import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* Tiny SVG heart for the intro */
const HeartIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#hg)"
    />
    <defs>
      <linearGradient id="hg" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" />
        <stop offset="1" stopColor="#9d4edd" />
      </linearGradient>
    </defs>
  </svg>
);

const Intro = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 2800);
    const t2 = setTimeout(() => setStage(2), 6500);
    const t3 = setTimeout(() => { onComplete(); }, 8800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(74,25,66,0.6), #050508)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem',
          textAlign: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Subtle grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
        }} />

        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.p
              key="line1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              style={{
                color: 'rgba(255,240,235,0.72)',
                fontSize: '1.15rem',
                fontWeight: 300,
                letterSpacing: '0.12em',
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              In a world full of temporary people...
            </motion.p>
          )}

          {stage === 1 && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem' }}
            >
              <motion.div
                initial={{ filter: 'drop-shadow(0 0 0px rgba(244,63,94,0))' }}
                animate={{ filter: 'drop-shadow(0 0 28px rgba(244,63,94,0.65))' }}
                transition={{ delay: 0.6, duration: 1.8 }}
              >
                <HeartIcon />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, letterSpacing: '0.3em' }}
                animate={{ opacity: 1, letterSpacing: '0.08em' }}
                transition={{ delay: 0.4, duration: 1.6 }}
                style={{
                  color: '#fff8f5',
                  fontSize: '3.2rem',
                  fontWeight: 600,
                  fontFamily: "'Cormorant Garamond', serif",
                  margin: 0,
                  background: 'linear-gradient(135deg, #fb7185, #f0c97a, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Lovedale
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.2 }}
                style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.7), transparent)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default Intro;
