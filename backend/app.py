import os
import json
import base64
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, disconnect
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_identity
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Инициализация Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def compress_image_to_bytes(image_data, max_size, quality):
    """Конвертирует любое изображение в WebP и сжимает"""
    image = Image.open(BytesIO(image_data))
    
    # Для WebP лучше оставить RGBA, если есть прозрачность, 
    # но для цветов обычно прозрачность не нужна, так что RGB ок.
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    
    image.thumbnail(max_size, Image.LANCZOS)
    img_byte_arr = BytesIO()
    
    # Сохраняем именно в формате WEBP
    image.save(img_byte_arr, format='WEBP', quality=quality, method=6) # method 6 - лучшее сжатие
    return img_byte_arr.getvalue()

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

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=1024 * 1024 * 1024)
jwt = JWTManager(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@socketio.on('connect')
def handle_connect():
    print('A user connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('A user disconnected')

@socketio.on('message')
def handle_message(message):
    message = json.loads(message)
    print(f"Received message: {message[0]}")

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
                    list_fields = ['colors', 'counts', 'packages', 'sizes' ]
                    for field in list_fields:
                        if field in card and isinstance(card[field], str):
                            try:
                                card[field] = json.loads(card[field])
                            except:
                                card[field] = [] # Если там пусто, отдаем пустой список
                emit('message', json.dumps(['cards', 'filter', cards, message[2], message[3]]))
                
            elif message[1] == "create":
                card_data = message[2]
                price_number = int(card_data['price'].replace(' ', '').replace('₽', '')) if 'price' in card_data else 0
                
                data = {
                    'category': card_data.get('category'),
                    'title': card_data.get('title'),
                    'description': card_data.get('description'),
                    'price': card_data.get('price'),
                    'price_number': price_number,
                    'colors': json.dumps(card_data.get('colors', [])),
                    'counts': json.dumps(card_data.get('counts', [])),
                    'packages': json.dumps(card_data.get('packages', [])),
                    'sizes': json.dumps(card_data.get('sizes', [])),
                    'prices': json.dumps(card_data.get('prices', [])),
                    'views_count': card_data.get('views_count', 0)
                }
                
                response = supabase.table('cards').insert(data).execute()
                new_card_id = response.data[0]['id'] if response.data else None
                emit('message', json.dumps(['cards', 'created', str(new_card_id)]))
                
            elif message[1] == "update":
                card_data = message[2]
                card_id = message[4]
                price_number = int(card_data['price'].replace(' ', '').replace('₽', '')) if 'price' in card_data else 0
                
                data = {
                    'category': card_data.get('category'),
                    'title': card_data.get('title'),
                    'description': card_data.get('description'),
                    'price': card_data.get('price'),
                    'price_number': price_number,
                    'colors': json.dumps(card_data.get('colors', [])),
                    'counts': json.dumps(card_data.get('counts', [])),
                    'packages': json.dumps(card_data.get('packages', [])),
                    'sizes': json.dumps(card_data.get('sizes', [])),
                    'prices': json.dumps(card_data.get('prices', [])),
                    'views_count': card_data.get('views_count', 0)
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
                
                if "," in image_data:
                    image_data_binary = base64.b64decode(image_data.split(',')[-1])
                    compressed_image_data = compress_image(image_data_binary, (1200, 1200), 95)
                    compressed_image_data_lazy = compress_image(image_data_binary, (100, 100), 75)
                    
                    filename = str(uuid.uuid4()) + '.jpeg'
                    server_endpoint = os.getenv('SERVER_END_POINT', 'http://localhost:4000')
                    
                    # Сохраняем файлы локально (можно заменить на Supabase Storage)
                    with open(f'static/{filename}', 'wb') as f:
                        f.write(compressed_image_data)
                    with open(f'static/lazy/{filename}', 'wb') as f:
                        f.write(compressed_image_data_lazy)
                    
                    # Сохраняем информацию в БД
                    image_data = {
                        'card_id': card_id,
                        'file': f"{server_endpoint}/static/{filename}",
                        'file_lazy': f"{server_endpoint}/static/lazy/{filename}",
                        'image_index': image_index
                    }
                    
                    supabase.table('images').insert(image_data).execute()
                    emit("message", json.dumps(["images", "added", image_index]))
                    
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
                    'anonymous': order_data.get('anonymous', False),
                    'receiver_name': order_data.get('receiver_name'),
                    'receiver_phone': order_data.get('receiver_phone'),
                    'text_of_postcard': order_data.get('text_of_postcard'),
                    'comment': order_data.get('comment'),
                    'delivery': order_data.get('delivery'),
                    'city': order_data.get('city'),
                    'address': order_data.get('address'),
                    'date_of_post': order_data.get('date_of_post'),
                    'time_of_post': order_data.get('time_of_post'),
                    'request_address': order_data.get('request_address', False),
                    'request_datetime': order_data.get('request_datetime', False),
                    'items': json.dumps(order_data.get('items', []))
                }
                
                response = supabase.table('orders').insert(data).execute()
                order_id = response.data[0]['id'] if response.data else None
                emit("message", json.dumps(["order", "new", str(order_id)]))
                
    except Exception as e:
        print(f"Error: {e}")
        emit('message', json.dumps(['error', str(e)]))

# REST API endpoints для совместимости
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
        # Получаем текущее значение
        response = supabase.table('cards').select('views_count').eq('id', card_id).execute()
        if not response.data:
            return jsonify({'error': 'Not found'}), 404
        
        current_views = response.data[0]['views_count']
        # Увеличиваем на 1
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