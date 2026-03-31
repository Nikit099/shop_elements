import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export default function BottomSheet({ isOpen, onClose, children }) {
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
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 50,
            }}
            onClick={onClose}
          />

          {/* Само модальное окно */}
          <motion.div
            initial={{ y: 700, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 700, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            
            drag="y"
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={0.15}
            
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 450) {
                onClose();
              }
            }}
            
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: '42rem',           // ~ max-w-lg (512px)
              backgroundColor: '#ffffff',  // белый фон
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)',
              zIndex: 50,
              overflow: 'hidden',
              marginBottom: 'env(safe-area-inset-bottom)', // для iPhone
            }}
          >
            {/* Полоска для свайпа */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '12px',
              paddingBottom: '8px',
            }}>
              <div style={{
                width: '40px',
                height: '4px',
                backgroundColor: '#d1d5db',
                borderRadius: '9999px',
              }} />
            </div>

            {/* Содержимое модалки */}
            <div style={{
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingBottom: '32px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}