import { useSpringRef, animated, useSpring } from '@react-spring/web';
import { useMainContext } from '../context';

function SendedHover({ handleClose }) {
  const { theme } = useMainContext();
  
  const textPrimary = theme === "Dark" ? "#FFFFFF" : "#000000";
  const elementBg = theme === "Dark" ? "rgb(24, 24, 26)" : "rgb(230, 230, 235)";
  
  const api = useSpringRef();
  const props = useSpring({
    ref: api,
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0px)" },
    config: { duration: 300 }
  });

  return (
    <animated.div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      ...props
    }}>
      <animated.div style={{
        backgroundColor: elementBg,
        borderRadius: 12,
        padding: '20px',
        maxWidth: '80%',
        color: textPrimary,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 10 }}>
          Заказ успешно оформлен!
        </div>
        <div style={{ fontSize: 14, fontWeight: 300, marginBottom: 20, color: theme === "Dark" ? "#8F8E93" : "#8E8E93" }}>
          Спасибо за ваш заказ. Мы свяжемся с вами в ближайшее время.
        </div>
        <button 
          onClick={handleClose}
          style={{
            backgroundColor: theme === "Dark" ? "#2C2C2E" : "#C6C6C8",
            color: textPrimary,
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 16,
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Закрыть
        </button>
      </animated.div>
    </animated.div>
  );
}

export default SendedHover;