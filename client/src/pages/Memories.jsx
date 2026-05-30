import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiArrowLeft, FiPlay, FiUploadCloud, FiX, FiImage, FiMic, FiEdit3 } from 'react-icons/fi';
import api from '../utils/api';
import FloatingStickers from '../components/FloatingStickers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import PhotoEditor from '../components/chat/PhotoEditor';

const Memories = () => {
  const [memories, setMemories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => { fetchMemories(); }, []);

  const fetchMemories = async () => {
    try {
      const res = await api.get('/memories');
      setMemories(res.data);
    } catch (err) {
      console.error('Error fetching memories:', err);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    
    if (selectedFile.type.startsWith('image/')) {
      // Open photo editor for images
      setEditingImage(selectedFile);
      setShowPhotoEditor(true);
    } else {
      // Audio files go directly to preview
      setFile(selectedFile);
      setFilePreview({ type: 'audio', name: selectedFile.name });
    }
  };

  const handlePhotoEditorSave = (editedFile) => {
    setFile(editedFile);
    setFilePreview({ url: URL.createObjectURL(editedFile), type: 'image' });
    setShowPhotoEditor(false);
    setEditingImage(null);
  };

  const handlePhotoEditorCancel = () => {
    setShowPhotoEditor(false);
    setEditingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditPhoto = () => {
    if (file && file.type.startsWith('image/')) {
      setEditingImage(file);
      setShowPhotoEditor(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeModal = () => {
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    clearFile();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      const fileType = file.type.startsWith('image/') ? 'image' : 'voice';
      formData.append('type', fileType);

      const uploadRes = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const res = await api.post('/memories', {
        title: title.trim(),
        description: description.trim(),
        mediaUrl: uploadRes.data.url,
        mediaType: fileType,
      });

      setMemories([res.data, ...memories]);
      closeModal();
    } catch (err) {
      console.error('Error uploading memory:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this memory?')) return;
    try {
      await api.delete(`/memories/${id}`);
      setMemories(memories.filter(m => m._id !== id));
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  return (
    <div className="memories-page mood-romantic">
      <FloatingStickers count={12} />
      <div className="memories-container page-enter">
        <header className="memories-header">
          <button onClick={() => navigate('/chat')} className="back-btn">
            <FiArrowLeft /> Back
          </button>
          <h2>Our Memories</h2>
          <button onClick={() => setShowAddModal(true)} className="add-memory-btn">
            <FiPlus /> Add Memory
          </button>
        </header>

        <div className="masonry-gallery">
          {memories.length === 0 ? (
            <div className="no-memories">
              <FiImage style={{ fontSize: '3rem', opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} />
              <p>No memories yet. Add your first magical moment!</p>
            </div>
          ) : (
            memories.map(memory => (
              <motion.div
                key={memory._id}
                className="memory-card"
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="memory-image-container">
                  {memory.mediaType === 'image' ? (
                    <img
                      src={memory.mediaUrl}
                      alt={memory.title}
                    />
                  ) : (
                    <div className="memory-voice-placeholder">
                      <FiPlay style={{ fontSize: '2.5rem' }} />
                    </div>
                  )}
                </div>
                <div className="memory-card-info">
                  <h3>{memory.title}</h3>
                  <p>{format(new Date(memory.date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="memory-hover-actions" style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  display: 'flex', gap: '0.5rem', opacity: 0, transition: 'opacity 0.3s',
                }}>
                  {memory.uploadedBy._id === user._id && (
                    <button className="delete-memory-btn" onClick={() => handleDelete(memory._id)}>
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── Add Memory Modal ── */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.target === e.currentTarget && closeModal()}
            >
              <motion.div
                className="modal-content memory-modal"
                initial={{ y: 40, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              >
                <button className="close-modal-btn" onClick={closeModal} aria-label="Close">
                  <FiX />
                </button>

                <div className="memory-modal-header">
                  <h3>Add a Memory</h3>
                  <p>Capture a moment you never want to forget</p>
                </div>

                <form onSubmit={handleUpload} className="memory-form">
                  {/* Title */}
                  <div className="memory-field">
                    <label>Title</label>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Give this memory a name…"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="memory-field">
                    <label>Description <span className="optional-tag">optional</span></label>
                    <textarea
                      className="modal-input"
                      placeholder="What made this moment special?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  {/* File drop zone */}
                  <div className="memory-field">
                    <label>Photo or Audio</label>
                    {!filePreview ? (
                      <div
                        className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
                        onClick={() => fileInputRef.current.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                      >
                        <FiUploadCloud className="drop-icon" />
                        <p className="drop-label">Drop a photo or audio here</p>
                        <p className="drop-sub">or <span>click to browse</span></p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*,audio/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileSelect(e.target.files[0])}
                        />
                      </div>
                    ) : (
                      <div className="file-preview-box">
                        {filePreview.type === 'image' ? (
                          <>
                            <img src={filePreview.url} alt="Preview" className="file-preview-img" />
                            <div className="file-preview-actions">
                              <button
                                type="button"
                                className="file-preview-edit"
                                onClick={handleEditPhoto}
                                aria-label="Edit photo"
                                title="Edit photo"
                              >
                                <FiEdit3 />
                              </button>
                              <button
                                type="button"
                                className="file-preview-remove"
                                onClick={clearFile}
                                aria-label="Remove file"
                              >
                                <FiX />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="file-preview-audio">
                            <FiMic style={{ fontSize: '2rem', color: 'var(--rose-light)' }} />
                            <span>{filePreview.name}</span>
                            <button
                              type="button"
                              className="file-preview-remove"
                              onClick={clearFile}
                              aria-label="Remove file"
                            >
                              <FiX />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button type="button" onClick={closeModal} className="cancel-btn">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={isUploading || !file || !title.trim()}
                    >
                      {isUploading ? (
                        <><div className="spinner-small" /> Saving…</>
                      ) : (
                        'Save Memory'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Editor Modal */}
        {showPhotoEditor && editingImage && (
          <PhotoEditor
            imageFile={editingImage}
            onSave={handlePhotoEditorSave}
            onCancel={handlePhotoEditorCancel}
          />
        )}
      </div>
    </div>
  );
};

export default Memories;
