#!/bin/bash

echo "=== Интеграционные тесты Telegram авторизации ==="
echo

BASE_URL="http://localhost:8080"
BUSINESS_ID="f4e52bb7-a43b-4bfb-b953-2b07c965912b"
OWNER_USER_ID=709652754
NON_OWNER_USER_ID=123456

echo "1. Тест: Проверка владельца магазина"
echo "-----------------------------------"
curl -s "$BASE_URL/api/business/check-owner/$BUSINESS_ID?user_id=$OWNER_USER_ID" | python3 -m json.tool
echo

echo "2. Тест: Проверка не-владельца"
echo "-----------------------------"
curl -s "$BASE_URL/api/business/check-owner/$BUSINESS_ID?user_id=$NON_OWNER_USER_ID" | python3 -m json.tool
echo

echo "3. Тест: Отсутствие параметра user_id"
echo "------------------------------------"
curl -s "$BASE_URL/api/business/check-owner/$BUSINESS_ID" | python3 -m json.tool
echo

echo "4. Тест: Несуществующий бизнес"
echo "-----------------------------"
curl -s "$BASE_URL/api/business/check-owner/00000000-0000-0000-0000-000000000000?user_id=$OWNER_USER_ID" | python3 -m json.tool
echo

echo "5. Тест: Некорректный формат user_id"
echo "-----------------------------------"
curl -s "$BASE_URL/api/business/check-owner/$BUSINESS_ID?user_id=not_a_number" | python3 -m json.tool
echo

echo "=== Проверка структуры ответа ==="
echo

echo "6. Тест: Все обязательные поля присутствуют"
response=$(curl -s "$BASE_URL/api/business/check-owner/$BUSINESS_ID?user_id=$OWNER_USER_ID")
echo "Ответ: $response"

# Проверяем наличие обязательных полей
if echo "$response" | grep -q '"business_id"' && \
   echo "$response" | grep -q '"business_name"' && \
   echo "$response" | grep -q '"owner_id"' && \
   echo "$response" | grep -q '"is_owner"' && \
   echo "$response" | grep -q '"business_data"'; then
    echo "✓ Все обязательные поля присутствуют"
else
    echo "✗ Отсутствуют некоторые обязательные поля"
fi

echo
echo "=== Тесты завершены ==="