import { useSpringRef, animated, useSpring } from '@react-spring/web';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Slider from './Slider';
import MiniSlider from './MiniSlider';
import Button from './Button';
import Hint from './Hint';
import Contact from './Contact';
import { useMainContext } from '../context';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

function Post({ postData, type, parent, basePathUrl, shouldOpenModal = false }) {
  const navigate = useNavigate();
  const [ data, setData ] = useState(postData);
  const { sendMessage, message, setMessage, cartItems, setCartItems, account, theme, businessId, isBusinessOwner } = useMainContext();
  const postDivRef = useRef();
  const [ isOpenPost, setIsOpenPost ] = useState(false);
  const api = useSpringRef();
  const modalApi = useSpringRef();
  const modalApiMain = useSpringRef();
  const modalMainRef = useRef();
  const modalApiCart = useSpringRef();
  const props = useSpring({
    ref: api,
    from: { transform: "scale(1)" },
  })
  const modalProps = useSpring({
    ref: modalApi,
    from: { backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)" },
  })
  const modalPropsMain = useSpring({
    ref: modalApiMain,
    from: { top: "100vh" },
  })
  const modalPropsCart = useSpring({
    ref: modalApiCart,
    from: { bottom: "-40vh" },
  })
  const scrollY = useRef();

  // Восстановление скроллинга при размонтировании компонента
  useEffect(() => {
    return () => {
      // Восстанавливаем скроллинг при размонтировании компонента
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
      // Автоматически открываем модальное окно без анимации клика
      setTimeout(() => {
        toggle(true);
      }, 100);
    }
  }, [shouldOpenModal]);
  const toggle = (skipAnimation = false) => {
    if (!skipAnimation) {
      api.start({ transform: "scale(1.05)", config: { duration: 200 } });
      setTimeout(() => {
        api.start({ transform: "scale(1)", config: { duration: 200 } });
      }, 200);
    }
    
    if (!isOpenPost) {
      // При открытии модального окна обновляем URL с параметром card_id
      if (!parent) {
        const newUrl = `/${businessId}${basePathUrl || ''}?card_id=${data._id}`;
        window.history.pushState({}, '', newUrl);
      }
      
      modalApi.start({ backdropFilter: "blur(0.5vh)", WebkitBackdropFilter: "blur(0.5vh)", background: "rgba(0, 0, 0, .4)", config: { duration: 300 } });
      setTimeout(() => {
        modalApiMain.start({ top: "0vh", config: { duration: 300 } });
      }, 100)
      setTimeout(() => {
        modalApiCart.start({ bottom: "0vh", config: { duration: 300 } });
        if (!parent) {
          scrollY.current = window.scrollY;
          document.querySelector("body").style.top = `-${scrollY.current}px`
          document.querySelector("html").style.overflow = "hidden";
          document.querySelector("body").style.overflow = "hidden";
          document.querySelector("body").style.position = "fixed";
        }
      }, 300)
    } else {
      // При закрытии модального окна восстанавливаем URL без параметра
      if (!parent) {
        const cleanUrl = `/${businessId}${basePathUrl || ''}`;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
    setIsOpenPost(!isOpenPost);
  }
  const imagesDivRef = useRef();
  const [ activeImage, setActiveImage ] = useState(null);
  const colors = data.colors || [];
  const [ selectedColor, setSelectedColor ] = useState(colors[0] || null);
  const counts = data.counts || [];
  const [ selectedCount, setSelectedCount ] = useState(counts[0] || null);
  const sizes = data.sizes || [];
  const [ selectedSize, setSelectedSize ] = useState(sizes[0] || null);
  const packages = data.packages || [];
  const [ selectedPackage, setSelectedPackage ] = useState(packages[0] || null);
  const [ posts, setPosts ] = useState([]);
  const [ touchStartY, setTouchStartY ] = useState(null);
  const closing = useRef(false);
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].screenY);
  }
    const handleTouchMove = (e) => {
    if (modalMainRef.current && !closing.current) {
      if (touchStartY < e.touches[0].screenY) {
        modalMainRef.current.style.top = `${e.touches[0].screenY - touchStartY}px`;
        if (modalMainRef.current?.getBoundingClientRect().top > window.innerHeight * .4) {
          // При закрытии модального окна восстанавливаем URL без параметра
          if (!parent) {
            const cleanUrl = `/${businessId}${basePathUrl || ''}`;
            window.history.replaceState({}, '', cleanUrl);
          }
          
          setPosts([]);
          closing.current = true;
          modalApiMain.set({ top: `${e.touches[0].screenY - touchStartY}px`})
          modalApi.start({ backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)", config: { duration: 300 } });
          setTimeout(() => {
            modalApiMain.start({ top: `${window.innerHeight}px`, config: { duration: 200 } });
            if (!parent) {
              document.querySelector("html").style.overflow = "auto";
              document.querySelector("body").style.overflow = "auto";
              document.querySelector("body").style.position = "relative";
              document.querySelector("body").style.top = "0px";
              window.scrollTo({ top: scrollY.current })
            }
          }, 100)
          setTimeout(() => {
            modalApiCart.start({ bottom: "-40vh", config: { duration: 100 } });
          }, 300)
          setTimeout(() => {
            closing.current = false;
            setIsOpenPost(false);
          }, 600)
        }
      }
    }
  }
  const handleTouchEnd = (e) => {
    if (modalMainRef.current?.getBoundingClientRect().top < window.innerHeight * .4 && !closing.current) {
      modalApiMain.set({ top: `${modalMainRef.current?.getBoundingClientRect().top - window.innerHeight / 10}px` })
      setTimeout(() => {
        modalApiMain.start({ top: `0px`, config: { duration: 200 } });
      }, 100)
    }
  }
  const [ newPrice, setNewPrice ] = useState(null);
  useEffect(() => {
    setData(prevState => ({...prevState, selectedColor: selectedColor, selectedCount: selectedCount, selectedPackage: selectedPackage, selectedSize: selectedSize }))
    for (let i = 0; i < data.prices?.length; i++) {
      const price = data.prices[i];
      let checked = [0, 0, 0, 0]
      if (price.colors.length > 0) {
        if (price.colors.includes(selectedColor)) {
          checked[0] = 1;
        }
      } else {
        checked[0] = 1;
      };
      if (price.counts.length > 0) {
        if (price.counts.includes(selectedCount)) {
          checked[1] = 1;
        }
      } else {
        checked[1] = 1;
      };
      if (price.packages.length > 0) {
        if (price.packages.includes(selectedPackage)) {
          checked[2] = 1;
        }
      } else {
        checked[2] = 1;
      };
      if (price.sizes.length > 0) {
        if (price.sizes.includes(selectedSize)) {
          checked[3] = 1;
        }
      } else {
        checked[3] = 1;
      };
      if (JSON.stringify(checked) === JSON.stringify([1, 1, 1, 1])) {
        setNewPrice(price);
        return
      }
    }
    setNewPrice(null)
  }, [selectedColor, selectedCount, selectedPackage, selectedSize]);
  useEffect(() => {
    if (message && window.location.pathname === '/card/' + data._id) {
      if (message[0] === 'cards') {
        if (message[1] === 'filter') {
          setPosts(prevState => [...prevState, ...message[2].filter(item => {
            const isInMessage = prevState.some(msgItem => msgItem._id === item._id);
            return !isInMessage;
          })]);
        }
      }
      setMessage(null);
    };
  }, [message]);
  const apiRemoveFromCart = useSpringRef();
  const propsRemoveFromCart = useSpring({
    ref: apiRemoveFromCart,
    from: { right: 0, left: 0 },
  })
  const apiAddFromCart = useSpringRef();
  const propsAddFromCart = useSpring({
    ref: apiAddFromCart,
    from: { right: 0, left: 0 },
  })
  const divCountItemsCartRef = useRef();
  const apiCountItemsCart = useSpringRef();
  const propsCountItemsCart = useSpring({
    ref: apiCountItemsCart,
    from: { opacity: 0 },
  })
  const handleCart = (e, type) => {
    e.stopPropagation();
    if (type === 1) {
      setCartItems(prevState => {
        // Ищем индекс элемента в массиве, который мы хотим обновить
        const index = prevState.findIndex(item => JSON.stringify(item.product) === JSON.stringify(data));
        // Если элемент найден, увеличиваем его count на 1
        if (index !== -1) {
          return prevState.map((item, i) => {
            if (i === index && item.count !== 100) {
              return { ...item, count: item.count + 1 };
            }
            return item;
          });
        }
        // Если элемент не найден, добавляем новый элемент в массив с count равным 1
        return [...prevState, { product: data, count: 1 }];
      });
      if (divCountItemsCartRef.current) {
        apiRemoveFromCart.start({right: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
        apiAddFromCart.start({left: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
        apiCountItemsCart.start({opacity: 1, config: {duration: 400}});
      }
    } else if (type === 0) {
      setCartItems(prevState => {
        // Ищем индекс элемента в массиве, который мы хотим обновить
        const index = prevState.findIndex(item => JSON.stringify(item.product) === JSON.stringify(data));
        // Если элемент найден, уменьшаем его count на 1
        if (index !== -1) {
          const updatedItem = { ...prevState[index], count: prevState[index].count - 1 };
          if (updatedItem.count === 0) {
            if (divCountItemsCartRef.current) {
              apiRemoveFromCart.start({right: 0, config: {duration: 200}});
              apiAddFromCart.start({left: 0, config: {duration: 200}});
              apiCountItemsCart.start({opacity: 0, config: {duration: 200}});
            }
            // Если количество стало равным 0, удаляем элемент из массива
            return prevState.filter((_, i) => i !== index);
          } else {
            if (divCountItemsCartRef.current) {
              apiRemoveFromCart.start({right: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
              apiAddFromCart.start({left: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
              apiCountItemsCart.start({opacity: 1, config: {duration: 400}});
            }
            // Иначе обновляем количество
            return prevState.map((item, i) => i === index ? updatedItem : item);
          }
        }
        if (divCountItemsCartRef.current) {
          apiRemoveFromCart.start({right: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
          apiAddFromCart.start({left: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
          apiCountItemsCart.start({opacity: 1, config: {duration: 400}});
        }
        // Если элемент не найден, возвращаем предыдущее состояние
        return prevState;
      });
    };
  }
  useEffect(() => {
    if (divCountItemsCartRef.current) {
      if (cartItems.filter((item) => JSON.stringify(item.product) === JSON.stringify(data)).length > 0) {
        apiRemoveFromCart.start({right: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
        apiAddFromCart.start({left: divCountItemsCartRef.current.clientWidth, config: {duration: 200}});
        apiCountItemsCart.start({opacity: 1, config: {duration: 400}});
      }
    };
    setData(prevState => ({...prevState, selectedColor: selectedColor, selectedCount: selectedCount, selectedPackage: selectedPackage, selectedSize: selectedSize }))
  }, [divCountItemsCartRef.current])




  return (
    <>
      {type === "block" &&
        <animated.div style={{width: "calc(50vw - 20px)", position: "relative", height: "100%", zIndex: 1, ...props}}>
          <div ref={postDivRef} onClick={toggle} style={{position: "relative", display: "flex", flexFlow: "column", rowGap: 10, height: "100%"}}>
            <div style={{flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 9, height: "calc(50vw - 20px)"}}>
              <LazyLoadImage src={data.images[0]?.file} placeholderSrc={data.images[0]?.file_lazy} style={{width: "100%", height: "100%", objectFit: "cover"}} />
            </div>
            {/* <div style={{display: "flex", justifyContent: "center", alignItems: "center", position: "absolute", top: "calc(50vw - 53px)", width: "calc(50vw - 20px)", height: 28}}>
              <animated.div onClick={(e) => handleCart(e, 0)} style={{width: 28, height: 28, zIndex: 1, position: "absolute", left: 0, right: 0, margin: "auto", display: "flex", alignItems: "center", justifyContent: "center", ...propsRemoveFromCart}}>
                <img src={require("../screens/images/remove-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
              </animated.div>
              <animated.div ref={divCountItemsCartRef} style={{borderRadius: 4, padding: "0 28px", height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#1C1C1E", zIndex: 0, ...propsCountItemsCart}}>
                <div style={{fontSize: 16, fontWeight: 300, lineHeight: 1}}>{cartItems.filter((item) => JSON.stringify(item.product) === JSON.stringify(data))[0]?.count}</div>
              </animated.div>
              <animated.div onClick={(e) => handleCart(e, 1)} style={{width: 28, height: 28, zIndex: 1, position: "absolute", left: 0, right: 0, margin: "auto", display: "flex", alignItems: "center", justifyContent: "center", ...propsAddFromCart}}>
                <img src={require("../screens/images/add-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
              </animated.div>
            </div> */}
            <div style={{height: "100%", display: "flex", flexFlow: "column", rowGap: 5, padding: "0 5px 5px 5px"}}>
              <div style={{fontSize: 14, fontWeight: 400}}>{data.title}</div>
              <div style={{fontSize: 14, fontWeight: 300, color: "#8F8E93"}}>{data.price}</div> 
              {/* <span style={{display: "inline-block", textDecoration: "line-through", transform: "scale(.8)"}}>{data.oldPrice}</span> */}
            </div>
          </div>
        </animated.div>}
      {type === "block-small" &&
        <animated.div style={{width: "calc(30vw - 20px)", position: "relative", height: "100%", zIndex: 1, ...props}}>
          <div ref={postDivRef} onClick={(e) => handleCart(e, 1)} style={{position: "relative", display: "flex", flexFlow: "column", rowGap: 10, height: "100%"}}>
            <div style={{flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 9, height: "calc(30vw - 20px)"}}>
              <LazyLoadImage visibleByDefault={true} src={data.images[0]?.file} placeholderSrc={data.images[0]?.file_lazy} style={{width: "100%", height: "100%", objectFit: "cover"}} />
            </div>
            <div style={{display: "flex", justifyContent: "flex-end", alignItems: "center", position: "absolute", top: "calc(30vw - 53px)", width: "calc(30vw - 30px)", height: 28, marginRight: 10}}>
              <animated.div onClick={(e) => handleCart(e, 0)} style={{width: 24, height: 24, zIndex: 1, position: "absolute", right: 0, marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", ...propsRemoveFromCart}}>
                <img src={require("../screens/images/remove-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
              </animated.div>
              <animated.div ref={divCountItemsCartRef} style={{borderRadius: 4, padding: "0 28px", height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#1C1C1E", marginRight: divCountItemsCartRef.current?.offsetWidth * 0.2 || 10, zIndex: 0, ...propsCountItemsCart}}>
                <div style={{fontSize: 16, fontWeight: 300, lineHeight: 1}}>{cartItems.filter((item) => JSON.stringify(item.product) === JSON.stringify(data))[0]?.count}</div>
              </animated.div>
              <animated.div onClick={(e) => handleCart(e, 1)} style={{width: 24, height: 24, zIndex: 1, position: "absolute", right: 0, marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", ...propsAddFromCart}}>
                <img src={require("../screens/images/add-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
              </animated.div>
            </div>
            <div style={{height: "100%", display: "flex", flexFlow: "column", rowGap: 5, padding: "0 5px 5px 5px"}}>
              <div style={{fontSize: 14, fontWeight: 400}}>{data.title}</div>
              <div style={{fontSize: 14, fontWeight: 300, color: "#8F8E93"}}>{data.price}</div>
            </div>
          </div>
        </animated.div>}
      {type === "line" &&
        <div onClick={toggle}>
          <animated.div ref={postDivRef} style={{display: "flex", columnGap: 14, alignItems: "center", position: "relative", ...props}}>
            <div style={{minHeight: 80}}>
              <div style={{width: 80, height: 80, flexShrink: 0, overflow: "hidden", borderRadius: 9}}>
                <LazyLoadImage src={data.images[0]?.file} placeholderSrc={data.images[0]?.file_lazy} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
              </div>
            </div>
            <div style={{display: "flex", flexFlow: "column", rowGap: 5}}>
              <div style={{fontSize: 14, fontWeight: 400}}>{data.title}</div>
              <div style={{fontSize: 14, fontWeight: 300, color: "#8F8E93"}}>{data.price}</div>
            </div>
            {/* <div style={{marginLeft: "auto", height: 28, width: 86, position: "relative", flexShrink: 0}}>
              <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: 28, flexShrink: 0, width: "100%"}}>
                <animated.div onClick={(e) => handleCart(e, 0)} style={{width: 28, height: 28, zIndex: 1, position: "absolute", left: 0, right: 0, marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", ...propsRemoveFromCart}}>
                  <img src={require("../screens/images/remove-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                </animated.div>
                <animated.div ref={divCountItemsCartRef} style={{width: "67.5%", height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#1C1C1E", zIndex: 0, ...propsCountItemsCart}}>
                  <div style={{fontSize: 16, fontWeight: 300, lineHeight: 1}}>{cartItems.filter((item) => JSON.stringify(item.product) === JSON.stringify(data))[0]?.count}</div>
                </animated.div>
                <animated.div onClick={(e) => handleCart(e, 1)} style={{width: 28, height: 28, zIndex: 1, position: "absolute", left: 0, right: 0, marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", ...propsAddFromCart}}>
                  <img src={require("../screens/images/add-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                </animated.div>
              </div>
            </div> */}
          </animated.div>
        </div>}
      {type === "old-normal" &&
        <animated.div onClick={toggle} ref={postDivRef} style={{width: "calc(50vw - 20px)", position: "relative", height: "100%", borderRadius: 9, overflow: "hidden", ...props}}>
          <div>
            <div style={{position: "relative", background: "#1C1C1E", display: "flex", flexFlow: "column", rowGap: 10, height: "100%", borderRadius: 9}}>
              <div style={{flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 9, height: "calc(50vw - 20px)"}}>
                <LazyLoadImage src={data.images[0]?.file} placeholderSrc={data.images[0]?.file_lazy} style={{width: "100%", height: "100%", objectFit: "cover"}} />
              </div>
              <div style={{width: "calc(100% - 20px)", display: "flex", flexFlow: "column", rowGap: 5, padding: "60px 10px 10px 10px", position: "absolute", bottom: 0, left: 0, background: "linear-gradient(to top, rgba(24, 24, 26, .9) 10%, rgba(24, 24, 26, 0) 100%)"}}>
                <div style={{fontSize: 14, fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: theme === "Dark" ? "#fff" : "#fff"}}>{data.title}</div>
                <div style={{fontSize: 14, fontWeight: 300, color: "#8F8E93", marginTop: "auto"}}>{data.price}</div>
              </div>
            </div>
          </div>
        </animated.div>}
      {type === "old-big" &&
        <animated.div onClick={toggle} ref={postDivRef} style={{width: "calc(100vw - 30px)", height: "calc(60vw - 30px)", position: "relative", borderRadius: 9, overflow: "hidden", ...props}}>
          <div style={{position: "relative", background: "#1C1C1E", display: "flex", flexFlow: "column", rowGap: 10, height: "100%", borderRadius: 9}}>
            <div style={{flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 9}}>
              <LazyLoadImage src={data.images[0]?.file} placeholderSrc={data.images[0]?.file_lazy} style={{width: "100%", height: "100%", objectFit: "cover"}} />
            </div>
            <div style={{width: "calc(100% - 20px)", display: "flex", flexFlow: "column", rowGap: 5, padding: "60px 10px 10px 10px", position: "absolute", bottom: 0, left: 0, background: "linear-gradient(to top, rgba(24, 24, 26, .9) 10%, rgba(24, 24, 26, 0) 100%)"}}>
                              <div style={{fontSize: 14, fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: theme === "Dark" ? "#fff" : "#fff"}}>{data.title}</div>
              <div style={{fontSize: 14, fontWeight: 300, color: "#8F8E93", marginTop: "auto"}}>{data.price}</div>
            </div>
          </div>
        </animated.div>}
      {type === "old-small" &&
        <animated.div onClick={toggle} ref={postDivRef} style={{width: "calc(33.3333vw - 17px)", height: "calc(33.3333vw - 15px)", position: "relative", borderRadius: 9, overflow: "hidden", ...props}}>
          <div style={{position: "relative", background: "#1C1C1E", display: "flex", flexFlow: "column", rowGap: 10, height: "100%", borderRadius: 9}}>
            <div style={{flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 9}}>
              <LazyLoadImage src={data.images[0]?.file} placeholderSrc={data.images[0]?.file_lazy} style={{width: "100%", height: "100%", objectFit: "cover"}} />
            </div>
            <div style={{width: "calc(100% - 20px)", display: "flex", flexFlow: "column", rowGap: 5, padding: "60px 10px 10px 10px", position: "absolute", bottom: 0, left: 0, background: "linear-gradient(to top, rgba(24, 24, 26, .9) 10%, rgba(24, 24, 26, 0) 100%)"}}>
                              <div style={{fontSize: 14, fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: theme === "Dark" ? "#fff" : "#fff"}}>{data.title}</div>
              <div style={{fontSize: 14, fontWeight: 300, color: "#8F8E93", marginTop: "auto"}}>{data.price}</div>
            </div>
          </div>
        </animated.div>}
      {isOpenPost &&
        <animated.div style={{
                        position: "fixed", 
                        left: 0, 
                        top: 0, 
                        width: "100vw", 
                        height: "100vh",
                        zIndex: 99999,
                        display: "flex",
                        ...modalProps
                      }}>
          <div style={{
            overflowY: "auto",
            overflowX: "hidden",
          }}>
            <animated.div style={{background: "linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(26, 24, 24, 1) 100%)", 
                                  width: "100vw",
                                  minHeight: "100vh",
                                  paddingBottom: 300,
                                  borderTopLeftRadius: 25, 
                                  borderTopRightRadius: 25, 
                                  position: "relative",
                                  marginTop: "15vh",
                                  ...modalPropsMain}}
                          ref={modalMainRef}>
              <div
                style={{position: "absolute", top: "-15vh", height: "25vh", width: "100vw", display: "flex", justifyContent: "center", zIndex: 1}}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div style={{marginTop: "auto", marginBottom: "calc(10vh + 20px)", width: "40vw", height: 4, borderRadius: 2, backgroundColor: "#bbb"}}></div>
              </div>
              <Slider images={data.images} imagesDivRef={imagesDivRef} setActiveImage={setActiveImage} image_color={data.image_color} setSelectedColor={setSelectedColor} setSelectedCount={setSelectedCount} />
              {data.images.length > 1 &&
                <div style={{marginTop: "-18vw", position: "relative", zIndex: 3}}>
                  <MiniSlider images={data.images} imagesDivRef={imagesDivRef} activeImage={activeImage} image_color={data.image_color} setSelectedColor={setSelectedColor} setSelectedCount={setSelectedCount} />
                </div>}
              <div className={styles.price} style={{padding: data.images.length > 1 ? "30px 15px 0px 15px" : "10px 15px 0px 15px", position: "relative"}}>
                <div className={styles.title} style={{fontWeight: 400, fontSize: 20, maxWidth: "85%"}}>{data.title}</div>
                <div className={styles.actions} style={{position: "absolute", right: 15, top: data.images.length > 1 ? 25 : 10}}>
                  {/* <div className={styles.action} style={{color: "#8F8E93"}}>
                    <img src={require("../screens/images/compare.svg").default} alt="" />
                    Сравнить
                  </div>
                  <div className={styles.action} style={{color: "#8F8E93"}}>
                    <img src={require("../components/images/like.svg").default} alt="" />
                    Избранное
                  </div> */}
                  <div className={styles.action} style={{color: "#FFFFFF", fontSize: 9, fontWeight: 100}} onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: data.title,
                        url: window.location.href
                      })
                        .then(() => console.log('Successful share'))
                        .catch((error) => console.log('Error sharing', error));
                    } else {
                      // Если Web Share API не поддерживается, вы можете предложить пользователю скопировать ссылку в буфер обмена или использовать другие методы общения.
                      console.log('Web Share API не поддерживается в вашем браузере');
                    }
                  }}>
                    <img src={require("../components/images/share-white.svg").default} alt="" style={{marginBottom: 0, height: 40}} />
                    Поделиться
                  </div>
                    {/* {(account.user?.username === "thecreatxr" || account.user?.username === "Mr_Romadanov") &&
  <div className={styles.action} style={{color: "#FFFFFF", fontSize: 9, fontWeight: 100}} onClick={() => {
    window.history.replaceState({}, '', `/${businessId}${basePathUrl}?card_id=${data._id}`);
    setPosts([]);
    document.querySelector("html").style.overflow = "auto";
                    document.querySelector("body").style.overflow = "auto";
                    document.querySelector("body").style.position = "relative";
                    document.querySelector("body").style.top = "0px";
                    setIsOpenPost(false);
                    navigate(`/${businessId}/edit` + data._id);
                  }}>
                    <img src={require("./images/settings.svg").default} alt="" style={{marginBottom: 0, height: 40}} />
                    Настройки
                  </div>} */}
                      {isBusinessOwner && (
                        <div className={styles.action} style={{color: "#FFFFFF", fontSize: 9, fontWeight: 100}} onClick={() => {
                          setIsOpenPost(false);
                          navigate(`/${businessId}/edit/` + data._id);
                        }}>
                          <img src={require("./images/settings.svg").default} alt="" style={{marginBottom: 0, height: 40}} />
                          Настройки
                        </div>
                      )}
                </div>
              </div>
              <div style={{fontSize: 18, fontWeight: 200, padding: "10px 15px 30px 15px"}}>{!newPrice ? data.price : newPrice.price}</div>
              <div style={{paddingBottom: [...colors, ...counts, ...sizes, ...packages].length > 0 ? 10 : 0}}>
                {colors.length > 0 &&
                <div style={{padding: "0px 15px 20px 15px"}}>
                  <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Цвет</div>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6
                  }}>
                    {colors.map((color, index) => (
                      <div key={"color" + index} 
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: selectedColor === color ? "#fff" : "rgb(24, 24, 26)",
                            fontSize: 13,
                            fontWeight: 300,
                            color: selectedColor === color ? "#000" : "#fff"
                          }}
                          onClick={() => {
                            if (selectedColor === color) {
                              // setSelectedColor(null);
                            } else {
                              setSelectedColor(color);
                              if (data.image_color) {
                                if (data.image_color.find((o, i) => o.color === color)) {
                                  setActiveImage(data.image_color.find((o, i) => o.color === color).index);
                                  imagesDivRef.current.scrollLeft = window.innerWidth * data.image_color.find((o, i) => o.color === color).index
                                }
                              }
                            }
                          }}
                      >
                        {color}
                      </div>
                    ))}
                  </div>
                </div>}
                {counts.length > 0 &&    
                <div style={{padding: "0 15px 20px 15px"}}>
                  <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Кол-во стеблей</div>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6
                  }}>
                    {counts.map((count, index) => (
                      <div key={"count" + index} 
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: selectedCount === count ? "#fff" : "var(--element-bg)",
                            fontSize: 13,
                            fontWeight: 300,
                            color: selectedCount === count ? "#000" : "#fff"
                          }}
                          onClick={() => {
                            if (selectedCount === count) {
                              // setSelectedCount(null)
                            } else {
                              setSelectedCount(count)
                              if (data.image_color) {
                                if (data.image_color.find((o, i) => o.count === count)) {
                                  setActiveImage(data.image_color.find((o, i) => o.count === count).index);
                                  imagesDivRef.current.scrollLeft = window.innerWidth * data.image_color.find((o, i) => o.count === count).index
                                }
                              }
                            }
                          }}
                      >
                        {count}
                      </div>
                    ))}
                  </div>
                </div>}
                {sizes.length > 0 &&
                <div style={{padding: "0 15px 20px 15px"}}>
                  <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Высота букета</div>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6
                  }}>
                    {sizes.map((size, index) => (
                      <div key={"size" + index} 
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: selectedSize === size ? "#fff" : "var(--element-bg)",
                            fontSize: 13,
                            fontWeight: 300,
                            color: selectedSize === size ? "#000" : "#fff"
                          }}
                          onClick={() => {
                            if (selectedSize === size) {
                              // setSelectedSize(null)
                            } else {
                              setSelectedSize(size)
                            }
                          }}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>}
                {packages.length > 0 &&
                <div style={{padding: "0 15px 20px 15px"}}>
                  <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Упаковка</div>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6
                  }}>
                    {packages.map((pckg, index) => (
                      <div key={"package" + index} 
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: selectedPackage === pckg ? "#fff" : "var(--element-bg)",
                            fontSize: 13,
                            fontWeight: 300,
                            color: selectedPackage === pckg ? "#000" : "#fff"
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
                </div>}
              </div>
              <Hint product={data} selectedColor={selectedColor} selectedCount={selectedCount} selectedPackage={selectedPackage} selectedSize={selectedSize}/>
              <Contact />
              {/* {posts.filter((post) => post.category === "Розы с любовью" && post._id !== data._id).length > 0 &&
              <>
                <div style={{padding: "30px 15px 15px 15px", fontSize: 16, fontWeight: 300}}>
                  Смотрите также
                </div>
                <div style={{overflowX: "auto", width: "100vw"}} className="no-scrollbar">
                  <div style={{padding: "0 15px", display: "flex", flexWrap: "nowrap", gap: 10}}>
                    {posts.filter((post) => post.category === "Розы с любовью" && post._id !== data._id).map((post, index) => (
                      <div key={post._id} style={{paddingRight: index === posts.length - 1 ? 15 : 0}}>
                        <Post postData={post} type="block-small" basePathUrl={basePathUrl} parent={
                          {
                            api,
                            modalApi,
                            modalApiMain,
                            modalApiCart,
                            setIsOpenPost,
                            _id: data._id
                          }
                        } />
                      </div>
                    ))}
                  </div>
                </div>
              </>} */}
              {/* {(posts.filter((post) => post.category === "Подарки" && post._id !== data._id).length > 0) &&
              <>
                <div style={{padding: "30px 15px 15px 15px", fontSize: 16, fontWeight: 300}}>
                  Рекомендуем дополнить букет
                </div>
                <div style={{overflowX: "auto", width: "100vw"}} className="no-scrollbar">
                  <div style={{padding: "0 15px", display: "flex", flexWrap: "nowrap", gap: 10}}>
                    {posts.filter((post) => post.category === "Подарки" && post._id !== data._id).map((post, index) => (
                      <div key={post._id} style={{paddingRight: index === posts.filter((post) => post.category === "Подарки" && post._id !== data._id).length - 1 ? 15 : 0}}>
                        <Post postData={post} type="block-small" basePathUrl={basePathUrl} parent={
                          {
                            api,
                            modalApi,
                            modalApiMain,
                            modalApiCart,
                            setIsOpenPost,
                            _id: data._id
                          }
                        } />
                      </div>
                    ))}
                  </div>
                </div>
              </>} */}
              <animated.div style={{width: "100%",
                                    boxSizing: "border-box",
                                    padding: "20px 20px 30px 20px",
                                    background: "linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(26, 24, 24, 1) 100%)", 
                                    position: "fixed",
                                    marginTop: 30, 
                                    zIndex: 10000,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    flexFlow: "column",
                                    ...modalPropsCart}}>
                {/* {cartItems.filter((item) => item.product.category === "Подарки").length > 0 &&
                <div style={{position: "relative", display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 20}}>
                  {cartItems.filter((item) => item.product.category === "Подарки").map((item, index) => (
                    <span key={index} style={{fontSize: 12, fontWeight: 300, padding: 3, background: "#2C2C2E", borderRadius: 4}}>
                      {item.product.title}, {item.count} шт {multiplyPrice(item.product.price, item.count)} ₽
                    </span>
                  ))}  
                </div>} */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%"
                }}>
                  {/* <div style={{display: "flex", flexFlow: "column"}}>
                    <div style={{fontSize: 14, fontWeight: 300, color: "#bbb", marginTop: "auto"}}>{!newPrice ? data.price : newPrice.price}</div>
                    <div style={{fontSize: 14, fontWeight: 300, marginTop: 5}}>{data.title}</div>
                    {data.category === "Розы с любовью" &&
                    <div style={{fontSize: 11, fontWeight: 300, marginTop: 2, color: "#8F8E93"}}>Открытка в подарок</div>}
                  </div> */}
                  <div style={{flexShrink: 0, marginTop: "auto", width: "100%"}}>
                    {cartItems.filter((item) => JSON.stringify(item.product) === JSON.stringify(data)).length > 0 ?
                    <div style={{display: "flex", alignItems: "center", gap: 25}}>
                      <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: 40, flexShrink: 0}}>
                        <div onClick={(e) => handleCart(e, 0)} style={{marginRight: -4, width: 40, height: 40, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center"}}>
                          <img src={require("../screens/images/remove-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                        </div>
                        <div style={{width: 44, height: 40, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0}}>
                          <div style={{fontSize: 16, fontWeight: 300, lineHeight: 1}}>{cartItems.filter((item) => JSON.stringify(item.product) === JSON.stringify(data))[0]?.count}</div>
                        </div>
                        <div onClick={(e) => handleCart(e, 1)} style={{marginLeft: -4, width: 40, height: 40, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center"}}>
                          <img src={require("../screens/images/add-to-cart.svg").default} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                        </div>
                      </div>
                                                <Button text={"Просмотреть корзину (" + cartItems.map(item => item.count).reduce((total, count) => total + count, 0) + ")"}  handleClick={(e) => {
                        setIsOpenPost(false);
                        navigate(`/${businessId}/cart`);
                      }} style={{
                        fontWeight: 500,
                        fontSize: 16,
                        borderRadius: 22,
                        height: 60,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(125deg, rgb(239 7 50) 0%, rgb(253 68 59) 100%)"
                      }} />
                    </div>
                    : <div style={{display: "flex", alignItems: "center", width: "100%"}}>
                        <Button text="Добавить в корзину" handleClick={(e) => handleCart(e, 1)} style={{
                          fontWeight: 500,
                          fontSize: 16,
                          borderRadius: 22,
                          height: 60,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(125deg, rgb(239 7 50) 0%, rgb(253 68 59) 100%)"
                        }} />
                      </div>}
                  </div>
                </div>
              </animated.div>
            </animated.div>
          </div>
        </animated.div>}
    </>
  )
}

export default Post;

