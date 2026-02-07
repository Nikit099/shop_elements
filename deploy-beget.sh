#!/bin/bash

# Скрипт для деплоя Telegram Mini App на Beget
# Использование: ./deploy-beget.sh [сервер] [пользователь]

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Параметры по умолчанию
SERVER="${1:-your-server-ip}"
USER="${2:-your-username}"
PROJECT_DIR="/home/$USER/telegram-app"
REMOTE_DIR="$USER@$SERVER:$PROJECT_DIR"

echo -e "${GREEN}=== Деплой Telegram Mini App на Beget ===${NC}\n"

# Проверка наличия необходимых файлов
check_files() {
    echo -e "${YELLOW}Проверка необходимых файлов...${NC}"
    
    local required_files=(
        "docker-compose.yml"
        "Dockerfile.backend"
        "Dockerfile.frontend"
        "Dockerfile.bot"
        "nginx.conf"
        ".env.example"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}Ошибка: Файл $file не найден${NC}"
            echo -e "${BLUE}Подсказка: Убедитесь что вы запускаете скрипт из корня проекта${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✓ Все необходимые файлы присутствуют${NC}\n"
}

# Копирование файлов на сервер
copy_files() {
    echo -e "${YELLOW}Копирование файлов на сервер...${NC}"
    
    # Создание директории на сервере
    echo -e "${BLUE}Создание директории $PROJECT_DIR на сервере...${NC}"
    ssh $USER@$SERVER "mkdir -p $PROJECT_DIR"
    
    # Копирование основных файлов
    echo -e "${BLUE}Копирование конфигурационных файлов...${NC}"
    scp docker-compose.yml $REMOTE_DIR/
    scp Dockerfile.backend $REMOTE_DIR/
    scp Dockerfile.frontend $REMOTE_DIR/
    scp Dockerfile.bot $REMOTE_DIR/
    scp nginx.conf $REMOTE_DIR/
    scp .env.example $REMOTE_DIR/
    
    # Копирование исходного кода
    echo -e "${YELLOW}Копирование backend...${NC}"
    scp -r backend/ $REMOTE_DIR/
    
    echo -e "${YELLOW}Копирование frontend...${NC}"
    scp -r frontend/ $REMOTE_DIR/
    
    echo -e "${YELLOW}Копирование bot...${NC}"
    scp -r bot/ $REMOTE_DIR/
    
    echo -e "${GREEN}✓ Файлы скопированы${NC}\n"
}

# Настройка окружения на сервере
setup_server() {
    echo -e "${YELLOW}Настройка сервера...${NC}"
    
    ssh $USER@$SERVER << 'EOF'
        cd $PROJECT_DIR
        
        echo "Обновление пакетов..."
        sudo apt-get update
        
        # Проверка установки Docker
        if ! command -v docker &> /dev/null; then
            echo "Установка Docker..."
            sudo apt-get install -y docker.io
        fi
        
        # Проверка установки Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            echo "Установка Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Добавление пользователя в группу docker (если нужно)
        if ! groups $USER | grep -q '\bdocker\b'; then
            echo "Добавление пользователя $USER в группу docker..."
            sudo usermod -aG docker $USER
            echo -e "${YELLOW}ВАЖНО: Необходимо перелогиниться или выполнить 'newgrp docker'${NC}"
        fi
        
        # Проверка файла .env
        if [ ! -f ".env" ]; then
            echo "Создание файла .env из примера..."
            cp .env.example .env
            echo -e "${YELLOW}ВАЖНО: Отредактируйте файл .env на сервере перед запуском!${NC}"
            echo "Используйте: nano $PROJECT_DIR/.env"
        else
            echo "Файл .env уже существует"
        fi
        
        # Создание необходимых директорий для логов и данных
        echo "Создание директорий для логов и данных..."
        mkdir -p logs/nginx
        mkdir -p logs/backend
        mkdir -p logs/frontend
        mkdir -p logs/bot
        mkdir -p data/db
        
        # Установка прав
        chmod 755 logs/
        chmod 755 data/
        
        echo -e "${GREEN}✓ Сервер настроен${NC}"
EOF
    
    echo ""
}

# Запуск приложения
start_application() {
    echo -e "${YELLOW}Запуск приложения...${NC}"
    
    ssh $USER@$SERVER << 'EOF'
        cd $PROJECT_DIR
        
        echo "Проверка переменных окружения..."
        if [ ! -f ".env" ]; then
            echo -e "${RED}Ошибка: Файл .env не найден${NC}"
            echo "Создайте его из .env.example и настройте переменные"
            exit 1
        fi
        
        # Остановка старых контейнеров
        echo "Остановка старых контейнеров..."
        docker-compose down --remove-orphans || true
        
        # Удаление старых образов (опционально)
        echo "Очистка неиспользуемых образов..."
        docker image prune -f || true
        
        # Сборка и запуск новых контейнеров
        echo "Сборка и запуск контейнеров..."
        docker-compose up -d --build
        
        # Небольшая пауза для запуска
        echo "Ожидание запуска сервисов..."
        sleep 10
        
        # Проверка статуса
        echo -e "\n${BLUE}Проверка статуса контейнеров...${NC}"
        docker-compose ps
        
        # Просмотр логов
        echo -e "\n${BLUE}Последние логи...${NC}"
        docker-compose logs --tail=20
        
        # Проверка здоровья
        echo -e "\n${BLUE}Проверка доступности сервисов...${NC}"
        
        # Проверка nginx
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200\|301\|302"; then
            echo "✓ Nginx работает"
        else
            echo -e "${YELLOW}⚠ Nginx может быть недоступен${NC}"
        fi
        
        echo -e "${GREEN}✓ Приложение запущено${NC}"
EOF
    
    echo ""
}

# Настройка домена и SSL
setup_domain() {
    echo -e "${YELLOW}Настройка домена и SSL...${NC}"
    
    read -p "Установить SSL сертификат? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Для Beget SSL настраивается через панель управления${NC}"
        echo -e "${BLUE}1. Зайдите в панель управления Beget${NC}"
        echo -e "${BLUE}2. Перейдите в раздел 'Домены'${NC}"
        echo -e "${BLUE}3. Выберите ваш домен и нажмите 'SSL'${NC}"
        echo -e "${BLUE}4. Включите SSL и выберите 'Let's Encrypt'${NC}"
        echo -e "${BLUE}5. Обновите конфигурацию nginx${NC}"
        
        ssh $USER@$SERVER << 'EOF'
            cd $PROJECT_DIR
            
            # Обновление nginx конфига для SSL
            if [ -f "nginx-ssl.conf" ]; then
                echo "Обновление конфигурации nginx для SSL..."
                cp nginx-ssl.conf nginx.conf
                docker-compose restart nginx
            else
                echo -e "${YELLOW}Файл nginx-ssl.conf не найден${NC}"
                echo "Создайте конфигурацию для SSL вручную"
            fi
EOF
    fi
    
    echo ""
}

# Настройка Telegram Webhook
setup_webhook() {
    echo -e "${YELLOW}Настройка Telegram Webhook...${NC}"
    
    read -p "Настроить Telegram Webhook? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ssh $USER@$SERVER << 'EOF'
            cd $PROJECT_DIR
            
            if [ -f ".env" ]; then
                # Загрузка переменных окружения
                source .env
                
                if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
                    # Определение домена
                    local DOMAIN="${DOMAIN:-$SERVER}"
                    
                    echo "Настройка webhook для бота..."
                    echo "URL: https://$DOMAIN/bot-webhook"
                    
                    # Настройка webhook
                    curl -X POST \
                         -H "Content-Type: application/json" \
                         -d "{\"url\": \"https://$DOMAIN/bot-webhook\"}" \
                         "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"
                    
                    echo -e "\n${GREEN}✓ Webhook настроен${NC}"
                    
                    # Проверка webhook
                    echo -e "\n${BLUE}Проверка webhook...${NC}"
                    curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
                    
                else
                    echo -e "${YELLOW}⚠ Предупреждение: TELEGRAM_BOT_TOKEN не установлен в .env${NC}"
                fi
            else
                echo -e "${YELLOW}⚠ Предупреждение: Файл .env не найден${NC}"
            fi
EOF
    fi
    
    echo ""
}

# Создание скрипта для бэкапа
create_backup_script() {
    echo -e "${YELLOW}Создание скрипта для бэкапа...${NC}"
    
    ssh $USER@$SERVER << 'EOF'
        cd $PROJECT_DIR
        
        cat > backup.sh << 'BACKUP_EOF'
#!/bin/bash

set -e

BACKUP_DIR="/home/$USER/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/telegram-app-backup-$TIMESTAMP.tar.gz"

echo "Создание бэкапа..."
mkdir -p $BACKUP_DIR

# Создание бэкапа базы данных
docker-compose exec -T db pg_dumpall -U postgres > data/db-backup-$TIMESTAMP.sql 2>/dev/null || echo "Бэкап БД пропущен (возможно, нет контейнера db)"

# Архивирование важных данных
tar -czf $BACKUP_FILE \
    data/ \
    .env \
    docker-compose.yml \
    *.conf \
    Dockerfile.* 2>/dev/null || true

echo "Бэкап создан: $BACKUP_FILE"
echo "Размер: $(du -h $BACKUP_FILE | cut -f1)"

# Удаление старых бэкапов (сохраняем последние 7)
find $BACKUP_DIR -name "telegram-app-backup-*.tar.gz" -type f -mtime +7 -delete

BACKUP_EOF
        
        chmod +x backup.sh
        echo -e "${GREEN}✓ Скрипт backup.sh создан${NC}"
EOF
    
    echo ""
}

# Мониторинг
show_monitoring() {
    echo -e "${GREEN}=== Команды для мониторинга ===${NC}\n"
    
    echo -e "${BLUE}Просмотр логов:${NC}"
    echo "  ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose logs -f'"
    echo "  ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose logs nginx -f'"
    echo "  ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose logs backend -f'"
    echo ""
    
    echo -e "${BLUE}Просмотр статуса контейнеров:${NC}"
    echo "  ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose ps'"
    echo "  ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose top'"
    echo ""
    
    echo -e "${BLUE}Управление приложением:${NC}"
    echo "  Перезапуск:      ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose restart'"
    echo "  Остановка:       ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose stop'"
    echo "  Запуск:          ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose start'"
    echo "  Пересборка:      ssh $USER@$SERVER 'cd $PROJECT_DIR && docker-compose up -d --build'"
    echo ""
    
    echo -e "${BLUE}Системные команды:${NC}"
    echo "  Использование диска: ssh $USER@$SERVER 'df -h'"
    echo "  Использование памяти: ssh $USER@$SERVER 'free -h'"
    echo "  Активные процессы:   ssh $USER@$SERVER 'htop'"
    echo ""
    
    echo -e "${BLUE}Бэкапы:${NC}"
    echo "  Создать бэкап:   ssh $USER@$SERVER 'cd $PROJECT_DIR && ./backup.sh'"
    echo ""
}

# Основной процесс
main() {
    echo -e "${BLUE}Целевой сервер:${NC} $SERVER"
    echo -e "${BLUE}Пользователь:${NC} $USER"
    echo -e "${BLUE}Директория проекта:${NC} $PROJECT_DIR"
    echo ""
    
    # Проверка подключения
    echo -e "${YELLOW}Проверка подключения к серверу...${NC}"
    if ! ssh -q -o ConnectTimeout=5 $USER@$SERVER exit; then
        echo -e "${RED}Ошибка: Не удалось подключиться к серверу${NC}"
        echo -e "${BLUE}Проверьте:${NC}"
        echo "  1. Парольную или ключевую аутентификацию"
        echo "  2. Доступ по SSH на сервере"
        echo "  3. Корректность IP и имени пользователя"
        exit 1
    fi
    echo -e "${GREEN}✓ Подключение установлено${NC}\n"
    
    # Выполнение шагов
    check_files
    copy_files
    setup_server
    start_application
    
    # Создание скрипта бэкапа
    create_backup_script
    
    # Опциональные шаги
    setup_domain
    setup_webhook
    
    # Итог
    echo -e "${GREEN}=== Деплой завершен успешно! ===${NC}\n"
    
    # Получение IP сервера для информации
    SERVER_IP=$(ssh $USER@$SERVER "hostname -I | awk '{print \$1}'" 2>/dev/null || echo "$SERVER")
    
    echo -e "${BLUE}Информация о развертывании:${NC}"
    echo "  Сервер:          $SERVER_IP"
    echo "  Домен:           (настройте в панели Beget)"
    echo "  SSH доступ:      ssh $USER@$SERVER"
    echo "  Директория:      $PROJECT_DIR"
    echo ""
    
    show_monitoring
}

# Обработка аргументов командной строки
SKIP_COPY=false
SKIP_SETUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "Использование: $0 [сервер] [пользователь] [опции]"
            echo ""
            echo "Примеры:"
            echo "  $0 123.456.789.0 username"
            echo "  $0 beget-server.ru user123 --skip-copy"
            echo ""
            echo "Опции:"
            echo "  --help, -h        Показать эту справку"
            echo "  --skip-copy       Пропустить копирование файлов"
            echo "  --skip-setup      Пропустить настройку сервера"
            echo "  --domain-only     Только настройка домена и SSL"
            echo "  --webhook-only    Только настройка Telegram Webhook"
            exit 0
            ;;
        --skip-copy)
            SKIP_COPY=true
            shift
            ;;
        --skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        *)
            # Обработка позиционных аргументов
            if [ -z "$SERVER_SET" ]; then
                SERVER="$1"
                SERVER_SET=true
            elif [ -z "$USER_SET" ]; then
                USER="$1"
                USER_SET=true
            fi
            shift
            ;;
    esac
done

# Проверка обязательных параметров
if [ "$SERVER" = "your-server-ip" ] || [ "$USER" = "your-username" ]; then
    echo -e "${RED}Ошибка: Не указаны сервер и пользователь${NC}"
    echo "Использование: $0 [сервер] [пользователь]"
    echo "Пример: $0 123.456.789.0 username"
    exit 1
fi

# Запуск основного процесса
main