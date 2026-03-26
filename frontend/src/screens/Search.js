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
  const { 
    sendMessage, 
    message, 
    setMessage, 
    theme, 
    setTheme, 
    businessId,
    businessSettings,
    businessCards,
    loadBusinessSettings,
    loadBusinessCards
  } = useMainContext();
  const navigate = useNavigate();
  const [ view, setView ] = useState("grid");
  const [ sortBy, setSortBy ] = useState("Сначала популярные");
  const [ filteredPosts, setFilteredPosts ] = useState([]);
  const [ isOpenFilter, setIsOpenFilter ] = useState(false);
  
  const counts = [
    "19 роз",
    "29 роз",
    "51 роза",
    "101 роза"
  ];
  const [ selectedCounts, setSelectedCounts ] = useState([]);
  const [ selectedColors, setSelectedColors ] = useState([]);
  const [ selectedSizes, setSelectedSizes ] = useState([]);
  const [ selectedPackages, setSelectedPackages ] = useState([]);
  const [ price, setPrice ] = useState([]);
  
  // Используем ref для отслеживания, был ли уже обработан card_id
  const hasProcessedCardIdRef = useRef(false);
  
  // Обработка параметра card_id из URL
  useEffect(() => {
    if (cardId && businessId && !hasProcessedCardIdRef.current) {
      hasProcessedCardIdRef.current = true;
      
      // Если есть card_id в URL, загружаем карточку с фильтрацией по business_id
      sendMessage(JSON.stringify(["cards", "filter", {"_id": cardId, "business_id": businessId}, 1]));
      
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
  
  // При изменении businessId загружаем данные через контекст
  useEffect(() => {
    if (businessId) {
      console.log("Search: Загружаем данные для businessId:", businessId);
      loadBusinessSettings(businessId);
      loadBusinessCards(businessId, 100); // Загружаем больше карточек для поиска
    }
  }, [businessId]);

  // Для загрузки конкретной карточки по card_id в URL
  useEffect(() => {
    if (message && window.location.pathname === `/${businessId}/search`) {
      console.log("Search: Получено сообщение для загрузки карточки:", message);
      setMessage(null);
    }
  }, [message]);
  
  // Фильтрация карточек на основе выбранных фильтров
  useEffect(() => {
    if (!businessId || businessCards.length === 0) return;
    
    console.log("Search: Фильтрация карточек с применением фильтров");
    
    let filtered = businessCards.filter(card => 
      card.business_id === businessId &&
      (!price[0] || card.price_number >= price[0]) &&
      (!price[1] || card.price_number <= price[1]) &&
      (selectedCounts.length === 0 || selectedCounts.some(count => card.counts?.includes?.(count))) &&
      (selectedColors.length === 0 || selectedColors.some(color => card.colors?.includes?.(color))) &&
      (selectedSizes.length === 0 || selectedSizes.some(size => card.sizes?.includes?.(size))) &&
      (selectedPackages.length === 0 || selectedPackages.some(pkg => card.packages?.includes?.(pkg)))
    );
    
    // Сортировка
    filtered = filtered.sort((a, b) => {
      if (sortBy === "Сначала дорогие") {
        return b.price_number - a.price_number;
      } else if (sortBy === "Сначала недорогие") {
        return a.price_number - b.price_number;
      }
      // По умолчанию: сначала популярные (оставляем как есть)
      return 0;
    });
    
    setFilteredPosts(filtered);
  }, [businessCards, businessId, selectedCounts, selectedColors, selectedSizes, selectedPackages, sortBy, price]);
  
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
  
  // Удалены старые эффекты загрузки данных, так как теперь используем контекст
  
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
          text={'Все товары'} 
          allowGrid={() => setView("grid")} 
          allowBlocks={() => setView("list")} 
          selected={view} 
          canChangeTitle={false} 
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
          {filteredPosts.map((post) => (
            <div key={post._id}>
              <Post postData={post} type="block" basePathUrl="/search" />
            </div>
          ))}
        </div>}
        
        {view === "list" && 
        <div style={{display: "flex", flexFlow: "column", rowGap: 20, marginTop: 5}}>
          {filteredPosts.map((post) => (
            <div key={post._id}>
              <Post postData={post} type="line" basePathUrl="/search" />
            </div>
          ))}
        </div>}
        
        {filteredPosts.length === 0 &&
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
          defaultPrice={price}
          setDefaultPrice={setPrice} 
        />
      }
    </>
  );
}

export default Search;