import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export default function CircularMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: '❤️', label: 'Like', color: '#ef4444', onClick: () => alert('Like!') },
    { icon: '⭐', label: 'Favorite', color: '#eab308', onClick: () => alert('Favorite!') },
    { icon: '🔗', label: 'Share', color: '#3b82f6', onClick: () => alert('Share!') },
    { icon: '✏️', label: 'Edit', color: '#10b981', onClick: () => alert('Edit!') },
  ];

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 100 }}>
      <AnimatePresence>
        {/* Маленькие кнопки */}
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            onClick={() => {
              item.onClick();
              setIsOpen(false); // закрываем меню после клика
            }}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{
              opacity: isOpen ? 1 : 0,
              scale: isOpen ? 1 : 0.5,
              x: isOpen ? Math.cos((index * 90) * (Math.PI / 180)) * 90 : 0,
              y: isOpen ? Math.sin((index * 90) * (Math.PI / 180)) * 90 - 20 : 0,
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: isOpen ? index * 0.03 : 0,
            }}
            style={{
              position: 'absolute',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: item.color,
              color: 'white',
              border: 'none',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              bottom: '50%',
              right: '50%',
              transform: 'translate(50%, 50%)',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Главная кнопка */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        animate={{
          rotate: isOpen ? 45 : 0,
          backgroundColor: isOpen ? '#ef4444' : '#3b82f6',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          fontSize: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 10,
        }}
      >
        +
      </motion.button>
    </div>
  );
}