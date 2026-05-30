import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiArrowLeft, FiTrash2, FiType, FiImage, FiMusic,
  FiX, FiSearch, FiPlay, FiPause, FiEye, FiVideo, FiScissors,
  FiSend, FiMessageCircle, FiAtSign, FiEdit3,
} from 'react-icons/fi';
import api, { resolveMediaUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import PhotoEditor from '../components/chat/PhotoEditor';

const DURATION = 30000; // 30 seconds per status

const BG_PRESETS = [
  { label: 'Plum',   value: 'linear-gradient(135deg,#4a1942,#9d4edd)' },
  { label: 'Rose',   value: 'linear-gradient(135deg,#e11d48,#f43f5e)' },
  { label: 'Sunset', value: 'linear-gradient(135deg,#f43f5e,#f97316)' },
  { label: 'Ocean',  value: 'linear-gradient(135deg,#0ea5e9,#6366f1)' },
  { label: 'Forest', value: 'linear-gradient(135deg,#065f46,#10b981)' },
  { label: 'Night',  value: 'linear-gradient(135deg,#0f0c29,#302b63)' },
  { label: 'Gold',   value: 'linear-gradient(135deg,#92400e,#d4a853)' },
  { label: 'Cherry', value: 'linear-gradient(135deg,#831843,#ec4899)' },
];

const searchSongs = async (q) => {
  if (!q.trim()) return [];
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=25&entity=song`
  );
  const data = await res.json();
  return data.results || [];
};

const fmtSec = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ══════════════════════════════════════════════════════════
   SONG TRIM PICKER
   — Shows the FULL song timeline using trackTimeMillis.
     User drags a 30-second selection window anywhere on it.
     Playback maps the chosen position proportionally into
     the 30s iTunes preview.
   ══════════════════════════════════════════════════════════ */
const BAR_COUNT = 48;
const CLIP_SEC  = 30;

const SongTrimPicker = ({ song, startSec, onChange }) => {
  const audioRef  = useRef(null);
  const scrubRef  = useRef(null);
  const rafRef    = useRef(null);
  const isDragging = useRef(false);

  const [playing,  setPlaying]  = useState(false);
  const [currentT, setCurrentT] = useState(startSec); // position in FULL song seconds
  const [previewDur, setPreviewDur] = useState(30);   // actual preview audio duration

  // Full song duration from iTunes metadata (ms → s)
  const fullDur = song.trackTimeMillis ? song.trackTimeMillis / 1000 : 240;

  // Stable fake waveform heights per song
  const [bars] = useState(() =>
    Array.from({ length: BAR_COUNT }, (_, i) => {
      // Make it look like a real waveform — louder in middle
      const pos = i / BAR_COUNT;
      const base = 0.2 + Math.random() * 0.5;
      const envelope = Math.sin(pos * Math.PI) * 0.3;
      return Math.min(1, base + envelope);
    })
  );

  // Map full-song position → preview audio time
  const toPreviewTime = (fullSongSec) => {
    const ratio = Math.min(1, fullSongSec / fullDur);
    return ratio * previewDur;
  };

  // RAF loop to sync playhead while playing
  useEffect(() => {
    const tick = () => {
      const a = audioRef.current;
      if (a && !a.paused) {
        // Map preview time back to full-song position
        const ratio = previewDur > 0 ? a.currentTime / previewDur : 0;
        setCurrentT(ratio * fullDur);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    if (playing) rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, previewDur, fullDur]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.currentTime = toPreviewTime(startSec);
      a.play().catch(() => {});
      setPlaying(true);
      // Auto-stop after 30s clip
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setPlaying(false);
        }
      }, CLIP_SEC * 1000);
    }
  };

  // Seek: click/drag on waveform moves the 30s window start
  const seekFromEvent = (e) => {
    if (!scrubRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    // Clamp so the 30s window fits within the full song
    const maxStart = Math.max(0, fullDur - CLIP_SEC);
    const newStart = Math.min(ratio * fullDur, maxStart);
    onChange(parseFloat(newStart.toFixed(2)));
    setCurrentT(newStart);
    if (audioRef.current) {
      audioRef.current.currentTime = toPreviewTime(newStart);
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    seekFromEvent(e);
    const onMove = (ev) => { if (isDragging.current) seekFromEvent(ev); };
    const onUp   = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchStart = (e) => {
    seekFromEvent(e);
    const onMove = (ev) => seekFromEvent(ev);
    const onEnd  = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
  };

  // Where the playhead sits on the waveform (0–100%)
  const playheadPct = fullDur > 0 ? (currentT / fullDur) * 100 : 0;
  // Where the 30s selection window starts/ends (0–100%)
  const clipStartPct = (startSec / fullDur) * 100;
  const clipEndPct   = Math.min(100, ((startSec + CLIP_SEC) / fullDur) * 100);

  return (
    <div className="song-trim-box">
      <audio
        ref={audioRef}
        src={song.previewUrl}
        onLoadedMetadata={e => setPreviewDur(e.target.duration || 30)}
        onEnded={() => { setPlaying(false); }}
        style={{ display: 'none' }}
      />

      {/* Song info + play button */}
      <div className="song-trim-header">
        <img src={song.artworkUrl100} alt={song.trackName} className="song-artwork" />
        <div className="song-info" style={{ flex: 1 }}>
          <p className="song-title">{song.trackName}</p>
          <p className="song-artist">{song.artistName}</p>
        </div>
        <button className="song-preview-btn" onClick={togglePlay} style={{ width: 38, height: 38 }}>
          {playing ? <FiPause /> : <FiPlay />}
        </button>
      </div>

      {/* Label */}
      <div className="song-trim-label">
        <FiScissors style={{ fontSize: '0.85rem' }} />
        <span>Drag to choose your 30s clip</span>
        <span className="song-trim-time">
          {fmtSec(startSec)} – {fmtSec(Math.min(startSec + CLIP_SEC, fullDur))}
        </span>
      </div>

      {/* Waveform scrubber — full song timeline */}
      <div
        ref={scrubRef}
        className="waveform-scrubber"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 30s selection highlight */}
        <div
          className="waveform-clip-highlight"
          style={{ left: `${clipStartPct}%`, width: `${clipEndPct - clipStartPct}%` }}
        />

        <div className="waveform-bars">
          {bars.map((h, i) => {
            const barPct  = (i / BAR_COUNT) * 100;
            const inClip  = barPct >= clipStartPct && barPct < clipEndPct;
            const isPast  = barPct < playheadPct;
            return (
              <div
                key={i}
                className="waveform-bar"
                style={{
                  height: `${h * 100}%`,
                  background: inClip
                    ? (isPast ? 'var(--rose)' : 'rgba(244,63,94,0.55)')
                    : 'rgba(255,255,255,0.18)',
                  transition: 'background 0.1s',
                }}
              />
            );
          })}
        </div>

        {/* Playhead */}
        <div className="waveform-playhead" style={{ left: `${playheadPct}%` }} />

        {/* Clip start/end handles */}
        <div className="waveform-clip-handle waveform-clip-handle-start"
          style={{ left: `${clipStartPct}%` }} />
        <div className="waveform-clip-handle waveform-clip-handle-end"
          style={{ left: `${clipEndPct}%` }} />
      </div>

      <div className="waveform-time-row">
        <span>0:00</span>
        <span style={{ color: 'var(--rose-light)', fontWeight: 600, fontSize: '0.78rem' }}>
          ▶ {fmtSec(startSec)} → {fmtSec(Math.min(startSec + CLIP_SEC, fullDur))}
        </span>
        <span>{fmtSec(fullDur)}</span>
      </div>

      <p className="song-trim-hint">Drag on the waveform to move the 30s clip window</p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MUSIC PICKER PANEL (reused in both image & music tabs)
   ══════════════════════════════════════════════════════════ */
const MusicPicker = ({ selectedSong, songStartSec, onSelect, onStartChange, onRemove }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const audioRef = useRef(null);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try { setResults(await searchSongs(query)); }
    catch (e) { console.error(e); }
    finally { setSearching(false); }
  };

  const togglePreview = (url) => {
    if (previewUrl === url) { audioRef.current?.pause(); setPreviewUrl(null); }
    else { setPreviewUrl(url); setTimeout(() => audioRef.current?.play(), 50); }
  };

  return (
    <div className="music-picker-panel">
      <audio ref={audioRef} src={previewUrl || ''} style={{ display: 'none' }} onEnded={() => setPreviewUrl(null)} />

      {selectedSong ? (
        <SongTrimPicker song={selectedSong} startSec={songStartSec} onChange={onStartChange} />
      ) : (
        <>
          <div className="status-search-row">
            <input
              type="text"
              className="modal-input"
              placeholder="Search songs, artists, any language…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              style={{ marginBottom: 0 }}
            />
            <button className="status-search-btn" onClick={doSearch} disabled={searching}>
              {searching ? <div className="spinner-small" /> : <FiSearch />}
            </button>
          </div>
          <div className="status-song-results">
            {results.map(song => (
              <div key={song.trackId} className="status-song-row" onClick={() => onSelect(song)}>
                <img src={song.artworkUrl100} alt={song.trackName} className="song-artwork" />
                <div className="song-info">
                  <p className="song-title">{song.trackName}</p>
                  <p className="song-artist">{song.artistName} · {song.primaryGenreName}</p>
                </div>
                {song.previewUrl && (
                  <button className="song-preview-btn" onClick={e => { e.stopPropagation(); togglePreview(song.previewUrl); }}>
                    {previewUrl === song.previewUrl ? <FiPause /> : <FiPlay />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {selectedSong && (
        <button className="song-remove-full-btn" onClick={onRemove}>
          <FiX /> Remove song
        </button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   STATUS VIEWER — 30s per status
   ══════════════════════════════════════════════════════════ */
const StatusViewer = ({ statuses, startIndex, onClose, currentUserId, onDelete }) => {
  const [idx, setIdx]           = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [sending, setSending]   = useState(false);

  // Helper — safely stringify a Mongoose _id (object or string)
  const sid = (id) => (id?._id || id)?.toString() ?? '';

  // likedIds: Set of status IDs the user has liked (initialised from server data)
  const [likedIds, setLikedIds] = useState(() => {
    const set = new Set();
    statuses.forEach(s => {
      if (s.likedBy?.some(id => sid(id) === currentUserId)) set.add(s._id);
    });
    return set;
  });

  const audioRef     = useRef(null);
  const intervalRef  = useRef(null);
  const progressRef  = useRef(0);
  const replyInputRef = useRef(null);

  const current = statuses[idx];

  const goNext = useCallback(() => {
    if (idx < statuses.length - 1) setIdx(i => i + 1);
    else onClose();
  }, [idx, statuses.length, onClose]);

  // Reset + start timer on each status
  useEffect(() => {
    if (!current) return;
    setShowReply(false);
    setReplyText('');

    // Mark viewed — only when it's NOT your own status
    if (sid(current.postedBy._id) !== currentUserId) {
      api.patch(`/status/${current._id}/view`).catch(() => {});
    }

    // Music
    const a = audioRef.current;
    if (a) {
      a.pause(); a.src = '';
      if (current.songPreviewUrl) {
        a.src = current.songPreviewUrl;
        a.currentTime = current.songStartSec || 0;
        a.play().catch(() => {});
      }
    }

    // 30s progress bar
    progressRef.current = 0;
    setProgress(0);
    clearInterval(intervalRef.current);
    const tick = 100;
    intervalRef.current = setInterval(() => {
      progressRef.current += (100 / (DURATION / tick));
      if (progressRef.current >= 100) {
        clearInterval(intervalRef.current);
        if (a) { a.pause(); a.src = ''; }
        goNext();
      } else {
        setProgress(progressRef.current);
      }
    }, tick);

    return () => {
      clearInterval(intervalRef.current);
      if (a) { a.pause(); a.src = ''; }
    };
  }, [idx]);

  // Pause timer while reply input is open
  useEffect(() => {
    if (showReply) {
      clearInterval(intervalRef.current);
      setTimeout(() => replyInputRef.current?.focus(), 80);
    }
  }, [showReply]);

  // ── Like (server-persisted) ──────────────────────────────
  const handleLike = async () => {
    try {
      const res = await api.patch(`/status/${current._id}/like`);
      setLikedIds(prev => {
        const next = new Set(prev);
        if (res.data.liked) next.add(current._id);
        else next.delete(current._id);
        return next;
      });
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  // ── Send reply / mention as a real chat message with status snapshot ──
  const buildStatusRef = () => ({
    statusId:    current._id,
    statusType:  current.type,
    mediaUrl:    current.mediaUrl || null,
    text:        current.text || null,
    bgColor:     current.bgColor || null,
    songTitle:   current.songTitle || null,
    songArtwork: current.songArtwork || null,
    posterName:  current.postedBy.name,
  });

  const sendChatMessage = async (text, receiverId) => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post('/messages/send', {
        receiverId,
        text,
        statusRef: buildStatusRef(),
      });
    } catch (err) {
      console.error('Reply send failed:', err);
    } finally {
      setSending(false);
      setReplyText('');
      setShowReply(false);
    }
  };

  const handleReply = () => {
    // Reply goes to the status poster
    const msg = replyText.trim();
    sendChatMessage(msg, current.postedBy._id);
  };

  const handleMention = () => {
    // Mention: open reply pre-filled with @Name
    // Also immediately notify the poster that they were mentioned
    const posterName = current.postedBy.name;
    setShowReply(true);
    setReplyText(`@${posterName} `);
  };

  if (!current) return null;

  const isOwn   = sid(current.postedBy._id) === currentUserId;
  const isLiked = likedIds.has(current._id);

  return (
    <motion.div
      className="status-viewer-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="status-viewer"
        initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
        onClick={e => e.stopPropagation()}
      >
        <audio ref={audioRef} style={{ display: 'none' }} />

        {/* Progress bars */}
        <div className="status-progress-bars">
          {statuses.map((_, i) => (
            <div key={i} className="status-progress-track">
              <div className="status-progress-fill"
                style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="status-viewer-header">
          <div className="status-viewer-user">
            <div className="status-viewer-avatar">{current.postedBy.name?.[0]?.toUpperCase()}</div>
            <div>
              <p className="status-viewer-name">{current.postedBy.name}</p>
              <p className="status-viewer-time">
                {formatDistanceToNow(new Date(current.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isOwn && (
              <button className="status-action-btn" onClick={() => onDelete(current._id)}>
                <FiTrash2 />
              </button>
            )}
            <button className="status-action-btn" onClick={onClose}><FiX /></button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="status-viewer-content">
          {current.type === 'text' && (
            <div className="status-text-display" style={{ background: current.bgColor }}>
              <p style={{ fontFamily: current.fontStyle === 'serif' ? "'Cormorant Garamond',serif" : "'DM Sans',sans-serif" }}>
                {current.text}
              </p>
            </div>
          )}
          {current.type === 'image' && current.mediaUrl && (
            <img src={resolveMediaUrl(current.mediaUrl)} alt="status" className="status-media-img" />
          )}
          {current.type === 'video' && current.mediaUrl && (
            <video src={resolveMediaUrl(current.mediaUrl)} autoPlay loop muted className="status-media-video" />
          )}
          {current.type === 'music' && (
            <div className="status-music-display" style={{ background: 'linear-gradient(180deg,#1a0a18,#0d0810)' }}>
              <img src={current.songArtwork} alt={current.songTitle} className="status-music-artwork" />
              <div className="status-music-info">
                <p className="status-music-title">{current.songTitle}</p>
                <p className="status-music-artist">{current.songArtist}</p>
              </div>
              <div className="status-music-wave">
                {[...Array(14)].map((_, i) => (
                  <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom layer ── */}
        <div className="status-bottom-layer">

          {/* Caption */}
          {current.caption && <p className="status-caption-text">{current.caption}</p>}

          {/* Music pill — slim pill for photo+music */}
          {current.type === 'image' && current.songTitle && (
            <div className="status-music-pill">
              <img src={current.songArtwork} alt={current.songTitle} className="pill-art" />
              <div className="pill-info">
                <span className="pill-title">{current.songTitle}</span>
                <span className="pill-artist">{current.songArtist}</span>
              </div>
              <div className="pill-wave">
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="wave-bar wave-bar-sm" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Action bar — partner's statuses only ── */}
          {!isOwn && (
            <div className="status-action-bar">
              {/* Like */}
              <button
                className={`status-react-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill={isLiked ? '#f43f5e' : 'none'}
                  stroke={isLiked ? '#f43f5e' : 'rgba(255,255,255,0.85)'}
                  strokeWidth="2">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>

              {showReply ? (
                <div className="status-reply-input-row">
                  <input
                    ref={replyInputRef}
                    type="text"
                    className="status-reply-input"
                    placeholder={replyText.startsWith('@') ? `Mention ${current.postedBy.name}…` : 'Reply to status…'}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleReply();
                      if (e.key === 'Escape') setShowReply(false);
                    }}
                  />
                  <button
                    className="status-reply-send"
                    onClick={handleReply}
                    disabled={!replyText.trim() || sending}
                  >
                    {sending ? <div className="spinner-small" /> : <FiSend />}
                  </button>
                  <button className="status-reply-cancel" onClick={() => setShowReply(false)}>
                    <FiX />
                  </button>
                </div>
              ) : (
                <>
                  {/* Reply */}
                  <button
                    className="status-react-btn"
                    onClick={() => { setShowReply(true); setReplyText(''); }}
                    title="Reply to status"
                  >
                    <FiMessageCircle size={20} />
                  </button>
                  {/* Mention */}
                  <button
                    className="status-react-btn"
                    onClick={() => {
                      // Send a "you were mentioned" notification immediately
                      sendChatMessage(
                        `📍 @${current.postedBy.name} — you were mentioned in a status`,
                        current.postedBy._id
                      );
                      // Also open reply pre-filled with @Name for the user to add their message
                      handleMention();
                    }}
                    title={`Mention @${current.postedBy.name}`}
                  >
                    <FiAtSign size={20} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* View count + like count for own status */}
          {isOwn && (
            <div className="status-view-count-bar">
              <FiEye />
              <span>
                {current.viewedBy?.length
                  ? `Seen by ${current.viewedBy.length}`
                  : 'No views yet'}
              </span>
              {(current.likedBy?.length > 0) && (
                <>
                  <span style={{ opacity: 0.4, margin: '0 0.25rem' }}>·</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f43f5e">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{current.likedBy.length}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tap zones — disabled while reply open */}
        {!showReply && (
          <>
            <div className="status-tap-prev" onClick={() => idx > 0 ? setIdx(i => i - 1) : null} />
            <div className="status-tap-next" onClick={goNext} />
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   ADD STATUS MODAL
   ══════════════════════════════════════════════════════════ */
const AddStatusModal = ({ onClose, onCreated }) => {
  const [tab, setTab] = useState('text');
  // text
  const [text, setText] = useState('');
  const [bg, setBg] = useState(BG_PRESETS[0].value);
  const [fontStyle, setFontStyle] = useState('serif');
  // media
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  // music (shared across image + music tabs)
  const [selectedSong, setSelectedSong] = useState(null);
  const [songStartSec, setSongStartSec] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // photo editor
  const [editingImage, setEditingImage] = useState(null);
  const fileRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;
    if (f.type.startsWith('image/') && tab === 'image') {
      // Open photo editor for images
      setEditingImage(f);
    } else {
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const canSubmit = () => {
    if (tab === 'text') return text.trim().length > 0;
    if (tab === 'image' || tab === 'video') return !!file;
    if (tab === 'music') return !!selectedSong;
    return false;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSubmitting(true);
    try {
      let body = { type: tab };

      if (tab === 'text') {
        body = { ...body, text, bgColor: bg, fontStyle };
      }

      if (tab === 'image' || tab === 'video') {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('type', tab);
        const up = await api.post('/messages/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        body = { ...body, mediaUrl: up.data.url, caption };
        // attach music if chosen
        if (selectedSong) {
          body = {
            ...body,
            songTitle: selectedSong.trackName,
            songArtist: selectedSong.artistName,
            songArtwork: selectedSong.artworkUrl100?.replace('100x100', '300x300'),
            songPreviewUrl: selectedSong.previewUrl,
            songStartSec,
          };
        }
      }

      if (tab === 'music') {
        body = {
          ...body,
          songTitle: selectedSong.trackName,
          songArtist: selectedSong.artistName,
          songArtwork: selectedSong.artworkUrl100?.replace('100x100', '300x300'),
          songPreviewUrl: selectedSong.previewUrl,
          songStartSec,
          caption,
        };
      }

      const res = await api.post('/status', body);
      onCreated(res.data);
      onClose();
    } catch (err) {
      console.error('Status create error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-content status-add-modal"
        initial={{ y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <button className="close-modal-btn" onClick={onClose}><FiX /></button>

        <div className="status-modal-header">
          <h3>Add Status</h3>
          <p>Visible for 24 hours · 30 seconds</p>
        </div>

        <div className="status-type-tabs">
          {[
            { id: 'text',  icon: <FiType />,  label: 'Text'  },
            { id: 'image', icon: <FiImage />, label: 'Photo' },
            { id: 'video', icon: <FiVideo />, label: 'Video' },
            { id: 'music', icon: <FiMusic />, label: 'Music' },
          ].map(t => (
            <button key={t.id} className={`status-type-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="status-modal-body">

          {/* ── TEXT ── */}
          {tab === 'text' && (
            <div className="status-text-editor">
              <div className="status-text-preview" style={{ background: bg }}>
                <p style={{ fontFamily: fontStyle === 'serif' ? "'Cormorant Garamond',serif" : "'DM Sans',sans-serif" }}>
                  {text || 'Your status here…'}
                </p>
              </div>
              <textarea className="modal-input status-textarea" placeholder="What's on your mind?" value={text}
                onChange={e => setText(e.target.value)} maxLength={300} rows={3} />
              <div className="status-char-count">{text.length}/300</div>
              <div className="status-bg-row">
                <span className="status-option-label">Background</span>
                <div className="status-bg-swatches">
                  {BG_PRESETS.map(p => (
                    <button key={p.value} className={`status-bg-swatch ${bg === p.value ? 'selected' : ''}`}
                      style={{ background: p.value }} onClick={() => setBg(p.value)} title={p.label} />
                  ))}
                </div>
              </div>
              <div className="status-font-row">
                <span className="status-option-label">Font</span>
                <button className={`status-font-btn ${fontStyle === 'serif' ? 'active' : ''}`} onClick={() => setFontStyle('serif')} style={{ fontFamily: "'Cormorant Garamond',serif" }}>Elegant</button>
                <button className={`status-font-btn ${fontStyle === 'sans' ? 'active' : ''}`} onClick={() => setFontStyle('sans')} style={{ fontFamily: "'DM Sans',sans-serif" }}>Modern</button>
              </div>
            </div>
          )}

          {/* ── IMAGE / VIDEO ── */}
          {(tab === 'image' || tab === 'video') && (
            <div className="status-media-editor">
              {!filePreview ? (
                <div className="file-drop-zone" onClick={() => fileRef.current.click()}>
                  <FiImage style={{ fontSize: '2rem', color: 'var(--rose-light)', opacity: 0.7 }} />
                  <p className="drop-label">Click to select {tab === 'image' ? 'a photo' : 'a video'}</p>
                  <input ref={fileRef} type="file" accept={tab === 'image' ? 'image/*' : 'video/*'}
                    style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files[0])} />
                </div>
              ) : (
                <div className="status-media-preview-box">
                  {tab === 'image' ? <img src={filePreview} alt="preview" /> : <video src={filePreview} muted autoPlay loop />}
                  <div className="status-preview-actions">
                    {tab === 'image' && (
                      <button
                        type="button"
                        className="status-preview-edit-btn"
                        onClick={() => setEditingImage(file)}
                        title="Edit photo"
                      >
                        <FiEdit3 />
                      </button>
                    )}
                    <button className="file-preview-remove" onClick={() => { setFile(null); setFilePreview(null); }}><FiX /></button>
                  </div>
                </div>
              )}
              <input type="text" className="modal-input" placeholder="Caption… (optional)"
                value={caption} onChange={e => setCaption(e.target.value)} maxLength={200} style={{ marginTop: '0.75rem' }} />

              {/* Music attach for photo/video */}
              <div className="status-music-attach-section">
                <div className="status-music-attach-label">
                  <FiMusic style={{ color: 'var(--rose-light)' }} />
                  <span>Attach a song</span>
                  {selectedSong && <span className="attach-song-name">· {selectedSong.trackName}</span>}
                </div>
                <MusicPicker
                  selectedSong={selectedSong}
                  songStartSec={songStartSec}
                  onSelect={s => { setSelectedSong(s); setSongStartSec(0); }}
                  onStartChange={setSongStartSec}
                  onRemove={() => { setSelectedSong(null); setSongStartSec(0); }}
                />
              </div>
            </div>
          )}

          {/* ── MUSIC ONLY ── */}
          {tab === 'music' && (
            <div className="status-music-editor">
              <MusicPicker
                selectedSong={selectedSong}
                songStartSec={songStartSec}
                onSelect={s => { setSelectedSong(s); setSongStartSec(0); }}
                onStartChange={setSongStartSec}
                onRemove={() => { setSelectedSong(null); setSongStartSec(0); }}
              />
              <input type="text" className="modal-input" placeholder="Caption… (optional)"
                value={caption} onChange={e => setCaption(e.target.value)} maxLength={200} style={{ marginTop: '0.75rem' }} />
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ padding: '0 2rem 2rem' }}>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSubmit} disabled={submitting || !canSubmit()}>
            {submitting ? <><div className="spinner-small" /> Posting…</> : 'Post Status'}
          </button>
        </div>
      </motion.div>
    </motion.div>

    {/* Photo Editor — renders outside the modal stack */}
    {editingImage && (
      <PhotoEditor
        imageFile={editingImage}
        onSave={(editedFile) => {
          setFile(editedFile);
          setFilePreview(URL.createObjectURL(editedFile));
          setEditingImage(null);
        }}
        onCancel={() => setEditingImage(null)}
      />
    )}
  </>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN STATUS PAGE
   ══════════════════════════════════════════════════════════ */
const StatusPage = () => {
  const [statuses, setStatuses] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [viewerList, setViewerList] = useState(null); // which list to show in viewer
  const [viewerIdx, setViewerIdx] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchStatuses(); }, []);

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/status');
      setStatuses(res.data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/status/${id}`);
      setStatuses(s => s.filter(x => x._id !== id));
    } catch (err) { console.error(err); }
  };

  const openViewer = (list, idx = 0) => {
    setViewerList(list);
    setViewerIdx(idx);
  };

  const closeViewer = () => {
    setViewerList(null);
    setViewerIdx(null);
  };

  const mine   = statuses.filter(s => s.postedBy._id === user._id);
  const theirs = statuses.filter(s => s.postedBy._id !== user._id);

  const allViewed = (list) =>
    list.every(s => s.viewedBy?.some(v => (v?._id || v)?.toString() === user._id));

  return (
    <div className="status-page">
      <div className="status-container page-enter">
        <header className="memories-header">
          <button onClick={() => navigate('/chat')} className="back-btn"><FiArrowLeft /> Back</button>
          <h2>Status</h2>
          <button onClick={() => setShowAdd(true)} className="add-memory-btn"><FiPlus /> Add</button>
        </header>

        <div className="status-list">
          {statuses.length === 0 && mine.length === 0 ? (
            <div className="no-memories" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
              <FiImage style={{ fontSize: '3rem', opacity: 0.3, display: 'block', margin: '0 auto 1rem' }} />
              <p style={{ opacity: 0.6 }}>No statuses yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="status-rings-row">

              {/* My status ring — shows my own name */}
              {mine.length > 0 && (
                <div className="status-ring-item" onClick={() => openViewer(mine, 0)} style={{ cursor: 'pointer' }}>
                  <div className="status-ring my-status-ring">
                    <div className="status-ring-avatar">{user.name?.[0]?.toUpperCase()}</div>
                  </div>
                  <p className="status-ring-name">{user.name}</p>
                  <p className="status-ring-count">{mine.length} update{mine.length > 1 ? 's' : ''}</p>
                </div>
              )}

              {/* Partner statuses */}
              {theirs.length > 0 && (
                <div className="status-ring-item" onClick={() => openViewer(theirs, 0)} style={{ cursor: 'pointer' }}>
                  <div className={`status-ring ${allViewed(theirs) ? 'viewed' : 'unviewed'}`}>
                    <div className="status-ring-avatar">{theirs[0].postedBy.name?.[0]?.toUpperCase()}</div>
                  </div>
                  <p className="status-ring-name">{theirs[0].postedBy.name}</p>
                  <p className="status-ring-count">{theirs.length} update{theirs.length > 1 ? 's' : ''}</p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddStatusModal
            onClose={() => setShowAdd(false)}
            onCreated={s => setStatuses(prev => [s, ...prev])}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewerList !== null && viewerIdx !== null && (
          <StatusViewer
            statuses={viewerList}
            startIndex={viewerIdx}
            onClose={closeViewer}
            currentUserId={user._id}
            onDelete={(id) => {
              handleDelete(id);
              closeViewer();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusPage;
