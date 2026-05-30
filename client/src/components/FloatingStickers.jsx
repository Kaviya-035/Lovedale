import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/* Cute emoji stickers for floating elements */
const STICKER_EMOJIS = [
  '✨', '🌸', '🦋', '🌺', '💫', '🌷', '🌼', '🎀',
  '💕', '🌹', '💖', '🎁', '🌻', '💝', '🌙', '⭐',
  '🎀', '✨', '🦋', '🌸', '💫', '🌺', '🌷', '💕',
];

const Sticker = ({ id }) => {
  const emoji = useMemo(() => STICKER_EMOJIS[id % STICKER_EMOJIS.length], [id]);
  const startX = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => 18 + Math.random() * 22, []);
  const delay = useMemo(() => Math.random() * 35, []);
  const scale = useMemo(() => 0.8 + Math.random() * 1.2, []);
  const drift = useMemo(() => (Math.random() - 0.5) * 30, []);
  const size = useMemo(() => 24 + Math.random() * 16, []);

  return (
    <motion.div
      initial={{ y: '110vh', x: `${startX}vw`, opacity: 0, rotate: 0, scale }}
      animate={{
        y: '-15vh',
        x: `${startX + drift}vw`,
        rotate: [0, 15, -15, 0],
        opacity: [0, 0.65, 0.65, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'linear',
      }}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 5,
        fontSize: `${size}px`,
        filter: 'drop-shadow(0 4px 12px rgba(244, 63, 94, 0.25))',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
        lineHeight: 1,
      }}
    >
      {emoji}
    </motion.div>
  );
};

const FloatingStickers = ({ count = 15 }) => {
  const stickers = Array.from({ length: count }, (_, i) => i);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'hidden',
      }}
    >
      {stickers.map((i) => (
        <Sticker key={i} id={i} />
      ))}
    </div>
  );
};

export default FloatingStickers;
