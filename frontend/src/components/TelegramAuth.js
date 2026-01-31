// frontend/src/components/TelegramAuth.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMainContext } from '../context';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Paper
} from '@mui/material';
import TelegramIcon from '@mui/icons-material/Telegram';

const TelegramAuth = () => {
  const { setAccount, setAccessToken, setRefreshToken } = useMainContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

const handleTelegramAuth = async () => {
  try {
    setLoading(true);
    setError(null);

    // Получаем initData от Telegram WebApp
    const initData = window.Telegram.WebApp.initData;
    
    if (!initData) {
      throw new Error('Telegram initData not available');
    }

    // Парсим initData для получения user_id
    const params = new URLSearchParams(initData);
    const userData = params.get('user');
    let user_id = null;
    
    if (userData) {
      const user = JSON.parse(userData);
      user_id = user.id;
    }

    // Получаем business_id из URL
    const pathParts = window.location.pathname.split('/');
    const businessId = pathParts[1];
    
    if (businessId && businessId !== 'auth' && businessId !== 'welcome') {
      // Проверяем, является ли пользователь владельцем бизнеса
      const response = await fetch(`http://localhost:8080/api/business/check-owner/${businessId}?user_id=${user_id}`);
      
      if (response.ok) {
        const businessInfo = await response.json();
        
        if (businessInfo.is_owner) {
          // Сохраняем business_id в localStorage
          localStorage.setItem('businessId', businessId);
          localStorage.setItem('isBusinessOwner', 'true');
          localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
          
          // Обновляем контекст
          setBusinessId(businessId);
          setShopInfo(businessInfo);
        } else {
          // Пользователь не владелец
          localStorage.setItem('businessId', businessId);
          localStorage.setItem('isBusinessOwner', 'false');
          localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
        }
      }
    }

    // Перенаправляем на страницу магазина
    if (businessId && businessId !== 'auth' && businessId !== 'welcome') {
      navigate(`/${businessId}`);
    } else {
      navigate('/welcome');
    }

  } catch (err) {
    setError(err.message);
    console.error('Auth error:', err);
  } finally {
    setLoading(false);
  }
};

  const checkAuth = async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Токен истек, пробуем обновить
        const refreshed = await handleRefreshToken();
        return refreshed;
      }

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Обновляем информацию о пользователе
      localStorage.setItem('user', JSON.stringify(data.user));
      setAccount(data.user);

      return true;
    } catch (err) {
      console.error('Auth check error:', err);
      return false;
    }
  };

 useEffect(() => {
  const checkAuth = async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        // Токен истек, пробуем обновить
        const refreshed = await handleRefreshToken();
        return refreshed;
      }

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Обновляем информацию о пользователе
      localStorage.setItem('user', JSON.stringify(data.user));
      setAccount(data.user);

      return true;
    } catch (err) {
      console.error('Auth check error:', err);
      return false;
    }
  };

  // Проверяем авторизацию при загрузке компонента
  const initAuth = async () => {
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
      navigate('/welcome');
    }
  };

  initAuth();
}, [navigate, setAccount, handleRefreshToken]); // Теперь handleRefreshToken тоже нужно добавить

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <TelegramIcon sx={{ fontSize: 60, color: '#0088cc', mb: 2 }} />
        
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Telegram Shop
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Авторизуйтесь через Telegram для доступа к магазинам
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleTelegramAuth}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <TelegramIcon />}
          sx={{
            width: '100%',
            py: 1.5,
            borderRadius: 2,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: 'linear-gradient(45deg, #0088cc, #00a2e8)',
            '&:hover': {
              background: 'linear-gradient(45deg, #0077b3, #0091d4)',
            },
          }}
        >
          {loading ? 'Авторизация...' : 'Войти через Telegram'}
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Для работы приложения требуется Telegram аккаунт
        </Typography>
      </Paper>
    </Box>
  );
};

export default TelegramAuth;