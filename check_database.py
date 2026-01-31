import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY[:10]}...")

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Проверяем таблицу users
    try:
        users = supabase.table('users').select('*').execute()
        print('\nПользователи:')
        if users.data:
            for user in users.data:
                print(f'  ID: {user.get("id")}, Telegram ID: {user.get("telegram_id")}, Роль: {user.get("role")}, Магазин: {user.get("owned_shop_id")}')
        else:
            print('  Нет пользователей')
    except Exception as e:
        print(f'Ошибка при получении пользователей: {e}')
    
    # Проверяем таблицу shops
    try:
        shops = supabase.table('shops').select('*').execute()
        print('\nМагазины:')
        if shops.data:
            for shop in shops.data:
                print(f'  ID: {shop.get("id")}, Название: {shop.get("name")}, Владелец: {shop.get("owner_id")}')
        else:
            print('  Нет магазинов')
    except Exception as e:
        print(f'Ошибка при получении магазинов: {e}')
else:
    print('Не настроены переменные окружения SUPABASE_URL и SUPABASE_KEY')