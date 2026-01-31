# Запуск тестов для Telegram авторизации

## Backend тесты (Python)

### Установка зависимостей:
```bash
cd backend
pip install -r requirements.txt
```

### Запуск unit-тестов:
```bash
cd backend
python -m pytest test_backend_auth.py -v
```

Или:
```bash
cd backend
python test_backend_auth.py
```

### Запуск интеграционных тестов:
1. Убедитесь, что backend сервер запущен:
```bash
cd backend
python app.py
```

2. В другом терминале:
```bash
cd backend
chmod +x test_integration.sh
./test_integration.sh
```

## Frontend тесты (JavaScript)

### Установка Jest (если не установлен):
```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Настройка package.json:
Добавьте в `package.json`:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

### Запуск тестов:
```bash
cd frontend
npm test
```

Или для watch mode:
```bash
cd frontend
npm run test:watch