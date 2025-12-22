from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.enums import ParseMode
import asyncio
import logging
import sqlite3
import json
import re
from datetime import datetime

API_TOKEN = '7406131994:AAEyqJgeUdjFzfm8hFHk-f5vwvMz8xBiqbU'

logging.basicConfig(level=logging.INFO)
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# Инициализация SQLite базы данных
def init_db():
    conn = sqlite3.connect('../shared/bot_database.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            username TEXT,
            full_name TEXT,
            start_date TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            anonymous BOOLEAN,
            receiver_name TEXT,
            receiver_phone TEXT,
            text_of_postcard TEXT,
            comment TEXT,
            delivery TEXT,
            city TEXT,
            address TEXT,
            date_of_post TEXT,
            time_of_post TEXT,
            request_address BOOLEAN,
            request_datetime BOOLEAN,
            items TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sended BOOLEAN DEFAULT FALSE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            receiver_name TEXT,
            receiver_phone TEXT,
            product TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sended BOOLEAN DEFAULT FALSE
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# Ваши функции multiply_price, get_price, get_total остаются без изменений
def multiply_price(price_string, multiplier):
    cleaned_price_string = re.sub(r'[^\d\s]', '', price_string)
    amount = cleaned_price_string.replace(' ', '')
    total_amount = round(int(amount) * multiplier)
    formatted_amount = f'{total_amount:,}'.replace(',', ' ')
    return formatted_amount

def get_price(data):
    if "prices" in data:
        for price in data["prices"]:
            checked = [0, 0, 0, 0]
            if len(price["colors"]) > 0:
                if data["selectedColor"] in price["colors"]:
                    checked[0] = 1
            else:
                checked[0] = 1
            if len(price["counts"]) > 0:
                if data["selectedCount"] in price["counts"]:
                    checked[1] = 1
            else:
                checked[1] = 1
            if len(price["packages"]) > 0:
                if data["selectedPackage"] in price["packages"]:
                    checked[2] = 1
            else:
                checked[2] = 1
            if len(price["sizes"]) > 0:
                if data["selectedSize"] in price["sizes"]:
                    checked[3] = 1
            else:
                checked[3] = 1

            if checked == [1, 1, 1, 1]:
                return price["price"]
    return data["price"]

def get_total(items):
    totalPrice = 0
    for item in items:
        price = get_price(item["product"])
        price = int(re.sub(r'[^\d]', '', price)) if price else 0
        totalPrice += price * item["count"]
    return '{:,}'.format(totalPrice).replace(',', ' ')

async def background_task():
    while True:
        conn = sqlite3.connect('../shared/bot_database.db')
        cursor = conn.cursor()
        
        # Обработка намёков
        cursor.execute("SELECT * FROM hints WHERE sended = FALSE")
        hints = cursor.fetchall()
        
        for hint in hints:
            hint_id, name, receiver_name, receiver_phone, product_json, created_at, sended = hint
            product = json.loads(product_json)
            
            char = ""
            if product["selectedColor"]:
                char += product["selectedColor"]
            if product["selectedCount"]:
                if len(char) > 0:
                    char += f', {product["selectedCount"]}'
                else:
                    char += product["selectedCount"]
            # ... остальной код формирования сообщения
            
            for i in [1265381195, 453500861]:
                try:
                    await bot.send_message(i, f"""
<b>Намёк</b>\n
от: {name}
имя получателя: {receiver_name}
телефон получателя: {receiver_phone}\n

- {product["title"]}, {char} {get_price(product)} / шт

<i>{created_at}</i>
                    """, parse_mode="HTML")
                except:
                    import traceback
                    traceback.print_exc()
            
            cursor.execute("UPDATE hints SET sended = TRUE WHERE id = ?", (hint_id,))
        
        # Обработка заказов (аналогично)
        cursor.execute("SELECT * FROM orders WHERE sended = FALSE")
        orders = cursor.fetchall()
        
        for order in orders:
            # ... код обработки заказа
            cursor.execute("UPDATE orders SET sended = TRUE WHERE id = ?", (order[0],))
        
        conn.commit()
        conn.close()
        await asyncio.sleep(10)

@dp.message(Command("start", "help"))
async def send_welcome(message: types.Message):
    user_id = message.from_user.id
    username = getattr(message.from_user, 'username', None)
    full_name = message.from_user.full_name

    # Сохранение пользователя в SQLite
    conn = sqlite3.connect('../shared/bot_database.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    existing_user = cursor.fetchone()
    
    if not existing_user:
        cursor.execute(
            "INSERT INTO users (user_id, username, full_name, start_date) VALUES (?, ?, ?, ?)",
            (user_id, username, full_name, datetime.now())
        )
    
    conn.commit()
    conn.close()

    greeting = f"""{f"Привет, @{username}!" if username else "Привет!"} Это <b>Студия Роз | LIGHT Business</b>, переходи в приложение, чтобы порадовать своих любимых."""
    
    inline_btn = types.InlineKeyboardButton(text='Запустить приложение', url='https://t.me/lightbizbot/litee')
    inline_kb = types.InlineKeyboardMarkup(inline_keyboard=[[inline_btn]])
    
    await message.reply(greeting, parse_mode="HTML", reply_markup=inline_kb)

async def main():
    asyncio.create_task(background_task())
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())