import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function CardRoute() {
  const { bId, id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Используем replace: false чтобы не заменять текущую запись в истории
    // и добавляем параметр card_id к текущему URL
    navigate(`/${bId}/search?card_id=${id}`, { replace: false });
  }, [bId, id, navigate]);

  return null; // или можно вернуть <Loading />
}

export default CardRoute;