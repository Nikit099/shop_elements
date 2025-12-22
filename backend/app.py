import os
import json
import base64
import sqlite3
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, disconnect
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_identity
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

# Путь к общей базе данных
DB_PATH = '../shared/bot_database.db'

def init_db():
    """Инициализация базы данных"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Таблица карточек товаров
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            price TEXT,
            price_number INTEGER,
            colors TEXT,
            counts TEXT,
            packages TEXT,
            sizes TEXT,
            prices TEXT,
            views_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица изображений - ИСПРАВЛЕНО
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id INTEGER,
            file TEXT,
            file_lazy TEXT,
            image_index INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (card_id) REFERENCES cards (id)
        )
    ''')
    
    # Таблица намёков
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            receiver_name TEXT,
            receiver_phone TEXT,
            product TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sended BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # Таблица заказов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            anonymous BOOLEAN,
            receiver_name TEXT,
            receiver_phone TEXT,
            text_of_postcard TEXT,
            comment TEXT,
            delivery TEXT,
            city TEXT,
            address TEXT,
            date_of_post TEXT,
            time_of_post TEXT,
            request_address BOOLEAN,
            request_datetime BOOLEAN,
            items TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sended BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            username TEXT,
            full_name TEXT,
            start_date TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Инициализируем базу при запуске
init_db()

def compress_image(image_data, max_size, quality):
    """Сжатие изображения"""
    image = Image.open(BytesIO(image_data))
    image.thumbnail(max_size, Image.LANCZOS)
    img_byte_arr = BytesIO()
    image.save(img_byte_arr, format='JPEG', quality=quality)
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

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        if message[0] == "cards":
            if message[1] == "filter":
                where_conditions = []
                params = []
                
                filters = message[2] if message[2] else {}
                for key, value in filters.items():
                    if isinstance(value, list):
                        placeholders = ','.join('?' * len(value))
                        where_conditions.append(f"{key} IN ({placeholders})")
                        params.extend(value)
                    else:
                        where_conditions.append(f"{key} = ?")
                        params.append(value)
                
                order_by = "id ASC"
                if message[4] == 0:
                    order_by = "views_count DESC"
                elif message[4] == 1:
                    order_by = "price_number ASC"
                elif message[4] == 2:
                    order_by = "price_number DESC"
                
                if message[5] and len(message[5]) >= 2:
                    where_conditions.append("price_number BETWEEN ? AND ?")
                    params.extend([message[5][0], message[5][1]])
                
                where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
                limit = message[3]
                
                query = f"""
                    SELECT * FROM cards 
                    WHERE {where_clause}
                    ORDER BY {order_by}
                    LIMIT ?
                """
                params.append(limit)
                
                cursor.execute(query, params)
                cards = [dict(row) for row in cursor.fetchall()]
                
                # Загрузка изображений для каждой карточки - ИСПРАВЛЕНО
                for card in cards:
                    cursor.execute("SELECT * FROM images WHERE card_id = ? ORDER BY image_index", (card['id'],))
                    images = [dict(row) for row in cursor.fetchall()]
                    card['images'] = images
                    card['_id'] = card['id']
                
                emit('message', json.dumps(['cards', 'filter', cards, message[2], message[3]]))
                
            elif message[1] == "create":
                card_data = message[2]
                price_number = int(card_data['price'].replace(' ', '').replace('₽', '')) if 'price' in card_data else 0
                
                cursor.execute('''
                    INSERT INTO cards (title, description, price, price_number, colors, counts, packages, sizes, prices, views_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    card_data.get('title'),
                    card_data.get('description'),
                    card_data.get('price'),
                    price_number,
                    json.dumps(card_data.get('colors', [])),
                    json.dumps(card_data.get('counts', [])),
                    json.dumps(card_data.get('packages', [])),
                    json.dumps(card_data.get('sizes', [])),
                    json.dumps(card_data.get('prices', [])),
                    card_data.get('views_count', 0)
                ))
                new_card_id = cursor.lastrowid
                conn.commit()
                emit('message', json.dumps(['cards', 'created', str(new_card_id)]))
                
            elif message[1] == "update":
                card_data = message[2]
                card_id = message[4]
                price_number = int(card_data['price'].replace(' ', '').replace('₽', '')) if 'price' in card_data else 0
                
                cursor.execute('''
                    UPDATE cards 
                    SET title=?, description=?, price=?, price_number=?, colors=?, counts=?, packages=?, sizes=?, prices=?, views_count=?
                    WHERE id=?
                ''', (
                    card_data.get('title'),
                    card_data.get('description'),
                    card_data.get('price'),
                    price_number,
                    json.dumps(card_data.get('colors', [])),
                    json.dumps(card_data.get('counts', [])),
                    json.dumps(card_data.get('packages', [])),
                    json.dumps(card_data.get('sizes', [])),
                    json.dumps(card_data.get('prices', [])),
                    card_data.get('views_count', 0),
                    card_id
                ))
                conn.commit()
                emit('message', json.dumps(['cards', 'updated', card_id]))
                
            elif message[1] == "delete":
                card_id = message[3]
                cursor.execute("DELETE FROM cards WHERE id = ?", (card_id,))
                cursor.execute("DELETE FROM images WHERE card_id = ?", (card_id,))
                conn.commit()
                emit('message', json.dumps(['cards', 'deleted']))
                
        elif message[0] == "images":
            if message[1] == "add":
                card_id = message[2]
                image_index = message[3]  # ИСПРАВЛЕНО
                image_data = message[4]
                
                if "," in image_data:
                    image_data_binary = base64.b64decode(image_data.split(',')[-1])
                    compressed_image_data = compress_image(image_data_binary, (1200, 1200), 95)
                    compressed_image_data_lazy = compress_image(image_data_binary, (100, 100), 75)
                    
                    filename = str(uuid.uuid4()) + '.jpeg'
                    server_endpoint = os.getenv('SERVER_END_POINT', 'http://localhost:4000')
                    
                    with open(f'static/{filename}', 'wb') as f:
                        f.write(compressed_image_data)
                    with open(f'static/lazy/{filename}', 'wb') as f:
                        f.write(compressed_image_data_lazy)
                    
                    cursor.execute('''
                        INSERT INTO images (card_id, file, file_lazy, image_index)  # ИСПРАВЛЕНО
                        VALUES (?, ?, ?, ?)
                    ''', (
                        card_id,
                        f"{server_endpoint}/static/{filename}",
                        f"{server_endpoint}/static/lazy/{filename}",
                        image_index  # ИСПРАВЛЕНО
                    ))
                    conn.commit()
                    emit("message", json.dumps(["images", "added", image_index]))  # ИСПРАВЛЕНО
                    
            elif message[1] == "delete":
                image_id = message[2]
                cursor.execute("DELETE FROM images WHERE id = ?", (image_id,))
                conn.commit()
                
        elif message[0] == "hint":
            if message[1] == "new":
                hint_data = message[2]
                cursor.execute('''
                    INSERT INTO hints (name, receiver_name, receiver_phone, product)
                    VALUES (?, ?, ?, ?)
                ''', (
                    hint_data.get('name'),
                    hint_data.get('receiver_name'),
                    hint_data.get('receiver_phone'),
                    json.dumps(hint_data.get('product', {}))
                ))
                conn.commit()
                emit("message", json.dumps(["hint", "new", str(cursor.lastrowid)]))
                
        elif message[0] == "order":
            if message[1] == "new":
                order_data = message[2]
                cursor.execute('''
                    INSERT INTO orders (name, phone, anonymous, receiver_name, receiver_phone, 
                                      text_of_postcard, comment, delivery, city, address, 
                                      date_of_post, time_of_post, request_address, request_datetime, items)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    order_data.get('name'),
                    order_data.get('phone'),
                    order_data.get('anonymous', False),
                    order_data.get('receiver_name'),
                    order_data.get('receiver_phone'),
                    order_data.get('text_of_postcard'),
                    order_data.get('comment'),
                    order_data.get('delivery'),
                    order_data.get('city'),
                    order_data.get('address'),
                    order_data.get('date_of_post'),
                    order_data.get('time_of_post'),
                    order_data.get('request_address', False),
                    order_data.get('request_datetime', False),
                    json.dumps(order_data.get('items', []))
                ))
                conn.commit()
                emit("message", json.dumps(["order", "new", str(cursor.lastrowid)]))
                
    except Exception as e:
        print(f"Error: {e}")
        emit('message', json.dumps(['error', str(e)]))
    finally:
        conn.close()

if __name__ == '__main__':
    
    socketio.run(
        app,
        host='127.0.0.1',
        port=8080,
        debug=True
    )