"""Функции для работы с настройками бизнеса"""

import os
import json
import base64
import uuid
from PIL import Image
from io import BytesIO
from datetime import datetime

BUCKET_NAME = 'public_assets'

# Функции для работы с настройками бизнеса
def get_business_settings(business_id):
    """Получает настройки бизнеса из базы данных"""
    try:
        response = supabase.table('business_settings') \
            .select('*') \
            .eq('business_id', business_id) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            # Возвращаем настройки по умолчанию
            return {
                'business_id': business_id,
                'business_name': 'LB',
                'logo_url': '',
                'tagline': '',
                'advantages': '',
                'phone_number': '',
                'telegram_url': '',
                'whatsapp_url': '',
                'address': '',
                'yandex_map_url': '',
                'yandex_reviews_url': '',
                'call_to_action': '',
                'faq': []
            }
    except Exception as e:
        print(f"Error getting business settings: {e}")
        return None

def update_business_settings(settings_data):
    """Обновляет настройки бизнеса"""
    try:
        business_id = settings_data.get('business_id')
        if not business_id:
            return False
        
        # Проверяем, существует ли запись
        existing = supabase.table('business_settings') \
            .select('id') \
            .eq('business_id', business_id) \
            .execute()
        
        # Подготавливаем данные для обновления
        update_data = {
            'business_name': settings_data.get('business_name', 'LB'),
            'logo_url': settings_data.get('logo_url', ''),
            'tagline': settings_data.get('tagline', ''),
            'advantages': settings_data.get('advantages', ''),
            'phone_number': settings_data.get('phone_number', ''),
            'telegram_url': settings_data.get('telegram_url', ''),
            'whatsapp_url': settings_data.get('whatsapp_url', ''),
            'address': settings_data.get('address', ''),
            'yandex_map_url': settings_data.get('yandex_map_url', ''),
            'yandex_reviews_url': settings_data.get('yandex_reviews_url', ''),
            'call_to_action': settings_data.get('call_to_action', ''),
            'faq': json.dumps(settings_data.get('faq', [])),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if existing.data and len(existing.data) > 0:
            # Обновляем существующую запись
            supabase.table('business_settings') \
                .update(update_data) \
                .eq('business_id', business_id) \
                .execute()
        else:
            # Создаем новую запись
            update_data['business_id'] = business_id
            update_data['created_at'] = datetime.utcnow().isoformat()
            supabase.table('business_settings') \
                .insert(update_data) \
                .execute()
        
        return True
    except Exception as e:
        print(f"Error updating business settings: {e}")
        return False

def upload_business_logo(business_id, image_data):
    """Загружает логотип бизнеса в Supabase Storage"""
    try:
        # Декодируем base64
        if "," in image_data:
            image_data_binary = base64.b64decode(image_data.split(',')[-1])
        else:
            image_data_binary = base64.b64decode(image_data)
        
        # Сжимаем изображение
        image = Image.open(BytesIO(image_data_binary))
        
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Оптимальный размер для логотипа
        image.thumbnail((400, 400), Image.LANCZOS)
        
        # Конвертируем в WebP
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format='WEBP', quality=85, method=6)
        compressed_image = img_byte_arr.getvalue()
        
        # Генерируем имя файла
        filename = f"logo_{uuid.uuid4()}.webp"
        path = f"{business_id}/about/{filename}"
        
        # Загружаем в Supabase Storage
        response = supabase.storage.from_(BUCKET_NAME).upload(
            path,
            compressed_image,
            {"content-type": "image/webp", "upsert": 'true'}
        )
        
        # Получаем публичный URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(path)
        
        return public_url
    except Exception as e:
        print(f"Error uploading business logo: {e}")
        return None

def compress_image_to_bytes(image_data, max_size, quality):
    """Конвертирует любое изображение в WebP и сжимает"""
    image = Image.open(BytesIO(image_data))
    
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    
    image.thumbnail(max_size, Image.LANCZOS)
    img_byte_arr = BytesIO()
    
    image.save(img_byte_arr, format='WEBP', quality=quality, method=6)
    return img_byte_arr.getvalue()