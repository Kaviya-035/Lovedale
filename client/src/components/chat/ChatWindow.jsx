import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';

const EmptyHeartIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.45 }}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#cwHG)"
    />
    <defs>
      <linearGradient id="cwHG" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" />
      </linearGradient>
    </defs>
  </svg>
);

const ChatWindow = ({ messages, currentUserId, onDelete, onEdit, onReact, onReply, otherUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-window">
      <div className="messages-list">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="no-messages"
            >
              <div className="heart-icon"><EmptyHeartIcon /></div>
              <p>Start your romantic journey here…</p>
            </motion.div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={(message.sender?._id || message.sender) === currentUserId}
                onDelete={onDelete}
                onEdit={onEdit}
                onReact={onReact}
                onReply={onReply}
              />
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
