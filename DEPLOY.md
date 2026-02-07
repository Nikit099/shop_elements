# Инструкция по деплою на Beget

## Подготовка

1. **Создайте аккаунт на Beget** и войдите в панель управления
2. **Подготовьте базу данных**:
   - В панели Beget создайте базу данных MySQL/PostgreSQL
   - Или используйте Supabase (рекомендуется, как в текущем проекте)

## Вариант 1: Деплой с Docker (рекомендуется)

### 1. Настройка сервера

1. Подключитесь к VPS серверу Beget по SSH:
   ```bash
   ssh username@server_ip
   ```

2. Установите Docker и Docker Compose:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

3. Добавьте пользователя в группу docker:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

### 2. Подготовка проекта

1. Скопируйте файлы проекта на сервер:
   ```bash
   scp -r . username@server_ip:/home/username/telegram-app
   ```

2. На сервере создайте файл `.env` в корне проекта:
   ```bash
   cd /home/username/telegram-app
   nano .env
   ```

3. Заполните переменные окружения:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   
   # Telegram Bot
   TELEGRAM_BOT_TOKEN=your_bot_token
   ADMIN_CHAT_IDS=123456789,987654321
   
   # JWT
   JWT_SECRET_KEY=your_jwt_secret_key_change_this
   
   # Flask
   FLASK_APP=app.py
   FLASK_ENV=production
   ```

### 3. Запуск приложения

1. Соберите и запустите контейнеры:
   ```bash
   docker-compose up -d --build
   ```

2. Проверьте статус контейнеров:
   ```bash
   docker-compose ps
   ```

3. Просмотрите логи:
   ```bash
   docker-compose logs -f
   ```

## Вариант 2: Деплой без Docker

### 1. Настройка Backend

1. Установите Python 3.10+:
   ```bash
   sudo apt update
   sudo apt install -y python3.10 python3.10-venv python3-pip
   ```

2. Создайте виртуальное окружение:
   ```bash
   cd backend
   python3.10 -m venv venv
   source venv/bin/activate
   ```

3. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```

4. Настройте переменные окружения:
   ```bash
   cp .env.example .env
   nano .env
   ```

5. Запустите backend с Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn --bind 0.0.0.0:8080 --workers 4 --threads 2 app:app
   ```

### 2. Настройка Frontend

1. Установите Node.js 18+:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. Установите зависимости и соберите проект:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. Установите и настройте Nginx:
   ```bash
   sudo apt install -y nginx
   sudo cp nginx.conf /etc/nginx/sites-available/telegram-app
   sudo ln -s /etc/nginx/sites-available/telegram-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 3. Настройка Telegram Bot

1. Установите зависимости:
   ```bash
   cd bot
   python3.10 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Настройте переменные окружения:
   ```bash
   cp .env.example .env
   nano .env
   ```

3. Запустите бота:
   ```bash
   python bot.py
   ```

## Настройка домена и SSL

1. **Добавьте домен** в панели Beget
2. **Настройте DNS записи**:
   - A запись: @ → IP вашего сервера
   - CNAME запись: www → ваш-домен.ru

3. **Установите SSL сертификат**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
   ```

## Настройка Telegram Bot

1. Создайте бота через @BotFather
2. Получите токен бота
3. Настройте Webhook для бота:
   ```bash
   curl -F "url=https://ваш-домен.ru/bot-webhook" https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
   ```

4. Настройте команды бота:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{
     "commands": [
       {"command": "start", "description": "Запустить бота"},
       {"command": "help", "description": "Помощь"},
       {"command": "shop", "description": "Открыть магазин"}
     ]
   }' https://api.telegram.org/bot<BOT_TOKEN>/setMyCommands
   ```

## Мониторинг и обслуживание

### Логирование
```bash
# Просмотр логов backend
journalctl -u telegram-app-backend -f

# Просмотр логов nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Автозапуск
```bash
# Создайте systemd сервис для backend
sudo nano /etc/systemd/system/telegram-app-backend.service
```

Содержимое файла:
```ini
[Unit]
Description=Telegram App Backend
After=network.target

[Service]
User=username
WorkingDirectory=/home/username/telegram-app/backend
Environment="PATH=/home/username/telegram-app/backend/venv/bin"
ExecStart=/home/username/telegram-app/backend/venv/bin/gunicorn --bind 0.0.0.0:8080 --workers 4 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable telegram-app-backend
sudo systemctl start telegram-app-backend
```

### Резервное копирование
```bash
# Скрипт для резервного копирования
#!/bin/bash
BACKUP_DIR="/home/username/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Создание резервной копии базы данных
pg_dump -U username -d database_name > $BACKUP_DIR/db_backup_$DATE.sql

# Создание резервной копии файлов
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /home/username/telegram-app

# Удаление старых резервных копий (старше 7 дней)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Устранение неполадок

### 1. Проверка портов
```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8080
```

### 2. Проверка логов
```bash
# Backend
sudo journalctl -u telegram-app-backend -n 50

# Nginx
sudo tail -f /var/log/nginx/error.log
```

### 3. Проверка подключения к базе данных
```bash
# Для Supabase
curl -X GET https://your-supabase-url.supabase.co/rest/v1/
```

### 4. Проверка Telegram Webhook
```bash
curl https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

## Оптимизация производительности

1. **Кэширование**:
   - Настройте Redis для кэширования сессий
   - Используйте CDN для статических файлов

2. **База данных**:
   - Создайте индексы для часто используемых полей
   - Регулярно делайте оптимизацию таблиц

3. **Nginx**:
   - Настройте кэширование статических файлов
   - Включите gzip сжатие
   - Настройте лимиты запросов

## Безопасность

1. **Обновляйте зависимости**:
   ```bash
   # Backend
   pip list --outdated
   pip install --upgrade -r requirements.txt
   
   # Frontend
   npm outdated
   npm update
   ```

2. **Настройте брандмауэр**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

3. **Регулярные проверки безопасности**:
   - Проверяйте логи на подозрительную активность
   - Обновляйте SSL сертификаты
   - Делайте резервные копии

## Контакты для поддержки

- **Техническая поддержка Beget**: support@beget.com
- **Документация проекта**: см. README.md
- **Issues проекта**: создавайте issues в репозитории

---

*Примечание: Эта инструкция предполагает, что у вас есть базовые знания Linux и опыт работы с серверами. Если возникнут трудности, обратитесь к технической поддержке Beget.*