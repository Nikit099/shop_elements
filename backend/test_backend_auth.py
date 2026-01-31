import unittest
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
import json

class TestBusinessOwnerAuth(unittest.TestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
        # Тестовые данные
        self.test_business_id = "f4e52bb7-a43b-4bfb-b953-2b07c965912b"
        self.owner_user_id = 709652754  # Владелец из базы данных
        self.non_owner_user_id = 123456  # Не владелец
        
    def test_check_owner_success(self):
        """Тест успешной проверки владельца"""
        response = self.app.get(f'/api/business/check-owner/{self.test_business_id}?user_id={self.owner_user_id}')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        
        # Проверяем структуру ответа
        self.assertIn('business_id', data)
        self.assertIn('business_name', data)
        self.assertIn('owner_id', data)
        self.assertIn('is_owner', data)
        self.assertIn('business_data', data)
        
        # Проверяем значения
        self.assertEqual(data['business_id'], self.test_business_id)
        self.assertEqual(data['owner_id'], self.owner_user_id)
        self.assertTrue(data['is_owner'])
        
    def test_check_owner_not_owner(self):
        """Тест проверки не-владельца"""
        response = self.app.get(f'/api/business/check-owner/{self.test_business_id}?user_id={self.non_owner_user_id}')
        
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertFalse(data['is_owner'])
        
    def test_check_owner_missing_user_id(self):
        """Тест без параметра user_id"""
        response = self.app.get(f'/api/business/check-owner/{self.test_business_id}')
        
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'user_id is required')
        
    def test_check_owner_invalid_business_id(self):
        """Тест с несуществующим business_id"""
        invalid_business_id = "00000000-0000-0000-0000-000000000000"
        response = self.app.get(f'/api/business/check-owner/{invalid_business_id}?user_id={self.owner_user_id}')
        
        self.assertEqual(response.status_code, 404)
        
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Business not found')
        
    def test_check_owner_invalid_user_id_format(self):
        """Тест с некорректным форматом user_id"""
        response = self.app.get(f'/api/business/check-owner/{self.test_business_id}?user_id=not_a_number')
        
        # Должен вернуть 500 из-за ошибки преобразования в int
        self.assertEqual(response.status_code, 500)
        
    def test_response_structure(self):
        """Тест структуры ответа"""
        response = self.app.get(f'/api/business/check-owner/{self.test_business_id}?user_id={self.owner_user_id}')
        data = json.loads(response.data)
        
        # Проверяем бизнес данные
        business_data = data['business_data']
        expected_fields = ['id', 'name', 'owner_id', 'created_at']
        
        for field in expected_fields:
            self.assertIn(field, business_data)
            
        self.assertEqual(business_data['id'], self.test_business_id)
        self.assertEqual(business_data['owner_id'], self.owner_user_id)

if __name__ == '__main__':
    unittest.main()