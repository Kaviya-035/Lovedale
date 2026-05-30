import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiPlay, FiPause, FiSkipForward, FiSkipBack, FiFilm } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api, { resolveMediaUrl } from '../utils/api';
import { format } from 'date-fns';

const MOOD_GRADIENTS = {
  romantic: 'linear-gradient(135deg,#4a1942,#e11d48)',
  nostalgic: 'linear-gradient(135deg,#1a0a18,#6b2d5e)',
  joyful:   'linear-gradient(135deg,#0f0c29,#f43f5e)',
  tender:   'linear-gradient(135deg,#0a0608,#9d4edd)',
  magical:  'linear-gradient(135deg,#0f0c29,#d4a853)',
};

const HeartSVG = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#rmhg)" />
    <defs>
      <linearGradient id="rmhg" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" />
      </linearGradient>
    </defs>
  </svg>
);

const RelationshipMovie = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const SLIDE_DURATION = 6000; // 6s per chapter

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await api.get('/memories');
      setMemories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const generateMovie = async () => {
    if (memories.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/movie', {
        memories: memories.map(m => ({
          title: m.title,
          description: m.description,
          date: m.date,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
        })),
      });
      setMovie(res.data.movie);
      setCurrentIdx(0);
      setProgress(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance slides when playing
  useEffect(() => {
    if (!playing || !movie) return;
    setProgress(0);
    clearInterval(intervalRef.current);
    const tick = 100;
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (100 / (SLIDE_DURATION / tick));
        if (next >= 100) {
          clearInterval(intervalRef.current);
          if (currentIdx < movie.length - 1) {
            setCurrentIdx(i => i + 1);
          } else {
            setPlaying(false);
          }
          return 100;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(intervalRef.current);
  }, [playing, currentIdx, movie]);

  const goTo = (idx) => {
    clearInterval(intervalRef.current);
    setCurrentIdx(idx);
    setProgress(0);
  };

  const current = movie?.[currentIdx];
  const bg = current ? (MOOD_GRADIENTS[current.mood] || MOOD_GRADIENTS.romantic) : 'var(--bg-deep)';

  // ── No memories yet ──
  if (memories.length === 0 && !loading) {
    return (
      <div className="movie-page">
        <div className="movie-empty">
          <FiFilm style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }} />
          <h2>No Memories Yet</h2>
          <p>Add some memories first to generate your Relationship Movie.</p>
          <button className="movie-btn-primary" onClick={() => navigate('/memories')}>
            Go to Memories
          </button>
          <button className="movie-btn-ghost" onClick={() => navigate('/chat')}>
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  // ── Landing / Generate screen ──
  if (!movie) {
    return (
      <div className="movie-page">
        <div className="movie-landing">
          <button className="movie-back-btn" onClick={() => navigate('/chat')}>
            <FiArrowLeft /> Back
          </button>

          <motion.div
            className="movie-landing-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="movie-landing-icon">
              <HeartSVG />
            </div>
            <h1 className="movie-title">Our Story</h1>
            <p className="movie-subtitle">
              {memories.length} memories · AI-crafted into a cinematic journey
            </p>

            {/* Memory preview strip */}
            <div className="movie-preview-strip">
              {memories.slice(0, 6).map((m, i) => (
                <motion.div
                  key={m._id}
                  className="movie-preview-thumb"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {m.mediaType === 'image' ? (
                    <img src={resolveMediaUrl(m.mediaUrl)} alt={m.title} />
                  ) : (
                    <div className="movie-preview-audio">♪</div>
                  )}
                </motion.div>
              ))}
              {memories.length > 6 && (
                <div className="movie-preview-more">+{memories.length - 6}</div>
              )}
            </div>

            <button
              className="movie-generate-btn"
              onClick={generateMovie}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner-small" /> Creating your movie…</>
              ) : (
                <><FiFilm /> Generate Our Movie</>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Movie Player ──
  return (
    <div className="movie-page">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          className="movie-scene"
          style={{ background: bg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Progress bars */}
          <div className="movie-progress-bars">
            {movie.map((_, i) => (
              <div key={i} className="movie-progress-track" onClick={() => goTo(i)}>
                <div
                  className="movie-progress-fill"
                  style={{
                    width: i < currentIdx ? '100%' : i === currentIdx ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="movie-header">
            <button className="movie-back-btn" onClick={() => navigate('/chat')}>
              <FiArrowLeft />
            </button>
            <div className="movie-header-title">
              <HeartSVG />
              <span>Our Story</span>
            </div>
            <span className="movie-chapter-count">
              {currentIdx + 1} / {movie.length}
            </span>
          </div>

          {/* Main content */}
          <div className="movie-content">
            {/* Photo */}
            {current.memory.mediaType === 'image' && current.memory.mediaUrl && (
              <motion.div
                className="movie-photo-frame"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <img src={resolveMediaUrl(current.memory.mediaUrl)} alt={current.memory.title} />
              </motion.div>
            )}

            {/* Chapter info */}
            <motion.div
              className="movie-chapter-info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <p className="movie-date">
                {format(new Date(current.memory.date), 'MMMM yyyy')}
              </p>
              <h2 className="movie-chapter-title">{current.chapterTitle}</h2>
              <p className="movie-narration">{current.narration}</p>
              <div className="movie-music-tag">
                <span>♪</span>
                <span>{current.musicSuggestion}</span>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="movie-controls">
            <button
              className="movie-ctrl-btn"
              onClick={() => goTo(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
            >
              <FiSkipBack />
            </button>
            <button
              className="movie-ctrl-btn movie-ctrl-play"
              onClick={() => setPlaying(p => !p)}
            >
              {playing ? <FiPause /> : <FiPlay />}
            </button>
            <button
              className="movie-ctrl-btn"
              onClick={() => goTo(Math.min(movie.length - 1, currentIdx + 1))}
              disabled={currentIdx === movie.length - 1}
            >
              <FiSkipForward />
            </button>
          </div>

          {/* Regenerate */}
          <button className="movie-regen-btn" onClick={() => { setMovie(null); setPlaying(false); }}>
            Regenerate
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RelationshipMovie;
