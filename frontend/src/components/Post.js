import { LazyLoadImage } from 'react-lazy-load-image-component';
import Slider from './Slider';
import MiniSlider from './MiniSlider';
import Button from './Button';
import Hint from './Hint';
import Contact from './Contact';
import { useMainContext } from '../context';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from './BottomSheet';

import styles from './styles/Post.module.css';

function multiplyPrice(priceString, multiplier) {
  // Удаляем все символы, кроме цифр и пробелов, из строки цены
  const cleanedPriceString = priceString.replace(/[^\d\s]/g, '');
  // Разбиваем очищенную строку на части: количество и валюту
  const amount = cleanedPriceString.replace(' ', '');
  // Умножаем количество на множитель и округляем до целого числа
  const totalAmount = Math.round(parseInt(amount, 10) * multiplier);
  // Форматируем сумму с разделением тысяч и добавляем валюту
  const formattedAmount = totalAmount.toLocaleString('ru-RU');
  // Возвращаем форматированную строку с суммой
  return `${formattedAmount}`;
}

// Вспомогательный компонент для содержимого модального окна
function ModalContent({ 
  data, 
  theme, 
  textPrimary, 
  textSecondary, 
  textTertiary, 
  elementBg, 
  surface, 
  imagesDivRef,
  activeImage,
  setActiveImage,
  selectedColor,
  setSelectedColor,
  selectedCount,
  setSelectedCount,
  selectedSize,
  setSelectedSize,
  selectedPackage,
  setSelectedPackage,
  colors,
  counts,
  sizes,
  packages,
  newPrice,
  isBusinessOwner,
  businessId,
  navigate
}) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <Slider 
        images={data.images} 
        imagesDivRef={imagesDivRef} 
        setActiveImage={setActiveImage} 
        image_color={data.image_color} 
        setSelectedColor={setSelectedColor} 
        setSelectedCount={setSelectedCount} 
      />
      
      {data.images.length > 1 && (
        <div style={{ marginTop: -72, position: 'relative', zIndex: 3 }}>
          <MiniSlider 
            images={data.images} 
            imagesDivRef={imagesDivRef} 
            activeImage={activeImage} 
            image_color={data.image_color} 
            setSelectedColor={setSelectedColor} 
            setSelectedCount={setSelectedCount} 
          />
        </div>
      )}
      
      <div className={styles.price} style={{ 
        padding: data.images.length > 1 ? '30px 15px 0px 15px' : '10px 15px 0px 15px', 
        position: 'relative' 
      }}>
        <div className={styles.title} style={{ 
          fontWeight: 400, 
          fontSize: 20, 
          maxWidth: '85%', 
          color: textPrimary 
        }}>
          {data.title}
        </div>
        
        <div className={styles.actions} style={{ 
          position: 'absolute', 
          right: 15, 
          top: data.images.length > 1 ? 25 : 10 
        }}>
          <div 
            className={styles.action} 
            style={{ color: textPrimary, fontSize: 9, fontWeight: 100 }}
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: data.title,
                  url: window.location.href
                })
                  .then(() => console.log('Successful share'))
                  .catch((error) => console.log('Error sharing', error));
              } else {
                console.log('Web Share API не поддерживается в вашем браузере');
              }
            }}
          >
            <img 
              src={require('../components/images/share-white.svg').default} 
              alt="" 
              style={{ marginBottom: 0, height: 40 }} 
            />
            Поделиться
          </div>
          
          {isBusinessOwner && (
            <div 
              className={styles.action} 
              style={{ color: textPrimary, fontSize: 9, fontWeight: 100 }}
              onClick={() => {
                navigate(`/${businessId}/edit/${data._id}`);
              }}
            >
              <img 
                src={require('./images/settings.svg').default} 
                alt="" 
                style={{ marginBottom: 0, height: 40 }} 
              />
              Настройки
            </div>
          )}
        </div>
      </div>
      
      <div style={{ 
        fontSize: 18, 
        fontWeight: 200, 
        padding: '10px 15px 30px 15px', 
        color: textPrimary 
      }}>
        {!newPrice ? data.price : newPrice.price}
      </div>
      
      <div style={{ paddingBottom: [...colors, ...counts, ...sizes, ...packages].length > 0 ? 10 : 0 }}>
        {colors.length > 0 && (
          <div style={{ padding: '0px 15px 20px 15px' }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 300, 
              paddingBottom: 10, 
              color: textTertiary 
            }}>
              Цвет
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {colors.map((color, index) => (
                <div 
                  key={`color-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 7px',
                    borderRadius: 4,
                    background: selectedColor === color ? '#fff' : elementBg,
                    fontSize: 13,
                    fontWeight: 300,
                    color: selectedColor === color ? '#000' : '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (selectedColor === color) {
                      // setSelectedColor(null);
                    } else {
                      setSelectedColor(color);
                      if (data.image_color) {
                        const colorImage = data.image_color.find((o, i) => o.color === color);
                        if (colorImage) {
                          setActiveImage(colorImage.index);
                          if (imagesDivRef.current) {
                            imagesDivRef.current.scrollLeft = window.innerWidth * colorImage.index;
                          }
                        }
                      }
                    }
                  }}
                >
                  {color}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {counts.length > 0 && (
          <div style={{ padding: '0 15px 20px 15px' }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 300, 
              paddingBottom: 10, 
              color: textTertiary 
            }}>
              Кол-во стеблей
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {counts.map((count, index) => (
                <div 
                  key={`count-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 7px',
                    borderRadius: 4,
                    background: selectedCount === count ? '#fff' : elementBg,
                    fontSize: 13,
                    fontWeight: 300,
                    color: selectedCount === count ? '#000' : '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (selectedCount === count) {
                      // setSelectedCount(null)
                    } else {
                      setSelectedCount(count);
                      if (data.image_color) {
                        const countImage = data.image_color.find((o, i) => o.count === count);
                        if (countImage) {
                          setActiveImage(countImage.index);
                          if (imagesDivRef.current) {
                            imagesDivRef.current.scrollLeft = window.innerWidth * countImage.index;
                          }
                        }
                      }
                    }
                  }}
                >
                  {count}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sizes.length > 0 && (
          <div style={{ padding: '0 15px 20px 15px' }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 300, 
              paddingBottom: 10, 
              color: textTertiary 
            }}>
              Высота букета
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sizes.map((size, index) => (
                <div 
                  key={`size-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 7px',
                    borderRadius: 4,
                    background: selectedSize === size ? '#fff' : elementBg,
                    fontSize: 13,
                    fontWeight: 300,
                    color: selectedSize === size ? '#000' : '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (selectedSize === size) {
                      // setSelectedSize(null)
                    } else {
                      setSelectedSize(size);
                    }
                  }}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {packages.length > 0 && (
          <div style={{ padding: '0 15px 20px 15px' }}>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 300, 
              paddingBottom: 10, 
              color: textTertiary 
            }}>
              Упаковка
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {packages.map((pckg, index) => (
                <div 
                  key={`package-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 7px',
                    borderRadius: 4,
                    background: selectedPackage === pckg ? '#fff' : elementBg,
                    fontSize: 13,
                    fontWeight: 300,
                    color: selectedPackage === pckg ? '#000' : '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (selectedPackage === pckg) {
                      // setSelectedPackage(null)
                    } else {
                      setSelectedPackage(pckg);
                    }
                  }}
                >
                  {pckg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Hint 
        product={data} 
        selectedColor={selectedColor} 
        selectedCount={selectedCount} 
        selectedPackage={selectedPackage} 
        selectedSize={selectedSize} 
      />
      
      <Contact />
    </div>
  );
}

// Компонент для панели корзины
function CartPanel({
  cartItems,
  data,
  textPrimary,
  elementBg,
  handleCart,
  navigate,
  businessId,
  setIsOpenPost
}) {
  const itemInCart = cartItems.find(item => JSON.stringify(item.product) === JSON.stringify(data));
  const totalItemsInCart = cartItems.reduce((total, item) => total + item.count, 0);
  
  return (
    <div style={{
      width: '100%',
      boxSizing: 'border-box',
      padding: '20px 20px 30px 20px',
      background: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(26, 24, 24, 1) 100%)',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'space-between',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <div style={{ flexShrink: 0, marginTop: 'auto', width: '100%' }}>
          {itemInCart ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 25 }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40, flexShrink: 0 }}>
                <div 
                  onClick={(e) => handleCart(e, 0)}
                  style={{ 
                    marginRight: -4, 
                    width: 40, 
                    height: 40, 
                    zIndex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <img 
                    src={require('../screens/images/remove-to-cart.svg').default} 
                    alt="Удалить из корзины" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div style={{ 
                  width: 44, 
                  height: 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  zIndex: 0 
                }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 300, 
                    lineHeight: 1, 
                    color: textPrimary 
                  }}>
                    {itemInCart.count}
                  </div>
                </div>
                <div 
                  onClick={(e) => handleCart(e, 1)}
                  style={{ 
                    marginLeft: -4, 
                    width: 40, 
                    height: 40, 
                    zIndex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <img 
                    src={require('../screens/images/add-to-cart.svg').default} 
                    alt="Добавить в корзину" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              </div>
              
              <Button 
                text={`Просмотреть корзину (${totalItemsInCart})`}
                handleClick={(e) => {
                  setIsOpenPost(false);
                  navigate(`/${businessId}/cart`);
                }}
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  borderRadius: 22,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: elementBg,
                  color: textPrimary,
                  flex: 1
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Button 
                text="Добавить в корзину" 
                handleClick={(e) => handleCart(e, 1)}
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  borderRadius: 22,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: elementBg,
                  color: textPrimary,
                  width: '100%'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Post({ postData, type, parent, basePathUrl, shouldOpenModal = false }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // Для тестовой кнопочки

  const [data, setData] = useState(postData);
  const { 
    sendMessage, 
    message, 
    setMessage, 
    cartItems, 
    setCartItems, 
    account, 
    theme, 
    businessId, 
    isBusinessOwner 
  } = useMainContext();
  
  // CSS переменные для темы
  const textPrimary = theme === "Dark" ? "#FFFFFF" : "#000000";
  const textSecondary = theme === "Dark" ? "#8F8E93" : "#8E8E93";
  const textTertiary = theme === "Dark" ? "#bbb" : "#666";
  const elementBg = theme === "Dark" ? "rgb(24, 24, 26)" : "rgb(230, 230, 235)";
  const surface = theme === "Dark" ? "#1C1C1E" : "#F2F2F7";
  const borderColor = theme === "Dark" ? "#2C2C2E" : "#C6C6C8";
  
  const postDivRef = useRef();
  const [isOpenPost, setIsOpenPost] = useState(false);
  
  // Состояния для выбора опций
  const imagesDivRef = useRef();
  const [activeImage, setActiveImage] = useState(null);
  const colors = data.colors || [];
  const [selectedColor, setSelectedColor] = useState(colors[0] || null);
  const counts = data.counts || [];
  const [selectedCount, setSelectedCount] = useState(counts[0] || null);
  const sizes = data.sizes || [];
  const [selectedSize, setSelectedSize] = useState(sizes[0] || null);
  const packages = data.packages || [];
  const [selectedPackage, setSelectedPackage] = useState(packages[0] || null);
  const [posts, setPosts] = useState([]);
  const [newPrice, setNewPrice] = useState(null);

  // Восстановление скроллинга при размонтировании компонента
  useEffect(() => {
    return () => {
      if (!parent) {
        document.querySelector("html").style.overflow = "auto";
        document.querySelector("body").style.overflow = "auto";
        document.querySelector("body").style.position = "relative";
        document.querySelector("body").style.top = "0px";
      }
    };
  }, []);

  // Автоматическое открытие модального окна при загрузке (для страницы карточки)
  useEffect(() => {
    if (shouldOpenModal && !isOpenPost) {
      setTimeout(() => {
        toggle(true);
      }, 100);
    }
  }, [shouldOpenModal]);

  // Логика для определения цены на основе выбранных опций
  useEffect(() => {
    setData(prevState => ({
      ...prevState, 
      selectedColor, 
      selectedCount, 
      selectedPackage, 
      selectedSize 
    }));
    
    for (let i = 0; i < data.prices?.length; i++) {
      const price = data.prices[i];
      let checked = [0, 0, 0, 0];
      
      if (price.colors.length > 0) {
        if (price.colors.includes(selectedColor)) {
          checked[0] = 1;
        }
      } else {
        checked[0] = 1;
      }
      
      if (price.counts.length > 0) {
        if (price.counts.includes(selectedCount)) {
          checked[1] = 1;
        }
      } else {
        checked[1] = 1;
      }
      
      if (price.packages.length > 0) {
        if (price.packages.includes(selectedPackage)) {
          checked[2] = 1;
        }
      } else {
        checked[2] = 1;
      }
      
      if (price.sizes.length > 0) {
        if (price.sizes.includes(selectedSize)) {
          checked[3] = 1;
        }
      } else {
        checked[3] = 1;
      }
      
      if (JSON.stringify(checked) === JSON.stringify([1, 1, 1, 1])) {
        setNewPrice(price);
        return;
      }
    }
    setNewPrice(null);
  }, [selectedColor, selectedCount, selectedPackage, selectedSize]);

  // Обработка сообщений
  useEffect(() => {
    if (message && window.location.pathname === '/card/' + data._id) {
      if (message[0] === 'cards' && message[1] === 'filter') {
        setPosts(prevState => [
          ...prevState, 
          ...message[2].filter(item => {
            const isInMessage = prevState.some(msgItem => msgItem._id === item._id);
            return !isInMessage;
          })
        ]);
      }
      setMessage(null);
    }
  }, [message]);

  // Функция для работы с корзиной
  const handleCart = (e, type) => {
    e.stopPropagation();
    
    if (type === 1) {
      // Добавление в корзину
      setCartItems(prevState => {
        const index = prevState.findIndex(item => 
          JSON.stringify(item.product) === JSON.stringify(data)
        );
        
        if (index !== -1) {
          return prevState.map((item, i) => {
            if (i === index && item.count !== 100) {
              return { ...item, count: item.count + 1 };
            }
            return item;
          });
        }
        
        return [...prevState, { product: data, count: 1 }];
      });
    } else if (type === 0) {
      // Удаление из корзины
      setCartItems(prevState => {
        const index = prevState.findIndex(item => 
          JSON.stringify(item.product) === JSON.stringify(data)
        );
        
        if (index !== -1) {
          const updatedItem = { 
            ...prevState[index], 
            count: prevState[index].count - 1 
          };
          
          if (updatedItem.count === 0) {
            return prevState.filter((_, i) => i !== index);
          } else {
            return prevState.map((item, i) => 
              i === index ? updatedItem : item
            );
          }
        }
        
        return prevState;
      });
    }
  };

  // Функция открытия/закрытия модального окна
  const toggle = useCallback((skipAnimation = false) => {
    if (!isOpenPost) {
      // При открытии модального окна обновляем URL с параметром card_id
      if (!parent) {
        const newUrl = `/${businessId}${basePathUrl || ''}?card_id=${data._id}`;
        window.history.pushState({}, '', newUrl);
      }
    } else {
      // При закрытии модального окна восстанавливаем URL без параметра
      if (!parent) {
        const cleanUrl = `/${businessId}${basePathUrl || ''}`;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
    
    setIsOpenPost(!isOpenPost);
  }, [isOpenPost, businessId, basePathUrl, data._id, parent]);

  // Функция закрытия модального окна
  const handleClose = useCallback(() => {
    if (!parent) {
      const cleanUrl = `/${businessId}${basePathUrl || ''}`;
      window.history.replaceState({}, '', cleanUrl);
    }
    setIsOpenPost(false);
  }, [businessId, basePathUrl, parent]);

  // Функция открытия модального окна
  const handleOpen = useCallback(() => {
    if (!parent) {
      const newUrl = `/${businessId}${basePathUrl || ''}?card_id=${data._id}`;
      window.history.pushState({}, '', newUrl);
    }
  }, [businessId, basePathUrl, data._id, parent]);

  // Рендер карточки в зависимости от типа
  const renderCard = () => {
    const commonProps = {
      onClick: toggle,
      ref: postDivRef,
      style: { position: 'relative' }
    };

    switch (type) {
      case "block":
        return (
          <div 
            {...commonProps}
            style={{ 
              width: 'calc(50vw - 20px)', 
              position: 'relative', 
              height: '100%', 
              zIndex: 1 
            }}
          >
            <div style={{ 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              rowGap: 10, 
              height: '100%' 
            }}>
              <div style={{ 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden', 
                borderRadius: 9, 
                height: 'calc(50vw - 20px)' 
              }}>
                <LazyLoadImage 
                  src={data.images[0]?.file} 
                  placeholderSrc={data.images[0]?.file_lazy} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                rowGap: 5, 
                padding: '0 5px 5px 5px' 
              }}>
                <div style={{ fontSize: 14, fontWeight: 400 }}>{data.title}</div>
                <div style={{ fontSize: 14, fontWeight: 300, color: textSecondary }}>{data.price}</div>
              </div>
            </div>
          </div>
        );

      case "block-small":
        return (
          <div 
            {...commonProps}
            style={{ 
              width: 'calc(30vw - 20px)', 
              position: 'relative', 
              height: '100%', 
              zIndex: 1 
            }}
          >
            <div 
              onClick={(e) => handleCart(e, 1)} 
              style={{ 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column', 
                rowGap: 10, 
                height: '100%' 
              }}
            >
              <div style={{ 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden', 
                borderRadius: 9, 
                height: 'calc(30vw - 20px)' 
              }}>
                <LazyLoadImage 
                  visibleByDefault={true} 
                  src={data.images[0]?.file} 
                  placeholderSrc={data.images[0]?.file_lazy} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                position: 'absolute', 
                top: 'calc(30vw - 53px)', 
                width: 'calc(30vw - 30px)', 
                height: 28, 
                marginRight: 10 
              }}>
                <div style={{ 
                  width: 24, 
                  height: 24, 
                  zIndex: 1, 
                  position: 'absolute', 
                  right: 0, 
                  marginLeft: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <img 
                    src={require('../screens/images/remove-to-cart.svg').default} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div style={{ 
                  borderRadius: 4, 
                  padding: '0 28px', 
                  height: 28, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: surface, 
                  marginRight: 10, 
                  zIndex: 0 
                }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 300, 
                    lineHeight: 1, 
                    color: textPrimary 
                  }}>
                    {cartItems.find(item => JSON.stringify(item.product) === JSON.stringify(data))?.count || 0}
                  </div>
                </div>
                <div style={{ 
                  width: 24, 
                  height: 24, 
                  zIndex: 1, 
                  position: 'absolute', 
                  right: 0, 
                  marginLeft: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <img 
                    src={require('../screens/images/add-to-cart.svg').default} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              </div>
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                rowGap: 5, 
                padding: '0 5px 5px 5px' 
              }}>
                <div style={{ fontSize: 14, fontWeight: 400 }}>{data.title}</div>
                <div style={{ fontSize: 14, fontWeight: 300, color: textSecondary }}>{data.price}</div>
              </div>
            </div>
          </div>
        );

      case "line":
        return (
          <div onClick={toggle}>
            <div 
              {...commonProps}
              style={{ 
                display: 'flex', 
                columnGap: 14, 
                alignItems: 'center', 
                position: 'relative' 
              }}
            >
              <div style={{ minHeight: 80 }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  flexShrink: 0, 
                  overflow: 'hidden', 
                  borderRadius: 9 
                }}>
                  <LazyLoadImage 
                    src={data.images[0]?.file} 
                    placeholderSrc={data.images[0]?.file_lazy} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', rowGap: 5 }}>
                <div style={{ fontSize: 14, fontWeight: 400 }}>{data.title}</div>
                <div style={{ fontSize: 14, fontWeight: 300, color: textSecondary }}>{data.price}</div>
              </div>
            </div>
          </div>
        );

      case "old-normal":
        return (
          <div 
            {...commonProps}
            style={{ 
              width: 'calc(50vw - 20px)', 
              height: '100%', 
              borderRadius: 9, 
              overflow: 'hidden' 
            }}
          >
            <div style={{ 
              position: 'relative', 
              background: theme === "Dark" ? "#1C1C1E" : "#F2F2F7", 
              display: 'flex', 
              flexDirection: 'column', 
              rowGap: 10, 
              height: '100%', 
              borderRadius: 9 
            }}>
              <div style={{ 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden', 
                borderRadius: 9, 
                height: 'calc(50vw - 20px)' 
              }}>
                <LazyLoadImage 
                  src={data.images[0]?.file} 
                  placeholderSrc={data.images[0]?.file_lazy} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ 
                width: 'calc(100% - 20px)', 
                display: 'flex', 
                flexDirection: 'column', 
                rowGap: 5, 
                padding: '60px 10px 10px 10px', 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                background: 'linear-gradient(to top, rgba(24, 24, 26, .9) 10%, rgba(24, 24, 26, 0) 100%)' 
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 400, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  color: '#fff' 
                }}>
                  {data.title}
                </div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 300, 
                  color: textSecondary, 
                  marginTop: 'auto' 
                }}>
                  {data.price}
                </div>
              </div>
            </div>
          </div>
        );

      case "old-big":
        return (
          <div 
            {...commonProps}
            style={{ 
              width: 'calc(100vw - 30px)', 
              height: 'calc(60vw - 30px)', 
              borderRadius: 9, 
              overflow: 'hidden' 
            }}
          >
            <div style={{ 
              position: 'relative', 
              background: theme === "Dark" ? "#1C1C1E" : "#F2F2F7", 
              display: 'flex', 
              flexDirection: 'column', 
              rowGap: 10, 
              height: '100%', 
              borderRadius: 9 
            }}>
              <div style={{ 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden', 
                borderRadius: 9 
              }}>
                <LazyLoadImage 
                  src={data.images[0]?.file} 
                  placeholderSrc={data.images[0]?.file_lazy} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ 
                width: 'calc(100% - 20px)', 
                display: 'flex', 
                flexDirection: 'column', 
                rowGap: 5, 
                padding: '60px 10px 10px 10px', 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                background: 'linear-gradient(to top, rgba(24, 24, 26, .9) 10%, rgba(24, 24, 26, 0) 100%)' 
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 400, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  color: '#fff' 
                }}>
                  {data.title}
                </div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 300, 
                  color: textSecondary, 
                  marginTop: 'auto' 
                }}>
                  {data.price}
                </div>
              </div>
            </div>
          </div>
        );

      case "old-small":
        return (
          <div 
            {...commonProps}
            style={{ 
              width: 'calc(33.3333vw - 17px)', 
              height: 'calc(33.3333vw - 15px)', 
              borderRadius: 9, 
              overflow: 'hidden' 
            }}
          >
            <div style={{ 
              position: 'relative', 
              background: theme === "Dark" ? "#1C1C1E" : "#F2F2F7", 
              display: 'flex', 
              flexDirection: 'column', 
              rowGap: 10, 
              height: '100%', 
              borderRadius: 9 
            }}>
              <div style={{ 
                flexShrink: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden', 
                borderRadius: 9 
              }}>
                <LazyLoadImage 
                  src={data.images[0]?.file} 
                  placeholderSrc={data.images[0]?.file_lazy} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ 
                width: 'calc(100% - 20px)', 
                display: 'flex', 
                flexDirection: 'column', 
                rowGap: 5, 
                padding: '60px 10px 10px 10px', 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                background: 'linear-gradient(to top, rgba(24, 24, 26, .9) 10%, rgba(24, 24, 26, 0) 100%)' 
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 400, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  color: '#fff' 
                }}>
                  {data.title}
                </div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 300, 
                  color: textSecondary, 
                  marginTop: 'auto' 
                }}>
                  {data.price}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderCard()}
      
      <BottomSheet
        isOpen={isOpenPost}
        onClose={handleClose}
        onOpen={handleOpen}
        theme={theme}
        maxHeight="90vh"
        lockScroll={true}
      >
        <ModalContent
          data={data}
          theme={theme}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          textTertiary={textTertiary}
          elementBg={elementBg}
          surface={surface}
          imagesDivRef={imagesDivRef}
          activeImage={activeImage}
          setActiveImage={setActiveImage}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedCount={selectedCount}
          setSelectedCount={setSelectedCount}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          selectedPackage={selectedPackage}
          setSelectedPackage={setSelectedPackage}
          colors={colors}
          counts={counts}
          sizes={sizes}
          packages={packages}
          newPrice={newPrice}
          isBusinessOwner={isBusinessOwner}
          businessId={businessId}
          navigate={navigate}
        />
        
        <CartPanel
          cartItems={cartItems}
          data={data}
          textPrimary={textPrimary}
          elementBg={elementBg}
          handleCart={handleCart}
          navigate={navigate}
          businessId={businessId}
          setIsOpenPost={setIsOpenPost}
        />
      </BottomSheet>
    </>
  );
}

export default Post;