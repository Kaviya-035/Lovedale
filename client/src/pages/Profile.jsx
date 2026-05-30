import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingHearts from '../components/FloatingHearts';
import { FiMessageCircle, FiLogOut } from 'react-icons/fi';

const HeartSVG = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto' }}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#phg)"
    />
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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
            <p style={{ color: 'var(--txt-muted)', marginTop: '1rem' }}>
              Loading your profile…
            </p>
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
            <div className="profile-avatar">
              {getInitial(displayData?.name)}
            </div>
            <h1 className="profile-name">{displayData?.name}</h1>
            <p className="profile-email">{displayData?.email}</p>
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            <div className="profile-info-row">
              <span className="profile-info-label">Status</span>
              <span className="profile-info-value">
                <span className="profile-status">
                  <span
                    className={`profile-status-dot ${
                      profile?.isOnline ? 'online' : 'offline'
                    }`}
                  />
                  {profile?.isOnline ? 'Online' : 'Offline'}
                </span>
              </span>
            </div>

            <div className="profile-info-row">
              <span className="profile-info-label">Last Seen</span>
              <span className="profile-info-value">
                {profile?.isOnline
                  ? 'Now'
                  : formatLastSeen(profile?.lastSeen)}
              </span>
            </div>

            <div className="profile-info-row">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">
                {formatDate(profile?.createdAt)}
              </span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="profile-actions">
            <button
              className="chat-nav-btn"
              onClick={() => navigate('/chat')}
            >
              <FiMessageCircle style={{ marginRight: '0.4rem' }} /> Back to Chat
            </button>
          </div>

          {/* Logout Button */}
          <button
            className="logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            id="logout-btn"
          >
            {loggingOut ? (
              <>
                <div className="spinner" />
                Signing out...
              </>
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
