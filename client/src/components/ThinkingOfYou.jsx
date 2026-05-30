import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* Floating hearts burst when notification arrives */
const HeartBurst = ({ onDone }) => {
  const hearts = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i / 8) * 360,
    color: ['#f43f5e','#fb7185','#fda4af','#9d4edd','#c084fc','#f43f5e','#fb7185','#fda4af'][i],
  }));

  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
      {hearts.map(h => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0, x: '50vw', y: '50vh' }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.4, 0.8],
            x: `calc(50vw + ${Math.cos((h.angle * Math.PI) / 180) * 120}px)`,
            y: `calc(50vh + ${Math.sin((h.angle * Math.PI) / 180) * 120}px)`,
          }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={h.color}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

/* Toast notification shown to the receiver */
export const ThinkingOfYouToast = ({ from, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      className="toy-toast"
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="toy-toast-heart">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="url(#toyHG)" />
          <defs>
            <linearGradient id="toyHG" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="toy-toast-text">
        <p className="toy-toast-name">{from}</p>
        <p className="toy-toast-msg">is thinking about you ❤️</p>
      </div>
      <button className="toy-toast-close" onClick={onClose}>×</button>
    </motion.div>
  );
};

/* Button shown in the chat sidebar */
export const ThinkingOfYouButton = ({ onClick, cooldown }) => (
  <motion.button
    className={`toy-btn ${cooldown ? 'toy-btn-cooldown' : ''}`}
    onClick={onClick}
    disabled={cooldown}
    whileHover={!cooldown ? { scale: 1.05 } : {}}
    whileTap={!cooldown ? { scale: 0.95 } : {}}
    title="Send a thinking of you notification"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={cooldown ? 'rgba(255,255,255,0.3)' : 'url(#toyBtnHG)'} />
      <defs>
        <linearGradient id="toyBtnHG" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" />
        </linearGradient>
      </defs>
    </svg>
    <span>{cooldown ? 'Sent ✓' : 'Thinking of You'}</span>
  </motion.button>
);

export { HeartBurst };
