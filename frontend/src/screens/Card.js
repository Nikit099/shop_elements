import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMainContext } from '../context';
import Post from '../components/Post';

function Card() {
  const { bId, id } = useParams();
  const navigate = useNavigate();
  const { sendMessage, message, setMessage } = useMainContext();
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем данные карточки
    if (id) {
      sendMessage(JSON.stringify(["cards", "filter", {"_id": id}, 1]));
    }
  }, [id, sendMessage]);

  useEffect(() => {
    if (message) {
      if (message[0] === 'cards' && message[1] === 'filter') {
        if (message[2] && message[2].length > 0) {
          setCardData(message[2][0]);
        } else {
          // Карточка не найдена, редирект на 404 или главную
          navigate(`/${bId}/oups`);
        }
        setLoading(false);
        setMessage(null);
      }
    }
  }, [message, bId, navigate, setMessage]);

  // Обработка кнопки "назад"
  useEffect(() => {
    const handleBackButton = () => {
      // При нажатии назад из карточки возвращаемся на главную
      navigate(`/${bId}`, { replace: true });
    };

    // Добавляем обработчик popstate
    window.addEventListener('popstate', handleBackButton);
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [bId, navigate]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!cardData) {
    return <div>Карточка не найдена</div>;
  }

  return (
    <div>
      <Post 
        postData={cardData} 
        type="modal" 
        shouldOpenModal={true}
      />
    </div>
  );
}

export default Card;