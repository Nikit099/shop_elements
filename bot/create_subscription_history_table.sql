-- Таблица для хранения истории платежей за подписки
CREATE TABLE subscription_history (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    period_days INTEGER NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- 'month', '3months', '6months', 'year'
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
    payment_method VARCHAR(50),
    yookassa_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Индексы для быстрого поиска
CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at);
CREATE INDEX idx_subscription_history_payment_status ON subscription_history(payment_status);
CREATE INDEX idx_subscription_history_yookassa_payment_id ON subscription_history(yookassa_payment_id);

-- Комментарии к таблице
COMMENT ON TABLE subscription_history IS 'История платежей за подписки пользователей';
COMMENT ON COLUMN subscription_history.user_id IS 'ID пользователя (telegram_id)';
COMMENT ON COLUMN subscription_history.payment_id IS 'Уникальный ID платежа в системе';
COMMENT ON COLUMN subscription_history.amount IS 'Сумма платежа в рублях';
COMMENT ON COLUMN subscription_history.period_days IS 'Количество дней подписки';
COMMENT ON COLUMN subscription_history.period_type IS 'Тип периода: month (30 дней), 3months (90 дней), 6months (180 дней), year (365 дней)';
COMMENT ON COLUMN subscription_history.payment_status IS 'Статус платежа: pending, success, failed, refunded';
COMMENT ON COLUMN subscription_history.yookassa_payment_id IS 'ID платежа в ЮKassa';
COMMENT ON COLUMN subscription_history.completed_at IS 'Дата завершения платежа';

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_history_updated_at 
    BEFORE UPDATE ON subscription_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();