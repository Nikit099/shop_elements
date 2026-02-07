import React from 'react';
import './styles/FixedButton.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMainContext } from '../context';

const useDoubleClick = (callback, onSingleClick = () => {}, timeout = 150) => {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (clickCount === 2) {
        callback();
      } else if (clickCount === 1) {
        onSingleClick();
      }
      setClickCount(0);
    }, timeout);

    return () => clearTimeout(timer);
  }, [clickCount, callback, onSingleClick, timeout]);

  return () => setClickCount(prev => prev + 1);
};

const FixedButton = (props) => {
  let location = useLocation();
  const navigate = useNavigate();
  const [ isProButtonVisible, setIsProButtonVisible ] = useState(true);
  const [ canGoBack, setCanGoBack ] = useState(false);
  const [ canScrollUp, setCanScrollUp ] = useState(false);
  const { accessToken, refreshToken, handleClickBackButton, cartItems, businessId, isBusinessOwner } = useMainContext();

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log(accessToken && refreshToken)
  }

  const goBack = () => {
    // Проверяем, если мы на глубоком уровне, просто идем назад, 
    // но лучше всегда контролировать путь через businessId
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/${businessId}`);
    }
  };

  const openButtons = () => {
    setIsProButtonVisible(prev => !prev);
  }

  useEffect(() => {
    const updateCanGoBack = () => {
      setCanGoBack(window.location.pathname !== '/');
    };

    const handleScroll = () => {
      if (document.documentElement.scrollTop > 400) {
        setCanScrollUp(true);
      } else {
        setCanScrollUp(false);
      }
    };

    window.addEventListener('popstate', updateCanGoBack);
    window.addEventListener('scroll', handleScroll);

    updateCanGoBack();

    return () => {
      window.removeEventListener('popstate', updateCanGoBack);
      window.removeEventListener('scroll', handleScroll);
    }
  }, [location.pathname])

  return (
    <div className={(props.upper && 'upper') || (props.send && 'send')}>
      {/* Кнопка настроек компании (только для владельца) */}
      {isBusinessOwner && (
        <div className={`fixed-button settings ${isProButtonVisible ? 'visible' : ''}`} onClick={() => navigate(`/${businessId}/settings`)}>
          <img src={require("./images/settings.svg").default} className="" alt="settings" />
        </div>
      )}
      
      {/* Кнопка добавления товара (только для владельца) */}
      {isBusinessOwner && (
        <div className={`fixed-button add ${isProButtonVisible ? 'visible' : ''}`} onClick={() => navigate(`/${businessId}/add`)}>
          <img src={require("./images/plus.svg").default} className="" alt="plus" />
        </div>
      )}
      
      {/* Кнопка корзины */}
      <div className={`fixed-button ${isProButtonVisible ? 'visible' : ''}`} onClick={() => navigate(`/${businessId}/cart`)}>
        <img src={require("../screens/images/box.svg").default} className="" alt="cart" />
        {cartItems.length > 0 &&
        <div style={{position: "absolute", 
                     top: 1, 
                     right: 1, 
                     width: 15, 
                     height: 15, 
                     borderRadius: "50%",
                     background: "#FF4545", 
                     display: "flex", 
                     alignItems: "center", 
                     justifyContent: "center",
                     fontSize: 11,
                     fontWeight: 300}}>{cartItems.length}</div>}
      </div>
      
      {/* Кнопка назад */}
      {canGoBack &&
        <div className="fixed-button-back" onClick={handleClickBackButton ? handleClickBackButton : goBack}>
          <img src={require("./images/arrow-right.svg").default} className="" alt="arrow" />
        </div>}
      
      {/* Кнопка прокрутки вверх */}
      {(canScrollUp || props.send) &&
  <div className={`fixed-button-up ${isProButtonVisible ? 'visible' : ''}`} onClick={!props.send ? scrollUp : props.onDelete}>
    {!props.send ?
      <img src={require("./images/arrow-right.svg").default} alt="arrow" />
      : <img src={require("./images/close.svg").default} alt="arrow" style={{width: "100%"}}/> }
  </div>
}
    </div>
  );
};

export default FixedButton;
