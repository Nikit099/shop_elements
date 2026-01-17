import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const NotFound = () => {
  const navigate = useNavigate();
  const bId = localStorage.getItem('businessId') || 'default';

  return (
    <div className="view" style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', height: '100vh', textAlign: 'center' 
    }}>
      <h2 style={{ fontSize: '48px', margin: '0' }}>404</h2>
      <p style={{ fontWeight: 300, marginBottom: '30px' }}>Упс! Такой страницы не существует.</p>
      <Button text="Вернуться на главную" handleClick={() => navigate(`/${bId}`)} />
    </div>
  );
};
export default NotFound;