import styles from './styles/User.module.css';
import styles2 from './styles/Search.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FixedButton from '../components/FixedButton';
import Button from '../components/Button';
import Title from '../components/Title';
import Grid from '../components/Grid';
import BlocksV2 from "../components/BlocksV2";
import Blocks from "../components/Blocks";
import FlexVariables from '../components/FlexVariables';
import { useMainContext } from '../context';

function User() {

  const navigate = useNavigate();
  const { id } = useParams();

  const { account, sendMessage, message, setMessage, businessId } = useMainContext();

  const [ variables, setVariables ] = useState([
    {
      value: "transport",
      label: "Автомобили"
    },
    {
      value: "services",
      label: "Услуги"
    }
  ])
  const [ select, setSelect ] = useState("transport");
  const [ user, setUser ] = useState(account?._id === id ? account : null);
  const [ posts, setPosts ] = useState([]);
  const [ services, setServices ] = useState([
    {
      image: require("./images/avatar.jpeg"),
      title: "Андрей",
      description: "Срочный выкуп автомобилей",
      price: "Цена договорная",
      name: "Александр"
    },
    {
      image: require("./images/avatar.jpeg"),
      title: "Выкуп авто в любом состоянии",
      description: "",
      price: "100 000 ₽",
      name: "Александр"
    }
  ]);
  const [ servicesView, setServicesView ] = useState("grid");
  const [ transportView, setTransportView ] = useState("grid");
  const [ loading, setLoading ] = useState(true);
  const [ subscribeState, setSubscribeState ] = useState(false);
  const [ stats, setStats ] = useState([0, 0, 0]);

  useEffect(() => {
    window.scrollTo({top: 0});
    sendMessage(JSON.stringify(["user", "get", {_id: id}]));
  }, [])

  useEffect(() => {
    if (user) {
      sendMessage(JSON.stringify(["posts", "filter", {user_id: user._id, status: 1}]));
      sendMessage(JSON.stringify(["stats", "get", {_id: id}]));
      sendMessage(JSON.stringify(["subscribe", "check", {_id: id}]));
    }
  }, [ user ])

  useEffect(() => {
    if (loading) {
      var l = 0;
      posts.forEach(post => {
        if (!post.images) {
          l += 1;
        }
      });
      if (l === posts.length) {
        setLoading(false);
      }
    }
  }, [posts, loading])

  useEffect(() => {
    if (message) {
      if (message[0] === 'user') {
        if (message[1] === 'get') {
          setUser(message[2]);
        }
      } else if (message[0] === 'posts') {
        if (message[1] === 'filter') {
          if (posts.length === 0) {
            setPosts(prevState => [...prevState, ...message[2]]);
            message[2].forEach(item => {
              sendMessage(JSON.stringify(["images", "get", item._id, "main"]));
            })
          }
        }
      } else if (message[0] === 'images') {
        if (message[1] === 'get') {
          setPosts(prevState => {
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
      } else if (message[0] === 'stats') {
        if (message[1] === 'get') {
          setStats(message[2])
        }
      } else if (message[0] === 'subscribe') {
        if (message[1] === 'check') {
          setSubscribeState(message[2]);
        }
      }
      setMessage(null);
    };
  }, [message]);

  const handleSubscribe = () => {
    sendMessage(JSON.stringify(["subscribe", "action", { _id: id }]));
    setStats(prevState => {
      const newState = [...prevState];
      newState[2] += subscribeState ? -1 : 1;
      return newState;
    })
    setSubscribeState(!subscribeState);
  }

  return (
    <div className="view">
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div>
            <span>{user?.username ? user?.username : user?._id}</span>
            {account?._id === user?._id && <img src={require("../components/images/arrow-right.svg").default} alt="arrow" />}
          </div>
          <div onClick={() => navigate(`/${businessId}/settings`)}>{account?._id === user?._id && "Править"}</div>
        </div>
        <div className={styles.main}>
          <div>
            {user?.avatar ?
              <img src={user.avatar} alt="avatar" />
            :
              <img src={require("../components/images/non-avatar.svg").default} alt="avatar" />}
          </div>
          <div>
            <div className={styles.inscription}>{user?.inscription}</div>
            <div className={styles.name}>{user?.name}</div>
            <div className={styles.city}>{user?.city}</div>
            <div className={styles.site}>{user?.site}</div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.value}>{stats[0]}</div>
                <div className={styles.label}>Публикации</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.value}>{stats[2]}</div>
                <div className={styles.label}>Подписчики</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.value}>{stats[1]}</div>
                <div className={styles.label}>Подписки</div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.pb20}>
          <div className={styles.bio}>{user?.bio}</div>
        </div>
        {(account?._id === user?._id && account) &&
          <div style={{marginTop: -15, marginBottom: 10, padding: "0 10px"}}>
            <Button text="Пароли" small={true} handleClick={() => navigate(`/${businessId}/passwords`)} />
          </div>
        }
        {(account?._id !== user?._id && account) &&
        <div className={styles.pb20}>
          <div className={styles.buttons}>
            <Button text={!subscribeState ? "Подписаться" : "Отписаться"} 
                    small={true} 
                    handleClick={handleSubscribe} 
                    style={subscribeState ? { background: "#111", color: "#555" } : null}
            />
            <Button text="Написать" small={true} />
            <Button text="Контакты" small={true} />
          </div>
        </div>}
      </div>
      <div className={styles.content}>
        <FlexVariables variables={variables} select={select} setSelect={setSelect} />
        {select === "transport" && !loading &&
          <>
            <Title text="Автомобили" allowGrid={() => setTransportView("grid")} allowBlocks={() => setTransportView("list")} selected={transportView}/>
            {transportView === "grid" &&
              <Grid items={posts} navigate={navigate} businessId={businessId} />}
            {transportView === "list" &&
              <Blocks items={posts} />}
          </>}
        {select === "services" && !loading &&
          <>
            <Title text="Автоуслуги" allowGrid={() => setServicesView("grid")} allowBlocks={() => setServicesView("list")} selected={servicesView}/>
            {servicesView === "list" &&
              <BlocksV2 items={services} />}
            {servicesView === "grid" &&
              <div className={styles2.line}>
                {services.map((item, index) => (
                <div className={styles2.cellMiddle} key={index}>
                  <div className={styles2.image}>
                    <img src={item.image} alt="" />
                  </div>
                  <div className={styles2.information}>
                    <div className={styles2.title}>{item.title}</div>
                    <div className={styles2.price}>{item.price}</div>
                  </div>
                </div>))}
              </div>}
          </>}
      </div>
      <FixedButton />
    </div>
  );
}

export default User;
