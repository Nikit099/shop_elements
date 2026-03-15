import styles from './styles/Welcome.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMainContext } from '../context';

function Welcome() {
  const { sendMessage, message, setMessage, theme, telegramUser, loading } = useMainContext();
  const navigate = useNavigate();
  
  const [shopName, setShopName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [creationStatus, setCreationStatus] = useState(null); // 'creating', 'success', 'error'
  const [countdown, setCountdown] = useState(5); // 5 минут в секундах (300)
  
  // Обработка сообщений от сервера
  useEffect(() => {
    if (message) {
      console.log('Welcome message:', message);
      
      if (message[0] === 'business' && message[1] === 'create') {
        if (message[2] === 'success') {
          const businessId = message[3];
          setCreationStatus('success');
          
          // Сохраняем businessId в localStorage
          localStorage.setItem('businessId', businessId);
          localStorage.setItem('isBusinessOwner', 'true');
          
          // Устанавливаем таймер для перехода
          setTimeout(() => {
            navigate(`/${businessId}`);
          }, 3000); // Переход через 3 секунды после успеха
        } else if (message[2] === 'error') {
          setCreationStatus('error');
          setIsCreating(false);
        }
      }
      
      setMessage(null);
    }
  }, [message, setMessage, navigate]);
  
  // Таймер обратного отсчета
  useEffect(() => {
    let interval;
    if (creationStatus === 'creating' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [creationStatus, countdown]);
  
  const handleCreateShop = () => {
    if (!showInput) {
      setShowInput(true);
      return;
    }
    
    if (!shopName.trim()) {
      return;
    }
    
    // if (!telegramUser?.id) {
    //   alert('Для создания магазина необходимо авторизоваться через Telegram');
    //   return;
    // }
    
    setIsCreating(true);
    setCreationStatus('creating');
    setCountdown(300); // 5 минут в секундах
    // console.log(`${telegramUser.id} и просто ${telegramUser}`)
 

    // Отправляем запрос на создание бизнеса
    const businessData = {
      name: shopName.trim(),
      owner_id: telegramUser?.id,
      created_at: new Date().toISOString()
    };
    
    sendMessage(JSON.stringify(['business', 'create', businessData, telegramUser]));
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="view">
      <div className={styles.container} style={{
        backgroundColor: theme === "Dark" ? "#1a1a1a" : "#ffffff",
        color: theme === "Dark" ? "#dfdfdf" : "#2d2d2d"
      }}>
        <div className={styles.header}>
          <h1 className={styles.title}>Добро пожаловать в LIGHT Business</h1>
          <p className={styles.subtitle}>Платформа для создания и управления вашим онлайн-магазином</p>
        </div>
        
        <div className={styles.content}>
          <div className={styles.description}>
            <p>Здесь вы можете создать свой собственный магазин или перейти в существующий.</p>
            <p>Если вы хотите посетить чужой магазин, попросите у владельца ссылку.</p>
          </div>
          
          {!showInput && !isCreating && (
            <div className={styles.buttonContainer}>
              <button 
                className={styles.createButton}
                onClick={handleCreateShop}
                style={{
                  backgroundColor: theme === "Dark" ? "#313131" : "#f0f0f0",
                  color: theme === "Dark" ? "#dfdfdf" : "#2d2d2d"
                }}
              >
                Создать свой магазин
              </button>
            </div>
          )}
          
          {showInput && !isCreating && (
            <div className={styles.inputContainer}>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Введите название магазина"
                className={styles.nameInput}
                style={{
                  backgroundColor: theme === "Dark" ? "#2d2d2d" : "#f5f5f5",
                  color: theme === "Dark" ? "#dfdfdf" : "#2d2d2d",
                  border: theme === "Dark" ? "1px solid #444" : "1px solid #ddd"
                }}
                autoFocus
              />
              <button
                className={styles.createButton}
                onClick={handleCreateShop}
                disabled={!shopName.trim()}
                style={{
                  backgroundColor: shopName.trim() 
                    ? (theme === "Dark" ? "#4CAF50" : "#45a049") 
                    : (theme === "Dark" ? "#555" : "#ccc"),
                  color: "#fff",
                  opacity: shopName.trim() ? 1 : 0.7,
                  cursor: shopName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Создать магазин
              </button>
            </div>
          )}
          
          {isCreating && creationStatus === 'creating' && (
            <div className={styles.creatingContainer}>
              <div className={styles.loadingSpinner}></div>
              <h3>Создаем ваш магазин...</h3>
              <p>Магазин будет создан через {formatTime(countdown)}</p>
              <p className={styles.note}>Пожалуйста, не закрывайте приложение</p>
            </div>
          )}
          
          {creationStatus === 'success' && (
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>✓</div>
              <h3>Магазин успешно создан!</h3>
              <p>Сейчас вы будете перенаправлены в ваш новый магазин...</p>
            </div>
          )}
          
          {creationStatus === 'error' && (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>✗</div>
              <h3>Ошибка при создании магазина</h3>
              <p>Пожалуйста, попробуйте еще раз или обратитесь в поддержку.</p>
              <button 
                className={styles.retryButton}
                onClick={() => {
                  setCreationStatus(null);
                  setIsCreating(false);
                  setShowInput(true);
                }}
                style={{
                  backgroundColor: theme === "Dark" ? "#313131" : "#f0f0f0",
                  color: theme === "Dark" ? "#dfdfdf" : "#2d2d2d"
                }}
              >
                Попробовать снова
              </button>
            </div>
          )}
          
          
        </div>
        
        <div className={styles.footer}>
          <p>powered by <span>LIGHT Business</span> © 2024</p>
        </div>
      </div>
    </div>
  );
}

export default Welcome;