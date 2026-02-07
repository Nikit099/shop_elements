import styles from '../screens/styles/Post.module.css';
import styles2 from '../screens/styles/Main.module.css';
import { useState, useEffect, useRef } from 'react';
import { useSpringRef, animated, useSpring, config } from '@react-spring/web';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Slider from './Slider';
import MiniSlider from './MiniSlider';
import Button from './Button';
import Hint from './Hint';

function AddVariable({ data, type }) {
  const postDivRef = useRef();
  const [ isOpenPost, setIsOpenPost ] = useState(false);
  const modalApi = useSpringRef();
  const modalApiMain = useSpringRef();
  const modalMainRef = useRef();
  const modalProps = useSpring({
    ref: modalApi,
    from: { backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)" },
  })
  const modalPropsMain = useSpring({
    ref: modalApiMain,
    from: { top: "100vh" },
  })
  const scrollY = useRef();
  const toggle = () => {
    if (!isOpenPost) {
      modalApi.start({ backdropFilter: "blur(0.5vh)", WebkitBackdropFilter: "blur(0.5vh)", background: "rgba(0, 0, 0, .4)", config: { duration: 300 } });
      setTimeout(() => {
        modalApiMain.start({ top: "0vh", config: { duration: 300 } });
      }, 100)
      scrollY.current = window.scrollY;
      document.querySelector("html").style.overflow = "hidden";
      document.querySelector("body").style.overflow = "hidden";
      document.querySelector("body").style.position = "fixed";
      document.querySelector("body").style.top = `-${scrollY.current}px`
    }
    setIsOpenPost(!isOpenPost);
  }
  const [ photosError, setPhotosError ] = useState(null);
  const [ images, setImages ] = useState([]);
  const imagesDivRef = useRef();
  const [ activeImage, setActiveImage ] = useState(null);
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
  const [ selectedColors, setSelectedColors ] = useState([]);
  const counts = [
    "19 роз",
    "29 роз",
    "51 роза",
    "101 роза"
  ]
  const [ selectedCounts, setSelectedCounts ] = useState([]);
  const sizes = [
    "50 см",
    "60 см",
    "70 см",
    "80 см"
  ]
  const [ selectedSizes, setSelectedSizes ] = useState([]);
  const packages = [
    "Лента",
    "Коробка",
    "Корзина",
    "Подарочной упаковка",
    "Классика"
  ]
  const [ selectedPackages, setSelectedPackages ] = useState([]);
  const [ touchStartY, setTouchStartY ] = useState(null);
  const [ modalMainTopOffset, setModalMainTopOffset ] = useState(null);
  const closing = useRef(false);
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].screenY);
    if (modalMainRef.current) {
      setModalMainTopOffset(modalMainRef.current.getBoundingClientRect().top)
    }
  }
  const handleTouchMove = (e) => {
    if (modalMainRef.current && !closing.current) {
      if (touchStartY < e.touches[0].screenY) {
        modalMainRef.current.style.top = `${e.touches[0].screenY - touchStartY}px`;
        if (modalMainRef.current?.getBoundingClientRect().top > window.innerHeight * .4) {
          closing.current = true;
          modalApiMain.set({ top: `${e.touches[0].screenY - touchStartY}px`})
          modalApi.start({ backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)", config: { duration: 300 } });
          setTimeout(() => {
            modalApiMain.start({ top: `${window.innerHeight}px`, config: { duration: 200 } });
          }, 100)
          setTimeout(() => {
            modalApiCart.start({ bottom: "-12vh", config: { duration: 100 } });
          }, 300)
          setTimeout(() => {
            document.querySelector("html").style.overflow = "auto";
            document.querySelector("body").style.overflow = "auto";
            document.querySelector("body").style.position = "relative";
            document.querySelector("body").style.top = "0px";
            window.scrollTo({ top: scrollY.current })
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
  return (
    <>
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
                <animated.div style={{background: "linear-gradient(to top, rgba(0, 0, 0, 1) 50%, rgba(26, 24, 24, 1) 100%)", 
                          width: "100vw",
                          minHeight: "100vh",
                                  paddingBottom: 300,
                                  borderTopLeftRadius: 25, 
                                  borderTopRightRadius: 25, 
                                  position: "relative",
                                  marginTop: "10vh",
                                  ...modalPropsMain}}
                          ref={modalMainRef}>
              <div
                style={{position: "absolute", top: "-10vh", height: "10vh", width: "100vw", display: "flex", justifyContent: "center"}}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div style={{marginTop: "auto", marginBottom: 20, width: "40vw", height: 4, borderRadius: 2, backgroundColor: "#bbb"}}></div>
              </div>
              <div className={styles.wrapper} style={{marginBottom: 20}}>
                <Slider images={images}
                        imagesDivRef={imagesDivRef}
                        setActiveImage={setActiveImage}
                        canAdd={true}
                        activeImage={activeImage}
                        setImages={setImages}
                        maxImagesCount={10}
                        photosError={photosError}
                        setPhotosError={setPhotosError}
                        />
                {images.length > 0 &&
                  <MiniSlider images={images}
                              imagesDivRef={imagesDivRef}
                              activeImage={activeImage}
                              canAdd={true}
                              setImages={setImages}
                              maxImagesCount={10}
                              />}
              </div>
              <Slider images={images} imagesDivRef={imagesDivRef} setActiveImage={setActiveImage} />
            </animated.div>
          </div>
        </animated.div>}
    </>
  )
}

export default AddVariable;
