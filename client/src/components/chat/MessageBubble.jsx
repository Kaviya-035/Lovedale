import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiHeart } from 'react-icons/fi';
import { FaReply } from 'react-icons/fa';
import { format } from 'date-fns';
import { resolveMediaUrl } from '../../utils/api';

/* ── Status reference card (shown above reply/mention messages) ── */
const StatusRefCard = ({ statusRef }) => {
  if (!statusRef) return null;

  const { statusType, mediaUrl, text, bgColor, songTitle, songArtwork, posterName } = statusRef;

  return (
    <div className="status-ref-card">
      {/* Thumbnail */}
      <div className="status-ref-thumb">
        {statusType === 'image' && mediaUrl && (
          <img src={resolveMediaUrl(mediaUrl)} alt="status" />
        )}
        {statusType === 'text' && (
          <div className="status-ref-text-thumb" style={{ background: bgColor || 'linear-gradient(135deg,#4a1942,#9d4edd)' }}>
            <span>{text?.slice(0, 40)}{text?.length > 40 ? '…' : ''}</span>
          </div>
        )}
        {statusType === 'music' && songArtwork && (
          <img src={songArtwork} alt={songTitle} />
        )}
        {statusType === 'video' && (
          <div className="status-ref-text-thumb" style={{ background: '#1a0a18' }}>
            <span style={{ fontSize: '1.2rem' }}>▶</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="status-ref-info">
        <span className="status-ref-label">
          {posterName ? `${posterName}'s status` : 'Status'}
        </span>
        {statusType === 'music' && songTitle && (
          <span className="status-ref-sub">{songTitle}</span>
        )}
        {statusType === 'text' && text && (
          <span className="status-ref-sub">{text.slice(0, 35)}{text.length > 35 ? '…' : ''}</span>
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isOwnMessage, onDelete, onEdit, onReact, onReply }) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleEdit = () => {
    onEdit(message._id, editText);
    setIsEditing(false);
  };

  const getStatusIcon = () => {
    if (message.status === 'seen') return <span className="status-seen">✓✓</span>;
    if (message.status === 'delivered') return <span className="status-delivered">✓✓</span>;
    return <span className="status-sent">✓</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`message-bubble-wrapper ${isOwnMessage ? 'own' : 'partner'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message-content-container">
        {message.replyTo && (
          <div className="reply-preview">
            <span className="reply-sender">
              {(message.replyTo.sender?._id || message.replyTo.sender) === (message.sender?._id || message.sender) ? 'You' : 'Partner'}
            </span>
            <p>{message.replyTo.text || (message.replyTo.messageType === 'image' ? 'Image' : 'Voice')}</p>
          </div>
        )}

        <div className="message-bubble">
          {/* Status reference card — shown for status replies/mentions */}
          {message.statusRef && <StatusRefCard statusRef={message.statusRef} />}

          {message.messageType === 'text' && (
            isEditing ? (
              <div className="edit-mode">
                <textarea 
                  value={editText} 
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
                <div className="edit-actions">
                  <button onClick={() => setIsEditing(false)}>Cancel</button>
                  <button onClick={handleEdit}>Save</button>
                </div>
              </div>
            ) : (
              <p className="message-text">{message.text}</p>
            )
          )}

          {message.messageType === 'image' && message.mediaUrl && (
            <div className="message-image-wrapper">
              <img
                src={resolveMediaUrl(message.mediaUrl)}
                alt="Sent image"
                className="message-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="image-error" style={{ display: 'none' }}>
                Could not load image
              </div>
            </div>
          )}

          {message.messageType === 'voice' && message.mediaUrl && (
            <audio controls className="message-voice">
              <source src={resolveMediaUrl(message.mediaUrl)} />
            </audio>
          )}

          <div className="message-footer">
            <span className="message-time">
              {format(new Date(message.createdAt), 'hh:mm a')}
              {message.isEdited && <span className="edited-tag"> (edited)</span>}
            </span>
            {isOwnMessage && <span className="status-indicator">{getStatusIcon()}</span>}
          </div>

          {message.reactions?.length > 0 && (
            <div className="message-reactions">
              {message.reactions.map((r, i) => (
                <span key={i} className="reaction-emoji">{r.emoji}</span>
              ))}
            </div>
          )}
        </div>

        {showActions && !isEditing && (
          <motion.div 
            initial={{ opacity: 0, x: isOwnMessage ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="message-actions"
          >
            <button title="React" onClick={() => onReact(message._id, '❤️')}><FiHeart /></button>
            <button title="Reply" onClick={() => onReply(message)}><FaReply /></button>
            {isOwnMessage && (
              <>
                <button title="Edit" onClick={() => setIsEditing(true)}><FiEdit2 /></button>
                <button title="Delete" onClick={() => onDelete(message._id)}><FiTrash2 /></button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
