-- SQL миграция для добавления полей бесплатной недели и привязки карты в таблицу clients
-- Выполнить в Supabase SQL Editor

-- Добавление полей для бесплатной недели
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS free_trial_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS saved_payment_method_id TEXT;

-- Комментарии к новым полям
COMMENT ON COLUMN clients.free_trial_used IS 'Была ли использована бесплатная неделя (единоразово)';
COMMENT ON COLUMN clients.free_trial_started_at IS 'Дата начала бесплатной недели';
COMMENT ON COLUMN clients.saved_payment_method_id IS 'ID привязанной карты в ЮKassa';

-- Обновление существующих записей
-- Для пользователей, у которых free_tariff_active = true, устанавливаем free_trial_used = true
UPDATE clients 
SET free_trial_used = TRUE 
WHERE free_tariff_active = TRUE AND free_trial_used IS FALSE;

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_clients_free_trial_used ON clients(free_trial_used);
CREATE INDEX IF NOT EXISTS idx_clients_free_trial_started_at ON clients(free_trial_started_at);
CREATE INDEX IF NOT EXISTS idx_clients_saved_payment_method_id ON clients(saved_payment_method_id);

-- Проверка структуры таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;