import { useMemo } from 'react';

/* Premium collection of cute, real emojis for floating elements */
const CUTE_EMOJIS = [
  '💕', '✨', '🌸', '💫', '🎀', '💖', '🌹', '💝',
  '🦋', '🌺', '💗', '🌷', '🎁', '💞', '🌼', '💓',
  '🌻', '🎀', '✨', '💫', '🌸', '💖', '🦋', '🌹',
  '💕', '🌺', '💗', '🌷', '💝', '💞', '🌼', '💓',
  '🎀', '✨', '🦋', '🌸', '💫', '💖', '🌹', '💕',
];

const FloatingHearts = ({ count = 25 }) => {
  const hearts = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: CUTE_EMOJIS[i % CUTE_EMOJIS.length],
      left: `${Math.random() * 100}%`,
      size: 16 + Math.random() * 28,
      opacity: 0.35 + Math.random() * 0.65,
      animDuration: `${12 + Math.random() * 18}s`,
      animDelay: `${Math.random() * 16}s`,
      rotation: Math.random() * 360,
      swayAmount: 20 + Math.random() * 60,
    }));
  }, [count]);

  return (
    <div className="hearts-container" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="floating-heart"
          style={{
            left: h.left,
            animationDuration: h.animDuration,
            animationDelay: h.animDelay,
            fontSize: `${h.size}px`,
            opacity: h.opacity,
            transform: `rotate(${h.rotation}deg)`,
            '--sway-amount': `${h.swayAmount}px`,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
};

export default FloatingHearts;
