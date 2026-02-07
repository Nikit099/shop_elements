import { useState, useRef } from 'react';
import { useSpringRef, animated, useSpring } from '@react-spring/web';
import Button from './Button';

function Contact() {
  const [ isOpen, setIsOpen ] = useState(false);
  const api = useSpringRef();
  const api2 = useSpringRef();
  const modalApi = useSpringRef();
  const modalApiMain = useSpringRef();
  const modalMainRef = useRef();
  const [ type, setType ] = useState(0);
  const props = useSpring({
    ref: api,
    from: { transform: "scale(1)" },
  })
  const props2 = useSpring({
    ref: api2,
    from: { transform: "scale(1)" },
  })
  const modalProps = useSpring({
    ref: modalApi,
    from: { backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)" },
  })
  const modalPropsMain = useSpring({
    ref: modalApiMain,
    from: { top: "100vh" },
  })
  const toggle = (t) => {
    setType(t);
    if (t === 0) {
      api.start({ transform: "scale(1.05)", config: { duration: 200 } });
    } else {
      api2.start({ transform: "scale(1.05)", config: { duration: 200 } });
    }
    setTimeout(() => {
      api.start({ transform: "scale(1)", config: { duration: 200 } });
      api2.start({ transform: "scale(1)", config: { duration: 200 } });
    }, 200);
    if (!isOpen) {
      modalApi.start({ backdropFilter: "blur(0.5vh)", WebkitBackdropFilter: "blur(0.5vh)", background: "rgba(0, 0, 0, .4)", config: { duration: 300 } });
      setTimeout(() => {
        modalApiMain.start({ top: "0vh", config: { duration: 300 } });
      }, 100)
    }
    setIsOpen(!isOpen);
  }
  const [ touchStartY, setTouchStartY ] = useState(null);
  const closing = useRef(false);
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].screenY);
  }
  const handleTouchMove = (e) => {
    if (modalMainRef.current && !closing.current) {
      if (touchStartY < e.touches[0].screenY) {
        modalMainRef.current.style.top = `${e.touches[0].screenY - touchStartY}px`;
        if (modalMainRef.current?.getBoundingClientRect().top > window.innerHeight * .75) {
          closing.current = true;
          modalApiMain.set({ top: `${e.touches[0].screenY - touchStartY}px`})
          modalApi.start({ backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)", config: { duration: 300 } });
          setTimeout(() => {
            modalApiMain.start({ top: `${window.innerHeight}px`, config: { duration: 200 } });
          }, 100)
          setTimeout(() => {
            closing.current = false;
            setIsOpen(false);
          }, 600)
        }
      }
    }
  }
  const handleTouchEnd = (e) => {
    if (modalMainRef.current?.getBoundingClientRect().top < window.innerHeight * .75 && !closing.current) {
      modalApiMain.set({ top: `${modalMainRef.current?.getBoundingClientRect().top - window.innerHeight * .5}px` })
      setTimeout(() => {
        modalApiMain.start({ top: `0px`, config: { duration: 200 } });
      }, 100)
    }
  }
  return (
    <>
        <div style={{padding: "0 15px", display: "flex", gap: 8, width: "100%", boxSizing: "border-box"}}>
          <animated.div style={{width: "100%", ...props}} onClick={() => toggle(0)}>
            <Button text={"Позвонить"} style={{
              fontWeight: 500, 
              fontSize: 16,
              borderRadius: 12,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#323234",
              ...props}} />
          </animated.div>
          <animated.div style={{width: "100%", ...props2}} onClick={() => toggle(1)}>
            <Button text={"Написать"} style={{
              fontWeight: 500, 
              fontSize: 16,
              borderRadius: 11,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#323234",
              ...props2}} />
          </animated.div>
        </div>
      {isOpen &&
        <animated.div style={{
                        position: "fixed", 
                        left: 0, 
                        top: 0, 
                        width: "100vw", 
                        height: "100vh",
                        display: "flex",
                        zIndex: 10001,
                        ...modalProps
                      }}>
          <div style={{
            overflowY: "auto",
            overflowX: "hidden",
          }}>
                <animated.div style={{background: "linear-gradient(to top, rgba(0, 0, 0, 1) 50%, rgba(26, 24, 24, 1) 100%)", 
                          width: "100vw",
                          minHeight: "150px",
                                  borderTopLeftRadius: 25, 
                                  borderTopRightRadius: 25, 
                                  position: "relative",
                                  marginTop: "calc(100vh - 150px)",
                                  ...modalPropsMain}}
                          ref={modalMainRef}>
              <div style={{position: "absolute", right: -5, top: -5, padding: 10}} onClick={(e) => {
                  closing.current = true;
                  modalApi.start({ backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)", config: { duration: 300 } });
                  setTimeout(() => {
                    modalApiMain.start({ top: `${window.innerHeight}px`, config: { duration: 200 } });
                  }, 100)
                  setTimeout(() => {
                    closing.current = false;
                    setIsOpen(false);
                  }, 600)
                }}>
                <img src={require("../components/images/plus.svg").default} className="" alt="close" style={{width: 35, display: "flex", transform: "rotate(45deg)", filter: "brightness(.7)"}} />
              </div>
              {type === 1 ?
              <div style={{paddingTop: 10}}>
                <a href="https://t.me/LIGHTbusinessRose" target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}}>
                  <div style={{padding: "20px", fontSize: 16, fontWeight: 300, borderBottom: "0.5px solid rgb(24, 24, 26)", color: "#fff"}}>
                    Telegram
                  </div>
                </a>
                <a href="https://wa.me/79933074710" target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}}>
                  <div style={{padding: "20px", fontSize: 16, fontWeight: 300, color: "#fff"}}>
                    WhatsApp
                  </div>
                </a>
              </div> :
              <div style={{paddingTop: 10}}>
                <a href="tel:+79933074710" onСlick="window.open('tel:+79933074710');" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{padding: "20px", fontSize: 16, fontWeight: 300, borderBottom: "0.5px solid rgb(24, 24, 26)", color: "#fff"}}>
                    +7 993 30 74 710 - Сочи
                  </div>
                </a>
                <a href="tel:+79911888886" onСlick="window.open('tel:+79911888886');" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{padding: "20px", fontSize: 16, fontWeight: 300, color: "#fff"}}>
                    +7 991 18 88 886 - Краснодар
                  </div>
                </a>
              </div>}
            </animated.div>
          </div>
        </animated.div>}
    </>
  )
}

export default Contact;
