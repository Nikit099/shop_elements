import { useState, useRef, useEffect } from 'react';
import { useSpringRef, animated, useSpring } from '@react-spring/web';
import Button from './Button';
import { useMainContext } from '../context';

function Contact() {
  const { businessSettings, businessSettingsLoaded, theme } = useMainContext();
  
  // CSS переменные для темы (аналогично Post.js)
  const textPrimary = theme === "Dark" ? "#FFFFFF" : "#000000";
  const textSecondary = theme === "Dark" ? "#8F8E93" : "#8E8E93";
  const elementBg = theme === "Dark" ? "rgb(24, 24, 26)" : "rgb(230, 230, 235)";
  const modalBg = theme === "Dark" 
    ? "linear-gradient(to top, rgba(0, 0, 0, 1) 50%, rgba(26, 24, 24, 1) 100%)" 
    : "linear-gradient(to top, rgba(255, 255, 255, 1) 50%, rgba(245, 245, 247, 1) 100%)";
  const surface = theme === "Dark" ? "#1C1C1E" : "#F2F2F7";
  const borderColor = theme === "Dark" ? "#2C2C2E" : "#C6C6C8";
  const [isOpen, setIsOpen] = useState(false);
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
  // Проверяем наличие контактных данных в businessSettings
  const hasPhone = businessSettings && businessSettings.phone_number && businessSettings.phone_number.trim() !== '';
  const hasTelegram = businessSettings && businessSettings.telegram_url && businessSettings.telegram_url.trim() !== '';
  const hasWhatsApp = businessSettings && businessSettings.whatsapp_url && businessSettings.whatsapp_url.trim() !== '';
  const hasWriteContact = hasTelegram || hasWhatsApp;
  
  // Если нет контактных данных, не показываем компонент
  if (!hasPhone && !hasWriteContact) {
    return null;
  }

  return (
    <>
        <div style={{padding: "0 15px", display: "flex", gap: 8, width: "100%", boxSizing: "border-box"}}>
          {hasPhone && (
            <animated.div style={{width: "100%", ...props}} onClick={() => toggle(0)}>
              <Button text={"Позвонить"} style={{
                fontWeight: 500, 
                fontSize: 16,
                borderRadius: 12,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: elementBg,
                color: textPrimary,
                ...props}} />
            </animated.div>
          )}
          {hasWriteContact && (
            <animated.div style={{width: "100%", ...props2}} onClick={() => toggle(1)}>
              <Button text={"Написать"} style={{
                fontWeight: 500, 
                fontSize: 16,
                borderRadius: 11,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: elementBg,
                color: textPrimary,
                ...props2}} />
            </animated.div>
          )}
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
                <animated.div style={{background: modalBg, 
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
                {hasTelegram && (
                  <a href={businessSettings.telegram_url} target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}}>
                    <div style={{padding: "20px", fontSize: 16, fontWeight: 300, borderBottom: hasWhatsApp ? `0.5px solid ${borderColor}` : "none", color: textPrimary}}>
                      Telegram
                    </div>
                  </a>
                )}
                {hasWhatsApp && (
                  <a href={businessSettings.whatsapp_url} target="_blank" rel="noopener noreferrer" style={{textDecoration: "none"}}>
                    <div style={{padding: "20px", fontSize: 16, fontWeight: 300, color: textPrimary}}>
                      WhatsApp
                    </div>
                  </a>
                )}
              </div> :
              <div style={{paddingTop: 10}}>
                {hasPhone && (
                  <a href={`tel:${businessSettings.phone_number}`} onClick={(e) => { e.preventDefault(); window.open(`tel:${businessSettings.phone_number}`); }} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{padding: "20px", fontSize: 16, fontWeight: 300, borderBottom: `0.5px solid ${borderColor}`, color: textPrimary}}>
                      {businessSettings.phone_number}
                    </div>
                  </a>
                )}
              </div>}
            </animated.div>
          </div>
        </animated.div>}
    </>
  )
}

export default Contact;
