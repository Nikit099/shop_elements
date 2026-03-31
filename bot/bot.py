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
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, CallbackQuery
from aiogram.filters.callback_data import CallbackData
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import timedelta
import uuid
from datetime import timezone

# Загружаем переменные окружения
load_dotenv('../.env')

# Отладочный вывод для проверки загрузки переменных окружения
import sys
print(f"DEBUG: Current working directory: {os.getcwd()}")
print(f"DEBUG: .env file exists: {os.path.exists('../.env')}")
print(f"DEBUG: TELEGRAM_BOT_TOKEN loaded: {'YES' if os.getenv('TELEGRAM_BOT_TOKEN') else 'NO'}")
print(f"DEBUG: SUPABASE_URL loaded: {'YES' if os.getenv('SUPABASE_URL') else 'NO'}")
print(f"DEBUG: SUPABASE_KEY loaded: {'YES' if os.getenv('SUPABASE_KEY') else 'NO'}")

# Конфигурация из переменных окружения
API_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
ADMIN_CHAT_IDS = list(map(int, os.getenv('ADMIN_CHAT_IDS', '709652754').split(',')))

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

async def init_db() -> None:
    """Инициализация таблиц в Supabase через SQL Editor"""
    try:
        # Просто проверяем подключение - таблицы создадим через веб-интерфейс
        # или с помощью простых запросов через supabase.table().create()
        
        logger.info("Проверка подключения к Supabase...")
        
        # Простой запрос для проверки
        try:
            result = supabase.table("clients").select("*", count="exact").limit(1).execute()
            logger.info(f"Таблица 'clients' доступна. Записей: {result.count}")
        except Exception as e:
            logger.warning(f"Таблица 'clients' не существует или недоступна: {e}")
            
        try:
            result = supabase.table("orders").select("*", count="exact").limit(1).execute()
            logger.info(f"Таблица 'orders' доступна. Записей: {result.count}")
        except Exception as e:
            logger.warning(f"Таблица 'orders' не существует или недоступна: {e}")
            
        try:
            result = supabase.table("hints").select("*", count="exact").limit(1).execute()
            logger.info(f"Таблица 'hints' доступна. Записей: {result.count}")
        except Exception as e:
            logger.warning(f"Таблица 'hints' не существует или недоступна: {e}")
        
        logger.info("✅ Подключение к Supabase успешно установлено")
        
    except Exception as e:
        logger.error(f"Ошибка проверки подключения к базе данных: {e}")
        logger.info("\n📋 Инструкция по созданию таблиц в Supabase:")
        logger.info("1. Залогиньтесь в https://app.supabase.com")
        logger.info("2. Выберите ваш проект")
        logger.info("3. Перейдите в раздел 'Table Editor'")
        logger.info("4. Создайте таблицы вручную или используйте SQL из README")

def multiply_price(price_string: str, multiplier: int) -> str:
    """Умножает цену, представленную как строка с пробелами"""
    try:
        cleaned_price_string = re.sub(r'[^\d\s]', '', price_string)
        amount = int(cleaned_price_string.replace(' ', ''))
        total_amount = round(amount * multiplier)
        formatted_amount = f'{total_amount:,}'.replace(',', ' ')
        return formatted_amount
    except (ValueError, AttributeError) as e:
        logger.error(f"Ошибка умножения цены: {e}")
        return "0"

def get_price(product_data: Any) -> str:
    """Получает цену товара в зависимости от выбранных характеристик"""
    try:
        # Если product_data - строка, пытаемся распарсить JSON
        if isinstance(product_data, str):
            try:
                product_data = json.loads(product_data)
            except json.JSONDecodeError:
                return "0"
        
        # Если после парсинга это не словарь, возвращаем 0
        if not isinstance(product_data, dict):
            return "0"
        
        if "prices" in product_data and product_data["prices"]:
            for price_config in product_data["prices"]:
                matches = [True, True, True, True]
                
                if price_config.get("colors"):
                    matches[0] = product_data.get("selectedColor") in price_config["colors"]
                if price_config.get("counts"):
                    matches[1] = product_data.get("selectedCount") in price_config["counts"]
                if price_config.get("packages"):
                    matches[2] = product_data.get("selectedPackage") in price_config["packages"]
                if price_config.get("sizes"):
                    matches[3] = product_data.get("selectedSize") in price_config["sizes"]
                
                if all(matches):
                    return price_config.get("price", "0")
        
        return product_data.get("price", "0")
    except Exception as e:
        logger.error(f"Ошибка получения цены: {e}")
        return "0"

def calculate_total(items: List[Dict[str, Any]]) -> tuple[str, int]:
    """Рассчитывает общую стоимость всех товаров в корзине"""
    try:
        total_price = 0
        for item in items:
            product = item.get("product", {})
            count = item.get("count", 0)
            price_str = get_price(product)
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
        existing_user = supabase.table("clients").select("*").eq("user_id", user_id).execute()        
        if not existing_user.data:
            # Создаем нового пользователя
            user_data = {
                "user_id": user_id,
                "username": username,
                "full_name": full_name,
                "start_date": datetime.now().isoformat()
            }
            
            supabase.table("clients").insert(user_data).execute()
            logger.info(f"Новый пользователь сохранен: {user_id}")
        else:
            logger.debug(f"Пользователь {user_id} уже существует в базе")
            
    except Exception as e:
        logger.error(f"Ошибка сохранения пользователя {user_id}: {e}")

async def get_unsent_hints() -> List[Dict[str, Any]]:
    """Получает непросмотренные намёки"""
    try:
        response = supabase.table("hints").select("*").eq("sended", False).execute()
        return response.data
    except Exception as e:
        logger.error(f"Ошибка получения намёков: {e}")
        return []

async def get_unsent_orders() -> List[Dict[str, Any]]:
    """Получает необработанные заказы"""
    try:
        response = supabase.table("orders").select("*").eq("sended", False).order("created_at").execute()
        return response.data
    except Exception as e:
        logger.error(f"Ошибка получения заказов: {e}")
        return []

async def mark_hint_as_sent(hint_id: int) -> None:
    """Помечает намёк как отправленный"""
    try:
        supabase.table("hints").update({
            "sended": True
        }).eq("id", hint_id).execute()
        logger.debug(f"Намёк {hint_id} помечен как отправленный")
    except Exception as e:
        logger.error(f"Ошибка обновления намёка {hint_id}: {e}")

async def mark_order_as_sent(order_id: int) -> None:
    """Помечает заказ как обработанный"""
    try:
        supabase.table("orders").update({
            "sended": True
        }).eq("id", order_id).execute()
        logger.debug(f"Заказ {order_id} помечен как отправленный")
    except Exception as e:
        logger.error(f"Ошибка обновления заказа {order_id}: {e}")

# ============================================================================
# НОВЫЕ ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ ПОДПИСКАМИ И УВЕДОМЛЕНИЯМИ
# ============================================================================

async def get_user_subscription_status(user_id: int) -> Dict[str, Any]:
    """Получает статус подписки пользователя"""
    try:
        response = supabase.table("clients").select("*").eq("user_id", str(user_id)).execute()
        if not response.data:
            return {
                "has_subscription": False,
                "free_tariff_active": False,
                "tariff_expires_at": None,
                "days_left": 0,
                "is_active": False
            }
        
        client = response.data[0]
        tariff_expires_at = client.get("tariff_expires_at")
        has_subscription = client.get("has_subscription", False)
        free_tariff_active = client.get("free_tariff_active", False)
        
        days_left = 0
        if tariff_expires_at:
            try:
                expires_date = datetime.fromisoformat(tariff_expires_at.replace('Z', '+00:00'))
                # Делаем обе даты aware (с часовым поясом UTC)
                expires_date = expires_date.astimezone(timezone.utc)
                current_date = datetime.now(timezone.utc)
                days_left = (expires_date - current_date).days
                if days_left < 0:
                    days_left = 0
            except Exception as date_error:
                logger.error(f"Ошибка парсинга даты {tariff_expires_at}: {date_error}")
        
        is_active = has_subscription or free_tariff_active
        
        return {
            "has_subscription": has_subscription,
            "free_tariff_active": free_tariff_active,
            "tariff_expires_at": tariff_expires_at,
            "days_left": days_left,
            "is_active": is_active,
            "client_data": client
        }
    except Exception as e:
        logger.error(f"Ошибка получения статуса подписки пользователя {user_id}: {e}")
        return {
            "has_subscription": False,
            "free_tariff_active": False,
            "tariff_expires_at": None,
            "days_left": 0,
            "is_active": False
        }

async def get_business_by_owner_id(owner_id: str) -> Optional[Dict[str, Any]]:
    """Получает бизнес по ID владельца"""
    try:
        response = supabase.table("businesses").select("*").eq("owner_id", owner_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        logger.error(f"Ошибка получения бизнеса для owner_id {owner_id}: {e}")
        return None

async def get_business_owner_by_order(order_id: int) -> Optional[str]:
    """Получает owner_id по ID заказа"""
    try:
        # Получаем заказ
        order_response = supabase.table("orders").select("business_id").eq("id", order_id).execute()
        if not order_response.data:
            return None
        
        order = order_response.data[0]
        business_id = order.get("business_id")
        
        if not business_id:
            return None
        
        # Получаем бизнес
        business_response = supabase.table("businesses").select("owner_id").eq("id", business_id).execute()
        if not business_response.data:
            return None
        
        business = business_response.data[0]
        return business.get("owner_id")
    except Exception as e:
        logger.error(f"Ошибка получения владельца для заказа {order_id}: {e}")
        return None

async def get_business_owner_by_hint(hint_id: int) -> Optional[str]:
    """Получает owner_id по ID намёка"""
    try:
        # В текущей структуре намёки не привязаны к бизнесу напрямую
        # Возвращаем None - уведомления о намёках будут отправляться администраторам как раньше
        return None
    except Exception as e:
        logger.error(f"Ошибка получения владельца для намёка {hint_id}: {e}")
        return None

async def send_notification_to_owner(owner_id: str, message: str, parse_mode: str = ParseMode.HTML) -> bool:
    """Отправляет уведомление владельцу бизнеса"""
    try:
        await bot.send_message(
            chat_id=int(owner_id),
            text=message,
            parse_mode=parse_mode
        )
        logger.info(f"Уведомление отправлено владельцу {owner_id}")
        return True
    except Exception as e:
        logger.error(f"Ошибка отправки уведомления владельцу {owner_id}: {e}")
        return False

async def check_and_send_subscription_reminders() -> None:
    """Проверяет подписки и отправляет напоминания"""
    try:
        response = supabase.table("clients").select("*").execute()
        
        for client in response.data:
            user_id = client.get("user_id")
            if not user_id:
                continue
            
            tariff_expires_at = client.get("tariff_expires_at")
            if not tariff_expires_at:
                continue
            
            has_subscription = client.get("has_subscription", False)
            free_tariff_active = client.get("free_tariff_active", False)
            
            if not (has_subscription or free_tariff_active):
                continue
            
            try:
                expires_date = datetime.fromisoformat(tariff_expires_at.replace('Z', '+00:00'))
                expires_date = expires_date.astimezone(timezone.utc)
                current_date = datetime.now(timezone.utc)
                time_left = expires_date - current_date
                
                # КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: если подписка уже истекла
                if time_left.total_seconds() <= 0:
                    # Проверяем, отправляли ли уже уведомление об истечении
                    reminders_sent = client.get("reminders_sent", {})
                    if isinstance(reminders_sent, str):
                        try:
                            reminders_sent = json.loads(reminders_sent)
                        except:
                            reminders_sent = {}
                    
                    if "expired" not in reminders_sent:
                        await send_subscription_reminder(
                            user_id=int(user_id),
                            days_left=0,
                            hours_left=0,
                            is_free_tariff=free_tariff_active,
                            reminder_type="expired"
                        )
                        
                        reminders_sent["expired"] = datetime.now().isoformat()
                        # Отключаем подписку
                        update_data = {
                            "has_subscription": False,
                            "free_tariff_active": False,
                            "reminders_sent": json.dumps(reminders_sent)
                        }
                        supabase.table("clients").update(update_data).eq("user_id", user_id).execute()
                    continue  # Пропускаем дальнейшую обработку для этого пользователя
                
                # Только если подписка еще активна, считаем дни
                days_left = time_left.days
                hours_left = time_left.seconds // 3600
                total_hours_left = days_left * 24 + hours_left
                
                reminders_sent = client.get("reminders_sent", {})
                if isinstance(reminders_sent, str):
                    try:
                        reminders_sent = json.loads(reminders_sent)
                    except:
                        reminders_sent = {}
                
                reminder_points = [
                    (5 * 24, "5_days"),
                    (2 * 24, "2_days"),
                    (24, "1_day"),
                    (1, "1_hour")
                ]
                
                for hours_threshold, reminder_key in reminder_points:
                    # ИЗМЕНЕНИЕ: проверяем, что время еще не истекло
                    if total_hours_left <= hours_threshold and reminder_key not in reminders_sent:
                        await send_subscription_reminder(
                            user_id=int(user_id),
                            days_left=days_left,
                            hours_left=hours_left,
                            is_free_tariff=free_tariff_active,
                            reminder_type=reminder_key
                        )
                        
                        reminders_sent[reminder_key] = datetime.now().isoformat()
                        supabase.table("clients").update({
                            "reminders_sent": json.dumps(reminders_sent)
                        }).eq("user_id", user_id).execute()
                        break  # Отправляем только одно напоминание за раз
                
            except Exception as e:
                logger.error(f"Ошибка обработки подписки пользователя {user_id}: {e}")
                
    except Exception as e:
        logger.error(f"Ошибка проверки подписок: {e}")

async def send_subscription_reminder(user_id: int, days_left: int, hours_left: int, 
                                    is_free_tariff: bool, reminder_type: str) -> None:
    """Отправляет напоминание о подписке"""
    try:
        # Разные сообщения для бесплатного и платного тарифов
        if is_free_tariff:
            if reminder_type == "5_days":
                message = f"""
<b>⏰ Напоминание о бесплатном тарифе</b>

Ваш бесплатный тариф заканчивается через 5 дней.
Чтобы продолжить работу после окончания бесплатного периода, оплатите подписку.
                """
            elif reminder_type == "2_days":
                message = f"""
<b>⏰ Напоминание о бесплатном тарифе</b>

Ваш бесплатный тариф заканчивается через 2 дня.
Рекомендуем оплатить подписку заранее, чтобы не прерывать работу.
                """
            elif reminder_type == "1_day":
                message = f"""
<b>⏰ Напоминание о бесплатном тарифе</b>

Ваш бесплатный тариф заканчивается через 1 день.
Чтобы продолжить работу, оплатите подписку.
                """
            elif reminder_type == "1_hour":
                message = f"""
<b>⏰ Напоминание о бесплатном тарифе</b>

Ваш бесплатный тариф заканчивается через 1 час.
Рекомендуем оплатить подписку, чтобы не потерять доступ.
                """
            else:  # expired
                message = f"""
<b>🚫 Бесплатный тариф закончился</b>

Ваш бесплатный тариф завершен.
Чтобы восстановить доступ к функциям бизнеса, оплатите подписку.
                """
        else:
            if reminder_type == "5_days":
                message = f"""
<b>⏰ Напоминание о подписке</b>

Ваша подписка заканчивается через 5 дней.
Чтобы продолжить работу без перерывов, продлите подписку.
                """
            elif reminder_type == "2_days":
                message = f"""
<b>⏰ Напоминание о подписке</b>

Ваша подписка заканчивается через 2 дня.
Рекомендуем продлить подписку заранее.
                """
            elif reminder_type == "1_day":
                message = f"""
<b>⏰ Напоминание о подписке</b>

Ваша подписка заканчивается через 1 день.
Продлите подписку, чтобы не прерывать работу.
                """
            elif reminder_type == "1_hour":
                message = f"""
<b>⏰ Напоминание о подписке</b>

Ваша подписка заканчивается через 1 час.
Скорее продлите подписку, чтобы сохранить доступ.
                """
            else:  # expired
                message = f"""
<b>🚫 Подписка закончилась</b>

Ваша подписка завершена.
Доступ к функциям бизнеса приостановлен.
Оплатите подписку, чтобы восстановить доступ.
                """
        
        # Добавляем кнопку оплаты
        payment_button = InlineKeyboardButton(
            text="💳 Оплатить подписку",
            callback_data="subscription_payment_menu"
        )
        keyboard = InlineKeyboardMarkup(inline_keyboard=[[payment_button]])
        
        await bot.send_message(
            chat_id=user_id,
            text=message.strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        
        logger.info(f"Напоминание {reminder_type} отправлено пользователю {user_id}")
        
    except Exception as e:
        logger.error(f"Ошибка отправки напоминания пользователю {user_id}: {e}")

def create_payment_menu() -> InlineKeyboardMarkup:
    """Создает меню оплаты с вариантами подписки"""
    buttons = [
        [
            InlineKeyboardButton(
                text="1 месяц - 3 000₽",
                url="https://yookassa.ru/demo/payment?amount=3000"
            )
        ],
        [
            InlineKeyboardButton(
                text="3 месяца - 9 000₽",
                url="https://yookassa.ru/demo/payment?amount=9000"
            )
        ],
        [
            InlineKeyboardButton(
                text="6 месяцев - 18 000₽",
                url="https://yookassa.ru/demo/payment?amount=18000"
            )
        ],
        [
            InlineKeyboardButton(
                text="1 год - 36 000₽",
                url="https://yookassa.ru/demo/payment?amount=36000"
            )
        ],
        [
            InlineKeyboardButton(
                text="🔙 Назад",
                callback_data="business_info_menu"
            )
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

async def create_business_info_menu(user_id: int) -> tuple[str, InlineKeyboardMarkup]:
    """Создает меню информации о бизнесе и подписке"""
    try:
        # Получаем статус подписки
        subscription_status = await get_user_subscription_status(user_id)
        
        # Получаем бизнес пользователя
        business = await get_business_by_owner_id(str(user_id))
        
        if not business:
            # У пользователя нет бизнеса
            message = """
<b>🏢 Информация о бизнесе</b>

У вас еще нет созданного бизнеса.

🎁 <b>Бесплатный тариф:</b> При создании бизнеса вы получаете 7 дней бесплатного использования.
💳 <b>Платные тарифы:</b> После бесплатного периода доступны подписки от 1 месяца до 1 года.
            """
            
            buttons = [
                [
                    InlineKeyboardButton(
                        text="📝 Создать бизнес",
                        url="https://t.me/lightbizbot/litee"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="💳 Тарифы и оплата",
                        callback_data="subscription_payment_menu"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🔙 Назад",
                        callback_data="main_menu"
                    )
                ]
            ]
        else:
            # У пользователя есть бизнес
            business_name = business.get("name", "Не указано")
            has_subscription = subscription_status["has_subscription"]
            free_tariff_active = subscription_status["free_tariff_active"]
            days_left = subscription_status["days_left"]
            tariff_expires_at = subscription_status["tariff_expires_at"]
            
            if free_tariff_active:
                status_text = f"🎁 <b>Бесплатный тариф</b> (осталось {days_left} дней)"
                action_text = "Оплатите подписку, чтобы продолжить работу после бесплатного периода."
            elif has_subscription:
                status_text = f"✅ <b>Активная подписка</b> (осталось {days_left} дней)"
                action_text = "Вы можете продлить подписку заранее."
            else:
                status_text = "🚫 <b>Подписка отсутствует</b>"
                action_text = "Оплатите подписку, чтобы получить доступ к функциям бизнеса."
            
            if tariff_expires_at:
                try:
                    expires_date = datetime.fromisoformat(tariff_expires_at.replace('Z', '+00:00'))
                    expires_str = expires_date.strftime("%d.%m.%Y %H:%M")
                except:
                    expires_str = tariff_expires_at
            else:
                expires_str = "Не установлено"
            
            message = f"""
<b>🏢 Информация о бизнесе</b>

<b>Название бизнеса:</b> {business_name}
<b>Статус подписки:</b> {status_text}
<b>Окончание:</b> {expires_str}

{action_text}
            """
            
            buttons = [
                [
                    InlineKeyboardButton(
                        text="💳 Оплатить подписку",
                        callback_data="subscription_payment_menu"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🔄 Продлить заранее",
                        callback_data="subscription_payment_menu"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🔙 Назад",
                        callback_data="main_menu"
                    )
                ]
            ]
        
        return message.strip(), InlineKeyboardMarkup(inline_keyboard=buttons)
        
    except Exception as e:
        logger.error(f"Ошибка создания меню информации о бизнесе: {e}")
        error_message = "Произошла ошибка при получении информации. Пожалуйста, попробуйте позже."
        buttons = [[InlineKeyboardButton(text="🔙 Назад", callback_data="main_menu")]]
        return error_message, InlineKeyboardMarkup(inline_keyboard=buttons)

async def calculate_remaining_free_trial_days(user_id: str) -> int:
    """Вычисляет оставшееся количество дней бесплатного периода"""
    try:
        response = supabase.table("clients").select("*").eq("user_id", user_id).execute()
        if not response.data:
            return 0
        
        client = response.data[0]
        free_tariff_active = client.get("free_tariff_active", False)
        free_trial_started_at = client.get("free_trial_started_at")
        tariff_expires_at = client.get("tariff_expires_at")
        
        if not free_tariff_active or not free_trial_started_at:
            return 0
        
        try:
            # Вычисляем сколько дней прошло с начала бесплатного периода
            started_date = datetime.fromisoformat(free_trial_started_at.replace('Z', '+00:00'))
            started_date = started_date.astimezone(timezone.utc)
            current_date = datetime.now(timezone.utc)
            days_passed = (current_date - started_date).days
            
            # Всего бесплатный период 7 дней, вычисляем оставшиеся
            remaining_days = max(0, 7 - days_passed)
            return remaining_days
        except Exception as date_error:
            logger.error(f"Ошибка расчета оставшихся дней бесплатного периода: {date_error}")
            return 0
            
    except Exception as e:
        logger.error(f"Ошибка получения данных пользователя для расчета бесплатного периода: {e}")
        return 0

async def handle_payment_webhook(webhook_data: Dict[str, Any]) -> bool:
    """Обрабатывает вебхук от ЮKassa"""
    try:
        payment_id = webhook_data.get("object", {}).get("id")
        status = webhook_data.get("object", {}).get("status")
        amount = webhook_data.get("object", {}).get("amount", {}).get("value")
        metadata = webhook_data.get("object", {}).get("metadata", {})
        user_id = metadata.get("user_id")
        
        if not all([payment_id, status, user_id]):
            logger.error(f"Неполные данные в вебхуке: {webhook_data}")
            return False
        
        # Обновляем историю платежей
        payment_data = {
            "payment_id": str(uuid.uuid4()),
            "yookassa_payment_id": payment_id,
            "user_id": user_id,
            "amount": float(amount) if amount else 0,
            "payment_status": status,
            "completed_at": datetime.now().isoformat() if status == "succeeded" else None,
            "metadata": json.dumps(webhook_data)
        }
        
        supabase.table("subscription_history").insert(payment_data).execute()
        
        if status == "succeeded":
            # Определяем период подписки по сумме
            period_days = 30  # По умолчанию 1 месяц
            if amount == "9000":
                period_days = 90  # 3 месяца
            elif amount == "18000":
                period_days = 180  # 6 месяцев
            elif amount == "36000":
                period_days = 365  # 1 год
            
            # Вычисляем оставшиеся дни бесплатного периода (если есть)
            remaining_free_days = await calculate_remaining_free_trial_days(user_id)
            
            # Суммируем дни: оставшиеся бесплатные + купленные
            total_days = period_days + remaining_free_days
            
            # Обновляем подписку пользователя
            expires_at = (datetime.now() + timedelta(days=total_days)).isoformat()
            update_data = {
                "has_subscription": True,
                "free_tariff_active": False,
                "tariff_expires_at": expires_at,
                "reminders_sent": json.dumps({})  # Сбрасываем отправленные напоминания
            }
            
            supabase.table("clients").update(update_data).eq("user_id", user_id).execute()
            
            # Отправляем уведомление пользователю с информацией о суммировании
            try:
                if remaining_free_days > 0:
                    message = f"""
<b>✅ Подписка успешно оформлена!</b>

Спасибо за оплату! 
Ваша подписка активирована на {period_days} дней + {remaining_free_days} дней от бесплатного периода.

📅 <b>Итого:</b> {total_days} дней доступа
📆 <b>Доступ до:</b> {expires_at[:10]}

🎉 Теперь у вас есть полный доступ ко всем функциям на {total_days} дней!
                    """
                else:
                    message = f"""
<b>✅ Подписка успешно оформлена!</b>

Спасибо за оплату! Ваша подписка активирована на {period_days} дней.
Доступ к функциям бизнеса продлен до {expires_at[:10]}.
                    """
                
                await bot.send_message(
                    chat_id=int(user_id),
                    text=message.strip(),
                    parse_mode=ParseMode.HTML
                )
                
                # Дополнительное уведомление о суммировании дней
                if remaining_free_days > 0:
                    await bot.send_message(
                        chat_id=int(user_id),
                        text=f"""
<b>🎁 Дни суммированы!</b>

Вы успешно использовали оставшиеся {remaining_free_days} дней бесплатного периода.
Теперь у вас есть доступ на {total_days} дней без перерывов.

Продолжайте развивать свой бизнес! 🚀
                        """.strip(),
                        parse_mode=ParseMode.HTML
                    )
                    
            except Exception as e:
                logger.error(f"Ошибка отправки уведомления об успешной оплате: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"Ошибка обработки вебхука платежа: {e}")
        return False

# ============================================================================
# ФУНКЦИИ ДЛЯ БЕСПЛАТНОЙ НЕДЕЛИ И ПРИВЯЗКИ КАРТЫ
# ============================================================================

async def activate_free_trial(user_id: int) -> Dict[str, Any]:
    """Активирует бесплатную неделю для пользователя"""
    try:
        # Получаем текущий статус пользователя
        subscription_status = await get_user_subscription_status(user_id)
        client_data = subscription_status.get("client_data", {})
        
        # Проверяем условия
        if client_data.get("free_trial_used", False):
            return {
                "success": False,
                "message": "Вы уже использовали бесплатную неделю. Эта возможность доступна только один раз."
            }
        
        if subscription_status["is_active"]:
            return {
                "success": False,
                "message": "У вас уже есть активная подписка. Бесплатная неделя недоступна."
            }
        
        # Активируем бесплатную неделю (7 дней)
        free_trial_started_at = datetime.now(timezone.utc).isoformat()
        free_trial_expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        
        update_data = {
            "free_trial_used": True,
            "free_trial_started_at": free_trial_started_at,
            "free_tariff_active": True,
            "tariff_expires_at": free_trial_expires_at,
            "reminders_sent": json.dumps({})  # Сбрасываем отправленные напоминания
        }
        
        supabase.table("clients").update(update_data).eq("user_id", str(user_id)).execute()
        
        logger.info(f"Бесплатная неделя активирована для пользователя {user_id}")
        
        return {
            "success": True,
            "message": "🎉 Бесплатная неделя успешно активирована!",
            "expires_at": free_trial_expires_at,
            "days_left": 7
        }
        
    except Exception as e:
        logger.error(f"Ошибка активации бесплатной недели для пользователя {user_id}: {e}")
        return {
            "success": False,
            "message": "Произошла ошибка при активации бесплатной недели. Пожалуйста, попробуйте позже."
        }

async def get_user_free_trial_info(user_id: int) -> Dict[str, Any]:
    """Получает информацию о бесплатной неделе пользователя"""
    try:
        subscription_status = await get_user_subscription_status(user_id)
        client_data = subscription_status.get("client_data", {})
        
        free_trial_used = client_data.get("free_trial_used", False)
        free_trial_started_at = client_data.get("free_trial_started_at")
        free_tariff_active = subscription_status["free_tariff_active"]
        
        # Вычисляем оставшееся время для активной бесплатной недели
        days_left = 0
        if free_tariff_active and free_trial_started_at:
            try:
                started_date = datetime.fromisoformat(free_trial_started_at.replace('Z', '+00:00'))
                started_date = started_date.astimezone(timezone.utc)
                current_date = datetime.now(timezone.utc)
                days_passed = (current_date - started_date).days
                days_left = max(0, 7 - days_passed)
            except Exception as date_error:
                logger.error(f"Ошибка расчета дней бесплатной недели: {date_error}")
        
        return {
            "free_trial_used": free_trial_used,
            "free_trial_started_at": free_trial_started_at,
            "free_tariff_active": free_tariff_active,
            "days_left": days_left,
            "can_activate": not free_trial_used and not subscription_status["is_active"]
        }
        
    except Exception as e:
        logger.error(f"Ошибка получения информации о бесплатной неделе пользователя {user_id}: {e}")
        return {
            "free_trial_used": False,
            "free_trial_started_at": None,
            "free_tariff_active": False,
            "days_left": 0,
            "can_activate": False
        }

async def handle_free_trial_menu(callback_query: types.CallbackQuery) -> None:
    """Обработчик меню бесплатной недели"""
    try:
        user_id = callback_query.from_user.id
        free_trial_info = await get_user_free_trial_info(user_id)
        
        if free_trial_info["free_tariff_active"]:
            # Пользователь уже имеет активную бесплатную неделю
            message = f"""
<b>🎁 Ваша бесплатная неделя</b>

Ваша бесплатная неделя активна.
Осталось дней: <b>{free_trial_info['days_left']}</b>

Используйте это время, чтобы протестировать все возможности бизнеса.
Рекомендуем оплатить подписку заранее, чтобы не прерывать работу.
            """
            
            buttons = [
                [
                    InlineKeyboardButton(
                        text="💳 Оплатить подписку",
                        callback_data="subscription_payment_menu"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🔙 Назад",
                        callback_data="main_menu"
                    )
                ]
            ]
            
        elif free_trial_info["free_trial_used"]:
            # Пользователь уже использовал бесплатную неделю
            message = """
<b>🎁 Бесплатная неделя</b>

Вы уже использовали бесплатную неделю.
Эта возможность доступна только один раз.

Чтобы продолжить работу, оплатите подписку.
            """
            
            buttons = [
                [
                    InlineKeyboardButton(
                        text="💳 Оплатить подписку",
                        callback_data="subscription_payment_menu"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🔙 Назад",
                        callback_data="main_menu"
                    )
                ]
            ]
            
        else:
            # Пользователь может активировать бесплатную неделю
            message = """
<b>🎁 Бесплатная неделя</b>

Получите 7 дней бесплатного доступа ко всем функциям бизнеса!

🎯 <b>Что включено:</b>
• Полный доступ ко всем функциям
• Создание и управление бизнесом
• Прием заказов и намёков
• Все возможности платформы

⚠️ <b>Важно:</b> Эта возможность доступна только один раз.
После окончания бесплатного периода рекомендуем оплатить подписку.
            """
            
            buttons = [
                [
                    InlineKeyboardButton(
                        text="✅ Активировать бесплатную неделю",
                        callback_data="activate_free_trial_confirm"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="💳 Сразу оплатить подписку",
                        callback_data="subscription_payment_menu"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🔙 Назад",
                        callback_data="main_menu"
                    )
                ]
            ]
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await callback_query.message.edit_text(
            message.strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка обработки меню бесплатной недели: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

async def handle_activate_free_trial_confirm(callback_query: types.CallbackQuery) -> None:
    """Обработчик подтверждения активации бесплатной недели"""
    try:
        user_id = callback_query.from_user.id
        
        # Создаем меню подтверждения
        message = """
<b>🎁 Подтверждение активации</b>

Вы уверены, что хотите активировать бесплатную неделю?

⚠️ <b>Помните:</b>
• Эта возможность доступна только один раз
• После активации отменить нельзя
• По окончании 7 дней доступ прекратится
• Рекомендуем оплатить подписку заранее

Нажмите "✅ Да, активировать", чтобы начать бесплатную неделю.
        """
        
        buttons = [
            [
                InlineKeyboardButton(
                    text="✅ Да, активировать",
                    callback_data="activate_free_trial_execute"
                )
            ],
            [
                InlineKeyboardButton(
                    text="❌ Отмена",
                    callback_data="free_trial_menu"
                )
            ]
        ]
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await callback_query.message.edit_text(
            message.strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка обработки подтверждения активации: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

async def handle_activate_free_trial_execute(callback_query: types.CallbackQuery) -> None:
    """Обработчик выполнения активации бесплатной недели"""
    try:
        user_id = callback_query.from_user.id
        
        # Активируем бесплатную неделю
        result = await activate_free_trial(user_id)
        
        if result["success"]:
            # Форматируем дату окончания
            expires_at = result["expires_at"]
            try:
                expires_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                expires_str = expires_date.strftime("%d.%m.%Y %H:%M")
            except:
                expires_str = expires_at[:10]
            
            success_message = f"""
<b>🎉 Бесплатная неделя активирована!</b>

Ваш бесплатный доступ активен до: <b>{expires_str}</b>
Осталось дней: <b>{result['days_left']}</b>

Используйте это время, чтобы протестировать все возможности платформы.
Рекомендуем оплатить подписку заранее, чтобы не прерывать работу.
            """
            
            buttons = [
                [
                    InlineKeyboardButton(
                        text="🚀 Начать использовать",
                        url="https://t.me/lightbizbot/litee"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="💳 Оплатить подписку заранее",
                        callback_data="subscription_payment_menu"
                    )
                ],
                [
                    InlineKeyboardButton(
                        text="🔙 Главное меню",
                        callback_data="main_menu"
                    )
                ]
            ]
            
            await callback_query.message.edit_text(
                success_message.strip(),
                parse_mode=ParseMode.HTML,
                reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons)
            )
            
            # Отправляем дополнительное уведомление
            try:
                await bot.send_message(
                    chat_id=user_id,
                    text=f"""
<b>🎁 Добро пожаловать в бесплатную неделю!</b>

Теперь у вас есть полный доступ ко всем функциям на 7 дней.

Советы для начала:
1. Создайте свой бизнес
2. Добавьте товары и услуги
3. Настройте автоматические уведомления
4. Протестируйте прием заказов

Удачи в развитии вашего бизнеса!
                    """.strip(),
                    parse_mode=ParseMode.HTML
                )
            except Exception as e:
                logger.error(f"Ошибка отправки приветственного сообщения: {e}")
                
        else:
            # Ошибка активации
            error_message = f"""
<b>❌ Не удалось активировать бесплатную неделю</b>

{result['message']}
            """
            
            buttons = [
                [
                    InlineKeyboardButton(
                        text="🔙 Назад",
                        callback_data="free_trial_menu"
                    )
                ]
            ]
            
            await callback_query.message.edit_text(
                error_message.strip(),
                parse_mode=ParseMode.HTML,
                reply_markup=InlineKeyboardMarkup(inline_keyboard=buttons)
            )
        
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка выполнения активации бесплатной недели: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

async def handle_bind_card_menu(callback_query: types.CallbackQuery) -> None:
    """Обработчик меню привязки карты"""
    try:
        user_id = callback_query.from_user.id
        
        message = """
<b>🔗 Привязка карты</b>

Привяжите карту для удобной оплаты подписки.

🎯 <b>Преимущества:</b>
• Автоматическое продление подписки
• Не нужно каждый раз вводить данные карты
• Безопасное хранение данных в ЮKassa
• Быстрая оплата в один клик

⚠️ <b>Безопасность:</b>
Данные вашей карты хранятся только в защищенной системе ЮKassa.
Мы не имеем доступа к полным данным вашей карты.
        """
        
        # Создаем кнопку для привязки карты через ЮKassa
        # В реальной реализации нужно создать платежную сессию в ЮKassa
        # и получить ссылку для привязки карты
        
        buttons = [
            [
                InlineKeyboardButton(
                    text="💳 Привязать карту",
                    url="https://yookassa.ru/demo/bind-card"  # Заглушка, нужна реальная ссылка
                )
            ],
            [
                InlineKeyboardButton(
                    text="ℹ️ Как это работает?",
                    callback_data="card_bind_info"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🔙 Назад",
                    callback_data="main_menu"
                )
            ]
        ]
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await callback_query.message.edit_text(
            message.strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка обработки меню привязки карты: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

# ============================================================================
# КОНЕЦ НОВЫХ ФУНКЦИЙ
# ============================================================================

def format_hint_message(hint: Dict[str, Any]) -> str:
    """Форматирует сообщение о намёке"""
    try:
        product_raw = hint.get("product", {})
        
        # Обрабатываем случай, когда product хранится как JSON-строка
        product = product_raw
        if isinstance(product_raw, str):
            try:
                product = json.loads(product_raw)
            except json.JSONDecodeError:
                product = {}
        elif not isinstance(product_raw, dict):
            product = {}
        
        characteristics = []
        if isinstance(product, dict):
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
        
        product_title = product.get('title', 'Не указано') if isinstance(product, dict) else 'Не указано'
        
        message = f"""
<b>🎯 НАМЁК НА ЗАКАЗ</b>

<b>Отправитель:</b> {hint.get('name', 'Не указано')}
<b>Получатель:</b> {hint.get('receiver_name', 'Не указано')}
<b>Телефон:</b> {hint.get('receiver_phone', 'Не указано')}

<b>Товар:</b> {product_title}
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
        items_raw = order.get("items", [])
        total_price = order.get("total_price", 0)
        
        # Обрабатываем случай, когда items хранится как JSON-строка
        items = items_raw
        if isinstance(items_raw, str):
            try:
                items = json.loads(items_raw)
            except json.JSONDecodeError:
                items = []
        elif not isinstance(items_raw, list):
            items = []
        
        items_text = ""
        for i, item in enumerate(items, 1):
            if not isinstance(item, dict):
                continue
                
            product_raw = item.get("product", {})
            count = item.get("count", 0)
            
            # Обрабатываем product, который может быть строкой JSON
            product = product_raw
            if isinstance(product_raw, str):
                try:
                    product = json.loads(product_raw)
                except json.JSONDecodeError:
                    product = {}
            elif not isinstance(product_raw, dict):
                product = {}
            
            price = get_price(product)
            product_title = product.get('title', 'Не указано') if isinstance(product, dict) else 'Не указано'
            items_text += f"{i}. {product_title} x{count} - {price} ₽\n"
        
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
    
    error_count = 0
    max_error_delay = 300  # Максимальная задержка при ошибках - 5 минут
    
    # Счетчик для проверки подписок (каждые 30 минут)
    subscription_check_counter = 0
    
    while True:
        try:
            # Получаем и отправляем намёки
            hints = await get_unsent_hints()
            for hint in hints:
                message = format_hint_message(hint)
                if message == "Ошибка форматирования намёка":
                    logger.warning(f"Пропущен намёк {hint['id']} из-за ошибки форматирования")
                    continue
                
                sent_to_any = False
                for admin_id in ADMIN_CHAT_IDS:
                    try:
                        await bot.send_message(
                            chat_id=admin_id,
                            text=message,
                            parse_mode=ParseMode.HTML
                        )
                        logger.info(f"Намёк {hint['id']} отправлен администратору {admin_id}")
                        sent_to_any = True
                    except Exception as e:
                        logger.error(f"Ошибка отправки намёка {hint['id']} админу {admin_id}: {e}")
                
                if sent_to_any:
                    await mark_hint_as_sent(hint["id"])
                else:
                    logger.warning(f"Намёк {hint['id']} не отправлен ни одному администратору")
            
            # Получаем и отправляем заказы
            orders = await get_unsent_orders()
            for order in orders:
                message = format_order_message(order)
                if message == "Ошибка форматирования заказа":
                    logger.warning(f"Пропущен заказ {order['id']} из-за ошибки форматирования")
                    continue
                
                # Отправляем уведомление владельцу бизнеса
                owner_id = await get_business_owner_by_order(order["id"])
                if owner_id:
                    try:
                        await send_notification_to_owner(owner_id, message)
                        logger.info(f"Заказ {order['id']} отправлен владельцу бизнеса {owner_id}")
                    except Exception as e:
                        logger.error(f"Ошибка отправки заказа владельцу {owner_id}: {e}")
                
                # Также отправляем администраторам
                sent_to_any = False
                for admin_id in ADMIN_CHAT_IDS:
                    try:
                        await bot.send_message(
                            chat_id=admin_id,
                            text=message,
                            parse_mode=ParseMode.HTML
                        )
                        logger.info(f"Заказ {order['id']} отправлен администратору {admin_id}")
                        sent_to_any = True
                    except Exception as e:
                        logger.error(f"Ошибка отправки заказа {order['id']} админу {admin_id}: {e}")
                
                if sent_to_any or owner_id:
                    await mark_order_as_sent(order["id"])
                else:
                    logger.warning(f"Заказ {order['id']} не отправлен ни одному администратору")
            
            # Проверяем подписки каждые 30 минут (1800 секунд / 60 = 30 итераций)
            subscription_check_counter += 1
            if subscription_check_counter >= 30:
                logger.info("Проверка подписок и отправка напоминаний...")
                await check_and_send_subscription_reminders()
                subscription_check_counter = 0
            
            # Сбрасываем счетчик ошибок при успешном выполнении
            if error_count > 0:
                logger.info(f"Фоновая задача восстановлена после {error_count} ошибок")
                error_count = 0
            
            # Нормальный интервал - 60 секунд
            await asyncio.sleep(60)
            
        except Exception as e:
            error_count += 1
            logger.error(f"Ошибка в фоновой задаче (попытка {error_count}): {e}")
            
            # Экспоненциальная задержка при ошибках
            delay = min(30 * (2 ** error_count), max_error_delay)
            logger.warning(f"Пауза перед следующей попыткой: {delay} секунд")
            await asyncio.sleep(delay)

@dp.message(Command("start", "help"))
async def send_welcome(message: types.Message) -> None:
    """Обработчик команд /start и /help"""
    try:
        user = message.from_user
        user_id = user.id
        username = user.username
        full_name = user.full_name
        
        await save_user(user_id, username, full_name)
        
        greeting = f"{f'Привет, @{username}!' if username else 'Привет!'} "
        greeting += "Это <b>Студия Роз | LIGHT Business</b>"
        
        # Создаем основное меню с инлайн кнопками
        buttons = [
            [
                InlineKeyboardButton(
                    text="🏢 Мой бизнес",
                    callback_data="business_info_menu"
                ),
                InlineKeyboardButton(
                    text="🎁 Бесплатная неделя",
                    callback_data="free_trial_menu"
                )
            ],
            [
                InlineKeyboardButton(
                    text="💳 Оплатить подписку",
                    callback_data="subscription_payment_menu"
                ),
                InlineKeyboardButton(
                    text="🔗 Привязать карту",
                    callback_data="bind_card_menu"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🎁 Запустить приложение",
                    url="https://t.me/lightbizbot/litee"
                )
            ]
        ]
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await message.answer(
            greeting,
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        
        logger.info(f"Пользователь {user_id} ({username}) запустил бота")
        
    except Exception as e:
        logger.error(f"Ошибка обработки команды /start: {e}")
        await message.answer("Произошла ошибка. Пожалуйста, попробуйте позже.")

@dp.callback_query(lambda c: c.data == "main_menu")
async def handle_main_menu(callback_query: types.CallbackQuery) -> None:
    """Обработчик кнопки 'Главное меню'"""
    try:
        user = callback_query.from_user
        
        greeting = f"{f'Привет, @{user.username}!' if user.username else 'Привет!'} "
        greeting += "Это <b>Студия Роз | LIGHT Business</b>"
        
        buttons = [
            [
                InlineKeyboardButton(
                    text="🏢 Мой бизнес",
                    callback_data="business_info_menu"
                ),
                InlineKeyboardButton(
                    text="🎁 Бесплатная неделя",
                    callback_data="free_trial_menu"
                )
            ],
            [
                InlineKeyboardButton(
                    text="💳 Оплатить подписку",
                    callback_data="subscription_payment_menu"
                ),
                InlineKeyboardButton(
                    text="🔗 Привязать карту",
                    callback_data="bind_card_menu"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🎁 Запустить приложение",
                    url="https://t.me/lightbizbot/litee"
                )
            ]
        ]
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await callback_query.message.edit_text(
            greeting,
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка обработки главного меню: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

@dp.callback_query(lambda c: c.data == "business_info_menu")
async def handle_business_info_menu(callback_query: types.CallbackQuery) -> None:
    """Обработчик меню информации о бизнесе"""
    try:
        user_id = callback_query.from_user.id
        message_text, keyboard = await create_business_info_menu(user_id)
        
        await callback_query.message.edit_text(
            message_text,
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка обработки меню бизнеса: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

@dp.callback_query(lambda c: c.data == "subscription_payment_menu")
async def handle_subscription_payment_menu(callback_query: types.CallbackQuery) -> None:
    """Обработчик меню оплаты подписки"""
    try:
        message_text = """
<b>💳 Оплата подписки</b>

Выберите срок подписки:

• <b>1 месяц</b> - 3 000₽
• <b>3 месяца</b> - 9 000₽ (экономия 3 000₽)
• <b>6 месяцев</b> - 18 000₽ (экономия 6 000₽)
• <b>1 год</b> - 36 000₽ (экономия 12 000₽)

После оплаты подписка активируется автоматически.
        """
        
        keyboard = create_payment_menu()
        
        await callback_query.message.edit_text(
            message_text.strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка обработки меню оплаты: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

@dp.callback_query(lambda c: c.data == "free_trial_menu")
async def callback_free_trial_menu(callback_query: types.CallbackQuery) -> None:
    """Обработчик меню бесплатной недели"""
    await handle_free_trial_menu(callback_query)

@dp.callback_query(lambda c: c.data == "activate_free_trial_confirm")
async def callback_activate_free_trial_confirm(callback_query: types.CallbackQuery) -> None:
    """Обработчик подтверждения активации бесплатной недели"""
    await handle_activate_free_trial_confirm(callback_query)

@dp.callback_query(lambda c: c.data == "activate_free_trial_execute")
async def callback_activate_free_trial_execute(callback_query: types.CallbackQuery) -> None:
    """Обработчик выполнения активации бесплатной недели"""
    await handle_activate_free_trial_execute(callback_query)

@dp.callback_query(lambda c: c.data == "bind_card_menu")
async def callback_bind_card_menu(callback_query: types.CallbackQuery) -> None:
    """Обработчик меню привязки карты"""
    await handle_bind_card_menu(callback_query)

@dp.callback_query(lambda c: c.data == "card_bind_info")
async def callback_card_bind_info(callback_query: types.CallbackQuery) -> None:
    """Обработчик информации о привязке карты"""
    try:
        message = """
<b>ℹ️ Как работает привязка карты</b>

<u>Безопасность:</u>
• Данные карты хранятся только в защищенной системе ЮKassa
• Мы не имеем доступа к полным данным вашей карты
• Используется только token для автоматических списаний

<u>Процесс:</u>
1. Вы нажимаете "Привязать карту"
2. Открывается защищенная страница ЮKassa
3. Вы вводите данные карты один раз
4. Карта привязывается к вашему аккаунту
5. В будущем подписка продлевается автоматически

<u>Преимущества:</u>
• Не нужно каждый раз вводить данные
• Автоматическое продление без перерывов
• Можно отвязать карту в любой момент
        """
        
        buttons = [
            [
                InlineKeyboardButton(
                    text="💳 Привязать карту",
                    callback_data="bind_card_menu"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🔙 Назад",
                    callback_data="bind_card_menu"
                )
            ]
        ]
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
        
        await callback_query.message.edit_text(
            message.strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard
        )
        await callback_query.answer()
        
    except Exception as e:
        logger.error(f"Ошибка обработки информации о привязке карты: {e}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже.")

@dp.message(Command("stats"))
async def send_stats(message: types.Message) -> None:
    """Показывает статистику (только для админов)"""
    try:
        user_id = message.from_user.id
        
        if user_id not in ADMIN_CHAT_IDS:
            await message.answer("У вас нет прав для выполнения этой команды.")
            return
        
        # Получаем статистику через отдельные запросы
        clients_count = supabase.table("clients").select("*", count="exact").execute().count or 0
        orders_count = supabase.table("orders").select("*", count="exact").execute().count or 0
        hints_count = supabase.table("hints").select("*", count="exact").execute().count or 0
        
        # Новые заказы и намёки
        new_orders = supabase.table("orders").select("*", count="exact").eq("sended", False).execute().count or 0
        new_hints = supabase.table("hints").select("*", count="exact").eq("sended", False).execute().count or 0
        
        response = f"""
<b>📊 Статистика</b>

Пользователей: {clients_count}  # было users_count
Заказов: {orders_count}
Намёков: {hints_count}

Новых заказов: {new_orders}
Новых намёков: {new_hints}

<i>Обновлено: {datetime.now().strftime('%H:%M:%S')}</i>
"""
        await message.answer(response, parse_mode=ParseMode.HTML)
            
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        await message.answer("Ошибка получения статистики.")

async def on_startup() -> None:
    """Выполняется при запуске бота"""
    logger.info("Бот запускается...")
    
    # Инициализируем базу данных (просто проверяем подключение)
    await init_db()
    
    # Запускаем фоновую задачу
    asyncio.create_task(background_task())
    
   

async def on_shutdown() -> None:
    """Выполняется при остановке бота"""
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