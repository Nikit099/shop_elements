import styles from '../screens/styles/Post.module.css';
import styles2 from '../screens/styles/Main.module.css';
import { useState, useEffect, useRef } from 'react';
import { useSpringRef, animated, useSpring, config } from '@react-spring/web';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useMainContext } from '../context';
import ScrollToError from './ScrollToError';
import { Formik, Form } from 'formik';
import Button from './Button';
import FormLIGHT from './FormLIGHT';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  "name": Yup.string()
    .required("Обязательное поле"),
  "receiver_name": Yup.string()
    .required("Обязательное поле"),
  "receiver_phone": Yup.string()
    .required("Обязательное поле")
});

function Hint({ product, selectedColor, selectedCount, selectedPackage, selectedSize }) {
  const { sendMessage, message, setMessage } = useMainContext();
  const [ isSended, setIsSended ] = useState(false);
  const [ inputs, setInputs ] = useState({
    "name": {
        value: null,
        isFocused: false,
        error: null,
        label: "Ваше имя",
        type: "text",
    },
    "receiver_name": {
        value: null,
        isFocused: false,
        error: null,
        label: "Имя получателя",
        type: "text",
    },
    "receiver_phone": {
        value: null,
        isFocused: false,
        error: null,
        label: "Телефон получателя *",
        type: "text",
        mask: [
            '+', '7', ' ', '(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/
        ]
    }
  });
  const [ isOpen, setIsOpen ] = useState(false);
  const api = useSpringRef();
  const modalApi = useSpringRef();
  const modalApiMain = useSpringRef();
  const modalMainRef = useRef();
  const props = useSpring({
    ref: api,
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
  const scrollY = useRef();
  const toggle = () => {
    api.start({ transform: "scale(1.05)", config: { duration: 200 } });
    setTimeout(() => {
      api.start({ transform: "scale(1)", config: { duration: 200 } });
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
        if (modalMainRef.current?.getBoundingClientRect().top > window.innerHeight * .7) {
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
          setIsSended(false);
        }
      }
    }
  }
  const handleTouchEnd = (e) => {
    if (modalMainRef.current?.getBoundingClientRect().top < window.innerHeight * .7 && !closing.current) {
      modalApiMain.set({ top: `${modalMainRef.current?.getBoundingClientRect().top - window.innerHeight * .5}px` })
      setTimeout(() => {
        modalApiMain.start({ top: `0px`, config: { duration: 200 } });
      }, 100)
    }
  }
  const handleSubmit = (values) => {
    sendMessage(JSON.stringify(["hint", "new", {...values, product, selectedColor, selectedCount, selectedPackage, selectedSize}]));
  }
  useEffect(() => {
    if (message) {
      if (message[0] === 'hint') {
        if (message[1] === 'new') {
          console.log(message[2]);
          setIsSended(true);
          setTimeout(() => {
            closing.current = true;
            modalApi.start({ backdropFilter: "blur(0vh)", WebkitBackdropFilter: "blur(0vh)", background: "rgba(0, 0, 0, 0)", config: { duration: 300 } });
            setTimeout(() => {
              modalApiMain.start({ top: `${window.innerHeight}px`, config: { duration: 200 } });
            }, 100)
            setTimeout(() => {
              closing.current = false;
              setIsOpen(false);
            }, 600)
            setIsSended(false);
          }, 3000)
        }
      }
      setMessage(null);
    };
  }, [message]);
  return (
    <>
        <animated.div style={{padding: "0 15px", display: "flex", alignItems: "center", gap: 8, marginBottom: 20, ...props}} onClick={toggle}>
            <div style={{height: 20}}>
                <img src={require("../screens/images/lips.png")} className="" alt="whatsapp" style={{height: "100%"}} />
            </div>
            <div style={{
                background: "linear-gradient(to left, #EF0E37 0%, #FF0000 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 500,
                fontSize: 14
            }}>
                Намекнуть о подарке
            </div>
        </animated.div>
      {isOpen &&
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
                          minHeight: "80vh",
                                  borderTopLeftRadius: 25, 
                                  borderTopRightRadius: 25, 
                                  position: "relative",
                                  marginTop: "50vh",
                                  ...modalPropsMain}}
                          ref={modalMainRef}>
              <div
                style={{position: "absolute", top: "-50vh", height: "60vh", width: "100vw", display: "flex", justifyContent: "center"}}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div style={{marginTop: "auto", marginBottom: "calc(20px + 10vh)", width: "40vw", height: 4, borderRadius: 2, backgroundColor: "#bbb"}}></div>
              </div>
              {!isSended ? 
              <>
                <div style={{padding: "30px 20px 15px 20px", fontSize: 16, fontWeight: 300}}>
                  Понравился букет и вы хотели бы получить<br/>
                  его в подарок от близкого человека?
                </div>
                <div style={{padding: "0px 20px 20px 20px", fontSize: 13, fontWeight: 300, color: "#bbb"}}>
                  Заполните его имя и номер телефона,
                  мы отправим сообщение с намеком.
                </div>
                <div style={{padding: "0px 20px 20px 20px"}}>
                  <Formik
                      initialValues={{
                          "name": "",
                          "receiver_name": "",
                          "receiver_phone": ""
                      }}
                      onSubmit={handleSubmit}
                      validationSchema={validationSchema}
                  >
                  {({ errors, touched, handleSubmit }) => (
                      <Form>
                          <div style={{display: "flex", gap: 20, flexFlow: "column"}}>
                              <FormLIGHT inputs={Object.entries(inputs).slice(0, 3)} setInputs={setInputs} errors={errors} touched={touched} />
                              <Button text="Отправить" handleClick={handleSubmit} style={{
                                    fontWeight: 500, 
                                    fontSize: 16,
                                    borderRadius: 12,
                                    height: 44,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#323234"
                              }}/>
                          </div>
                          <ScrollToError/>
                      </Form>
                  )}
                  </Formik>  
                </div>
              </> :
              <div style={{padding: "30px 20px 15px 20px", fontSize: 16, fontWeight: 300, textAlign: "center"}}>
                Готово, намёк ясен
              </div>}
            </animated.div>
          </div>
        </animated.div>}
    </>
  )
}

export default Hint;
