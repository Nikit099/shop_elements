import styles from './styles/Main.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Post from '../components/Post';
import { useMainContext } from '../context';
import { useSpringRef, animated, useSpring } from '@react-spring/web';

function Main() {
  const { sendMessage, message, setMessage, theme, setTheme, businessId } = useMainContext();
  const wrapperApi = useSpringRef();
  const wrapperProps = useSpring({
    ref: wrapperApi,
    from: { background: theme === "Dark" ? "#000" : "#fff" },
  })
  const divApi = useSpringRef();
  const divProps = useSpring({
    ref: divApi,
    from: { transform: theme === "Dark" ? "translateX(20px)" : "translateX(0px)", background: theme === "Dark" ? "#fff" : "#000" },
  })
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const cardId = params.get('card_id');
  const navigate = useNavigate();
  const [ posts, setPosts ] = useState([]);
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
          if (cardId) {
            sendMessage(JSON.stringify(["cards", "filter", {"_id": cardId}, 1]))
          }
        }
      }
      setMessage(null);
    };
  }, [message]);
  return (
    <div className="view">
      <div className={styles.header} style={{paddingBottom: 15, paddingTop: 15, borderBottom: theme === "Dark" ? "0.5px solid #e1e1e1" : "0.5px solid #18181A", marginLeft: -15, width: "100vw", marginBottom: 18}}>
        <div style={{display: "flex", alignItems: "center", gap: 15, paddingLeft: 15, paddingRight: 15, boxSizing: "border-box"}}>
          <div>
            <img src={require("./images/splash.svg").default} alt="" style={{width: 40, filter: theme === "Dark" ? "brightness(0)" : "brightness(1)"}} />
          </div>
          <div style={{marginBottom: 4}}>
            <div style={{fontSize: 20, fontWeight: 300, color: theme === "Dark" ? "#000" : "#fff"}}>Студия <span>Роз</span></div>
            <div style={{fontSize: 11, fontWeight: 300, color: theme === "Dark" ? "#444" : "#999999"}}>Нежность в каждом лепестке</div>
          </div>
          <div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 8}}>
            <div style={{fontSize: 11, fontWeight: 300, color: theme === "Dark" ? "#000" : "#fff"}}>{theme}</div>
            <animated.div 
              style={{
                display: "flex",
                justifyContent: "flex-start",
                width: 46,
                height: 26,
                borderRadius: 26,
                background: theme === "Dark" ? "#000" : "#fff",
                ...wrapperProps
              }}
              onClick={() => {
                setTheme(prevState => {
                  if (prevState === "Light") {
                    return "Dark"
                  } else {
                    return "Light"
                  }
                })
                if (theme === "Light") {
                  wrapperApi.start({ background: "#000", config: { duration: 200 } });
                  wrapperApi.set({ background: "#000" });
                  divApi.start({ transform: "translateX(20px)", background: "#fff", config: { duration: 200 } });
                  divApi.set({ transform: "translateX(20px)", background: "#fff" });
                } else {
                  wrapperApi.start({ background: "#fff", config: { duration: 200 } });
                  wrapperApi.set({ background: "#fff" });
                  divApi.start({ transform: "translateX(0px)", background: "#000", config: { duration: 200 } });
                  divApi.set({ transform: "translateX(0px)", background: "#000" });
                }
              }}
            >
              <animated.div style={{
                backgroundColor: theme === "Dark" ? "#fff" : "#000",
                borderRadius: 26,
                height: 22,
                margin: 2,
                transition: ".2s",
                width: 22,
                ...divProps
              }}></animated.div>
            </animated.div>
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
      <div style={{fontSize: 14, fontWeight: 300, textAlign: "center", marginBottom: 13, color: theme === "Dark" ? "#000" : "#fff"}}>
        Cвежие цветы <span style={{margin: "0 2px"}}>•</span> Доставка <span style={{margin: "0 2px"}}>•</span> Гарантия <span style={{margin: "0 2px"}}>•</span> Круглосуточно
      </div>
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
      <div style={{display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 20, borderBottom: theme === "Dark" ? "0.5px solid #e1e1e1" : "0.5px solid rgb(24, 24, 26)", paddingBottom: 20}}>
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
            <div style={{fontSize: 16, fontWeight: 300, color: theme === "Dark" ? "#444" : "#bbb"}}>Букеты отсутствуют</div>
          </div>
        }
      </div>
      {posts.length > 0 &&
      <div style={{marginTop: 15, display: "flex", justifyContent: "center", color: theme === "Dark" ? "#666" : "#bbb", fontWeight: 300, fontSize: 15, alignItems: "center", gap: 8}} onClick={() => navigate(`/${businessId}/search`)}>
        Показать всё <img src={require("../components/images/arrow-right.svg").default} alt="" style={{display: "flex", marginTop: 1, filter: theme === "Dark" ? "brightness(0.5)" : "brightness(.6)"}} />
      </div>}
      <div className={styles.information}>
        <div className={styles.informationblocks}>
          <div className={styles.informationblock} style={theme === "Dark" ? {borderBottom: "0.5px solid #e1e1e1"} : null}>
            <div className={styles.informationtitle} onClick={handleClick}>
              <span style={{fontSize: 17}}>Почему мы?</span>  <img src={require("../components/images/arrow-right.svg").default} alt="arrow right" style={theme === "Dark" ? {filter: "brightness(0)"} : null}/>
            </div>
            <div className={styles.informationdescription}>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Быстрая доставка</span>
              <p>
                Время – это ценность. Готовые букеты доставляем в течение 60 минут, а индивидуальные авторские – в течение 2 часов с момента подтверждения заказа.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Свежие цветы</span>
              <p>
                Свежесть, которую можно почувствовать. Наши букеты комплектуются непосредственно перед доставкой, гарантируя свежесть каждого цветка.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Ищете что-то особенное?</span>
              <p>
                У нас есть широкий ассортимент сопутствующих товаров и открыток для идеального дополнения к вашему букету.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Сюрприз для получателя</span>
              <p>
                Подарите эмоции внезапности. Мы уточним время и адрес доставки у получателя, оставив в тайне детали сюрприза и ваше имя.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Фотография букета до отправки</span>
              <p>
                Ваша уверенность – наш приоритет. Вы получите фотографию букета до момента доставки, чтобы убедиться в его безупречном качестве.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Отчет о доставке</span>
              <p>
                Информирование без задержек. Мы мгновенно сообщим вам о доставке, чтобы вы были в курсе.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Фотография счастливого момента</span>
              <p>
                Радость, которой хочется поделиться. По вашему желанию мы пришлем фото момента вручения цветов, чтобы вы могли разделить этот волнующий момент с близкими.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Персонализированная открытка</span>
              <p>
                Ваши слова – наша забота. Каждый букет украсим открыткой с вашими пожеланиями, написанными от руки.
              </p>
            </div>
          </div>
          <div className={styles.informationblock} style={theme === "Dark" ? {borderBottom: "0.5px solid #e1e1e1"} : null}>
            <div className={styles.informationtitle} onClick={handleClick}>
              <span style={{fontSize: 17}}>Как заказать цветы?</span>  <img src={require("../components/images/arrow-right.svg").default} alt="arrow right" style={theme === "Dark" ? {filter: "brightness(0)"} : null}/>
            </div>
            <div className={styles.informationdescription}>
              <ul style={{paddingLeft: 20, listStyleType: 'decimal'}}>
                <li style={{paddingBottom: 10}}>Выбор букета:<br/>Найдите букет, который вам по душе.</li>
                <li style={{paddingBottom: 10}}>Заполнение формы заказа:<br/>Заполните форму заказа, указав все необходимые данные.</li>
                <li style={{paddingBottom: 10}}>Подтверждение заказа:<br/>После оформления заказа наш специалист свяжется с вами для уточнения деталей.</li>
                <li style={{paddingBottom: 10}}>Доставка:<br/>Как только букет будет готов, курьер доставит его указанному получателю.<br/>Вы получите фотоотчет о вручении и уведомление о доставке.</li>
              </ul>
              <p>
                Если у вас возникнут вопросы или потребуется помощь в процессе заказа, вы можете связаться с нами по телефону <a href="tel:+79933074710" style={{ textDecoration: 'none', color: '#0066CC' }}>+7 993 30 74 710</a> или написать в <a href="https://wa.me/79933074710" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0066CC' }}>WhatsApp</a> или <a href="https://t.me/LIGHTbusinessRose" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0066CC' }}>Telegram</a> для консультации и помощи в оформлении и оплате заказа.<br/><br/>
                Мы доступны круглосуточно и всегда рады помочь
              </p>
              {/* <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>В какое время работает ваш интернет-магазин?</span>
              <p>
                Наш интернет-магазин открыт для вас 24 часа в сутки, 7 дней в неделю, без перерывов и праздничных дней. Вы можете разместить заказ непосредственно на нашем сайте в любое время или позвонить по номеру <a href="tel:+79667757966" style={{ textDecoration: 'none', color: '#0066CC' }}>+7 966 77 57 966</a> для консультации и помощи в оформлении и оплате заказа.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Как быстро доставите заказ и можно ли заказать доставку на определенное время?</span>
              <p>
                Мы обеспечиваем доставку ваших заказов в течение 60 минут после их подтверждения. Вы можете указать предпочтительную дату и время доставки, и наш курьер свяжется с вами в назначенный день, чтобы доставить заказ точно в срок.
              </p>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 10, display: "block"}}>Если получатель отсутствует или отказывается от заказа:</span>
              <p>
                В случае, если получатель не будет на месте или откажется принять букет в момент доставки, мы предложим вам возможность повторной доставки по альтернативному адресу.
              </p>
              <div style={{paddingBottom: 10, paddingTop: 10}}>
                <Button text="Задать свой вопрос" />
              </div> */}
            </div>
          </div>
          <div className={styles.informationblock} style={theme === "Dark" ? {borderBottom: "0.5px solid #e1e1e1"} : null}>
            <div className={styles.informationtitle} onClick={handleClick}>
              <span style={{fontSize: 17}}>Доставка и оплата</span>  <img src={require("../components/images/arrow-right.svg").default} alt="arrow right" style={theme === "Dark" ? {filter: "brightness(0)"} : null}/>
            </div>
            <div className={styles.informationdescription}>
              <ul style={{paddingLeft: 20}}>
                <li style={{paddingBottom: 10}}>Стоимость доставки рассчитывается индивидуально, исходя из адреса получателя. Уточнить точную сумму можно при оформлении заказа.</li>
                <li>По вопросам стоимости доставки вы можете связаться с нами по телефону <a href="tel:+79933074710" style={{ textDecoration: 'none', color: '#0066CC' }}>+7 993 30 74 710</a> или написать в <a href="https://wa.me/79933074710" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0066CC' }}>WhatsApp</a> или <a href="https://t.me/nikitalsa" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0066CC' }}>Telegram</a></li>
              </ul>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 5, display: "block"}}>Самовывоз:</span>
              <ul style={{paddingLeft: 20}}>
                <li>Заказы доступны для самостоятельного получения в нашем салоне по адресу: г. Сочи, улица Горького, 89 Б.</li>
              </ul>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 5, display: "block"}}>Оплата:</span>
              <ul style={{paddingLeft: 20}}>
                <li style={{paddingBottom: 10}}>Оплатить заказ можно онлайн банковской картой или через безналичный перевод.</li>
                <li>При самовывозе доступна оплата банковской картой или наличными.</li>
              </ul>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 5, display: "block"}}>Изменение заказа:</span>
              <ul style={{paddingLeft: 20}}>
                <li style={{paddingBottom: 10}}>Мы не можем вносить изменения в уже собранные букеты или заказы, переданные курьеру.</li>
                <li style={{paddingBottom: 10}}>В случае ошибки в адресе доставки, мы готовы обсудить изменения. Это может повлечь за собой перерасчет стоимости доставки.</li>
                <li>В случае, если получатель не будет на месте или откажется принять букет в момент доставки, мы предложим вам возможность повторной доставки по альтернативному адресу.</li>
              </ul>
              <span className={styles.ptitle} style={{fontWeight: 300, paddingTop: 5, display: "block"}}>Отмена заказа:</span>
              <ul style={{paddingLeft: 20}}>
                <li>Отмена заказа возможна с полным возвратом средств, если вы уведомите нас заранее и заказ ещё не был принят в работу.</li>
              </ul>
            </div>
          </div>
          <div className={styles.informationblock}>
            <div className={styles.informationtitle}>
              <span>Отзывы наших клиентов<div style={{marginTop: 5, fontSize: 11, fontWeight: 300, color: "#8F8E93", lineHeight: "120%"}}>Нажми на рейтинг справа, для того<br/>чтобы перейти к отзывам</div></span>  <iframe src="https://yandex.ru/sprav/widget/rating-badge/101836494062?type=rating" width="150" height="50" frameBorder="0"></iframe>
            </div>
          </div>
        </div>
      </div>
      <footer className={styles.footer} style={theme === "Dark" ? {borderTop: ".5px solid #e1e1e1"} : null}>
        <div style={{display: "flex", flexFlow: "column", padding: "20px 0 10px 0"}}>
          <div style={{fontSize: 16, fontWeight: 300, color: theme === "Dark" ? "#000" : "#fff", paddingBottom: 5}}>Не нашли что искали?</div>
          <div style={{fontSize: 14, fontWeight: 300, color: theme === "Dark" ? "#444" : "#bbb"}}>
            Отправьте сообщение или позвоните
            подберем самый подходящий букет для
            вашего мероприятия
          </div>
        </div>
        <div className={styles.contacts}>
          <div className={styles.telephone} style={theme === "Dark" ? {color: "#000"} : null}><a href="tel:+79933074710" style={{ textDecoration: 'none', color: 'inherit' }} rel="noopener noreferrer">+7 993 307 47 10</a></div>
          <div className={styles.icons}>
            <a href="https://t.me/LIGHTbusinessRose" target="_blank" rel="noopener noreferrer">
              <img src={require("./images/telegram.svg").default} alt="telegram" />
            </a>
            <a href="https://wa.me/79933074710" target="_blank" rel="noopener noreferrer">
              <img src={require("./images/whatsapp.svg").default} alt="whatsapp" />
            </a>
          </div>
        </div>
        <div className={styles.map}>
          <div className={styles.mapaddress}>г.Сочи, ул. Горького, 89 Б.</div>
          <div className={styles.map_24124}>
            <iframe src="https://yandex.ru/map-widget/v1/?um=constructor%3Aaaf447bdbb779d61d8f9ff0bfe4c0678b2bc275dff9c32f8950c336ecc1ab18a&amp;source=constructor" width="100%" height="200"></iframe>
          </div>
        </div>
        <div className={styles.labelBy}>
          powered by <span>LIGHT Business</span> © 2024
        </div>
      </footer>
    </div>
  );
}

export default Main;
