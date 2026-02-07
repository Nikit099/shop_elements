import styles from './styles/Main.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Title from '../components/Title';
import Filter from '../components/Filter';
import Post from '../components/Post';
import { useMainContext } from '../context';


function Search() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const cardId = params.get('card_id');
  const { sendMessage, message, setMessage, theme, setTheme, businessId } = useMainContext();
  const navigate = useNavigate();
  const [ view, setView ] = useState("grid");
  const [ sortBy, setSortBy ] = useState("Сначала популярные");
  const [ posts, setPosts ] = useState([]);
  
  // Загрузка настроек бизнеса
  const [businessSettings, setBusinessSettings] = useState(null);
  
  // Используем ref для отслеживания, был ли уже обработан card_id
  const hasProcessedCardIdRef = useRef(false);
  
  // Обработка параметра card_id из URL
  useEffect(() => {
    if (cardId && businessId && !hasProcessedCardIdRef.current) {
      hasProcessedCardIdRef.current = true;
      
      // Если есть card_id в URL, загружаем карточку
      sendMessage(JSON.stringify(["cards", "filter", {"_id": cardId}, 1]));
      
      // Очищаем URL от параметра card_id после короткой задержки
      const timer = setTimeout(() => {
        const cleanUrl = `/${businessId}/search`;
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
  
  useEffect(() => {
    window.scrollTo({top: 0, smooth: "behavior"});
  }, [])
  
  // Загрузка настроек бизнеса
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
  
  const [ isOpenFilter, setIsOpenFilter ] = useState(false);
  
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
        <div className={styles.header} style={{paddingBottom: 15, paddingTop: 15, borderBottom: theme === "Dark" ? "0.5px solid #ffffff5c" : "0.5px solid #18181a3e", marginLeft: -15, width: "100vw", marginBottom: 18}}>
          <div style={{display: "flex", alignItems: "center", gap: 15, paddingLeft: 15, paddingRight: 15, boxSizing: "border-box"}}>
            <div>
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
                }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <Title 
          text={'Товары'} 
          allowGrid={() => setView("grid")} 
          allowBlocks={() => setView("list")} 
          selected={view} 
          canChangeTitle={false} 
          choices={categories} 
          selectedChoice={selectedCategory} 
          setSelectedChoice={setSelectedCategory} 
        />
        
        {/* <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20}}>
          <div style={{display: "flex", alignItems: "center", columnGap: 8}} onClick={() => {
            document.getElementById(`sort`).focus();
            document.getElementById(`arrow`).style.transform = "rotate(270deg)";
          }}>
            <div style={{fontSize: 15, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>{sortBy}</div> 
            <img 
              id="arrow" 
              src={require("../components/images/arrow-right.svg").default} 
              alt="arrow right" 
              style={{transition: ".2s", filter: theme === "Dark" ? "brightness(1)" : "brightness(0.6)", transform: "rotate(90deg)"}}
            />
            <select 
              id="sort" 
              style={{opacity: 0, width: 0, height: 0, margin: 0, padding: 0}} 
              onChange={(e) => {
                document.getElementById(`arrow`).style.transform = "rotate(90deg)";
                setSortBy(e.target.value)
              }} 
              onBlur={() => {
                document.getElementById(`arrow`).style.transform = "rotate(90deg)"
              }}
            >
              <option value="Сначала недорогие" selected={sortBy === "Сначала недорогие"}>Сначала недорогие</option>
              <option value="Сначала дорогие" selected={sortBy === "Сначала дорогие"}>Сначала дорогие</option>
              <option value="Сначала популярные" selected={sortBy === "Сначала популярные"}>Сначала популярные</option>
            </select>
          </div>
          <div style={{display: "flex", alignItems: "center", columnGap: 8}} onClick={openFilter}>
            <img 
              src={require("../screens/images/compare.svg").default} 
              alt="" 
              style={theme === "Dark" ? {filter: "brightness(1)"} : {filter: "brightness(0.6)"}} 
            /> 
            <div style={{fontSize: 15, fontWeight: 300, color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"}}>Фильтры</div>
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
                   background: selectedCounts.includes(count) ? (theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff") : (theme === "Dark" ? "#2d2d2dff" : "#dfdfdfff"),
                   fontSize: 15,
                   fontWeight: 300,
                   color: selectedCounts.includes(count) ? (theme === "Dark" ? "#2d2d2dff" : "#dfdfdfff") : (theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff")
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
        <div style={{display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 20}}>
          {posts.filter((post) => post.category === selectedCategory && (!price[0] || post.price_number >= price[0]) && (!price[1] || post.price_number <= price[1])).sort((a, b) => {
            if (sortBy === "Сначала дорогие") {
              return b.price_number - a.price_number
            } else if (sortBy === "Сначала недорогие") {
              return a.price_number - b.price_number
            }
            return 0;
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
            return 0;
          }).map((post) => (
            <div key={post._id}>
              <Post postData={post} type="line" basePathUrl="/search" />
            </div>
          ))}
        </div>}
        
        {posts.filter((post) => post.category === selectedCategory && (!price[0] || post.price_number >= price[0]) && (!price[1] || post.price_number <= price[1])).length === 0 &&
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "50vw",
          fontSize: 16,
          fontWeight: 300,
          color: theme === "Dark" ? "#dfdfdfff" : "#2d2d2dff"
        }}>
          Товар отсутствует  
        </div>}
      </div>
      
      {isOpenFilter &&
        <Filter 
          setIsOpenFilter={setIsOpenFilter} 
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
          setDefaultPrice={setPrice} 
        />
      }
    </>
  );
}

export default Search;