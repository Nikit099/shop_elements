import os
import json
import base64
import uuid
import hashlib
import hmac
from datetime import datetime, timedelta
from functools import wraps
from flask_socketio import SocketIO, emit, disconnect
from flask_cors import CORS
# from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_identity
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
from supabase import create_client, Client
from flask import Flask, send_from_directory, jsonify, request

load_dotenv()

# Инициализация Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = 'public_assets'

# Конфигурация Flask и JWT
app = Flask(__name__)
# app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
# app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
# app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=1024 * 1024 * 1024)
# jwt = JWTManager(app)

def prepare_data(data):
    """Подготовка данных для JSON"""
    if isinstance(data, list):
        return [prepare_data(item) for item in data]
    elif isinstance(data, dict):
        return {k: prepare_data(v) for k, v in data.items()}
    elif isinstance(data, (int, str, bool, type(None))):
        return data
    else:
        return str(data)

def get_or_create_user(telegram_data: dict):
    """Получает или создает пользователя в базе данных"""
    try:
        response = supabase.table('users') \
            .select('*') \
            .eq('telegram_id', telegram_data['telegram_id']) \
            .execute()
        
        if response.data and len(response.data) > 0:
            user = response.data[0]
            update_data = {
                'username': telegram_data.get('username'),
                'first_name': telegram_data.get('first_name'),
                'last_name': telegram_data.get('last_name'),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            supabase.table('users') \
                .update(update_data) \
                .eq('id', user['id']) \
                .execute()
            
            return user
        else:
            new_user = {
                'telegram_id': telegram_data['telegram_id'],
                'username': telegram_data.get('username'),
                'first_name': telegram_data.get('first_name'),
                'last_name': telegram_data.get('last_name'),
                'language_code': telegram_data.get('language_code'),
                'is_premium': telegram_data.get('is_premium', False),
                'role': 'user',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = supabase.table('users').insert(new_user).execute()
            return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error getting/creating user: {e}")
        return None

def check_business_owner(business_id: str, user_id: int) -> dict:
    """
    Проверяет, является ли пользователь владельцем бизнеса
    Возвращает информацию о магазине и флаг is_owner
    """
    try:
        # Получаем бизнес из базы данных
        response = supabase.table('businesses') \
            .select('*') \
            .eq('id', business_id) \
            .execute()
        
        if not response.data:
            return None
        
        business = response.data[0]
        
        # Проверяем, совпадает ли owner_id с user_id
        is_owner = business.get('owner_id') == user_id
        
        return {
            'business_id': business['id'],
            'business_name': business.get('name'),
            'owner_id': business.get('owner_id'),
            'is_owner': is_owner,
            'business_data': business
        }
    except Exception as e:
        print(f"Error checking business owner: {e}")
        return None

def create_shop_owner(telegram_id: int, shop_id: str):
    """Назначает пользователя владельцем магазина"""
    try:
        response = supabase.table('users') \
            .select('*') \
            .eq('telegram_id', telegram_id) \
            .execute()
        
        if not response.data:
            return False
        
        user = response.data[0]
        update_data = {
            'role': 'shop_owner',
            'owned_shop_id': shop_id,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        supabase.table('users') \
            .update(update_data) \
            .eq('id', user['id']) \
            .execute()
        
        return True
    except Exception as e:
        print(f"Error creating shop owner: {e}")
        return False

# Вспомогательные функции
def compress_image_to_bytes(image_data, max_size, quality):
    """Конвертирует любое изображение в WebP и сжимает"""
    image = Image.open(BytesIO(image_data))
    
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    
    image.thumbnail(max_size, Image.LANCZOS)
    img_byte_arr = BytesIO()
    
    image.save(img_byte_arr, format='WEBP', quality=quality, method=6)
    return img_byte_arr.getvalue()

def upload_to_business_bucket(file_data, business_id, card_id, filename, is_lazy=False):
    """Загружает файл в папку business_id/products/"""
    try:
        folder = f"{business_id}/products"
        if is_lazy:
            folder = f"{business_id}/products/lazy"
        
        path = f"{folder}/{filename}"
        
        response = supabase.storage.from_(BUCKET_NAME).upload(
            path,
            file_data,
            {"content-type": "image/webp", "upsert": 'true'}
        )
        
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(path)
        
        return public_url
    except Exception as e:
        print(f"Error uploading to Supabase Storage: {e}")
        return None

@app.route('/api/business/check-owner/<string:business_id>', methods=['GET'])
def check_business_owner_endpoint(business_id):
    """
    Проверяет, является ли текущий пользователь владельцем бизнеса
    Ожидает параметр user_id в query string
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        business_info = check_business_owner(business_id, int(user_id))
        
        if not business_info:
            return jsonify({'error': 'Business not found'}), 404
        
        return jsonify(business_info)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# WebSocket события
@socketio.on('connect')
def handle_connect():
    print('A user connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('A user disconnected')

@socketio.on('message')
def handle_message(message):
    message = json.loads(message)
    print(f"Received message: {message[0]} и мы выполняем  {message[1]} ")

    try:
        if message[0] == "cards":
            if message[1] == "filter":
                
                filters = message[2] if len(message) > 2 and message[2] else {}
                limit = message[3] if len(message) > 3 else None
    
                # Безопасно достаем параметры, которых может не быть в коротком запросе
                order_type = message[4] if len(message) > 4 else None
                price_range = message[5] if len(message) > 5 and message[5] and len(message[5]) >= 2 else None
                # Базовый запрос
                
                query = supabase.table('cards').select('*')
                
                # Применение фильтров
                for key, value in filters.items():
                    db_key = 'id' if key == '_id' else key
                    
                    if isinstance(value, list) and value:
                        query = query.in_(db_key, value)
                    else:
                        query = query.eq(db_key, value)
                
                # Фильтр по цене
                if price_range:
                    query = query.gte('price_number', price_range[0]).lte('price_number', price_range[1])
                
                # Сортировка
                if order_type == 0:
                    query = query.order('views_count', desc=True)
                elif order_type == 1:
                    query = query.order('price_number')
                elif order_type == 2:
                    query = query.order('price_number', desc=True)
                else:
                    query = query.order('id')
                
                # Лимит
                if limit:
                    query = query.limit(limit)
                
                # Выполнение запроса
                response = query.execute()
                cards = response.data
                
                # Загрузка изображений для каждой карточки
                for card in cards:
                    images_response = supabase.table('images') \
                        .select('*') \
                        .eq('card_id', card['id']) \
                        .order('image_index') \
                        .execute()
                    card['images'] = images_response.data
                    card['_id'] = card['id']
                    
                    # 2. ДОБАВИТЬ ЭТУ ЧАСТЬ: Превращаем строки из БД обратно в списки для фронта
                    list_fields = ['colors', 'counts', 'packages', 'sizes', 'prices']  # ← ДОБАВИЛ prices
                    for field in list_fields:
                        if field in card and isinstance(card[field], str):
                            try:
                                card[field] = json.loads(card[field])
                            except:
                                card[field] = []  # Если там пусто или ошибка
                        # Если поле уже None или другой тип, оставляем как есть
                emit('message', json.dumps(['cards', 'filter', cards, message[2], message[3]]))
                
            elif message[1] == "create":
                card_data = message[2]
                business_id = message[4]
                
                # ОБРАБОТКА ЦЕНЫ - ИСПРАВЛЕННАЯ ВЕРСИЯ
                price_raw = card_data.get('price', '0')
                price_number = 0
                
                if isinstance(price_raw, str):
                    # Убираем пробелы и символ ₽, оставляем только цифры
                    price_str = price_raw.replace(' ', '').replace('₽', '').strip()
                    if price_str and price_str.isdigit():
                        price_number = int(price_str)
                    else:
                        # Пробуем извлечь цифры из строки типа "1000 руб"
                        digits = ''.join(filter(str.isdigit, price_str))
                        price_number = int(digits) if digits else 0
                elif isinstance(price_raw, (int, float)):
                    price_number = int(price_raw)
                
                # ОБРАБОТКА VIEWS_COUNT - ДОЛЖНА БЫТЬ ЧИСЛОМ
                views_count_raw = card_data.get('views_count', 0)
                if isinstance(views_count_raw, (int, float)):
                    views_count = int(views_count_raw)
                else:
                    views_count = 0
                
                # ДЕБАГ: Выводим что получаем
                print(f"DEBUG price_raw: {price_raw}, type: {type(price_raw)}")
                print(f"DEBUG price_number: {price_number}, type: {type(price_number)}")
                print(f"DEBUG views_count: {views_count}, type: {type(views_count)}")
                
                data = {
                    'category': card_data.get('category'),
                    'title': card_data.get('title'),
                    'description': card_data.get('description'),
                    'price': card_data.get('price', ''),
                    'price_number': price_number,  # ← гарантированно число
                    'colors': json.dumps(card_data.get('colors', [])),
                    'counts': json.dumps(card_data.get('counts', [])),
                    'packages': json.dumps(card_data.get('packages', [])),
                    'sizes': json.dumps(card_data.get('sizes', [])),
                    'prices': json.dumps(card_data.get('prices', [])),
                    'business_id': business_id,
                    'views_count': views_count  # ← гарантированно число
                }
                
                # ДЕБАГ: Проверяем все значения перед вставкой
                print("DEBUG data to insert:")
                for key, value in data.items():
                    print(f"  {key}: {repr(value)} (type: {type(value).__name__})")
                
                try:
                    response = supabase.table('cards').insert(data).execute()
                    new_card_id = response.data[0]['id'] if response.data else None
                    emit('message', json.dumps(['cards', 'created', str(new_card_id)]))
                except Exception as e:
                    print(f"ERROR in insert: {e}")
                    print(f"Problematic data: {data}")
                    emit('message', json.dumps(['error', 'card_creation', str(e)]))
                
            elif message[1] == "update":
                card_data = message[2]
                card_id = message[4]
                business_id = message[5]
                
                # ТАКАЯ ЖЕ ОБРАБОТКА ЦЕНЫ КАК ВЫШЕ
                price_raw = card_data.get('price', '0')
                price_number = 0
                
                if isinstance(price_raw, str):
                    price_str = price_raw.replace(' ', '').replace('₽', '').strip()
                    if price_str and price_str.isdigit():
                        price_number = int(price_str)
                    else:
                        digits = ''.join(filter(str.isdigit, price_str))
                        price_number = int(digits) if digits else 0
                elif isinstance(price_raw, (int, float)):
                    price_number = int(price_raw)
                
                # ОБРАБОТКА VIEWS_COUNT
                views_count_raw = card_data.get('views_count', 0)
                if isinstance(views_count_raw, (int, float)):
                    views_count = int(views_count_raw)
                else:
                    views_count = 0
                
                data = {
                    'category': card_data.get('category'),
                    'title': card_data.get('title'),
                    'description': card_data.get('description'),
                    'price': card_data.get('price', ''),
                    'price_number': price_number,
                    'colors': json.dumps(card_data.get('colors', [])),
                    'counts': json.dumps(card_data.get('counts', [])),
                    'packages': json.dumps(card_data.get('packages', [])),
                    'sizes': json.dumps(card_data.get('sizes', [])),
                    'prices': json.dumps(card_data.get('prices', [])),
                    'business_id': business_id,
                    'views_count': views_count
                }
                
                supabase.table('cards').update(data).eq('id', card_id).execute()
                emit('message', json.dumps(['cards', 'updated', card_id]))
                
            elif message[1] == "delete":
                card_id = message[3]
                # Удаляем сначала изображения (каскадное удаление в БД)
                supabase.table('images').delete().eq('card_id', card_id).execute()
                # Удаляем карточку
                supabase.table('cards').delete().eq('id', card_id).execute()
                emit('message', json.dumps(['cards', 'deleted']))
                
        elif message[0] == "images":
            if message[1] == "add":
                card_id = message[2]
                image_index = message[3]
                image_data = message[4]
                
                # НУЖНО ЕЩЁ ПОЛУЧИТЬ business_id
                # Предположим, что он приходит в сообщении или есть в контексте
                business_id = message[5] if len(message) > 5 else None
                
                if not business_id:
                    # Попробуй получить из контекста или БД
                    # Например, найди к какой карточке относится business_id
                    try:
                        card_response = supabase.table('cards').select('business_id').eq('id', card_id).execute()
                        if card_response.data:
                            business_id = card_response.data[0].get('business_id')
                    except:
                        pass
                
                if business_id and "," in image_data:
                    # Декодируем base64
                    image_data_binary = base64.b64decode(image_data.split(',')[-1])
                    
                    # Сжимаем изображения
                    compressed_image = compress_image_to_bytes(image_data_binary, (1200, 1200), 95)
                    compressed_image_lazy = compress_image_to_bytes(image_data_binary, (100, 100), 75)
                    
                    # Генерируем уникальные имена
                    filename_base = str(uuid.uuid4())
                    filename = f"{filename_base}.webp"
                    filename_lazy = f"{filename_base}_lazy.webp"
                    
                    # 1. ЗАГРУЖАЕМ В ПАПКУ БИЗНЕСА
                    public_url = upload_to_business_bucket(
                        file_data=compressed_image,
                        business_id=business_id,
                        card_id=card_id,
                        filename=filename,
                        is_lazy=False
                    )
                    
                    public_url_lazy = upload_to_business_bucket(
                        file_data=compressed_image_lazy,
                        business_id=business_id,
                        card_id=card_id,
                        filename=filename_lazy,
                        is_lazy=True
                    )
                    
                    if public_url and public_url_lazy:
                        # 2. СОХРАНЯЕМ ССЫЛКИ В ТАБЛИЦУ images
                        image_record = {
                            'card_id': card_id,
                            'file': public_url,
                            'file_lazy': public_url_lazy,
                            'image_index': image_index,
                        }
                        
                        supabase.table('images').insert(image_record).execute()
                        emit("message", json.dumps(["images", "added", image_index, public_url]))
                    else:
                        emit("message", json.dumps(["error", "image_upload_failed"]))
                
            elif message[1] == "delete":
                image_id = message[2]
                supabase.table('images').delete().eq('id', image_id).execute()
                
        elif message[0] == "hint":
            if message[1] == "new":
                hint_data = message[2]
                
                data = {
                    'name': hint_data.get('name'),
                    'receiver_name': hint_data.get('receiver_name'),
                    'receiver_phone': hint_data.get('receiver_phone'),
                    'product': json.dumps(hint_data.get('product', {}))
                }
                
                response = supabase.table('hints').insert(data).execute()
                hint_id = response.data[0]['id'] if response.data else None
                emit("message", json.dumps(["hint", "new", str(hint_id)]))
                
        elif message[0] == "order":
            if message[1] == "new":
                order_data = message[2]
                data = {
                    'name': order_data.get('name'),
                    'phone': order_data.get('phone'),
                    'anonymous': bool(order_data.get('anonymous')), 
                    'receiver_name': order_data.get('receiver_name'),
                    'receiver_phone': order_data.get('receiver_phone'),
                    'text_of_postcard': order_data.get('text_of_postcard'),
                    'comment': order_data.get('comment'),
                    'delivery': order_data.get('delivery'),
                    'city': order_data.get('city'),
                    'address': order_data.get('address'),
                    'date_of_post': order_data.get('date_of_post'),
                    'time_of_post': order_data.get('time_of_post'),
                    'request_address': bool(order_data.get('request_address')), 
                    'request_datetime':  bool(order_data.get('request_datetime')),
                    'items': json.dumps(order_data.get('items', []))
                }
                print(data)
                
                response = supabase.table('orders').insert(data).execute()
                order_id = response.data[0]['id'] if response.data else None
                emit("message", json.dumps(["order", "new", str(order_id)]))
                
    except Exception as e:
        print(f"Error: {e}")
        emit('message', json.dumps(['error', str(e)]))

# REST API endpoints
@app.route('/api/cards', methods=['GET'])
def get_cards():
    try:
        response = supabase.table('cards').select('*').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/<int:card_id>', methods=['GET'])
def get_card(card_id):
    try:
        response = supabase.table('cards').select('*').eq('id', card_id).execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cards/<int:card_id>/increment-views', methods=['POST'])
def increment_views(card_id):
    try:
        response = supabase.table('cards').select('views_count').eq('id', card_id).execute()
        if not response.data:
            return jsonify({'error': 'Not found'}), 404
        
        current_views = response.data[0]['views_count']
        supabase.table('cards').update({'views_count': current_views + 1}).eq('id', card_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    socketio.run(
        app,
        host='127.0.0.1',
        port=8080,
        debug=True
    )