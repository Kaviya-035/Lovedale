import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HeartSVG = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto', animation: 'heartPulse 2s ease-in-out infinite' }}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="url(#prHG)"
    />
    <defs>
      <linearGradient id="prHG" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" />
      </linearGradient>
    </defs>
  </svg>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <HeartSVG />
          <p style={{ color: 'var(--txt-muted)', marginTop: '1rem' }}>
            Loading your love story…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
