-- Создание таблицы business_settings для хранения настроек компании
-- Каждый бизнес может иметь только одну запись настроек

CREATE TABLE IF NOT EXISTS business_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Обязательные поля
    logo_url TEXT, -- URL логотипа в Supabase Storage
    business_name TEXT NOT NULL DEFAULT 'LB', -- Название бизнеса
    
    -- Необязательные поля
    tagline TEXT, -- Слоган или краткое описание
    advantages TEXT, -- Преимущества (через разделитель)
    phone_number TEXT, -- Номер телефона
    telegram_url TEXT, -- Ссылка на Telegram
    whatsapp_url TEXT, -- Ссылка на WhatsApp
    address TEXT, -- Адрес
    yandex_map_url TEXT, -- Ссылка на Яндекс карты
    yandex_reviews_url TEXT, -- Ссылка на Яндекс отзывы
    
    -- FAQ (Вопросы и ответы) - храним как JSON
    faq JSONB DEFAULT '[]'::jsonb,
    
    -- Call to action текст
    call_to_action TEXT,
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ограничения
    UNIQUE(business_id)
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_business_settings_business_id ON business_settings(business_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_settings_updated_at 
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Комментарии к таблице и полям
COMMENT ON TABLE business_settings IS 'Настройки компании для каждого бизнеса';
COMMENT ON COLUMN business_settings.logo_url IS 'URL логотипа компании (обязательное поле)';
COMMENT ON COLUMN business_settings.business_name IS 'Название бизнеса (обязательное поле)';
COMMENT ON COLUMN business_settings.advantages IS 'Преимущества компании, разделенные через •';
COMMENT ON COLUMN business_settings.faq IS 'Вопросы и ответы в формате JSON';
COMMENT ON COLUMN business_settings.call_to_action IS 'Призыв к действию для клиентов';

--  INSERT INTO business_settings (
--      business_id,
--      logo_url,
--      business_name,
--      advantages,
--      phone_number,
--      telegram_url,
--      whatsapp_url,
--      address,
--      yandex_map_url,
--      yandex_reviews_url,
--      faq,
--      call_to_action
--  ) VALUES (
--      'f4e52bb7-a43b-4bfb-b953-2b07c965912b', -- ID существующего бизнеса
--      'https://supabase.storage/businesses/f4e52bb7-a43b-4bfb-b953-2b07c965912b/about/logo.webp',
--      'Студия Роз',
--      'Свежие цветы • Доставка • Гарантия • Круглосуточно',
--      '+7 993 307 47 10',
--      'https://t.me/LIGHTbusinessRose',
--      'https://wa.me/79933074710',
--      'г.Сочи, ул. Горького, 89 Б.',
--      'https://yandex.ru/map-widget/v1/?um=constructor%3Aaaf447bdbb779d61d8f9ff0bfe4c0678b2bc275dff9c32f8950c336ecc1ab18a&source=constructor',
--      'https://yandex.ru/sprav/widget/rating-badge/101836494062?type=rating',
--      '[{"question": "Почему мы?", "answers": ["Быстрая доставка", "Свежие цветы", "Ищете что-то особенное?", "Сюрприз для получателя", "Фотография букета до отправки", "Отчет о доставке", "Фотография счастливого момента", "Персонализированная открытка"]}]',
--      'Не нашли что искали? Отправьте сообщение или позвоните подберем самый подходящий букет для вашего мероприятия'
--  );
