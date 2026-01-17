import os
import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
import re

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from supabase import create_client, Client
from dotenv import load_dotenv
import httpx

# Загружаем переменные окружения
load_dotenv()

# Конфигурация из переменных окружения
API_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')  # Используем service role для полного доступа
ADMIN_CHAT_IDS = list(map(int, os.getenv('ADMIN_CHAT_IDS', '1265381195,453500861').split(',')))
# Ключ должен начинаться с eyJhbGciOiJ...
key = os.getenv('SUPABASE_KEY', '')

print(key)

# Проверка обязательных переменных
if not all([API_TOKEN, SUPABASE_URL, SUPABASE_KEY]):
    missing = []
    if not API_TOKEN: missing.append('TELEGRAM_BOT_TOKEN')
    if not SUPABASE_URL: missing.append('SUPABASE_URL')
    if not SUPABASE_KEY: missing.append('SUPABASE_KEY')
    raise ValueError(f"Отсутствуют обязательные переменные окружения: {', '.join(missing)}")

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Инициализация клиентов
bot = Bot(
    token=API_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

# Инициализация Supabase клиента
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Кэш для временного хранения данных
order_cache: Dict[str, Any] = {}

class DatabaseError(Exception):
    """Кастомное исключение для ошибок базы данных"""
    pass

async def init_db() -> None:
    """Инициализация таблиц в Supabase"""
    try:
        # Создаем таблицу users
        create_users_table = """
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT UNIQUE NOT NULL,
            username TEXT,
            full_name TEXT,
            start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
        """
        
        # Создаем таблицу orders
        create_orders_table = """
        CREATE TABLE IF NOT EXISTS orders (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            anonymous BOOLEAN DEFAULT FALSE,
            receiver_name TEXT,
            receiver_phone TEXT,
            text_of_postcard TEXT,
            comment TEXT,
            delivery TEXT,
            city TEXT,
            address TEXT,
            date_of_post TEXT,
            time_of_post TEXT,
            request_address BOOLEAN DEFAULT FALSE,
            request_datetime BOOLEAN DEFAULT FALSE,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            total_price INTEGER,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            sended BOOLEAN DEFAULT FALSE
        );
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
        """
        
        # Создаем таблицу hints
        create_hints_table = """
        CREATE TABLE IF NOT EXISTS hints (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
            name TEXT NOT NULL,
            receiver_name TEXT,
            receiver_phone TEXT,
            product JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            sended BOOLEAN DEFAULT FALSE
        );
        CREATE INDEX IF NOT EXISTS idx_hints_sended ON hints(sended);
        """
        
        # Используем RPC для выполнения SQL
        await asyncio.to_thread(
            lambda: supabase.rpc('exec_sql', {'sql': create_users_table}).execute()
        )
        await asyncio.to_thread(
            lambda: supabase.rpc('exec_sql', {'sql': create_orders_table}).execute()
        )
        await asyncio.to_thread(
            lambda: supabase.rpc('exec_sql', {'sql': create_hints_table}).execute()
        )
        
        logger.info("База данных инициализирована успешно")
        
    except Exception as e:
        logger.error(f"Ошибка инициализации базы данных: {e}")
        raise DatabaseError(f"Не удалось инициализировать базу данных: {e}")

def multiply_price(price_string: str, multiplier: int) -> str:
    """Умножает цену, представленную как строка с пробелами"""
    try:
        # Удаляем все нецифровые символы, кроме пробелов
        cleaned_price_string = re.sub(r'[^\d\s]', '', price_string)
        # Убираем пробелы и преобразуем в число
        amount = int(cleaned_price_string.replace(' ', ''))
        total_amount = round(amount * multiplier)
        # Форматируем с пробелами как тысячи
        formatted_amount = f'{total_amount:,}'.replace(',', ' ')
        return formatted_amount
    except (ValueError, AttributeError) as e:
        logger.error(f"Ошибка умножения цены: {e}, price_string: {price_string}")
        return "0"

def get_price(product_data: Dict[str, Any]) -> str:
    """Получает цену товара в зависимости от выбранных характеристик"""
    try:
        if "prices" in product_data and product_data["prices"]:
            for price_config in product_data["prices"]:
                matches = [True, True, True, True]  # цвет, количество, упаковка, размер
                
                # Проверяем соответствие характеристик
                if price_config.get("colors"):
                    matches[0] = product_data.get("selectedColor") in price_config["colors"]
                if price_config.get("counts"):
                    matches[1] = product_data.get("selectedCount") in price_config["counts"]
                if price_config.get("packages"):
                    matches[2] = product_data.get("selectedPackage") in price_config["packages"]
                if price_config.get("sizes"):
                    matches[3] = product_data.get("selectedSize") in price_config["sizes"]
                
                # Если все условия совпадают
                if all(matches):
                    return price_config.get("price", "0")
        
        # Возвращаем базовую цену или 0
        return product_data.get("price", "0")
    except Exception as e:
        logger.error(f"Ошибка получения цены: {e}, product_data: {product_data}")
        return "0"

def calculate_total(items: List[Dict[str, Any]]) -> tuple[str, int]:
    """Рассчитывает общую стоимость всех товаров в корзине"""
    try:
        total_price = 0
        for item in items:
            product = item.get("product", {})
            count = item.get("count", 0)
            price_str = get_price(product)
            # Извлекаем число из строки с ценой
            price_num = int(re.sub(r'[^\d]', '', price_str)) if price_str else 0
            total_price += price_num * count
        
        formatted_total = f'{total_price:,}'.replace(',', ' ')
        return formatted_total, total_price
    except Exception as e:
        logger.error(f"Ошибка расчета общей стоимости: {e}")
        return "0", 0

async def save_user(user_id: int, username: Optional[str], full_name: str) -> None:
    """Сохраняет пользователя в базу данных"""
    try:
        # Проверяем, существует ли пользователь
        existing_user = await asyncio.to_thread(
            lambda: supabase.table("users")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        
        if not existing_user.data:
            # Создаем нового пользователя
            user_data = {
                "user_id": user_id,
                "username": username,
                "full_name": full_name,
                "start_date": datetime.now().isoformat()
            }
            
            await asyncio.to_thread(
                lambda: supabase.table("users").insert(user_data).execute()
            )
            logger.info(f"Новый пользователь сохранен: {user_id}")
    except Exception as e:
        logger.error(f"Ошибка сохранения пользователя {user_id}: {e}")

async def get_unsent_hints() -> List[Dict[str, Any]]:
    """Получает непросмотренные намёки"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table("hints")
            .select("*")
            .eq("sended", False)
            .execute()
        )
        return response.data
    except Exception as e:
        logger.error(f"Ошибка получения намёков: {e}")
        return []

async def get_unsent_orders() -> List[Dict[str, Any]]:
    """Получает необработанные заказы"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table("orders")
            .select("*")
            .eq("sended", False)
            .order("created_at", desc=False)
            .execute()
        )
        return response.data
    except Exception as e:
        logger.error(f"Ошибка получения заказов: {e}")
        return []

async def mark_hint_as_sent(hint_id: int) -> None:
    """Помечает намёк как отправленный"""
    try:
        await asyncio.to_thread(
            lambda: supabase.table("hints")
            .update({"sended": True, "updated_at": datetime.now().isoformat()})
            .eq("id", hint_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"Ошибка обновления намёка {hint_id}: {e}")

async def mark_order_as_sent(order_id: int) -> None:
    """Помечает заказ как обработанный"""
    try:
        await asyncio.to_thread(
            lambda: supabase.table("orders")
            .update({"sended": True, "updated_at": datetime.now().isoformat()})
            .eq("id", order_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"Ошибка обновления заказа {order_id}: {e}")

def format_hint_message(hint: Dict[str, Any]) -> str:
    """Форматирует сообщение о намёке"""
    try:
        product = hint.get("product", {})
        
        # Формируем строку характеристик
        characteristics = []
        if product.get("selectedColor"):
            characteristics.append(product["selectedColor"])
        if product.get("selectedCount"):
            characteristics.append(product["selectedCount"])
        if product.get("selectedPackage"):
            characteristics.append(product["selectedPackage"])
        if product.get("selectedSize"):
            characteristics.append(product["selectedSize"])
        
        char_str = ", ".join(characteristics) if characteristics else "без характеристик"
        created_at = hint.get("created_at", datetime.now().isoformat())
        
        message = f"""
<b>🎯 НАМЁК НА ЗАКАЗ</b>

<b>Отправитель:</b> {hint.get('name', 'Не указано')}
<b>Получатель:</b> {hint.get('receiver_name', 'Не указано')}
<b>Телефон:</b> {hint.get('receiver_phone', 'Не указано')}

<b>Товар:</b> {product.get('title', 'Не указано')}
<b>Характеристики:</b> {char_str}
<b>Цена:</b> {get_price(product)} ₽ / шт

<i>🕒 {created_at[:19].replace('T', ' ')}</i>
"""
        return message.strip()
    except Exception as e:
        logger.error(f"Ошибка форматирования намёка: {e}")
        return "Ошибка форматирования намёка"

def format_order_message(order: Dict[str, Any]) -> str:
    """Форматирует сообщение о заказе"""
    try:
        items = order.get("items", [])
        total_price = order.get("total_price", 0)
        
        # Формируем список товаров
        items_text = ""
        for i, item in enumerate(items, 1):
            product = item.get("product", {})
            count = item.get("count", 0)
            price = get_price(product)
            items_text += f"{i}. {product.get('title')} x{count} - {price} ₽\n"
        
        delivery_info = ""
        if order.get("delivery"):
            delivery_info += f"\n<b>Доставка:</b> {order['delivery']}"
        if order.get("city"):
            delivery_info += f"\n<b>Город:</b> {order['city']}"
        if order.get("address"):
            delivery_info += f"\n<b>Адрес:</b> {order['address']}"
        if order.get("date_of_post"):
            delivery_info += f"\n<b>Дата:</b> {order['date_of_post']}"
        if order.get("time_of_post"):
            delivery_info += f"\n<b>Время:</b> {order['time_of_post']}"
        
        message = f"""
<b>🛒 НОВЫЙ ЗАКАЗ #{order.get('id')}</b>

<b>Клиент:</b> {order.get('name')}
<b>Телефон:</b> {order.get('phone')}
<b>Анонимно:</b> {'Да' if order.get('anonymous') else 'Нет'}

<b>Получатель:</b> {order.get('receiver_name', 'Не указано')}
<b>Телефон получателя:</b> {order.get('receiver_phone', 'Не указано')}

<b>Товары:</b>
{items_text}
<b>Итого:</b> {f'{total_price:,}'.replace(',', ' ')} ₽

<b>Открытка:</b> {order.get('text_of_postcard', 'Не указано')}
<b>Комментарий:</b> {order.get('comment', 'Нет комментария')}
{delivery_info}

<i>🕒 {order.get('created_at', '')[:19].replace('T', ' ')}</i>
"""
        return message.strip()
    except Exception as e:
        logger.error(f"Ошибка форматирования заказа: {e}")
        return "Ошибка форматирования заказа"

async def background_task() -> None:
    """Фоновая задача для отправки уведомлений о новых заказах и намёках"""
    logger.info("Фоновая задача запущена")
    
    while True:
        try:
            # Получаем и отправляем намёки
            hints = await get_unsent_hints()
            for hint in hints:
                message = format_hint_message(hint)
                
                # Отправляем всем администраторам
                for admin_id in ADMIN_CHAT_IDS:
                    try:
                        await bot.send_message(
                            chat_id=admin_id,
                            text=message,
                            parse_mode=ParseMode.HTML
                        )
                        logger.info(f"Намёк {hint['id']} отправлен администратору {admin_id}")
                    except Exception as e:
                        logger.error(f"Ошибка отправки намёка {hint['id']} админу {admin_id}: {e}")
                
                # Помечаем как отправленный
                await mark_hint_as_sent(hint["id"])
            
            # Получаем и отправляем заказы
            orders = await get_unsent_orders()
            for order in orders:
                message = format_order_message(order)
                
                # Отправляем всем администраторам
                for admin_id in ADMIN_CHAT_IDS:
                    try:
                        await bot.send_message(
                            chat_id=admin_id,
                            text=message,
                            parse_mode=ParseMode.HTML
                        )
                        logger.info(f"Заказ {order['id']} отправлен администратору {admin_id}")
                    except Exception as e:
                        logger.error(f"Ошибка отправки заказа {order['id']} админу {admin_id}: {e}")
                
                # Помечаем как отправленный
                await mark_order_as_sent(order["id"])
            
            # Пауза между проверками
            await asyncio.sleep(15)  # Проверяем каждые 15 секунд
            
        except Exception as e:
            logger.error(f"Ошибка в фоновой задаче: {e}")
            await asyncio.sleep(30)  # При ошибке ждем дольше

@dp.message(Command("start", "help"))
async def send_welcome(message: types.Message) -> None:
    """Обработчик команд /start и /help"""
    try:
        user = message.from_user
        user_id = user.id
        username = user.username
        full_name = user.full_name
        
        # Сохраняем пользователя в базу
        await save_user(user_id, username, full_name)
        
        # Формируем приветствие
        greeting = f"{f'Привет, @{username}!' if username else 'Привет!'} "
        greeting += "Это <b>Студия Роз | LIGHT Business</b>, переходи в приложение, чтобы порадовать своих любимых."
        
        # Создаем кнопку
        inline_btn = types.InlineKeyboardButton(
            text='🎁 Запустить приложение',
            url='https://t.me/lightbizbot/litee'
        )
        inline_kb = types.InlineKeyboardMarkup(inline_keyboard=[[inline_btn]])
        
        # Отправляем приветствие
        await message.answer(
            greeting,
            parse_mode=ParseMode.HTML,
            reply_markup=inline_kb
        )
        
        logger.info(f"Пользователь {user_id} ({username}) запустил бота")
        
    except Exception as e:
        logger.error(f"Ошибка обработки команды /start: {e}")
        await message.answer("Произошла ошибка. Пожалуйста, попробуйте позже.")

@dp.message(Command("stats"))
async def send_stats(message: types.Message) -> None:
    """Показывает статистику (только для админов)"""
    try:
        user_id = message.from_user.id
        
        # Проверяем, является ли пользователь администратором
        if user_id not in ADMIN_CHAT_IDS:
            await message.answer("У вас нет прав для выполнения этой команды.")
            return
        
        # Получаем статистику
        stats_data = await asyncio.to_thread(
            lambda: supabase.rpc('get_stats', {}).execute()
        )
        
        if stats_data.data:
            stats = stats_data.data[0]
            response = f"""
<b>📊 Статистика</b>

Пользователей: {stats.get('users_count', 0)}
Заказов: {stats.get('orders_count', 0)}
Намёков: {stats.get('hints_count', 0)}

Новых заказов: {stats.get('new_orders', 0)}
Новых намёков: {stats.get('new_hints', 0)}

За сегодня: {stats.get('today_orders', 0)} заказов
"""
            await message.answer(response, parse_mode=ParseMode.HTML)
        else:
            await message.answer("Не удалось получить статистику.")
            
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        await message.answer("Ошибка получения статистики.")

async def on_startup() -> None:
    """Выполняется при запуске бота"""
    logger.info("Бот запускается...")
    
    # Инициализируем базу данных
    await init_db()
    
    # Запускаем фоновую задачу
    asyncio.create_task(background_task())
    
    # Отправляем уведомление администраторам
    for admin_id in ADMIN_CHAT_IDS:
        try:
            await bot.send_message(
                admin_id,
                "🤖 Бот успешно запущен и готов к работе!"
            )
        except Exception as e:
            logger.error(f"Не удалось отправить уведомление админу {admin_id}: {e}")

async def on_shutdown() -> None:
    """Выполняется при остановке бота"""
    logger.info("Бот останавливается...")
    
    # Отправляем уведомление администраторам
    for admin_id in ADMIN_CHAT_IDS:
        try:
            await bot.send_message(
                admin_id,
                "⚠️ Бот останавливается..."
            )
        except Exception as e:
            logger.error(f"Не удалось отправить уведомление админу {admin_id}: {e}")
    
    await bot.session.close()

async def main() -> None:
    """Основная функция запуска бота"""
    try:
        dp.startup.register(on_startup)
        dp.shutdown.register(on_shutdown)
        
        await dp.start_polling(bot)
        
    except Exception as e:
        logger.critical(f"Критическая ошибка: {e}")
        raise

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Бот остановлен пользователем")
    except Exception as e:
        logger.critical(f"Фатальная ошибка: {e}")