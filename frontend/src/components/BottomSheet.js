import { motion, AnimatePresence } from 'motion/react';

export default function BottomSheet({ 
  isOpen, 
  onClose, 
  children,
  theme = 'Light',
  backgroundColor,
  handleColor,
  maxHeight = '85vh',
  maxWidth = '42rem',
  onOpen,
  lockScroll = true
}) {
  // Определяем цвета на основе темы
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    return theme === 'Dark' ? '#1C1C1E' : '#FFFFFF';
  };
  
  const getHandleColor = () => {
    if (handleColor) return handleColor;
    return theme === 'Dark' ? '#8F8E93' : '#d1d5db';
  };
  
  const getOverlayColor = () => {
    return theme === 'Dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.6)';
  };
  
  // Обработка открытия/закрытия для блокировки скролла
  const handleOpen = () => {
    if (lockScroll) {
      document.querySelector("html").style.overflow = "hidden";
      document.querySelector("body").style.overflow = "hidden";
    }
    if (onOpen) onOpen();
  };
  
  const handleClose = () => {
    if (lockScroll) {
      document.querySelector("html").style.overflow = "auto";
      document.querySelector("body").style.overflow = "auto";
    }
    if (onClose) onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемнённый фон */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: getOverlayColor(),
              zIndex: 99998,
            }}
            onClick={handleClose}
          />

          {/* Само модальное окно */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            
            drag="y"
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={0.15}
            
            onDragStart={() => {
              handleOpen();
            }}
            
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 450) {
                handleClose();
              }
            }}
            
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: maxWidth,
              backgroundColor: getBackgroundColor(),
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 99999,
              overflow: 'hidden',
              marginBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Полоска для свайпа */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '12px',
              paddingBottom: '8px',
              cursor: 'grab',
            }}>
              <div style={{
                width: '40px',
                height: '4px',
                backgroundColor: getHandleColor(),
                borderRadius: '9999px',
              }} />
            </div>

            {/* Содержимое модалки */}
            <div style={{
              paddingLeft: '0',
              paddingRight: '0',
              paddingBottom: '32px',
              maxHeight: maxHeight,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}