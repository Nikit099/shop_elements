"#!/bin/bash

# Скрипт для резервного копирования Telegram Mini App
# Автоматическое создание резервных копий базы данных и файлов

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Конфигурация
BACKUP_DIR="/home/$(whoami)/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

# Создание директории для резервных копий
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}=== Создание резервной копии Telegram Mini App ===${NC}"

# 1. Резервное копирование базы данных Supabase
echo -e "${YELLOW}1. Резервное копирование базы данных...${NC}"

# Проверка наличия переменных окружения
if [ -f .env ]; then
    source .env
fi

if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
    # Экспорт данных через Supabase API (пример для таблиц)
    TABLES=("cards" "images" "users" "orders" "hints" "business_settings" "businesses")
    
    for table in "${TABLES[@]}"; do
        echo "  Экспорт таблицы: $table"
        curl -s -H "apikey: $SUPABASE_KEY" \
             -H "Authorization: Bearer $SUPABASE_KEY" \
             "$SUPABASE_URL/rest/v1/$table?select=*" \
             > "$BACKUP_DIR/${table}_${DATE}.json" 2>/dev/null || true
    done
    
    # Создание архива с JSON файлами
    tar -czf "$BACKUP_DIR/db_backup_${DATE}.tar.gz" \
        -C "$BACKUP_DIR" \
        $(for table in "${TABLES[@]}"; do echo "${table}_${DATE}.json"; done) \
        2>/dev/null
    
    # Удаление временных JSON файлов
    for table in "${TABLES[@]}"; do
        rm -f "$BACKUP_DIR/${table}_${DATE}.json"
    done
    
    echo -e "${GREEN}✓ База данных скопирована${NC}"
else
    echo -e "${YELLOW}⚠ Предупреждение: Переменные Supabase не найдены, пропускаем копирование БД${NC}"
fi

# 2. Резервное копирование файлов проекта
echo -e "${YELLOW}2. Резервное копирование файлов проекта...${NC}"

# Определяем директорию проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Файлы и директории для резервного копирования
BACKUP_ITEMS=(
    "docker-compose.yml"
    "Dockerfile.*"
    "nginx.conf"
    ".env"
    "backend/"
    "frontend/"
    "bot/"
    "deploy-beget.sh"
    "DEPLOY.md"
)

# Создание списка файлов для архивации
BACKUP_LIST_FILE="/tmp/backup_list_${DATE}.txt"
> "$BACKUP_LIST_FILE"

for item in "${BACKUP_ITEMS[@]}"; do
    if [ -e "$PROJECT_DIR/$item" ]; then
        echo "$item" >> "$BACKUP_LIST_FILE"
    fi
done

# Создание архива
tar -czf "$BACKUP_DIR/files_backup_${DATE}.tar.gz" \
    -C "$PROJECT_DIR" \
    --files-from="$BACKUP_LIST_FILE" \
    2>/dev/null

rm -f "$BACKUP_LIST_FILE"

echo -e "${GREEN}✓ Файлы проекта скопированы${NC}"

# 3. Резервное копирование логов Docker
echo -e "${YELLOW}3. Резервное копирование логов...${NC}"

if command -v docker-compose &> /dev/null; then
    # Экспорт логов контейнеров
    LOG_BACKUP_DIR="$BACKUP_DIR/logs_${DATE}"
    mkdir -p "$LOG_BACKUP_DIR"
    
    # Получаем список контейнеров
    CONTAINERS=$(docker-compose ps -q 2>/dev/null || true)
    
    if [ -n "$CONTAINERS" ]; then
        for container in $CONTAINERS; do
            container_name=$(docker inspect --format='{{.Name}}' "$container" | sed 's/^\///')
            echo "  Копирование логов: $container_name"
            docker logs "$container" --tail 1000 > "$LOG_BACKUP_DIR/${container_name}.log" 2>&1 || true
        done
        
        # Архивируем логи
        tar -czf "$BACKUP_DIR/logs_backup_${DATE}.tar.gz" \
            -C "$BACKUP_DIR" "logs_${DATE}" \
            2>/dev/null
        
        # Удаляем временную директорию
        rm -rf "$LOG_BACKUP_DIR"
        
        echo -e "${GREEN}✓ Логи скопированы${NC}"
    else
        echo -e "${YELLOW}⚠ Предупреждение: Контейнеры не найдены${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Предупреждение: docker-compose не установлен${NC}"
fi

# 4. Очистка старых резервных копий
echo -e "${YELLOW}4. Очистка старых резервных копий...${NC}"

find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name "*.sql" -mtime +$KEEP_DAYS -delete

echo -e "${GREEN}✓ Старые резервные копии удалены${NC}"

# 5. Проверка и вывод информации
echo -e "${YELLOW}5. Проверка созданных резервных копий...${NC}"

BACKUP_FILES=($(find "$BACKUP_DIR" -name "*${DATE}*" -type f))
TOTAL_SIZE=0

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "  $(basename "$file"): $size"
        TOTAL_SIZE=$((TOTAL_SIZE + $(du -k "$file" | cut -f1)))
    fi
done

# Конвертируем общий размер в человеко-читаемый формат
if [ $TOTAL_SIZE -lt 1024 ]; then
    TOTAL_SIZE_HR="${TOTAL_SIZE}K"
elif [ $TOTAL_SIZE -lt 1048576 ]; then
    TOTAL_SIZE_HR="$(echo "scale=1; $TOTAL_SIZE/1024" | bc)M"
else
    TOTAL_SIZE_HR="$(echo "scale=1; $TOTAL_SIZE/1048576" | bc)G"
fi

echo -e "${GREEN}✓ Всего создано ${#BACKUP_FILES[@]} файлов, общий размер: ${TOTAL_SIZE_HR}${NC}"

# 6. Создание отчета
REPORT_FILE="$BACKUP_DIR/backup_report_${DATE}.txt"
cat > "$REPORT_FILE" << EOF
Отчет о резервном копировании
=============================
Дата: $(date)
Директория: $BACKUP_DIR
Общий размер: ${TOTAL_SIZE_HR}

Созданные файлы:
$(for file in "${BACKUP_FILES[@]}"; do echo "- $(basename "$file")"; done)

Статус: УСПЕШНО
EOF

echo -e "${GREEN}✓ Отчет создан: $REPORT_FILE${NC}"

# 7. Отправка уведомления (опционально)
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
    
    if [ -n "$ADMIN_CHAT_IDS" ]; then
        echo -e "${YELLOW}6. Отправка уведомления...${NC}"
        
        # Разделяем chat IDs
        IFS=',' read -ra CHAT_IDS <<< "$ADMIN_CHAT_IDS"
        
        MESSAGE="✅ Резервное копирование завершено
📅 Дата: $(date)
💾 Размер: ${TOTAL_SIZE_HR}
📁 Файлов: ${#BACKUP_FILES[@]}"
        
        for chat_id in "${CHAT_IDS[@]}"; do
            if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
                curl -s -X POST \
                    -H "Content-Type: application/json" \
                    -d "{\"chat_id\": \"$chat_id\", \"text\": \"$MESSAGE\"}" \
                    "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                    > /dev/null || true
            fi
        done
        
        echo -e "${GREEN}✓ Уведомления отправлены${NC}"
    fi
fi

echo -e "${GREEN}=== Резервное копирование завершено успешно! ===${NC}"
echo -e "${YELLOW}Резервные копии сохранены в: $BACKUP_DIR${NC}"

# Автоматизация через cron
echo -e "${YELLOW}Для автоматического резервного копирования добавьте в crontab:${NC}"
echo "0 2 * * * $PROJECT_DIR/backup.sh > /dev/null 2>&1"
echo ""
echo "Это будет выполнять резервное копирование каждый день в 2:00 ночи"
EOF"