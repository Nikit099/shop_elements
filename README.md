# Multi-Store Telegram Mini App Platform

Платформа для создания и управления несколькими магазинами через Telegram Mini App с динамическими ссылками и авторизацией через Telegram.
SUPABASE - облачная, уже с загруженными данными
## 🎯 Основные возможности

### 1. Поддержка нескольких магазинов
- **Динамические ссылки**: `https://t.me/botname/app?startapp=shop_{shop_id}`
- Каждый магазин имеет уникальный ID и настройки
- Индивидуальный дизайн и контент для каждого магазина

### 2. Система авторизации
- **Telegram OAuth**: Авторизация через Telegram WebApp
- **JWT токены**: Безопасное хранение сессий
- **Ролевая модель**: Пользователи и владельцы магазинов

### 3. Ролевая модель
- **Пользователи**: Могут просматривать товары, добавлять в корзину, оформлять заказы
- **Владельцы магазинов**: Полный доступ к управлению своим магазином (CRUD товаров, просмотр заказов, статистика)

## 📁 Структура проекта

```
├── backend/                    # Backend сервер (Flask + Socket.IO)
│   ├── app.py                 # Основной файл сервера
│   ├── requirements.txt       # Python зависимости
│   ├── .env                   # Переменные окружения
│   └── venv/                  # Виртуальное окружение
├── frontend/                  # React приложение (Telegram Mini App)
│   ├── src/
│   │   ├── screens/          # Экранные компоненты
│   │   ├── components/       # Переиспользуемые компоненты
│   │   ├── context.js        # Контекст приложения
│   │   ├── navigate.js       # Навигация с поддержкой shop_id
│   │   └── index.js          # Точка входа
│   ├── package.json          # Зависимости React
│   └── craco.config.js       # Конфигурация CRA
├── bot/                       # Telegram бот
│   ├── bot.py                # Основной файл бота
│   ├── requirements.txt      # Python зависимости
│   └── .env                  # Переменные окружения
├── shared/                    # Общие ресурсы
└── README.md                 # Документация
```

## 🛠️ Технологический стек

### Backend
- **Flask**: Веб-фреймворк
- **Socket.IO**: Реальное время
- **Flask-JWT-Extended**: JWT аутентификация
- **Supabase**: База данных и хранилище
- **Python 3.10+**

### Frontend
- **React 18**: UI библиотека
- **React Router DOM**: Навигация
- **Socket.IO Client**: WebSocket клиент
- **Telegram WebApp API**: Интеграция с Telegram
- **Material-UI**: Компоненты интерфейса

### Telegram Bot
- **Aiogram 3**: Асинхронный фреймворк для ботов
- **Python 3.10+**

## 🔐 Система авторизации

### Flow авторизации:
1. Пользователь открывает Mini App через Telegram
2. Telegram передает `initData` (user data)
3. Сервер проверяет подпись Telegram
4. Генерируется JWT токен
5. Токен сохраняется в localStorage
6. Делается запрос к бд за строкой по условию business_id, в этой строке есть owner_id - его сравниваем с id от тг, если схож айди, то клиент владелец магазина, и вместе с jwt сохраняется информация о юзере и о том, что он владелец магазина в localStorage
7. Все последующие запросы включают токен

### Роли и разрешения:
```javascript

// Разрешения
const PERMISSIONS = {
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCT: 'create_product',
  EDIT_PRODUCT: 'edit_product',
  DELETE_PRODUCT: 'delete_product',
  VIEW_ORDERS: 'view_orders',
  MANAGE_SHOP: 'manage_shop'
};
```

## 🏪 Модель данных

### Основные сущности:

#### 1. Магазины (shops)
```sql
CREATE TABLE shops (
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
```

#### 2. Пользователи (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    owned_shop_id UUID REFERENCES shops(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Товары (products)
```sql
CREATE TABLE products (
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
```

#### 4. Изображения товаров (product_images)
```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Заказы (orders)
```sql
CREATE TABLE orders (
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
```

## 🚀 API Endpoints

### Аутентификация
- `POST /api/auth/telegram` - Авторизация через Telegram
- `POST /api/auth/refresh` - Обновление JWT токена
- `POST /api/auth/logout` - Выход из системы

### Магазины
- `GET /api/shops` - Список магазинов
- `GET /api/shops/:slug` - Информация о магазине
- `POST /api/shops` - Создание магазина (только admin)
- `PUT /api/shops/:id` - Обновление магазина (владелец/admin)
- `DELETE /api/shops/:id` - Удаление магазина (admin)

### Товары
- `GET /api/shops/:shop_id/products` - Товары магазина
- `GET /api/products/:id` - Детали товара
- `POST /api/shops/:shop_id/products` - Создание товара (владелец)
- `PUT /api/products/:id` - Обновление товара (владелец)
- `DELETE /api/products/:id` - Удаление товара (владелец)
- `POST /api/products/:id/view` - Увеличение счетчика просмотров

### Заказы
- `GET /api/shops/:shop_id/orders` - Заказы магазина (владелец)
- `GET /api/users/orders` - Заказы пользователя
- `POST /api/orders` - Создание заказа
- `PUT /api/orders/:id/status` - Обновление статуса (владелец)

## 🔌 WebSocket Events

### Клиент → Сервер
- `auth` - Аутентификация
- `products:filter` - Фильтрация товаров
- `products:create` - Создание товара
- `products:update` - Обновление товара
- `products:delete` - Удаление товара
- `images:upload` - Загрузка изображений
- `orders:create` - Создание заказа

### Сервер → Клиент
- `auth:success` - Успешная аутентификация
- `products:list` - Список товаров
- `products:created` - Товар создан
- `products:updated` - Товар обновлен
- `products:deleted` - Товар удален
- `orders:created` - Заказ создан
- `error` - Ошибка

## 📱 Telegram Mini App

### Конфигурация ссылок:
```
Основной шаблон: https://t.me/{bot_username}/app?startapp=shop_{shop_slug}
Пример: https://t.me/flowers_bot/app?startapp=shop_rose_studio
```

### Получение shop_id в приложении:
```javascript
// В navigate.js
const pathParts = window.location.pathname.split('/');
const shopSlug = pathParts[1]; // Получаем slug из URL

// Или из параметров запуска
const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
// start_param = "shop_rose_studio"
```

### Интеграция с Telegram WebApp:
```javascript
// Инициализация
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

// Получение данных пользователя
const user = window.Telegram.WebApp.initDataUnsafe.user;
const userId = user.id;
const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
```

## 🛒 Функционал магазина

### Для пользователей:
1. **Просмотр каталога** товаров магазина
2. **Фильтрация** по категориям, цене
3. **Детальный просмотр** товара с изображениями
4. **Добавление в корзину** с выбором характеристик
5. **Оформление заказа** с формой доставки
6. **Просмотр истории** заказов
7. **Темная/светлая тема**

### Для владельцев магазинов:
1. **Панель управления** магазином
2. **CRUD товаров** с загрузкой изображений
3. **Управление заказами** (просмотр, изменение статуса)
4. **Просмотр статистики** (просмотры, продажи)
5. **Настройки магазина** (информация, контакты, тема)

## 🔧 Настройка окружения

### Backend (.env)
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
TELEGRAM_BOT_TOKEN=your-bot-token
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080
REACT_APP_TELEGRAM_BOT=your_bot_username
```

### Bot (.env)
```env
TELEGRAM_BOT_TOKEN=your-bot-token
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
ADMIN_CHAT_IDS=123456789,987654321
```

## 🚀 Запуск проекта

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows
pip install -r requirements.txt
python app.py
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Telegram Bot
```bash
cd bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python bot.py
```

## 📊 База данных

### Инициализация таблиц:
```sql
-- Создание таблиц через Supabase SQL Editor
-- (см. раздел "Модель данных" выше)
```

### Миграции:
Используйте Supabase миграции или создавайте таблицы через веб-интерфейс.

## 🔒 Безопасность

1. **Telegram Data Validation**: Проверка подписи initData
2. **JWT Tokens**: Access и Refresh токены
3. **Role-Based Access Control**: Проверка ролей для каждого endpoint
4. **Input Validation**: Валидация всех входящих данных
5. **SQL Injection Protection**: Использование параметризованных запросов через Supabase

## 📈 Планы развития

### Ближайшие задачи:
1. **Панель администратора** для управления всеми магазинами
2. **Аналитика** для владельцев магазинов
3. **Уведомления** о новых заказах
4. **Система скидок и промокодов**
5. **Отзывы и рейтинги** товаров
6. **Мультиязычность**
7. **Интеграция с платежными системами**

### Долгосрочные цели:
1. **Мобильное приложение** на React Native
2. **API для внешних интеграций**
3. **Система рекомендаций** на основе поведения
4. **Интеграция с CRM системами**
5. **Маркетплейс** с несколькими продавцами

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для вашей фичи
3. Внесите изменения
4. Напишите тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Контакты

Для вопросов и поддержки:
- Telegram: @your_username
- Email: support@example.com
- Issues: GitHub Issues

---

*Проект разработан для быстрого создания и запуска интернет-магазинов через Telegram Mini App с минимальными затратами и максимальной простотой использования.*

По сути роль это условность, если у меня есть связь с магазином, то я его админ, другие магазины для меня чужие и я для них клиент этот пункт еще в ридми запиши

Велком это и есть сразу общая информация, она для всех, туда попадают и неавторизованные, и авторизованные без магазина, кратко и лаконично