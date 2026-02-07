// frontend/src/navigate.js - упрощенная версия
import { Routes, Route, Navigate as RouterNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useMainContext } from './context';

import FixedButton from './components/FixedButton';
import Main from './screens/Main';
import Loading from './screens/Loading';
import Search from './screens/Search';
import Add from './screens/Add';
import Edit from './screens/Edit';
import Cart from './screens/Cart';
import Card from './screens/Card';
import NotFound from './screens/NotFound';
import BusinessSettings from './screens/BusinessSettings';

const Navigate = () => {
  const { loading } = useMainContext();
  
  useEffect(() => {
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.disableVerticalSwipes();
  }, []);

  return (
    !loading ?
      <div>
        <Routes>
          {/* Страница 404 */}
          <Route path="/oups" element={<NotFound />} />
          
          {/* Редирект с корня на страницу магазина по умолчанию */}
          <Route path="/" element={
            <RouterNavigate to="/oups" replace />
          } />
          
          {/* Основные маршруты магазина - доступны всем */}
          <Route path="/:bId" element={<Main />} />
          <Route path="/:bId/add" element={<Add />} />
          <Route path="/:bId/cart" element={<Cart />} />
          <Route path="/:bId/search" element={<Search />} />
          <Route path="/:bId/card/:id" element={<Card />} />
          <Route path="/:bId/edit/:id" element={<Edit />} />
          
          {/* Страница настроек бизнеса - только для владельца */}
          <Route path="/:bId/settings" element={<BusinessSettings />} />
          
          {/* Страница 404 для всех остальных маршрутов */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FixedButton />
      </div>
    :
      <Loading />
  );
};

export default Navigate;