import styles from './styles/Search.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FixedButton from '../components/FixedButton';
import SearchInput from '../components/SearchInput';
import Title from '../components/Title';
import BlocksV2 from '../components/BlocksV2';
import { useMainContext } from '../context';
import { LazyLoadImage } from 'react-lazy-load-image-component';

function Serv() {

  const navigate = useNavigate();
  const { id } = useParams();
  const { sendMessage, setMessage, message, businessId } = useMainContext();
  const [ view, setView ] = useState("grid");
  const [ items, setItems ] = useState([]);

  useEffect(() => {
    if (items.length === 0) {
      if (id === "4") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Деньги под залог ПТС"}]));
      } else if (id === "5") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Лизинг автомобилей"}]));
      } else if (id === "6") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Автоюрист бесплатная консультация"}]));
      } else if (id === "7") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Срочная продажа автомобиля"}]));
      } else if (id === "8") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Электронный полис е-ОСАГО"}]));
      } else if (id === "9") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Техническая гарантия на автомобили с пробегом"}]));
      } else if (id === "10") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Автокредит онлайн без первого взноса"}]));
      } else if (id === "11") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Автомобили в рассрочку"}]));
      } else if (id === "12") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Подбор автомобиля"}]));
      } else if (id === "12") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Обмен автомобиля"}]));
      } else if (id === "13") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Выкуп автомобиля"}]));
      } else if (id === "14") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Помощь на дороге"}]));
      } else if (id === "15") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Оформление переоборудования автомобилей"}]));
      } else if (id === "16") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Аукцион автомобилей с пробегом"}]));
      } else if (id === "17") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Диагностическая карта онлайн"}]));
      } else if (id === "18") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Автозапчасти"}]));
      } else if (id === "19") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Онлайн показ автомобиля"}]));
      } else if (id === "20") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Лизинг авто с пробегом"}]));
      } else if (id === "21") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Продажа с гарантией и обеспечительным платежём"}]));
      } else if (id === "22") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Онлайн комиссия"}]));
      } else if (id === "23") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "ДТП Онлайн"}]));
      } else if (id === "24") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Комиссионная продажа"}]));
      } else if (id === "25") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Снятие запретов и ограничений"}]));
      } else if (id === "26") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Помощь в покупке"}]));
      } else if (id === "27") {
        sendMessage(JSON.stringify(["posts", "filter", {status: 1, input1: "Восстановление КБМ"}]));
      }
    }
  }, [items])
  
  useEffect(() => {
    if (message) {
      if (message[0] === 'images') {
        if (message[1] === 'get') {
          setItems(prevState => {
            // Создаем копию массива постов
            const newPosts = [...prevState];

            // Находим пост по его _id
            const postIndex = newPosts.findIndex(post => post._id === message[3]);

            // Если пост найден, обновляем его изображения
            if (postIndex !== -1) {
              newPosts[postIndex].images = message[2];
            }

            // Обновляем состояние постов
            return newPosts;
          });
        }
      } else if (message[0] === 'posts') {
        if (message[1] === 'filter') {
          if (items.length === 0) {
            setItems(prevState => [...prevState, ...message[2]]);
            message[2].forEach(item => {
              sendMessage(JSON.stringify(["images", "get", item._id, "main"]));
            })
          }
        }
      }
      setMessage(null);
    };
  }, [message]);

  return (
    <div className={styles.view}>
      <SearchInput />
      <Title text="Деньги под залог ПТС" allowGrid={() => setView("grid")} allowBlocks={() => setView("list")} selected={view} />
      {view === "list" &&
        <BlocksV2 items={items} />}
      {view === "grid" &&
        <div className={styles.line}>
          {items.map((item, index) => (
          <div className={styles.cellMiddle} key={index} onClick={() => navigate(`/${businessId}/posts/`+ item._id)}>
            <div className={styles.image}>
              {item.images &&
                <LazyLoadImage
                  alt="item"
                  src={item.images[0].file}
                  placeholderSrc={item.images[0].file_lazy}/>}
            </div>
            <div className={styles.information}>
              <div className={styles.title}>{item.input2}</div>
              <div className={styles.price}>{item.input5}</div>
            </div>
          </div>))}
        </div>}
      <FixedButton />
    </div>
  );
}

export default Serv;
