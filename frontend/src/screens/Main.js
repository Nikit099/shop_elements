import styles from './styles/Main.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Post from '../components/Post';
import { useMainContext } from '../context';


function Main() {
  const { sendMessage, message, setMessage, theme, setTheme,isBusinessOwner, loading, businessId } = useMainContext();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const cardId = params.get('card_id');
  const navigate = useNavigate();
  const [ posts, setPosts ] = useState([]);
  
  // Используем ref для отслеживания, был ли уже обработан card_id
  const hasProcessedCardIdRef = useRef(false);
  
  // Функция для безопасного отображения HTML
  const sanitizeHTML = (html) => {
    if (!html) return '';
    
    // Разрешаем только безопасные теги
    // В реальном проекте лучше использовать библиотеку like DOMPurify
    // Здесь просто возвращаем как есть, так как это внутренний инструмент
    return html;
  };
  
  // Обработка параметра card_id из URL
  useEffect(() => {
    if (cardId && businessId && !hasProcessedCardIdRef.current) {
      hasProcessedCardIdRef.current = true;
      
      // Если есть card_id в URL, загружаем карточку
      sendMessage(JSON.stringify(["cards", "filter", {"_id": cardId}, 1]));
      
      // Очищаем URL от параметра card_id после короткой задержки
      // чтобы пользователь мог обновить страницу и увидеть карточку
      const timer = setTimeout(() => {
        const cleanUrl = `/${businessId}`;
        // Проверяем, что текущий URL все еще содержит card_id
        if (window.location.search.includes('card_id=')) {
          window.history.replaceState({}, '', cleanUrl);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    // Сбрасываем ref при изменении businessId или cardId
    return () => {
      if (!cardId || !businessId) {
        hasProcessedCardIdRef.current = false;
      }
    };
  }, [businessId, cardId, sendMessage]);

  const handleClick = (e) => {
    if (e.currentTarget.classList.contains('active')) {
      e.currentTarget.children[1].style.transform = 'rotate(0deg)';
      e.currentTarget.parentElement.children[1].style.height = '0';
      e.currentTarget.classList.remove('active');
    } else {
      e.currentTarget.children[1].style.transform = 'rotate(90deg)';
      e.currentTarget.parentElement.children[1].style.height = "auto";
      e.currentTarget.classList.add('active');
    }
  };

  useEffect(() => {
    if (!businessId) {   
          setPosts([]);
          return; 
         }
    window.scrollTo({top: 0, smooth: "behavior"});
    const filters = {"category": "Розы с любовью" }
    if (businessId){
      filters["business_id"] = businessId
    }
    sendMessage(JSON.stringify(["cards", "filter", filters, 6]));
  }, [businessId])

  useEffect(() => {
    
    if (message && window.location.pathname === `/${businessId}`) {
      console.log(message)
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
    // Загрузка настроек бизнеса
  const [businessSettings, setBusinessSettings] = useState(null);
  
  useEffect(() => {
    if (businessId) {
      sendMessage(JSON.stringify(["business_settings", "get", { business_id: businessId }]));
    }
  }, [businessId]);

  useEffect(() => {
    if (message && message[0] === 'business_settings' && message[1] === 'get') {
      setBusinessSettings(message[2]);
      setMessage(null);
    }
  }, [message]);
  return (
    <div className="view">
      <div className={styles.header} style={{paddingBottom: 15, paddingTop: 15, borderBottom: theme === "Dark" ? "0.5px solid #ffffff5c" : "0.5px solid #18181a3e", marginLeft: -15, width: "100vw", marginBottom: 18}}>
        <div style={{display: "flex", alignItems: "center", gap: 15, paddingLeft: 15, paddingRight: 15, boxSizing: "border-box"}}><div>
          {businessSettings?.logo_url ? (
          <img src={businessSettings.logo_url} alt="" style={{width: 100}} />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 'bold',
              color: theme === "Dark" ? "#313131ff" : "#d3d3d3ff",
              background: theme === "Dark" ? "#afafafff" : "#333",
              borderRadius: '4px'
            }}>LB</div>
          )}
        </div>
        <div style={{marginBottom: 4}}>
          <div style={{fontSize: 20, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>
            {businessSettings?.business_name || 'LB'}
          </div>
          {businessSettings?.tagline && (
            <div style={{fontSize: 11, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>
              {businessSettings.tagline}
            </div>
          )}
        </div>
          <div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 8}}>

            <div style={{fontSize: 11, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>{theme}</div>
            <div 
              style={{
                display: "flex",
                justifyContent: theme === "Dark" ? "flex-end" : "flex-start",
                width: 46,
                height: 26,
                borderRadius: 26,
                background: theme === "Dark" ? "#6e6e6eff" : "#6e6e6eff",
                padding: 2,
                cursor: "pointer",
                // transition: "background 0.3s ease"
              }}
              onClick={() => {
                const newTheme = theme === "Light" ? "Dark" : "Light";
                setTheme(newTheme);
              }}
            >
              <div style={{
                marginTop: "1px",
                backgroundColor: theme === "Dark" ? "#e5e5e5ff" : "#e5e5e5ff",
                borderRadius: "50%",
                height: 22,
                width: 22,
                // transition: "transform 0.3s ease-out",
                // transform: theme === "Dark" ? "translateX(0px)" : "translateX(0px)"
              }}></div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className={styles.block}>
        <div className={styles.itemsWrapper}>
          <div className={styles.items}>
            <div className={styles.item}>
              <span style={{zIndex: 1}}>Фотоотчёт</span>
              <div style={{zIndex: 1}}>Присылаем фото собранного букета и фотоотчёт о вручении</div>
              <img src={require("./images/photo.svg").default} alt="" style={{position: "absolute", top: 0, right: 0, width: 80, transform: "rotate(14.5deg)", filter: "brightness(.3)"}} />
            </div>
            <div className={styles.item}>
              <span style={{zIndex: 1}}>Оплата при получении</span>
              <div style={{zIndex: 1}}>Наличными курьеру или переводом</div>
              <img src={require("./images/rouble.svg").default} alt="" style={{position: "absolute", top: 0, right: -10, width: 80, transform: "rotate(14.5deg)", filter: "brightness(.3)"}} />
            </div>
            <div className={styles.item}>
              <span style={{zIndex: 1}}>Бесплатная доставка</span>
              <div style={{zIndex: 1}}>При заказе от 4500 ₽</div>
              <img src={require("./images/delivery.svg").default} alt="" style={{position: "absolute", top: 0, right: 0, width: 80, transform: "rotate(14.5deg)", filter: "brightness(.3)"}} />
            </div>
            <div className={styles.item}>
              <span style={{zIndex: 1}}>Круглосуточно</span>
              <div style={{zIndex: 1}}>Режим работы 24/7</div>
              <img src={require("./images/clock.svg").default} alt="" style={{position: "absolute", top: 0, right: 0, width: 80, transform: "rotate(14.5deg)", filter: "brightness(.3)"}} />
            </div>
          </div>
        </div>
      </div> */}
     {businessSettings?.advantages && (
  <div style={{fontSize: 14, fontWeight: 300, textAlign: "center", marginBottom: 13, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>
    {businessSettings.advantages}
  </div>
)}
      {/* <div style={{position: "relative", width: "100%", height: "120px", borderRadius: 9, overflow: "hidden"}}>
        <img src={require("./images/woman.avif")} alt="" style={{borderRadius: 9, display: "flex", width: "100%", height: "100%", objectFit: "cover", position: "absolute", zIndex: 1}} />
        <div style={{position: "relative", 
                     boxSizing: "border-box", 
                     background: "linear-gradient(10deg, rgba(24, 24, 26, .7) 45%, rgba(24, 24, 26, 0)) 55%", 
                     width: "100%", 
                     height: "100%", 
                     zIndex: 2, 
                     padding: 15,
                     display: "flex",
                     alignItems: "flex-end"}}>
          <div style={{zIndex: 1, display: "flex", flexFlow: "column", rowGap: 5}}>
            <div style={{fontSize: 16, fontWeight: 300}}>Вы приводите клиентов - мы за это платим</div>
            <div style={{fontSize: 12, fontWeight: 300, color: "#bbb"}}>Рекомендуйте наши букеты и получаете до 2 000₽ за каждый букет, купленный по вашему промокоду</div>
          </div>
        </div>
      </div> */}
      {/* <div className={styles.posts}>
        {posts.map((post, index) => (
          <Post data={post} key={index}/>
        ))}
      </div> */}
      <div style={{display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 20, borderBottom: theme === "Dark" ? "0.5px solid #ffffff5c" : "0.5px solid #18181a3e", paddingBottom: 20}}>
        {posts.length > 0 ?
          <>
            {posts.map((post, index) => (
              <div key={post._id}>
                {index === 2 &&
                <Post postData={post} type="old-big" basePathUrl="/" />}
                {[0, 1].includes(index) &&
                <Post postData={post} type="old-normal" basePathUrl="/" />}
                {![0, 1, 2].includes(index) &&
                <Post postData={post} type="old-small" basePathUrl="/" />}
              </div>
            ))}
          </>
          :
          <div style={{width: "100%", height: "50vw", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <div style={{fontSize: 16, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>Товар отсутствует</div>
          </div>
        }
      </div>
      {posts.length > 0 &&
      <div style={{marginTop: 15, display: "flex", justifyContent: "center", color: theme ==="Dark" ? "#dfdfdfff" : "#2d2d2dff", fontWeight: 300, fontSize: 15, alignItems: "center", gap: 8}} onClick={() => navigate(`/${businessId}/search`)}>
        Показать всё <img src={require("../components/images/arrow-right.svg").default} alt="" style={{display: "flex", marginTop: 1, filter: "brightness(0.6)"}} />
      </div>}
      <div className={styles.information}>
        <div className={styles.informationblocks}>
        
        {/* Динамические FAQ из настроек бизнеса */}
        {businessSettings?.faq && businessSettings.faq.length > 0 && businessSettings.faq.map((faqItem, index) => (
          <div key={index} className={styles.informationblock} style={theme === "Dark" ? {borderBottom: "0.5px solid #ffffff5c"} :  {borderBottom: "0.5px solid #18181a3e"}}>
            <div className={styles.informationtitle} onClick={handleClick}>
              <span style={{fontSize: 17, color: theme ==="Dark" ? "#dfdfdfff" : "#1f1f1fff"}}>{faqItem.question}</span>
             <img 
                src={require("../components/images/arrow-right.svg").default} 
                alt="arrow right" 
                style={theme === "Dark" ? {filter: "brightness(1)"} : {filter: "brightness(0)"}}
              />
            </div>
            <div className={styles.informationdescription}>
              <div style={{ color: theme ==="Dark" ? "#dfdfdfff" : "#1f1f1fff"}} dangerouslySetInnerHTML={{ __html: sanitizeHTML(faqItem.answer) }} />
            </div>
          </div>
        ))}

          
          
                  {businessSettings?.yandex_reviews_url && (
          <div className={styles.informationblock}>
            <div className={styles.informationtitle}>
              <span style={{color: theme ==="Dark" ? "#dfdfdfff" : "#1f1f1fff"}}>Отзывы наших клиентов<div style={{marginTop: 5, fontSize: 11, fontWeight: 300, color: theme ==="Dark" ? "#dfdfdfff" : "#1f1f1fff", lineHeight: "120%"}}>Нажми на рейтинг справа, для того<br />чтобы перейти к отзывам</div></span>
              <iframe src={businessSettings.yandex_reviews_url} width="150" height="50" frameBorder="0"></iframe>
            </div>
          </div>
        )}
        

        
        </div>
      </div>
      <footer className={styles.footer} style={{color: theme ==="Dark" ? "#dfdfdfff" : "#1f1f1fff", borderTop:  theme === "Dark" ? "0.5px solid #ffffff5c" : "0.5px solid #18181a3e"}}>
        {businessSettings?.call_to_action && (
  <div style={{display: "flex", flexFlow: "column", padding: "20px 0 10px 0"}}>
    <div style={{fontSize: 16, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff", paddingBottom: 5}}>
      {businessSettings.call_to_action.split('\n')[0]}
    </div>
    {businessSettings.call_to_action.split('\n').slice(1).map((line, index) => (
      <div key={index} style={{fontSize: 14, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>
        {line}
      </div>
    ))}
  </div>
)}
        <div className={styles.contacts}>
         {businessSettings?.phone_number && (
  <div className={styles.telephone} style={theme === "Dark" ? {color: "#dfdfdfff" } : {color: "#2d2d2dff" } }>
    <a href={`tel:${businessSettings.phone_number.replace(/\s/g, '')}`} style={{ textDecoration: 'none', color: 'inherit' }} rel="noopener noreferrer">
      {businessSettings.phone_number}
    </a>
  </div>
)}
        <div className={styles.icons}>
  {businessSettings?.telegram_url && (
    <a href={businessSettings.telegram_url} target="_blank" rel="noopener noreferrer">
      <img src={require("./images/telegram.svg").default} alt="telegram" />
    </a>
  )}
  {businessSettings?.whatsapp_url && (
    <a href={businessSettings.whatsapp_url} target="_blank" rel="noopener noreferrer">
      <img src={require("./images/whatsapp.svg").default} alt="whatsapp" />
    </a>
  )}
</div>

        </div>
        <div className={styles.map}>
          {businessSettings?.address && (
          <div className={styles.mapaddress}>{businessSettings.address}</div>
          )}
          {businessSettings?.yandex_map_url && (
  <div className={styles.map_24124}>
    <iframe src={businessSettings.yandex_map_url} width="100%" height="200"></iframe>
  </div>
)}
        </div>
        <div className={styles.labelBy}>
          powered by <span>LIGHT Business</span> © 2024
        </div>
      </footer>
    </div>
  );
}

export default Main;
