import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const SakuraPetal = ({ id }) => {
  const left = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => 5 + Math.random() * 5, []);
  const delay = useMemo(() => Math.random() * 5, []);
  const size = useMemo(() => 10 + Math.random() * 15, []);

  return (
    <motion.div
      key={id}
      initial={{ top: -50, left: `${left}%`, rotate: 0, opacity: 0 }}
      animate={{ 
        top: '100vh', 
        left: `${left + (Math.random() * 20 - 10)}%`, 
        rotate: 360,
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration: duration, 
        repeat: Infinity, 
        delay: delay,
        ease: "linear"
      }}
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size * 0.6}px`,
        background: 'rgba(255, 183, 197, 0.7)',
        borderRadius: '100% 0% 100% 0%',
        boxShadow: '0 0 10px rgba(255, 183, 197, 0.4)',
        zIndex: 1
      }}
    />
  );
};

const RainDrop = ({ id }) => {
  const left = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => 0.5 + Math.random() * 0.5, []);
  const delay = useMemo(() => Math.random() * 2, []);

  return (
    <motion.div
      key={id}
      initial={{ top: -50, left: `${left}%`, opacity: 0 }}
      animate={{ 
        top: '100vh',
        opacity: [0, 0.8, 0]
      }}
      transition={{ 
        duration: duration, 
        repeat: Infinity, 
        delay: delay,
        ease: "linear"
      }}
      style={{
        position: 'absolute',
        width: '2px',
        height: '20px',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(150, 200, 255, 0.8))',
        zIndex: 1
      }}
    />
  );
};

const Star = ({ id }) => {
  const top = useMemo(() => Math.random() * 100, []);
  const left = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => 2 + Math.random() * 4, []);
  const delay = useMemo(() => Math.random() * 2, []);
  const size = useMemo(() => 1 + Math.random() * 3, []);

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0.1, scale: 0.5 }}
      animate={{ 
        opacity: [0.1, 0.8, 0.1],
        scale: [0.5, 1, 0.5]
      }}
      transition={{ 
        duration: duration, 
        repeat: Infinity, 
        delay: delay,
        ease: "easeInOut"
      }}
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: '#fff',
        borderRadius: '50%',
        boxShadow: `0 0 ${size * 2}px #fff`,
        zIndex: 0
      }}
    />
  );
};

const WeatherEffects = ({ mood }) => {
  const particleCount = 40;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  if (!mood || mood === 'normal') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 1
    }}>
      {mood === 'romantic' && particles.map(i => <SakuraPetal key={`sakura-${i}`} id={i} />)}
      {mood === 'missing' && particles.map(i => <RainDrop key={`rain-${i}`} id={i} />)}
      {mood === 'night' && particles.map(i => <Star key={`star-${i}`} id={i} />)}
    </div>
  );
};

export default WeatherEffects;
