import styles from './styles/Post.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import FixedButton from '../components/FixedButton';
import Slider from '../components/Slider';
import MiniSlider from '../components/MiniSlider';
import UserList from '../components/UserList';
import Button from '../components/Button';
import Items from '../components/Items';
import Title from '../components/Title';
import Grid from '../components/Grid';
import Banner from '../components/Banner';
import { useMainContext } from '../context';

function Post() {

  const navigate = useNavigate();
  const { id } = useParams();
  const { message, setMessage, sendMessage, posts, businessId } = useMainContext();
  const imagesDivRef = useRef();
  const [ user, setUser ] = useState(posts.filter((post) => post._id === id)[0]?.user || null);
  const [ images, setImages ] = useState(posts.filter((post) => post._id === id)[0]?.images || []);
  const [ activeImage, setActiveImage ] = useState(null);
  const [ post, setPost ] = useState(posts.filter((post) => post._id === id)[0] || null);
  const [ posts_, setPosts_ ] = useState([]);
  const [ loading, setLoading ] = useState(true);
  const [ isFavorite, setIsFavorite ] = useState(false);

  const [ damages, setDamages ] = useState([
    {
      type: "Лобовое стекло ЛКП 280",
      input1: "Трещина",
      input3: "Замена",
      input4: "",
      input5: ""
    },
    {
      type: "Передняя левая фара ЛКП 180",
      input1: "Царапина",
      input3: "Полировка",
      input4: "",
      input5: ""
    }
  ]);

  const handleAction = (e) => {
    alert('123');
  }

  useEffect(() => {
    setUser(posts.filter((post) => post._id === id)[0]?.user || null);
    setImages(posts.filter((post) => post._id === id)[0]?.images || []);
    setActiveImage(null);
    setPost(posts.filter((post) => post._id === id)[0] || null);
    setPosts_([]);
    sendMessage(JSON.stringify(["posts", "get", id]));
    sendMessage(JSON.stringify(["favorite_posts", "check", id]));
    if (post?.input1 === "Автомобили") {
      sendMessage(JSON.stringify(["posts", "filter", {_id: {"$ne": id}, status: 1, input1: "Автомобили"}]));
    } else {
      sendMessage(JSON.stringify(["posts", "filter", {_id: {"$ne": id}, status: 1, input1: {"$ne": "Автомобили"}}]));
    }
    sendMessage(JSON.stringify(["comments", "last", {post_id: id}]));
    sendMessage(JSON.stringify(["comments", "count", {post_id: id}]));
    window.scrollTo({top: 0, smooth: "behavior"});
  }, [id])

  useEffect(() => {
    if (images.length === 0) {
      sendMessage(JSON.stringify(["images", "get", id, "main"]));
    }
  }, [images])

  useEffect(() => {
    if (!user && post) {
      sendMessage(JSON.stringify(["user", "get", {_id: post.user_id}]));
    }
  }, [user, post])

  useEffect(() => {
    if (loading) {
      var l = 0;
      posts_.forEach(post => {
        if (!post.images) {
          l += 1;
        }
      });
      if (l === posts_.length) {
        setLoading(false);
      }
    }
  }, [posts_, loading])

  useEffect(() => {
    if (message) {
      if (message[0] === 'images') {
        if (message[1] === 'get') {
          if (message[3] === id) {
            setImages([...message[2]]);
          } else {
            setPosts_(prevState => {
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
        }
      } else if (message[0] === 'user') {
        if (message[1] === 'get') {
          setUser(message[2]);
        }
      } else if (message[0] === 'posts') {
        if (message[1] === 'get') {
          setPost(message[2]);
        } else if (message[1] === 'filter') {
          setPosts_(message[2]);
          message[2].forEach(item => {
            sendMessage(JSON.stringify(["images", "get", item._id, "main"]));
          })
        }
      } else if (message[0] === 'comments') {
        if (message[1] === 'last') {
          setPost(prevState => {
            var newComments;
            if ('comments' in prevState) {
              newComments = [...prevState.comments, message[2]];
            } else {
              newComments = [message[2]];
            }
            const updatedPost = { ...prevState, comments: newComments };
            return updatedPost;
          });
        } else if (message[1] === 'count') {
          setPost(prevState => ({...prevState, comments_count: message[2]}));
        }
      } else if (message[0] === 'favorite_posts') {
        if (message[1] === 'check') {
          setIsFavorite(message[2]);
        }
      }
      setMessage(null);
    };
  }, [message]);

  const handleFavorite = () => {
    sendMessage(JSON.stringify(["favorite_posts", "action", id]));
    setIsFavorite(!isFavorite);
  }

  return (
    <div className="view">
      <div className={styles.wrapper}>
        <Slider images={images} imagesDivRef={imagesDivRef} setActiveImage={setActiveImage} category={post?.input1} />
        {images.length > 1 &&
          <MiniSlider images={images} imagesDivRef={imagesDivRef} activeImage={activeImage} />}
      </div>
      <div className={styles.price}>
        <div>{post?.input1 === "Автомобили" ? post?.input39 : post?.input5}</div>
        <div className={styles.actions}>
          {post?.input1 === "Автомобили" &&
          <div className={styles.action} onClick={handleAction}>
            <img src={require("./images/compare.svg").default} alt="" />
            Сравнить
          </div>}
          <div className={styles.action} onClick={handleFavorite}>
            <img src={isFavorite ? require("../components/images/like-active.svg").default : require("../components/images/like.svg").default} alt="" />
            Избранное
          </div>
          <div className={styles.action} onClick={handleAction}>
            <img src={require("./images/share.svg").default} alt="" />
            Поделиться
          </div>
        </div>
      </div>
      <div className={styles.title}>{post?.input1 === "Автомобили" ? `${post?.input5} ${post?.input6}, ${post?.input7}, ${post?.input17}` : post?.input2 }</div>
      <div className={styles.address}>{post?.input1 === "Автомобили" ? post?.address : post?.input4}</div>
      <div className={styles.flex}>
        <div className={styles.createdAt}>{post?.created_at}</div>
        <div className={styles.viewCount}>{post?.view_count || 0} просмотров</div>
      </div>
      <div className={styles.wrapper}>
        <div className={styles.user}>
          <UserList items={[
            {
              _id: user?._id,
              username: user?.username ? user.username : user._id,
              name: user?.name,
              avatar: user?.avatar || require("../components/images/non-avatar.svg").default
            }
          ]} navigate={navigate} businessId={businessId} />
          <div className={styles.buttons}>
            <Button text="Написать" small={true} />
            <Button text="Позвонить" small={true} />
          </div>
        </div>
      </div>
      {post?.input1 === "Автомобили" &&
      <div style={{marginTop: 20}}>
        <Items items={[
          {
            label: "Категория",
            value: post?.input1
          },
          {
            label: "Тип автомобиля",
            value: "С пробегом"
          }
        ]} />
      </div>}
      {post?.input1 !== "Автомобили" &&
      <div style={{marginTop: 20}}>
        <Items items={[
          {
            label: "Категория",
            value: post?.input1
          }
        ]} />
      </div>}
      {post?.input1 === "Автомобили" &&
      <div style={{marginTop: 10}}>
        <Items items={[
          {
            label: "Год выпуска",
            value: post?.input7
          },
          {
            label: "Поколение",
            value: post?.input8
          },
          {
            label: "Комплектация",
            value: post?.input14
          },
          {
            label: "Пробег, км",
            value: post?.input17
          },
          {
            label: "Модификация",
            value: post?.input13
          },
          {
            label: "Двигатель",
            value: post?.input10
          },
          {
            label: "Объём двигателя",
            value: post?.input11
          },
          {
            label: "Мощность",
            value: "250 л.с."
          },
          {
            label: "Налог",
            value: "3 570 ₽ в год"
          },
          {
            label: "Коробка передач",
            value: post?.input19
          },
          {
            label: "Привод",
            value: post?.input18
          },
          {
            label: "Кузов",
            value: post?.input9
          },
          {
            label: "Цвет",
            value: post?.input16
          },
          {
            label: "Руль",
            value: post?.input15
          },
          {
            label: "Состояние",
            value: "Не требует ремонта"
          },
          {
            label: "Все характеристики",
            value: <img src={require("../components/images/arrow-right.svg").default} alt="" />
          },
        ]} />
      </div>}
      {post?.input1 === "Автомобили" &&
      <div style={{marginTop: 10}}>
        <Items items={[
          {
            label: "Таможня",
            value: "Растоможен"
          },
          {
            label: "ПТС",
            value: "Оригинал"
          },
          {
            label: "Владельцев по ПТС",
            value: "1"
          },
          {
            label: "VIN / Номер кузова",
            value: "SADC*****************"
          },
          {
            label: "Госномер",
            value: "м555мм|95"
          }
        ]} />
      </div>}
      {(post?.input1 === "Автомобили" && damages.length > 0) &&
        <div>
          <div className={styles.title_}>Повреждения кузова</div>
          <div className={styles.texts_}>
            <div className={styles.label_}>
              <div>Название детали</div>
              <div>Повреждения</div>
              <div>Ремонт</div>
            </div>
            {damages.map((damage, index) => (
              <div className={styles.text_} key={index}>
                <div>{damage.type}</div>
                <div>{damage.input1}</div>
                <div>{damage.input3} {damage.input4} {damage.input5}</div>
              </div>
            ))}
          </div>
        </div>}
      {post?.input1 === "Автомобили" && 
      <Button text="Посмотреть на схеме" small={true} style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}} />}
      {post?.input1 === "Автомобили" && 
      <div style={{marginTop: 20}}>
        <Items items={[
          {
            label: "Дополнительные опции",
            value: <img src={require("../components/images/arrow-right.svg").default} alt="" />
          },
        ]} />
      </div>}
      {post?.input1 === "Автомобили" && 
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8}}>
        Этот автомобиль возможно приобрести в Кредит<br/>
        или в Рассрочку на выгодных для вас условиях!
      </div>}
      {post?.input1 === "Автомобили" && 
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8}}>
        <div style={{padding: "10px 20px", textAlign: "center", background: "rgba(74,232,18,.2)", borderRadius: 4}}>
          Оценка автомобиля: 450 000 - 520 000 ₽
        </div>
        <div style={{padding: "20px 20px 0 20px", textAlign: "center", borderRadius: 4}}>
          Средняя стоимость: 499 000 ₽
        </div>
      </div>}
      {post?.input1 === "Автомобили" && 
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8}}>
        <div style={{fontSize: 16}}>
          Проверка истории автомобиля
        </div>
        <div style={{marginTop: 10}}>
          VIN или номер кузова: SADC*************
        </div>
        <div style={{marginTop: 20, display: "flex", alignItems: "center", gap: 10}}>
          <div style={{width: 20, height: 20, border: "1px solid #42CC16", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("../components/images/active.svg").default} alt="" style={{width: "100%"}} />
          </div>
          <div>Характеристики совпадают с ПТС</div>
        </div>
        <div style={{marginTop: 10, display: "flex", alignItems: "center", gap: 10}}>
          <div style={{width: 20, height: 20, border: "1px solid #42CC16", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("../components/images/active.svg").default} alt="" style={{width: "100%"}} />
          </div>
          <div>2 владельца по ПТС</div>
        </div>
        <div style={{marginTop: 10, display: "flex", alignItems: "center", gap: 10}}>
          <div style={{width: 20, height: 20, border: "1px solid #42CC16", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("../components/images/active.svg").default} alt="" style={{width: "100%"}} />
          </div>
          <div>Ограничений не обнаружено</div>
        </div>
        <div style={{marginTop: 10, display: "flex", alignItems: "center", gap: 10}}>
          <div style={{width: 20, height: 20, border: "1px solid #42CC16", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("../components/images/active.svg").default} alt="" style={{width: "100%"}} />
          </div>
          <div>Не числиться в розыске</div>
        </div>
        <div style={{marginTop: 10, display: "flex", alignItems: "center", gap: 10}}>
          <div style={{width: 20, height: 20, border: "1px solid #42CC16", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("../components/images/active.svg").default} alt="" style={{width: "100%"}} />
          </div>
          <div>Стоит на учете в ГИБДД</div>
        </div>
        <Button text="Получить полный отчёт" small={true} style={{marginTop: 20}} />
      </div>}
      {post?.input1 === "Автомобили" && 
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8}}>
        <div style={{fontSize: 16}}>
          Автокредит от 4.9%  
        </div>
        <div style={{marginTop: 20, display: "flex", alignItems: "center", gap: 60}}>
          <div>
            <div style={{fontSize: 12, marginBottom: 2.5}}>Первый взнос</div>
            <div style={{fontSize: 16}}>Не требуется</div>
          </div>
          <div>
            <div style={{fontSize: 12, marginBottom: 2.5}}>Платёж</div>
            <div style={{fontSize: 16}}>от 7 950 ₽/мес</div>
          </div>
        </div>
        <div style={{marginTop: 20, display: "flex", alignItems: "center", gap: 60}}>
          <div>
            <div style={{fontSize: 12, marginBottom: 2.5}}>Сумма кредита</div>
            <div style={{fontSize: 16}}>610 000 ₽</div>
            <input type="range" style={{
              marginTop: 10,
              width: "calc(100vw - 60px)"
            }} />
          </div>
        </div>
        <div style={{marginTop: 20, display: "flex", alignItems: "center", gap: 60}}>
          <div>
            <div style={{fontSize: 12, marginBottom: 2.5}}>Срок кредита</div>
            <div style={{fontSize: 16}}>7 лет</div>
            <input type="range" style={{
              marginTop: 10,
              width: "calc(100vw - 60px)"
            }} />
          </div>
        </div>
        <div style={{marginTop: 20}}>
          Одна заявка в несколько банков
        </div>
        <div style={{marginTop: 10, display: "flex", alignItems: "center", gap: 10}}>
          <div style={{padding: 10, background: "#28282A", borderRadius: 8, width: "100%", height: 30, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("./images/alfa.svg").default} alt="" style={{width: "100%"}} />
          </div>
          <div style={{padding: 10, background: "#28282A", borderRadius: 8, width: "100%", height: 30, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("./images/sberbank.svg").default} alt="" style={{width: "100%"}} />
          </div>
          <div style={{padding: 10, background: "#28282A", borderRadius: 8, width: "100%", height: 30, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={require("./images/tinkoff.svg").default} alt="" style={{width: "100%"}} />
          </div>
        </div>
        <Button text="Перейти к анкете" small={true} style={{marginTop: 20}} />
      </div>}
      {post?.input1 !== "Автомобили" &&
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8}}>
        <div>
          {post?.input3}
        </div>
      </div>}
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8}}>
        <div>
          Краснодар, Краснодарский край
        </div>
        <div style={{marginTop: 10}}>
          Размещено 07.12.2023, 16:23
        </div>
        <div style={{marginTop: 10}}>
          Объявление: № 00772665353
        </div>
        <div style={{marginTop: 10}}>
          Просмотров 699 (0 сегодня)
        </div>
        <div style={{marginTop: 10}}>
          В избраном: 29
        </div>
      </div>
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <div style={{display: "flex", flexFlow: "column"}}>
          <div style={{fontSize: 16}}>
            Владислав Ромаданов
          </div>
          <div style={{fontSize: 12, marginTop: 5}}>
            Частное лицо
          </div>
          <div style={{fontSize: 16, marginTop: 10}}>
            +7 966 77 57 966
          </div>
        </div>
        <div>
          <img src={user?.avatar || require("../components/images/non-avatar.svg").default} alt="" style={{display: "block", borderRadius: 8, width: "10vw", height: "17.5vw", objectFit: "cover"}} />
        </div>
      </div>
      <div style={{marginTop: 20, padding: 20, fontWeight: 300, fontSize: 14, background: "#18181A", borderRadius: 8, display: "flex", justifyContent: "space-between"}}>
        <div style={{display: "flex", flexFlow: "column"}}>
          <div style={{fontSize: 16}}>
            AutoLIGHT | MOTOR COMPANY
          </div>
          <div style={{display: "flex", gap: 10, marginTop: 5}}>
            <div style={{fontSize: 12}}>Комания</div>
            <div style={{fontSize: 12}}>2 отзыва</div>
          </div>
          <div style={{display: "flex", gap: 10, marginTop: 10}}>
            <div style={{fontSize: 12}}>25 объявлений</div>
          </div>
          <div style={{fontSize: 12, marginTop: 5}}>
            Частное лицо
          </div>
          <div style={{fontSize: 16, marginTop: 10}}>
            Ромаданов Владислав Константинович
          </div>
          <div style={{display: "flex", gap: 10, marginTop: 10}}>
            <div style={{fontSize: 12}}>Контактное лицо</div>
          </div>
          <div style={{fontSize: 16, marginTop: 10}}>
            +7 966 77 57 966
          </div>
        </div>
        <div>
          <img src={user?.avatar || require("../components/images/non-avatar.svg").default} alt="" style={{display: "block", borderRadius: 8, width: "10vw", height: "17.5vw", objectFit: "cover"}} />
        </div>
      </div>
      <div className={styles.wrapper}>
        {post?.description &&
        <div className={styles.descriptionBlock}>
          <Title text="Описание" />
          <div className={styles.description}>{post?.description}</div>
        </div>}
        <div className={styles.lastComment} onClick={() => navigate( `/${businessId}/posts/${post._id}/comments`)}>
          <div>Комментарии <span>{post?.comments_count || 0}</span></div>
          {post && post.comments &&
            <div className={styles.comment}>
              <img src={post?.comments[0].avatar || require("../components/images/non-avatar.svg").default} alt="" /> <span>{post?.comments[0].text}</span>
            </div>}
          <div className={styles.arrow}>
            <img src={require("../components/images/arrow-top-down.svg").default} alt="" />
          </div>
        </div>
      </div>
      {posts_.length > 0 && !loading &&
        <>
          <div className={styles.anotherTitle}>
            {post?.input1 === "Автомобили" &&
            <div>Другие автомобили компании</div>}
            {post?.input1 !== "Автомобили" &&
            <div>Другие услуги компании</div>}
            <div>
              <span>Показать все</span>
              <img src={require("../components/images/arrow-right.svg").default} alt="" />
            </div>
          </div>
          <Grid items={posts_.slice(0,3)} navigate={navigate} businessId={businessId} />
        </>}
      {post?.input1 === "Автомобили" &&
      <div style={{marginTop: 20, display: "flex", alignItems: "center", gap: 10}}>
        <div style={{borderRadius: "50%", background: "#18181A", width: 40, height: 40, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 0 10px red"}}>
          4.7
        </div>
        <div style={{fontSize: 16}}>
          Общий рейтинг модели<br/>
          AutoLIGHT
        </div>
      </div>}
      {post?.input1 === "Автомобили" &&
      <div style={{display: "flex", gap: 10, marginTop: 20}}>
        <div>
          <div style={{position: "relative"}}>
            <img src={require("./images/car.jpg")} alt="" style={{borderRadius: 8, width: "100%"}} />
            <div style={{fontSize: 14, position: "absolute", bottom: 10, left: 10, borderRadius: "50%", background: "#18181A", width: 35, height: 35, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 0 10px red"}}>
              4.9
            </div>
          </div>
          <div style={{fontSize: 14, fontWeight: 300, marginTop: 5}}>Комментарии 33</div>
        </div>
        <div>
          <div style={{position: "relative"}}>
            <img src={require("./images/car.jpg")} alt="" style={{borderRadius: 8, width: "100%"}} />
            <div style={{fontSize: 14, position: "absolute", bottom: 10, left: 10, borderRadius: "50%", background: "#18181A", width: 35, height: 35, display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 0 10px red"}}>
              3.5
            </div>
          </div>
          <div style={{fontSize: 14, fontWeight: 300, marginTop: 5}}>Комментарии 33</div>
        </div>
      </div>}
      {post?.input1 === "Автомобили" &&
      <div style={{marginTop: 10, fontWeight: 300, fontSize: 14}}>Все отзывы</div>}
      {post?.input1 === "Автомобили" &&
      <div style={{marginTop: 20, background: "#18181A", borderRadius: 8}}>
        <div style={{fontSize: 16, padding: "10px", fontWeight: 300, fontSize: 16}}>
          Оценка модели
        </div>
        <Items items={[
          {
            label: "Внешний вид",
            value: "4.8"
          },
          {
            label: "Салон",
            value: "3.6"
          },
          {
            label: "Двигатель",
            value: "3.2"
          },
          {
            label: "Ходовая часть",
            value: "4.3"
          }
        ]} />
      </div>}
      {posts_.length > 5 && !loading && post?.input1 === "Автомобили" &&
        <>
          <div className={styles.anotherTitle}>
            <div>Рекомендуем</div>
            <div>
              <span>Показать все</span>
              <img src={require("../components/images/arrow-right.svg").default} alt="" />
            </div>
          </div>
          <Grid items={posts_.slice(3,6)} navigate={navigate} businessId={businessId} />
        </>}
      <div className={styles.wrapper}>
        <Banner navigate={navigate} />
      </div>
      <FixedButton />
    </div>
  );
}

export default Post;
