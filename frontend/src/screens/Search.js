import styles from './styles/Main.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Title from '../components/Title';
import Filter from '../components/Filter';
import Post from '../components/Post';
import { useMainContext } from '../context';
import { useSpringRef, animated, useSpring } from '@react-spring/web';

function Search() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const cardId = params.get('card_id');
  const { sendMessage, message, setMessage, theme, setTheme, businessId } = useMainContext();
  const navigate = useNavigate();
  const [ view, setView ] = useState("grid");
  const [ sortBy, setSortBy ] = useState("Сначала популярные");
  const [ posts, setPosts ] = useState([]);
  useEffect(() => {
    window.scrollTo({top: 0, smooth: "behavior"});
  }, [])
  const [ isOpenFilter, setIsOpenFilter ] = useState(false);
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
  const openFilter = () => {
    setIsOpenFilter(true);
  }
  useEffect(() => {
    if (isOpenFilter) {
      const scrollY = window.scrollY;
      document.querySelector("html").style.overflow = "hidden";
      document.querySelector("body").style.overflow = "hidden";
      document.querySelector("body").style.position = "fixed";
      document.querySelector("body").style.top = `-${scrollY}px`
    }
  }, [isOpenFilter])
  const counts = [
    "19 роз",
    "29 роз",
    "51 роза",
    "101 роза"
  ]
  const [ selectedCounts, setSelectedCounts ] = useState([]);
  const [ selectedColors, setSelectedColors ] = useState([]);
  const [ selectedSizes, setSelectedSizes ] = useState([]);
  const [ selectedPackages, setSelectedPackages ] = useState([]);
  const [ price, setPrice ] = useState([]);
  const categories = [
    "Розы с любовью",
    "Подарки"
  ]
  const [ selectedCategory, setSelectedCategory ] = useState("Розы с любовью");
  useEffect(() => {
    if (message && window.location.pathname === `/${businessId}/search`) {
      if (message[0] === 'cards') {
        if (message[1] === 'filter') {
          setPosts(prevState => [...prevState, ...message[2].filter(item => {
            const isInMessage = prevState.some(msgItem => msgItem._id === item._id);
            return !isInMessage;
          })]);
          if (cardId) {
            sendMessage(JSON.stringify(["cards", "filter", {"_id": cardId}, 1]));
          }
        }
      }
      setMessage(null);
    };
  }, [message]);
  useEffect(() => {
    let sort = 0;
    if (sortBy === "Сначала недорогие") {
      sort = 2
    } else if (sortBy === "Сначала дорогие") {
      sort = 1
    };
    if (selectedCounts.length > 0 || selectedColors.length > 0 || selectedSizes.length > 0 || selectedPackages.length > 0) {
      let filter_query = {}
      if (selectedCategory === "Розы с любовью") {
        if (selectedCounts.length > 0) {
          filter_query["counts"] = { $in: selectedCounts }
        }
        if (selectedColors.length > 0) {
          filter_query["colors"] = { $in: selectedColors }
        }
        if (selectedColors.length > 0) {
          filter_query["sizes"] = { $in: selectedSizes }
        }
        if (selectedColors.length > 0) {
          filter_query["packages"] = { $in: selectedPackages }
        }
      }
      setPosts(prevState => prevState.filter((item) => item.category !== selectedCategory))
      sendMessage(JSON.stringify(["cards", "filter", {"category": selectedCategory, ...filter_query}, 25, sort, price]));
    } else {
      sendMessage(JSON.stringify(["cards", "filter", {"category": selectedCategory}, 25, sort, price]));
    }
  }, [selectedCounts, selectedColors, selectedSizes, selectedPackages, selectedCategory, sortBy, price])
  return (
    <>
      <div className="view">
        <div className={styles.header} style={{paddingBottom: 15, paddingTop: 15, borderBottom: theme === "Dark" ? "0.5px solid #e1e1e1" : "0.5px solid #18181A", marginLeft: -15, width: "100vw"}}>
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
                  background: "#fff",
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
                  backgroundColor: "#000",
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
        <Title text={selectedCategory} allowGrid={() => setView("grid")} allowBlocks={() => setView("list")} selected={view} canChangeTitle={false} choices={categories} selectedChoice={selectedCategory} setSelectedChoice={setSelectedCategory} />
        {/* <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20}}>
          <div style={{display: "flex", alignItems: "center", columnGap: 8}} onClick={() => {
            document.getElementById(`sort`).focus();
            document.getElementById(`arrow`).style.transform = "rotate(270deg)";
          }}>
            <div style={{fontSize: 15, fontWeight: 300}}>{sortBy}</div> <img id="arrow" src={require("../components/images/arrow-right.svg").default} alt="arrow right" style={{transition: ".2s", filter: "brightness(.6)", transform: "rotate(90deg)"}}/>
            <select id="sort" style={{opacity: 0, width: 0, height: 0, margin: 0, padding: 0}} onChange={(e) => {document.getElementById(`arrow`).style.transform = "rotate(90deg)";setSortBy(e.target.value)}} onBlur={() => {document.getElementById(`arrow`).style.transform = "rotate(90deg)"}}>
              <option value="Сначала недорогие" selected={sortBy === "Сначала недорогие"}>Сначала недорогие</option>
              <option value="Сначала дорогие" selected={sortBy === "Сначала дорогие"}>Сначала дорогие</option>
              <option value="Сначала популярные" selected={sortBy === "Сначала популярные"}>Сначала популярные</option>
            </select>
          </div>
          <div style={{display: "flex", alignItems: "center", columnGap: 8}} onClick={openFilter}>
            <img src={require("../screens/images/compare.svg").default} alt="" style={{filter: "brightness(.6)"}} /> <div style={{fontSize: 15, fontWeight: 300}}>Фильтры</div>
          </div>
        </div> */}
        {/* {selectedCategory === "Розы с любовью" &&
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          paddingBottom: 20
        }}>
          {counts.map((count, index) => (
            <div key={"count" + index} 
                 style={{
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   padding: "4px 7px",
                   borderRadius: 4,
                   background: selectedCounts.includes(count) ? "#fff" : "rgb(24, 24, 26)",
                   fontSize: 15,
                   fontWeight: 300,
                   color: selectedCounts.includes(count) ? "#000" : "#fff"
                 }}
                 onClick={() => {
                  if (selectedCounts.includes(count)) {
                    setSelectedCounts(prevState => prevState.filter((selectedCount) => count !== selectedCount))
                  } else {
                    setSelectedCounts(prevState => [...prevState, count])
                  }
                 }}
            >
              {count}
            </div>
          ))}
        </div>} */}
        {view === "grid" &&
        <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
          {posts.filter((post) => post.category === selectedCategory && (!price[0] || post.price_number >= price[0]) && (!price[1] || post.price_number <= price[1])).sort((a, b) => {
            if (sortBy === "Сначала дорогие") {
              return b.price_number - a.price_number
            } else if (sortBy === "Сначала недорогие") {
              return a.price_number - b.price_number
            }
          }).map((post) => (
            <div key={post._id}>
              <Post postData={post} type="block" basePathUrl="/search" />
            </div>
          ))}
        </div>}
        {view === "list" && 
        <div style={{display: "flex", flexFlow: "column", rowGap: 20, marginTop: 5}}>
          {posts.filter((post) => post.category === selectedCategory && (!price[0] || post.price_number >= price[0]) && (!price[1] || post.price_number <= price[1])).sort((a, b) => {
            if (sortBy === "Сначала дорогие") {
              return b.price_number - a.price_number
            } else if (sortBy === "Сначала недорогие") {
              return a.price_number - b.price_number
            }
          }).map((post) => (
            <div key={post._id}>
              <Post postData={post} type="line" basePathUrl="/search" />
            </div>
          ))}
        </div>}
        {posts.filter((post) => post.category === selectedCategory && (!price[0] | post.price_number >= price[0]) && (!price[1] | post.price_number <= price[1])).length === 0 &&
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100vw",
          fontSize: 16,
          color: "#bbb",
          fontWeight: 300
        }}>
          Список товаров пуст  
        </div>}
      </div>
      {isOpenFilter &&
        <Filter setIsOpenFilter={setIsOpenFilter} 
                selectedColors={selectedColors} 
                setSelectedColors={setSelectedColors}
                selectedCounts={selectedCounts}
                setSelectedCounts={setSelectedCounts}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                selectedPackages={selectedPackages}
                setSelectedPackages={setSelectedPackages}
                selectedCategory={selectedCategory}
                defaultPrice={price}
                setDefaultPrice={setPrice} />}
    </>
  );
}

export default Search;
