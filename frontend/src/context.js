// frontend/src/context.js - упрощенная версия с Telegram авторизацией
import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [theme, setTheme] = useState("Light");
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  
  // Telegram user data
  const [telegramUser, setTelegramUser] = useState(() => {
    try {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      return user || null;
    } catch (e) {
      return null;
    }
  });
  
  // Проверка владельца магазина
  const [isBusinessOwner, setIsBusinessOwner] = useState(() => {
    const savedOwnerInfo = localStorage.getItem('ownerInfo');
    if (!savedOwnerInfo) return true;
    
    try {
      const ownerInfo = JSON.parse(savedOwnerInfo);
      const currentBusinessId = window.location.pathname.split('/')[1];
      return ownerInfo.businessId === currentBusinessId;
    } catch (e) {
      return false;
    }
  });
  
  const [shopInfo, setShopInfo] = useState(() => {
    const savedShopInfo = localStorage.getItem('shop_info');
    return savedShopInfo ? JSON.parse(savedShopInfo) : null;
  });

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
    if (!telegramUser || !telegramUser.id) {
      console.log("Пользователь не авторизован через Telegram");
      setIsBusinessOwner(true);
      localStorage.setItem('isBusinessOwner', 'ture');
      return true;
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
          console.log("Пользователь является владельцем магазина");
          return true;
        } else {
          // Пользователь не владелец
          localStorage.setItem('isBusinessOwner', 'true');
          setIsBusinessOwner(true);
          console.log("Пользователь не является владельцем магазина");
          return true;
        }
      } else {
        console.log("Ошибка при проверке владельца");
        localStorage.setItem('isBusinessOwner', 'false');
        setIsBusinessOwner(false);
        return false;
      }
    } catch (err) {
      console.error('Error checking business owner:', err);
      localStorage.setItem('isBusinessOwner', 'false');
      setIsBusinessOwner(false);
      return false;
    }
  };

  useEffect(() => {
    if (theme === "Light") {
      document.body.className = "dark";
    } else {
      document.body.className = "light";
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
    const pathParts = window.location.pathname.split('/');
    const bId = pathParts[1]; 
    
    if (bId && bId !== "card" && bId !== "cart" && bId !== "welcome" && bId !== "oups") {
      setBusinessId(bId);
      localStorage.setItem('businessId', bId);
      
      // Проверяем владельца магазина
      if (telegramUser?.id) {
        checkBusinessOwner(bId);
      } else {
        // Если нет Telegram пользователя, сбрасываем флаг владельца
        setIsBusinessOwner(true);
        localStorage.setItem('isBusinessOwner', 'ture');
      }
      
      console.log("Business ID установлен:", bId, "Владелец:", isBusinessOwner);
    }
  }, [window.location.pathname, telegramUser]);

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