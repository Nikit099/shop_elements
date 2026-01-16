import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useMainContext } from './context';

import FixedButton from './components/FixedButton';

import Main from './screens/Main';
import Loading from './screens/Loading';

import Search from './screens/Search';
import Add from './screens/Add';
import Edit from './screens/Edit';
import Cart from './screens/Cart';
import CardRoute from './components/CardRoute';

const Navigate = () => {

  const { loading } = useMainContext();

  useEffect(() => {
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand();
    // window.Telegram.WebApp.enableClosingConfirmation();
    window.Telegram.WebApp.disableVerticalSwipes();
  }, [window.Telegram.WebApp])

  return (
    !loading ?
      <div>
        <Routes>
          <Route path="/:bId" element={<Main />} />
          <Route path="/:bId/add" element={<Add />} />
          <Route path="/:bId/cart" element={<Cart />} />
          <Route path="/:bId/search" element={<Search />} />
          <Route path="/:bId/card/:id" element={<CardRoute />} />
          <Route path="/:bId/edit/:id" element={<Edit />} />
          <Route path="/" element={<div className="view">Магазин не найден</div>} />
        </Routes>
        <FixedButton />
      </div>
    :
      <Loading />
  );
};

export default Navigate;
