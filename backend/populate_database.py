# populate_database.py
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_tables():
    """Создает необходимые таблицы в базе данных"""
    
    # SQL для создания таблиц
    sql_commands = [
        # Таблица пользователей
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            telegram_id INTEGER UNIQUE NOT NULL,
            username VARCHAR(255),
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            language_code VARCHAR(10),
            is_premium BOOLEAN DEFAULT false,
            role VARCHAR(50) DEFAULT 'user',
            owned_shop_id UUID,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """,
        
        # Таблица магазинов
        """
        CREATE TABLE IF NOT EXISTS shops (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            owner_id INTEGER REFERENCES users(id),
            description TEXT,
            logo_url TEXT,
            theme JSONB DEFAULT '{"primary": "#000000", "secondary": "#ffffff"}',
            contact_info JSONB DEFAULT '{"phone": "", "email": "", "address": ""}',
            settings JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """,
        
        # Обновляем foreign key в users для owned_shop_id
        """
        ALTER TABLE users 
        ADD CONSTRAINT fk_owned_shop 
        FOREIGN KEY (owned_shop_id) 
        REFERENCES shops(id) 
        ON DELETE SET NULL;
        """,
        
        # Таблица товаров (cards переименовываем в products для consistency)
        """
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            price_display VARCHAR(100),
            category VARCHAR(100),
            colors JSONB DEFAULT '[]',
            sizes JSONB DEFAULT '[]',
            packages JSONB DEFAULT '[]',
            counts JSONB DEFAULT '[]',
            prices JSONB DEFAULT '[]',
            views_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """,
        
        # Таблица изображений товаров
        """
        CREATE TABLE IF NOT EXISTS product_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            thumbnail_url TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """,
        
        # Таблица заказов
        """
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            shop_id UUID REFERENCES shops(id),
            user_id INTEGER REFERENCES users(id),
            items JSONB NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            customer_info JSONB NOT NULL,
            delivery_info JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        """
    ]
    
    try:
        for sql in sql_commands:
            supabase.postgrest.rpc('exec_sql', {'query': sql})
        print("Таблицы успешно созданы!")
        
        # Создаем тестового админа (ваш Telegram ID)
        admin_telegram_id = 123456789  # Замените на ваш реальный Telegram ID
        
        admin_user = {
            'telegram_id': admin_telegram_id,
            'username': 'admin_user',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'admin',
            'created_at': 'NOW()',
            'updated_at': 'NOW()'
        }
        
        supabase.table('users').upsert(admin_user).execute()
        print(f"Администратор создан с Telegram ID: {admin_telegram_id}")
        
        # Создаем тестовый магазин
        test_shop = {
            'name': 'Тестовый магазин',
            'slug': 'test-shop',
            'description': 'Это тестовый магазин для демонстрации',
            'theme': {'primary': '#667eea', 'secondary': '#764ba2'},
            'contact_info': {'phone': '+79991234567', 'email': 'test@example.com', 'address': 'Москва'},
            'is_active': True
        }
        
        shop_response = supabase.table('shops').insert(test_shop).execute()
        if shop_response.data:
            shop_id = shop_response.data[0]['id']
            print(f"Тестовый магазин создан с ID: {shop_id}")
            
            # Назначаем другого пользователя владельцем магазина
            owner_telegram_id = 987654321  # Замените на Telegram ID владельца магазина
            
            owner_user = {
                'telegram_id': owner_telegram_id,
                'username': 'shop_owner',
                'first_name': 'Shop',
                'last_name': 'Owner',
                'role': 'shop_owner',
                'owned_shop_id': shop_id,
                'created_at': 'NOW()',
                'updated_at': 'NOW()'
            }
            
            supabase.table('users').upsert(owner_user).execute()
            print(f"Владелец магазина создан с Telegram ID: {owner_telegram_id}")
            
    except Exception as e:
        print(f"Ошибка при создании таблиц: {e}")

if __name__ == '__main__':
    create_tables()