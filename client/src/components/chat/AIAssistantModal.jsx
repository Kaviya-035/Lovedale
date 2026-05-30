import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend } from 'react-icons/fi';
import { FaCalendarAlt, FaHeart, FaMagic } from 'react-icons/fa';
import api from '../../utils/api';

/* Sparkle SVG icon for the header */
const SparkleIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
      stroke="url(#spk)" strokeWidth="2" strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="3.5" fill="url(#spk2)" />
    <defs>
      <linearGradient id="spk" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fb7185" /><stop offset="1" stopColor="#c084fc" />
      </linearGradient>
      <linearGradient id="spk2" x1="8.5" y1="8.5" x2="15.5" y2="15.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" />
      </linearGradient>
    </defs>
  </svg>
);

const AIAssistantModal = ({ isOpen, onClose }) => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');

  const askAI = async (type, customPrompt = '') => {
    setLoading(true);
    setResponse('');
    try {
      const res = await api.post('/ai/ask', {
        prompt: customPrompt || 'Give me something romantic.',
        type,
      });
      setResponse(res.data.text);
    } catch (err) {
      setResponse(err.response?.data?.message || 'Error connecting to Love Guru.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    askAI('custom', prompt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay ai-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content ai-modal-content"
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <button className="close-modal-btn" onClick={onClose} aria-label="Close">
              <FiX />
            </button>

            {/* Header banner */}
            <div className="ai-header-banner">
              <SparkleIcon />
              <h3>Love Guru</h3>
              <p>Magic advice for your romance</p>
            </div>

            <div className="ai-modal-body">
              {/* Response area */}
              <div className="ai-response-area">
                {loading ? (
                  <div className="ai-loading">
                    <FaMagic className="spin" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.9rem' }}>Brewing some magic…</p>
                  </div>
                ) : (
                  response && (
                    <div className="ai-response-bubble">{response}</div>
                  )
                )}
              </div>

              {/* Quick action buttons */}
              <div className="ai-btn-group">
                <button
                  onClick={() => askAI('date_ideas')}
                  className="ai-premium-btn"
                  disabled={loading}
                >
                  <FaCalendarAlt />
                  <span>Date Ideas</span>
                </button>
                <button
                  onClick={() => askAI('message_help', 'Help me write a sweet good morning text')}
                  className="ai-premium-btn"
                  disabled={loading}
                >
                  <FaHeart />
                  <span>Sweet Text</span>
                </button>
              </div>

              {/* Custom prompt */}
              <form onSubmit={handleCustomSubmit} className="ai-custom-input-wrapper">
                <input
                  type="text"
                  placeholder="Ask the Guru anything…"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <button type="submit" className="ai-magic-btn" disabled={loading} aria-label="Send">
                  <FiSend style={{ fontSize: '0.95rem' }} />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantModal;
