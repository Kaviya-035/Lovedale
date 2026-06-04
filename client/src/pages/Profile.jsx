import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingHearts from '../components/FloatingHearts';
import { FiMessageCircle, FiLogOut, FiPhone, FiCheck, FiEdit2 } from 'react-icons/fi';
import api from '../utils/api';

const HeartSVG = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto' }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#phg)" />
    <defs>
      <linearGradient id="phg" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" />
      </linearGradient>
    </defs>
  </svg>
);

const Profile = () => {
  const { user, logout, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // WhatsApp number state
  const [wpNumber, setWpNumber] = useState('');
  const [wpEditing, setWpEditing] = useState(false);
  const [wpSaving, setWpSaving] = useState(false);
  const [wpSaved, setWpSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
        // Pre-fill WhatsApp number if already saved
        if (data?.whatsappNumber) {
          setWpNumber(data.whatsappNumber);
        } else {
          // First time — open edit mode automatically
          setWpEditing(true);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [fetchProfile]);

  const handleSaveWp = async () => {
    if (!wpNumber.trim()) return;
    setWpSaving(true);
    try {
      await api.patch('/auth/whatsapp', { whatsappNumber: wpNumber.trim() });
      setWpEditing(false);
      setWpSaved(true);
      setTimeout(() => setWpSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save WhatsApp number:', err);
    } finally {
      setWpSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setLoggingOut(false);
    }
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diffMs = new Date() - new Date(dateStr);
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMs / 3600000);
    const d = Math.floor(diffMs / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return formatDate(dateStr);
  };

  const displayData = profile || user;

  if (loading) {
    return (
      <>
        <div className="auth-bg" />
        <FloatingHearts count={12} />
        <div className="profile-container">
          <div style={{ textAlign: 'center' }}>
            <HeartSVG />
            <p style={{ color: 'var(--txt-muted)', marginTop: '1rem' }}>Loading your profile…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="auth-bg" />
      <FloatingHearts count={12} />

      <div className="profile-container">
        <div className="profile-card glass-card page-enter">

          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar">{getInitial(displayData?.name)}</div>
            <h1 className="profile-name">{displayData?.name}</h1>
            <p className="profile-email">{displayData?.email}</p>
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="profile-info-row">
              <span className="profile-info-label">Status</span>
              <span className="profile-info-value">
                <span className="profile-status">
                  <span className={`profile-status-dot ${profile?.isOnline ? 'online' : 'offline'}`} />
                  {profile?.isOnline ? 'Online' : 'Offline'}
                </span>
              </span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Last Seen</span>
              <span className="profile-info-value">
                {profile?.isOnline ? 'Now' : formatLastSeen(profile?.lastSeen)}
              </span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">{formatDate(profile?.createdAt)}</span>
            </div>
          </div>

          {/* ── WhatsApp Number ── */}
          <div className="wp-number-section">
            <div className="wp-number-header">
              <div className="wp-number-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp Notifications</span>
              </div>
              {!wpEditing && wpNumber && (
                <button className="wp-edit-btn" onClick={() => setWpEditing(true)}>
                  <FiEdit2 size={14} />
                </button>
              )}
            </div>

            {wpEditing ? (
              <div className="wp-input-row">
                <div className="form-input-wrapper" style={{ flex: 1 }}>
                  <span className="form-input-icon"><FiPhone /></span>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={wpNumber}
                    onChange={e => setWpNumber(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveWp()}
                    autoFocus
                  />
                </div>
                <button className="wp-save-btn" onClick={handleSaveWp} disabled={wpSaving || !wpNumber.trim()}>
                  {wpSaving ? <div className="spinner-small" /> : <FiCheck />}
                </button>
              </div>
            ) : (
              <div className="wp-saved-display">
                {wpNumber ? (
                  <>
                    <span className="wp-number-value">{wpNumber}</span>
                    {wpSaved && <span className="wp-saved-tag">Saved ✓</span>}
                  </>
                ) : (
                  <button className="wp-add-btn" onClick={() => setWpEditing(true)}>
                    + Add your WhatsApp number
                  </button>
                )}
              </div>
            )}

            <p className="wp-hint">
              When your partner sends "Thinking of You" while you're offline, you'll get a WhatsApp message 💕
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="profile-actions">
            <button className="chat-nav-btn" onClick={() => navigate('/chat')}>
              <FiMessageCircle style={{ marginRight: '0.4rem' }} /> Back to Chat
            </button>
          </div>

          {/* Logout Button */}
          <button className="logout-btn" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? (
              <><div className="spinner" /> Signing out...</>
            ) : (
              <><FiLogOut style={{ marginRight: '0.4rem' }} /> Sign Out</>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Profile;
