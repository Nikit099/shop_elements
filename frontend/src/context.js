import React, { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext();

const SocketProvider = ({ children }) => {

  const [ theme, setTheme ] = useState("Light");

  const [ state, setState ] = useState(null);
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState(null);

  const [ account, setAccount ] = useState(window.Telegram.WebApp.initDataUnsafe);
  const [ accessToken, setAccessToken ] = useState(localStorage.getItem('accessToken'));
  const [ refreshToken, setRefreshToken ] = useState(localStorage.getItem('refreshToken'));
  const [ isFirstLogin, setIsFirstLogin ] = useState(JSON.parse(localStorage.getItem('isFirstLogin')));

  const [ verifyCodeId, setVerifyCodeId ] = useState(null);
  const [ loadUserInfo, setLoadUserInfo ] = useState(false);

  const [ socket, setSocket ] = useState(null);
  const [ message, setMessage ] = useState(null);
  const [ messages, setMessages ] = useState([]);

  const [ postId, setPostId ] = useState(null);
  const [ posts, setPosts ] = useState([]);
  const [ users, setUsers ] = useState([]);
  const [ userPosts, setUserPosts ] = useState([]);

  const [ select, setSelect ] = useState("transport");

  const [ why, setWhy ] = useState(null);
  const [ why2, setWhy2 ] = useState(null);

  const [ transportView, setTransportView ] = useState("grid");
  const [ servicesView, setServicesView ] = useState("grid");
  const [ services_View, setServices_View ] = useState("grid");
  const [ dealersView, setDealersView ] = useState("grid");

  const [ handleClickBackButton, setHandleClickBackButton ] = useState();
  
  const [ openPost, setOpenPost ] = useState(null);

  const [ cartItems, setCartItems ] = useState([]);

  useEffect(() => {
    if (theme === "Light") {
      document.body.className = "dark";
    } else {
      document.body.className = "light";
    }
    
  }, [theme]);

  useEffect(() => {
    if (!socket) {
      setSocket(io("http://localhost:8080", {
        transportOptions: {
          polling: {
            maxHttpBufferSize: 1e8,
          },
        }
      }));
    }
  }, [socket]);

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
      };
    };
  }, [message, messages]);

  const sendMessage = (msg) => {
    if (socket) {
      socket.emit('message', msg);
    }
  };

  return (
    <SocketContext.Provider value={{ sendMessage,
                                     message,
                                     setMessage,
                                     socket,
                                     state,
                                     setState,

                                     accessToken,
                                     refreshToken,

                                     account,
                                     setAccount,
                                     verifyCodeId,
                                     setVerifyCodeId,

                                     loading,
                                     setLoading,
                                     loadUserInfo,
                                     setLoadUserInfo,

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

                                     handleClickBackButton, setHandleClickBackButton,
                                     openPost, setOpenPost,
                                     cartItems, setCartItems,

                                     error,
                                     setError,
                                     
                                     theme, setTheme}}>
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
