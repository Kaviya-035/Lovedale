import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiImage, FiMic, FiSmile, FiX } from 'react-icons/fi';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import api from '../../utils/api';
import PhotoEditor from './PhotoEditor';

const MessageInput = ({ onSendMessage, onTyping, otherUser, replyingTo, setReplyingTo }) => {
  const [text, setText] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingImage, setEditingImage] = useState(null);

  // Hold-to-record state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  const mediaInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const pickerRef = useRef(null);
  const micBtnRef = useRef(null);
  const cancelledRef = useRef(false); // ref so onstop can read latest value

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Hold-to-record handlers ──────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    cancelledRef.current = false;
    setCancelled(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());

        // If cancelled or too short (< 1s), discard
        if (cancelledRef.current || audioChunksRef.current.length === 0) return;

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) return; // discard near-empty recordings

        // Auto-upload and send
        const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
        setUploading(true);
        const formData = new FormData();
        formData.append('media', file);
        formData.append('type', 'voice');
        try {
          const res = await api.post('/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          onSendMessage({ text: '', messageType: 'voice', mediaUrl: res.data.url });
        } catch (err) {
          console.error('Voice upload failed:', err);
          setUploadError('Voice upload failed — is the server running?');
        } finally {
          setUploading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone access denied or unavailable.');
    }
  }, [onSendMessage]);

  const stopRecording = useCallback((cancel = false) => {
    cancelledRef.current = cancel;
    setCancelled(cancel);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Mouse events (desktop)
  const handleMicMouseDown = (e) => {
    e.preventDefault();
    startRecording();
  };
  const handleMicMouseUp = () => {
    if (isRecording) stopRecording(false);
  };
  const handleMicMouseLeave = () => {
    // Dragging finger away = cancel
    if (isRecording) stopRecording(true);
  };

  // Touch events (mobile)
  const handleMicTouchStart = (e) => {
    e.preventDefault();
    startRecording();
  };
  const handleMicTouchEnd = (e) => {
    e.preventDefault();
    if (isRecording) stopRecording(false);
  };
  const handleMicTouchCancel = () => {
    if (isRecording) stopRecording(true);
  };

  // ── Emoji ────────────────────────────────────────────────────────────────

  const handleEmojiSelect = (emoji) => {
    const native = emoji.native;
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newText = text.slice(0, start) + native + text.slice(end);
      setText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + native.length, start + native.length);
      }, 0);
    } else {
      setText(p => p + native);
    }
  };

  // ── Text / image send ────────────────────────────────────────────────────

  const handleTextChange = (e) => {
    setText(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !previewMedia) || uploading) return;
    setShowEmojiPicker(false);

    let mediaUrl = null;
    let messageType = 'text';

    if (previewMedia) {
      setUploading(true);
      const formData = new FormData();
      formData.append('media', previewMedia.file);
      formData.append('type', previewMedia.type);
      try {
        const res = await api.post('/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaUrl = res.data.url;
        messageType = previewMedia.type;
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadError('Upload failed — is the server running?');
        setUploading(false);
        return;
      }
    }

    onSendMessage({ text: text.trim(), messageType, mediaUrl, replyTo: replyingTo?._id });
    setText('');
    setPreviewMedia(null);
    setReplyingTo(null);
    setUploading(false);
    setUploadError('');
    onTyping(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // If it's an image, open the editor
    if (file.type.startsWith('image/')) {
      setEditingImage(file);
    } else {
      // For non-image files (voice), set preview directly
      setPreviewMedia({
        file,
        type: 'voice',
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="message-input-container" style={{ position: 'relative' }}>

      {/* Photo Editor Modal */}
      {editingImage && (
        <PhotoEditor
          imageFile={editingImage}
          onSave={(editedFile) => {
            setPreviewMedia({
              file: editedFile,
              type: 'image',
              previewUrl: URL.createObjectURL(editedFile),
            });
            setEditingImage(null);
          }}
          onCancel={() => setEditingImage(null)}
        />
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={pickerRef} className="emoji-picker-wrapper">
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            maxFrequentRows={2}
            perLine={8}
            emojiSize={22}
            emojiButtonSize={32}
          />
        </div>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <div className="reply-input-preview page-enter">
          <div className="reply-info">
            <span className="reply-label">Replying to {replyingTo.sender?.name}</span>
            <p className="reply-text-preview">
              {replyingTo.text || (replyingTo.messageType === 'image' ? 'Image' : 'Voice Note')}
            </p>
          </div>
          <button className="remove-reply" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
            <FiX />
          </button>
        </div>
      )}

      {/* Image preview */}
      {previewMedia && (
        <div className="media-preview page-enter">
          {previewMedia.type === 'image' ? (
            <img src={previewMedia.previewUrl} alt="Preview" />
          ) : (
            <div className="voice-preview">
              <FiMic style={{ color: 'var(--rose-light)' }} />
              <span>
                Voice Note &nbsp;
                ({previewMedia.file.size > 1024
                  ? (previewMedia.file.size / 1024).toFixed(1) + ' KB'
                  : previewMedia.file.size + ' B'})
              </span>
            </div>
          )}
          <button className="remove-preview" onClick={() => setPreviewMedia(null)} aria-label="Remove">
            <FiX />
          </button>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="upload-error-banner">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError('')}><FiX /></button>
        </div>
      )}

      {/* Recording indicator (shown above input while holding) */}
      {isRecording && (
        <div className="hold-recording-bar page-enter">
          <span className="recording-dot" />
          <span className="recording-timer">{formatDuration(recordingDuration)}</span>
          <span className="hold-hint">Release to send · Swipe away to cancel</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`input-wrapper ${isRecording ? 'recording-active' : ''}`}>
        {/* Image attach */}
        <button type="button" className="icon-btn" onClick={() => mediaInputRef.current.click()} title="Attach image">
          <FiImage />
        </button>
        <input
          type="file"
          ref={mediaInputRef}
          style={{ display: 'none' }}
          accept="image/*,audio/*"
          onChange={handleFileChange}
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder={isRecording ? '🎙 Recording…' : 'Write something sweet…'}
          disabled={isRecording}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowEmojiPicker(false); }}
        />

        {/* Emoji toggle */}
        <button
          type="button"
          className={`icon-btn emoji-toggle-btn ${showEmojiPicker ? 'active' : ''}`}
          title="Emoji"
          onClick={() => setShowEmojiPicker(p => !p)}
          disabled={isRecording}
        >
          <FiSmile />
        </button>

        {/* Send (when text/image) or Hold-to-record mic */}
        {text.trim() || previewMedia ? (
          <button type="submit" className="send-btn" disabled={uploading} aria-label="Send">
            {uploading ? <div className="spinner-small" /> : <FiSend />}
          </button>
        ) : (
          <button
            ref={micBtnRef}
            type="button"
            className={`mic-hold-btn ${isRecording ? 'recording' : ''}`}
            title="Hold to record"
            aria-label="Hold to record voice message"
            onMouseDown={handleMicMouseDown}
            onMouseUp={handleMicMouseUp}
            onMouseLeave={handleMicMouseLeave}
            onTouchStart={handleMicTouchStart}
            onTouchEnd={handleMicTouchEnd}
            onTouchCancel={handleMicTouchCancel}
          >
            <FiMic />
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
