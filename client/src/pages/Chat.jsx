import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../utils/api';
import ChatWindow from '../components/chat/ChatWindow';
import MessageInput from '../components/chat/MessageInput';
import WeatherEffects from '../components/WeatherEffects';
import FloatingHearts from '../components/FloatingHearts';
import AIAssistantModal from '../components/chat/AIAssistantModal';
import FloatingStickers from '../components/FloatingStickers';
import { AnimatePresence } from 'framer-motion';
import { FaFire } from 'react-icons/fa';
import { FiCpu, FiImage, FiUser, FiLogOut, FiCircle, FiFilm } from 'react-icons/fi';
import { ThinkingOfYouButton, ThinkingOfYouToast, HeartBurst } from '../components/ThinkingOfYou';

/* Inline SVG heart for sidebar logo */
const HeartLogo = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto' }}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#slg)"
    />
    <defs>
      <linearGradient id="slg" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" />
        <stop offset="1" stopColor="#9d4edd" />
      </linearGradient>
    </defs>
  </svg>
);

const Chat = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentMood, setCurrentMood] = useState('normal');
  const [streak, setStreak] = useState(user?.currentStreak || 0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [toyNotif, setToyNotif] = useState(null);   // { from } when received
  const [toyBurst, setToyBurst] = useState(false);  // heart burst animation
  const [toyCooldown, setToyCooldown] = useState(false); // 30s cooldown after sending
  const socketRef = useRef(null);

  useEffect(() => {
    // In production point to Render backend; in dev use relative (Vite proxy)
    const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

    // Initialize Socket
    socketRef.current = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('lovedale_token') },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected successfully');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    // Fetch other user (in a couple app, there's likely only one other user)
    const fetchOtherUser = async () => {
      try {
        const res = await api.get('/auth/users');
        const partner = res.data.find(u => u._id !== user._id);
        if (partner) {
          setOtherUser(partner);
          // Fetch chat history
          const msgRes = await api.get(`/messages/${partner._id}`);
          setMessages(msgRes.data);
        }
      } catch (err) {
        console.error('Error fetching users/history:', err);
      }
    };

    fetchOtherUser();

    // Socket listeners
    socketRef.current.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      // Mark as seen
      const senderId = message.sender?._id || message.sender;
      socketRef.current.emit('messageSeen', { messageId: message._id, senderId });
    });

    socketRef.current.on('messageSent', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('messageStatusUpdate', ({ messageId, status }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, status } : m));
    });

    socketRef.current.on('messageUpdated', (updatedMessage) => {
      setMessages((prev) => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
    });

    socketRef.current.on('messageDeleted', (messageId) => {
      setMessages((prev) => prev.filter(m => m._id !== messageId));
    });

    socketRef.current.on('userTyping', (typingUserId) => {
      if (typingUserId === otherUser?._id) setIsTyping(true);
    });

    socketRef.current.on('userStopTyping', (typingUserId) => {
      if (typingUserId === otherUser?._id) setIsTyping(false);
    });

    socketRef.current.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('streakUpdated', (newStreak) => {
      setStreak(newStreak);
    });

    socketRef.current.on('moodChanged', (newMood) => {
      setCurrentMood(newMood);
    });

    // "Thinking of You" events
    socketRef.current.on('thinkingOfYouReceived', ({ from }) => {
      setToyNotif({ from });
      setToyBurst(true);
    });
    socketRef.current.on('thinkingOfYouSent', () => {
      setToyCooldown(true);
      setTimeout(() => setToyCooldown(false), 30000); // 30s cooldown
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [user._id]);

  const sendMessage = (messageData) => {
    if (!otherUser) return;
    socketRef.current.emit('sendMessage', {
      ...messageData,
      receiverId: otherUser._id,
    });
  };

  const handleTyping = (isTyping) => {
    if (!otherUser) return;
    if (isTyping) {
      socketRef.current.emit('typing', otherUser._id);
    } else {
      socketRef.current.emit('stopTyping', otherUser._id);
    }
  };

  const deleteMessage = (messageId) => {
    socketRef.current.emit('deleteMessage', { messageId, receiverId: otherUser._id });
  };

  const editMessage = (messageId, newText) => {
    socketRef.current.emit('editMessage', { messageId, newText, receiverId: otherUser._id });
  };

  const reactToMessage = (messageId, emoji) => {
    socketRef.current.emit('reactMessage', { messageId, emoji, receiverId: otherUser._id });
  };

  const sendThinkingOfYou = () => {
    if (!otherUser || toyCooldown) return;
    socketRef.current.emit('thinkingOfYou', { receiverId: otherUser._id });
  };

  const isPartnerOnline = onlineUsers.includes(otherUser?._id);

  return (
    <div className={`chat-page mood-${currentMood}`}>
      <WeatherEffects mood={currentMood} />
      <FloatingStickers count={8} />
      {currentMood === 'romantic' && <FloatingHearts count={10} />}

      <div className="chat-container">
        {/* ── Sidebar ── */}
        <aside className="chat-sidebar">
          <div className="sidebar-branding">
            <div className="sidebar-logo">
              <HeartLogo />
            </div>
            <h1>Lovedale</h1>
          </div>

          <div className="partner-card-mini">
            <div className="partner-avatar-large">
              {otherUser?.profilePicture ? (
                <img
                  src={otherUser.profilePicture}
                  alt={otherUser.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                otherUser?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <h3>{otherUser?.name || 'Your Partner'}</h3>
            <p className="status-text" style={{ justifyContent: 'center', marginTop: '0.4rem' }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isPartnerOnline ? '#22c55e' : 'rgba(255,255,255,0.25)',
                  display: 'inline-block',
                  boxShadow: isPartnerOnline ? '0 0 6px #22c55e' : 'none',
                }}
              />
              {isPartnerOnline ? 'Online' : 'Offline'}
            </p>
          </div>

          <div className="sidebar-footer">
            {streak > 0 && (
              <div className="streak-badge-large">
                <FaFire />
                {streak} Day Streak
              </div>
            )}
            <ThinkingOfYouButton onClick={sendThinkingOfYou} cooldown={toyCooldown} />
            <button className="movie-sidebar-btn" onClick={() => navigate('/movie')}>
              <FiFilm /> Our Movie
            </button>
          </div>
        </aside>

        {/* ── Main Chat ── */}
        <main className="chat-main">
          <header className="chat-header">
            <div className="user-info">
              <div className="avatar-wrapper">
                <div className="avatar-placeholder">
                  {otherUser?.name?.[0]?.toUpperCase() || '?'}
                </div>
                {isPartnerOnline && <span className="online-indicator" />}
              </div>
              <div className="user-details">
                <h2>{otherUser?.name || 'Partner'}</h2>
                {isTyping
                  ? <p className="typing-text">typing a message…</p>
                  : <p className="status-text">{isPartnerOnline ? 'Active now' : 'Offline'}</p>
                }
              </div>
            </div>

            <div className="header-actions">
              <button
                onClick={() => setShowAIModal(true)}
                className="header-icon-btn"
                title="Love Guru"
              >
                <FiCpu />
              </button>
              <button
                onClick={() => navigate('/memories')}
                className="header-icon-btn"
                title="Memories"
              >
                <FiImage />
              </button>
              <button
                onClick={() => navigate('/status')}
                className="header-icon-btn"
                title="Status"
              >
                <FiCircle />
              </button>
              <button
                onClick={() => navigate('/movie')}
                className="header-icon-btn"
                title="Our Movie"
              >
                <FiFilm />
              </button>

              <select
                value={currentMood}
                onChange={(e) => {
                  const newMood = e.target.value;
                  setCurrentMood(newMood);
                  if (otherUser) {
                    socketRef.current.emit('changeMood', { mood: newMood, receiverId: otherUser._id });
                  }
                }}
                className="mood-selector"
              >
                <option value="normal">Mood</option>
                <option value="romantic">Romantic</option>
                <option value="missing">Missing You</option>
                <option value="night">Night Talk</option>
              </select>

              <button onClick={() => navigate('/profile')} className="header-nav-btn">
                <FiUser style={{ marginRight: '0.35rem' }} /> Profile
              </button>
              <button onClick={logout} className="header-logout-btn">
                <FiLogOut style={{ marginRight: '0.35rem' }} /> Logout
              </button>
            </div>
          </header>

          <ChatWindow
            messages={messages}
            currentUserId={user._id}
            onDelete={deleteMessage}
            onEdit={editMessage}
            onReact={reactToMessage}
            onReply={setReplyingTo}
            otherUser={otherUser}
          />

          <MessageInput
            onSendMessage={sendMessage}
            onTyping={handleTyping}
            otherUser={otherUser}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
          />
        </main>
      </div>

      <AIAssistantModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />

      {/* "Thinking of You" notifications */}
      <AnimatePresence>
        {toyNotif && (
          <ThinkingOfYouToast
            from={toyNotif.from}
            onClose={() => setToyNotif(null)}
          />
        )}
      </AnimatePresence>
      {toyBurst && <HeartBurst onDone={() => setToyBurst(false)} />}
    </div>
  );
};

export default Chat;
