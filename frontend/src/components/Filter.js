import { useEffect, useState } from 'react';
import { useSpringRef, animated, useSpring, easings } from '@react-spring/web';
import Title from './Title';
import Button from './Button';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { useMainContext } from '../context';

function valuetext(value) {
  return `${value} ₽`;
}

function Filter({ 
  setIsOpenFilter,
  selectedColors,
  setSelectedColors,
  selectedCounts,
  setSelectedCounts,
  selectedSizes,
  setSelectedSizes,
  selectedPackages,
  setSelectedPackages,
  defaultPrice,
  setDefaultPrice
 }) {
  const { setHandleClickBackButton } = useMainContext();
  const api = useSpringRef();
  const props = useSpring({
    ref: api,
    from: { top: "0", left: "100vw" },
    to: { top: "0", left: "0vw" }
  })
  useEffect(() => {
    api.start({ top: "0", left: "0vw", config: { duration: 200, tension: 280, friction: 60 } });
    setHandleClickBackButton(() => handleBack);
  }, [])
  const [ price, setPrice ] = useState(defaultPrice.length > 0 ? defaultPrice : [0, 9000])
  const handleChange = (event, value) => {
    setPrice(value);
  };
  const colors = [
    "Белые",
    "Красные",
    "Черные",
    "Синие",
    "Желтые", 
    "Оранжевые",
    "Розовые",
    "Микс"
  ]
  const counts = [
    "19 роз",
    "29 роз",
    "51 роза",
    "101 роза"
  ]
  const sizes = [
    "50 см",
    "60 см",
    "70 см",
    "80 см"
  ]
  const packages = [
    "Лента",
    "Коробка",
    "Корзина",
    "Подарочной упаковка",
    "Классика"
  ]
  const handleBack = () => {
    api.start({ top: "0", left: "100vw", config: { duration: 200, tension: 280, friction: 60 } })
    setTimeout(() => {
      document.querySelector("html").style.overflow = "auto";
      document.querySelector("body").style.overflow = "auto";
      document.querySelector("body").style.position = "relative";
      document.querySelector("body").style.top = "0px";
      setHandleClickBackButton(null);
      setIsOpenFilter(false);
    }, 200)
  }
  const handleSave = () => {
    setDefaultPrice(price);
    api.start({ top: "0", left: "100vw", config: { duration: 200, tension: 280, friction: 60 } })
    setTimeout(() => {
      document.querySelector("html").style.overflow = "auto";
      document.querySelector("body").style.overflow = "auto";
      document.querySelector("body").style.position = "relative";
      document.querySelector("body").style.top = "0px";
      setHandleClickBackButton(null);
      setIsOpenFilter(false);
    }, 200)
  }
  const handleClear = () => {
    setSelectedColors([]);
    setSelectedCounts([]);
    setSelectedSizes([]);
    setSelectedPackages([]);
    setDefaultPrice([0, 9000]);
    setPrice([0, 9000]);
  }
  return (
    <animated.div style={{
      position: "fixed",
      width: "100vw",
      height: "100vh",
      background: "#000",
      zIndex: 3,
      ...props
    }}>
      <div className="view">
        <div style={{borderBottom: "0.5px solid #18181A", marginLeft: -15, width: "100vw"}}>
            <div style={{padding: "0 15px"}}>
                <Title text="Фильтры" canDelete={handleClear} deleteText={"Очистить фильтры"} />
            </div>
        </div>
        <div style={{padding: "20px 0", display: "flex", flexFlow: "column", gap: 10}}>
          <div style={{fontSize: 16, fontWeight: 300}}>Цена</div>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <div>
              <input type="text" 
                     inputMode="decimal" 
                     placeholder="От"
                     value={valuetext(price[0])}
                     readOnly
                     style={{
                      width: 100,
                      background: "#18181A",
                      borderRadius: 4,
                      border: 0,
                      margin: 0,
                      padding: "8px 10px",
                      fontSize: 15,
                      color: "#fff",
                      outline: 0
                     }}
              />
            </div>
            <div>
              <input type="text" 
                      inputMode="decimal" 
                      placeholder="До"
                      value={valuetext(price[1])}
                      readOnly
                      style={{
                        width: 100,
                        background: "#18181A",
                        borderRadius: 4,
                        border: 0,
                        margin: 0,
                        padding: "8px 10px",
                        fontSize: 15,
                        color: "#fff",
                        outline: 0
                      }}
              />
            </div>
          </div>
          <div>
            <Box sx={{ width: "100%" }}>
              <Slider
                value={price}
                onChange={handleChange}
                getAriaValueText={valuetext}
                defaultValue={[1000, 5000]}
                min={0}
                max={10000}
                color="dark"
                sx={{
                  color: '#fff',
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 24,
                    height: 24,
                    backgroundColor: '#fff',
                    '&::before': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                    },
                    '&:hover, &.Mui-focusVisible, &.Mui-active': {
                      boxShadow: 'none',
                    },
                  },
                }}
              />
            </Box>
          </div>
        </div>
        <>
          <div style={{paddingBottom: 30}}>
            <div style={{fontSize: 16, fontWeight: 300, paddingBottom: 10}}>Цвет</div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10
            }}>
              {colors.map((color, index) => (
                <div key={"color" + index} 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px 7px",
                      borderRadius: 4,
                      background: selectedColors.includes(color) ? "#fff" : "rgb(24, 24, 26)",
                      fontSize: 15,
                      fontWeight: 300,
                      color: selectedColors.includes(color) ? "#000" : "#fff"
                    }}
                    onClick={() => {
                      if (selectedColors.includes(color)) {
                        setSelectedColors(prevState => prevState.filter((selectedColor) => color !== selectedColor))
                      } else {
                        setSelectedColors(prevState => [...prevState, color])
                      }
                    }}
                >
                  {color}
                </div>
              ))}
            </div>
          </div>
          <div style={{paddingBottom: 30}}>
            <div style={{fontSize: 16, fontWeight: 300, paddingBottom: 10}}>Количество цветов</div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10
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
            </div>
          </div>
          <div style={{paddingBottom: 30}}>
            <div style={{fontSize: 16, fontWeight: 300, paddingBottom: 10}}>Размер букета</div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10
            }}>
              {sizes.map((size, index) => (
                <div key={"size" + index} 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px 7px",
                      borderRadius: 4,
                      background: selectedSizes.includes(size) ? "#fff" : "rgb(24, 24, 26)",
                      fontSize: 15,
                      fontWeight: 300,
                      color: selectedSizes.includes(size) ? "#000" : "#fff"
                    }}
                    onClick={() => {
                      if (selectedSizes.includes(size)) {
                        setSelectedSizes(prevState => prevState.filter((selectedSize) => size !== selectedSize))
                      } else {
                        setSelectedSizes(prevState => [...prevState, size])
                      }
                    }}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>
          <div style={{paddingBottom: 30}}>
            <div style={{fontSize: 16, fontWeight: 300, paddingBottom: 10}}>Упаковка</div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10
            }}>
              {packages.map((pckg, index) => (
                <div key={"package" + index} 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px 7px",
                      borderRadius: 4,
                      background: selectedPackages.includes(pckg) ? "#fff" : "rgb(24, 24, 26)",
                      fontSize: 15,
                      fontWeight: 300,
                      color: selectedPackages.includes(pckg) ? "#000" : "#fff"
                    }}
                    onClick={() => {
                      if (selectedPackages.includes(pckg)) {
                        setSelectedPackages(prevState => prevState.filter((selectedPackage) => pckg !== selectedPackage))
                      } else {
                        setSelectedPackages(prevState => [...prevState, pckg])
                      }
                    }}
                >
                  {pckg}
                </div>
              ))}
            </div>
          </div>
        </>
        <div>
          <Button text="Применить" handleClick={handleSave} />
        </div>
      </div>
    </animated.div>
  );
}

export default Filter;
