// frontend/src/context.js - упрощенная версия с Telegram авторизацией
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    // Восстанавливаем тему из localStorage при инициализации
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || "Dark";
  });
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessId, setBusinessId] = useState(() => {
    // Восстанавливаем businessId из localStorage при инициализации
    const savedBusinessId = localStorage.getItem('businessId');
    return savedBusinessId || null;
  });
  
  // Telegram user data
  const [telegramUser, setTelegramUser] = useState(() => {
    try {
      // const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const user = {
  "id": 709652754,
  "is_bot": false,
  "first_name": "Nikita",
  "last_name": "Nechitailov",
  "username": "nechitailov",
  "language_code": "ru",
  "is_premium": false,
  "added_to_attachment_menu": false,
  "can_join_groups": true,
  "can_read_all_group_messages": false,
  "supports_inline_queries": false,
  "full_name": "Nikita Nechitailov",
  "display_name": "Nikita",
  "meta": {
    "source": "telegram_bot_api",
    "last_seen_at": "2026-03-26T20:50:00Z",
    "chat_type": "private"
  }
};
      return user || null;
    } catch (e) {
      return null;
    }
  });
  
  // Проверка владельца магазина
  const [isBusinessOwner, setIsBusinessOwner] = useState(() => {
    // Проверяем режим тестирования
    // const testMode = localStorage.getItem('test') === 'true';
    // if (testMode) {
    //   console.log("Режим тестирования активирован - пользователь считается владельцем магазина");
    //   return true;
    // }

    const savedOwnerInfo = localStorage.getItem('ownerInfo');
    const savedIsOwner = localStorage.getItem('isBusinessOwner');
    
    if (!savedOwnerInfo || savedIsOwner !== 'true') return false;
    
    try {
      const ownerInfo = JSON.parse(savedOwnerInfo);
      const savedBusinessId = localStorage.getItem('businessId');
      return ownerInfo.businessId === savedBusinessId;
    } catch (e) {
      return false;
    }
  });
  
  const [shopInfo, setShopInfo] = useState(() => {
    const savedShopInfo = localStorage.getItem('shop_info');
    return savedShopInfo ? JSON.parse(savedShopInfo) : null;
  });

  // Новые состояния для данных бизнеса (динамические, без localStorage кэширования)
  const [businessSettings, setBusinessSettings] = useState(null);
  const [businessCards, setBusinessCards] = useState([]);
  
  // Состояние для подарков (храним только в памяти)
  const [businessGifts, setBusinessGifts] = useState([]);
  const [businessGiftsLoaded, setBusinessGiftsLoaded] = useState(false);
  
  // Флаги для отслеживания загрузки (используются только для внутренней логики)
  const [businessSettingsLoaded, setBusinessSettingsLoaded] = useState(false);
  const [businessCardsLoaded, setBusinessCardsLoaded] = useState(false);
  const [forceReloadSettings, setForceReloadSettings] = useState(false);
  const [forceReloadCards, setForceReloadCards] = useState(false);

  // Остальные состояния...
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [postId, setPostId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [select, setSelect] = useState("transport");
  const [why, setWhy] = useState(null);
  const [why2, setWhy2] = useState(null);
  const [transportView, setTransportView] = useState("grid");
  const [servicesView, setServicesView] = useState("grid");
  const [services_View, setServices_View] = useState("grid");
  const [dealersView, setDealersView] = useState("grid");
  const [handleClickBackButton, setHandleClickBackButton] = useState();
  const [openPost, setOpenPost] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // Функция для проверки владельца магазина
  const checkBusinessOwner = async (businessId) => {
    // Проверяем режим тестирования
    // const testMode = localStorage.getItem('test') === 'true';
    // if (testMode) {
    //   console.log("Режим тестирования: пользователь считается владельцем магазина для бизнеса:", businessId);
    //   const ownerInfo = {
    //     businessId: businessId,
    //     userId: telegramUser?.id || 999999999, // Тестовый ID
    //     timestamp: Date.now()
    //   };
    //   localStorage.setItem('ownerInfo', JSON.stringify(ownerInfo));
    //   localStorage.setItem('isBusinessOwner', 'true');
    //   setIsBusinessOwner(true);
    //   return true;
    // }

    if (!telegramUser || !telegramUser.id) {
      console.log("Пользователь не авторизован через Telegram");
      setIsBusinessOwner(false);
      localStorage.setItem('isBusinessOwner', 'false');
      return false;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/business/check-owner/${businessId}?user_id=${telegramUser.id}`);
      
      if (response.ok) {
        const businessInfo = await response.json();
        
        if (businessInfo.is_owner) {
          // Сохраняем информацию о владельце
          const ownerInfo = {
            businessId: businessId,
            userId: telegramUser.id,
            timestamp: Date.now()
          };
          localStorage.setItem('ownerInfo', JSON.stringify(ownerInfo));
          localStorage.setItem('shop_info', JSON.stringify(businessInfo));
          localStorage.setItem('isBusinessOwner', 'true');
          
          setIsBusinessOwner(true);
          setShopInfo(businessInfo);
          console.log("Пользователь является владельцем магазина для бизнеса:", businessId);
          return true;
        } else {
          // Пользователь не владелец
          localStorage.setItem('isBusinessOwner', 'false');
          setIsBusinessOwner(false);
          console.log("Пользователь не является владельцем магазина для бизнеса:", businessId);
          return false;
        }
      } else {
        console.log("Ошибка при проверке владельца для бизнеса:", businessId);
        localStorage.setItem('isBusinessOwner', 'false');
        setIsBusinessOwner(false);
        return false;
      }
    } catch (err) {
      console.error('Error checking business owner for business:', businessId, err);
      localStorage.setItem('isBusinessOwner', 'false');
      setIsBusinessOwner(false);
      return false;
    }
  };

  useEffect(() => {
    // Сохраняем тему в localStorage при изменении
    localStorage.setItem('theme', theme);
    
    if (theme === "Light") {
      document.body.className = "light";
    } else {
      document.body.className = "dark";
    }
  }, [theme]);

  useEffect(() => {
    if (!socket) {
      const newSocket = io("http://localhost:8080", {
        transportOptions: {
          polling: {
            maxHttpBufferSize: 1e8,
          },
        }
      });
      
      setSocket(newSocket);
    }
  }, [socket]);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const bId = pathParts[1]; 
    
    if (bId && bId !== "card" && bId !== "cart" && bId !== "welcome" && bId !== "oups") {
      // Немедленно обновляем businessId из URL
      setBusinessId(bId);
      localStorage.setItem('businessId', bId);
      
      // Проверяем владельца магазина
      if (telegramUser?.id) {
        checkBusinessOwner(bId);
      } else {
        // Если нет Telegram пользователя, сбрасываем флаг владельца
        setIsBusinessOwner(false);
        localStorage.setItem('isBusinessOwner', 'false');
      }
      
      console.log("Business ID установлен из URL:", bId);
    } else if (!bId || bId === "welcome" || bId === "oups") {
      // Очищаем businessId для специальных маршрутов
      setBusinessId(null);
      localStorage.removeItem('businessId');
      setIsBusinessOwner(false);
      localStorage.setItem('isBusinessOwner', 'false');
      console.log("Business ID очищен для маршрута:", bId);
    }
  }, [location.pathname, telegramUser]);

  // Эффект для логирования изменений isBusinessOwner
  useEffect(() => {
    console.log("Статус владельца магазина обновлен:", isBusinessOwner, "для бизнеса:", businessId);
  }, [isBusinessOwner, businessId]);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Подключились к серверу');
        setLoading(false);
      });
      
      socket.on('disconnect', () => {
        console.log('Отключились от сервера');
      });
      
      socket.on('message', (msg) => {
        setMessages(prevMessages => [...prevMessages, JSON.parse(msg)]);
      });
      
      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('message');
      };
    }
  }, [socket]);

  useEffect(() => {
    if (!message) {
      if (messages.length > 0) {
        setMessage(messages[0]);
        setMessages(prevMessages => prevMessages.slice(1));
      }
    }
  }, [message, messages]);

  const sendMessage = (msg) => {
    if (socket) {
      socket.emit('message', msg);
    }
  };

  // Функция для загрузки бизнес-настроек
  const loadBusinessSettings = (bId) => {
    if (!bId) return;
    
    // Если не требуется принудительная перезагрузка и уже загружены для этого бизнеса - не загружаем снова
    if (!forceReloadSettings && businessSettings && businessSettings.business_id === bId && businessSettingsLoaded) {
      console.log("Business settings уже загружены для бизнеса:", bId);
      return;
    }
    
    // Сбрасываем флаг загрузки и загружаем
    console.log("Загружаем business settings для бизнеса:", bId);
    setBusinessSettingsLoaded(false);
    setForceReloadSettings(false); // Сбрасываем флаг принудительной перезагрузки
    sendMessage(JSON.stringify(["business_settings", "get", { business_id: bId }]));
  };

  // Функция для загрузки карточек
  const loadBusinessCards = (bId, limit = 100) => {
    if (!bId) return;
    
    // Если не требуется принудительная перезагрузка и уже загружены для этого бизнеса - не загружаем снова
    if (!forceReloadCards && businessCards.length > 0 && businessCardsLoaded) {
      console.log("Business cards уже загружены для бизнеса:", bId, businessCards.length, "карточек");
      return;
    }
    
    // Сбрасываем флаг загрузки и загружаем
    console.log("Загружаем business cards для бизнеса:", bId, "лимит:", limit);
    setBusinessCardsLoaded(false);
    setForceReloadCards(false); // Сбрасываем флаг принудительной перезагрузки
    sendMessage(JSON.stringify(["cards", "filter", { business_id: bId }, limit]));
  };

  // Функция для загрузки подарков
  const loadBusinessGifts = (bId, limit = 10) => {
    if (!bId) return;
    
    // Если уже загружены для этого бизнеса - не загружаем снова
    if (businessGifts.length > 0 && businessGiftsLoaded) {
      console.log("Business gifts уже загружены для бизнеса:", bId, businessGifts.length, "подарков");
      return;
    }
    
    // Сбрасываем флаг загрузки и загружаем
    console.log("Загружаем business gifts для бизнеса:", bId, "лимит:", limit);
    setBusinessGiftsLoaded(false);
    sendMessage(JSON.stringify(["cards", "filter", { business_id: bId, category: "Подарки" }, limit]));
  };
  
  // Функции для принудительной перезагрузки данных
  const forceReloadBusinessSettings = () => {
    console.log("Принудительная перезагрузка бизнес-настроек для бизнеса:", businessId);
    setForceReloadSettings(true);
    if (businessId) {
      loadBusinessSettings(businessId);
    }
  };
  
  const forceReloadBusinessCards = () => {
    console.log("Принудительная перезагрузка карточек для бизнеса:", businessId);
    setForceReloadCards(true);
    if (businessId) {
      loadBusinessCards(businessId, 100);
    }
  };

  // Функция для очистки данных бизнеса
  const clearBusinessData = () => {
    console.log("Очищаем данные бизнеса для:", businessId);
    setBusinessSettings(null);
    setBusinessCards([]);
    setBusinessSettingsLoaded(false);
    setBusinessCardsLoaded(false);
    
    // Очищаем localStorage
    if (businessId) {
      localStorage.removeItem(`businessSettings_${businessId}`);
      localStorage.removeItem(`businessCards_${businessId}`);
    }
  };

  // Обработка сообщений для сохранения данных бизнеса
  useEffect(() => {
    if (!message) return;

    console.log("Context обработка сообщения:", message);

    if (message[0] === 'business_settings') {
      if (message[1] === 'get') {
        const settings = message[2];
        if (settings) {
          setBusinessSettings(settings);
          setBusinessSettingsLoaded(true);
          // НЕ сохраняем в localStorage - используем динамический подход
          console.log("Business settings сохранены в контекст для бизнеса:", businessId);
        }
      } else if (message[1] === 'update') {
        // После обновления настроек автоматически перезагружаем данные
        // Это уже происходит в BusinessSettings.js, но на всякий случай оставляем
        if (businessId) {
          loadBusinessSettings(businessId);
        }
      }
    }
    
    if (message[0] === 'cards') {
      if (message[1] === 'filter') {
        const cards = message[2];
        const filters = message[3]; // Фильтры из запроса
        const bId = businessId; // Используем текущий businessId из состояния
        
        // Проверяем, не является ли это запросом на подарки (для корзины)
        // Если фильтры содержат category: "Подарки", то не сохраняем в businessCards
        const isGiftRequest = filters && 
                             ((typeof filters === 'object' && filters.category === "Подарки") ||
                              (Array.isArray(filters) && filters.length > 0 && 
                               filters.some(f => f && typeof f === 'object' && f.category === "Подарки")));
        
        if (bId && cards && !isGiftRequest) {
          setBusinessCards(cards);
          setBusinessCardsLoaded(true);
          // НЕ сохраняем в localStorage - используем динамический подход
          console.log("Business cards сохранены в контекст для бизнеса:", bId, cards.length, "карточек");
        } else if (isGiftRequest) {
          console.log("Запрос на подарки - сохраняем в businessGifts");
          // Сохраняем подарки в отдельное состояние
          if (bId && cards) {
            setBusinessGifts(cards);
            setBusinessGiftsLoaded(true);
            console.log("Business gifts сохранены в контекст для бизнеса:", bId, cards.length, "подарков");
          }
        }
      }
    }
    
    // Передаем сообщение дальше для обработки в компонентах
    if (messages.length > 0) {
      setMessage(messages[0]);
      setMessages(prevMessages => prevMessages.slice(1));
    } else {
      setMessage(null);
    }
  }, [message, messages, businessId]);

  // Автоматическая загрузка данных при изменении businessId
  useEffect(() => {
    if (businessId) {
      console.log("BusinessId изменился, загружаем данные для:", businessId);
      loadBusinessSettings(businessId);
      loadBusinessCards(businessId, 100);
      loadBusinessGifts(businessId, 10);
    } else {
      // Сбрасываем данные при смене бизнеса
      clearBusinessData();
    }
  }, [businessId]);

  return (
    <SocketContext.Provider value={{
      sendMessage,
      message,
      setMessage,
      socket,
      state,
      setState,
      telegramUser,
      loading,
      setLoading,
      error,
      setError,
      businessId,
      setBusinessId,
      theme,
      setTheme,
      isBusinessOwner,
      setIsBusinessOwner,
      checkBusinessOwner,
      shopInfo,
      setShopInfo,
      verifyCodeId: null,
      setVerifyCodeId: () => {},
      loadUserInfo: false,
      setLoadUserInfo: () => {},
      postId,
      setPostId,
      posts,
      setPosts,
      userPosts,
      setUserPosts,
      users,
      setUsers,
      select,
      setSelect,
      why,
      setWhy,
      why2,
      setWhy2,
      transportView,
      setTransportView,
      servicesView,
      setServicesView,
      services_View,
      setServices_View,
      dealersView,
      setDealersView,
      handleClickBackButton,
      setHandleClickBackButton,
      openPost,
      setOpenPost,
      cartItems,
      setCartItems,
      // Новые значения для работы с данными бизнеса
      businessSettings,
      businessCards,
      businessSettingsLoaded,
      businessCardsLoaded,
      loadBusinessSettings,
      loadBusinessCards,
      setBusinessSettings,
      setBusinessCards,
      clearBusinessData,
      // Функции принудительной перезагрузки
      forceReloadBusinessSettings,
      forceReloadBusinessCards,
      // Новые значения для работы с подарками
      businessGifts,
      businessGiftsLoaded,
      loadBusinessGifts,
      setBusinessGifts,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

const useMainContext = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export { SocketProvider, useMainContext };