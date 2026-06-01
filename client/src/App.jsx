import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Memories from './pages/Memories';
import StatusPage from './pages/Status';
import RelationshipMovie from './pages/RelationshipMovie';
import Intro from './components/Intro';
import { useState, useEffect } from 'react';
import { usePushNotifications } from './utils/usePushNotifications';

// Inner component — runs inside AuthProvider so it can access auth state
const PushSetup = () => {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
};

// Inner component — runs inside AuthProvider so it can access auth state
const PushSetup = () => {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
};

// Redirect authenticated users away from auth pages
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ display: 'block', margin: '0 auto', animation: 'heartPulse 2s ease-in-out infinite' }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#appHG)" />
            <defs><linearGradient id="appHG" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#f43f5e" /><stop offset="1" stopColor="#9d4edd" /></linearGradient></defs>
          </svg>
          <p style={{ color: 'var(--txt-muted)', marginTop: '1rem' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return children;
};

const App = () => {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenLovedaleIntro');
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('hasSeenLovedaleIntro', 'true');
    setShowIntro(false);
  };

  return (
    <Router>
      <AuthProvider>
        <PushSetup />
        {showIntro && <Intro onComplete={handleIntroComplete} />}
        {!showIntro && (
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memories"
            element={
              <ProtectedRoute>
                <Memories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/status"
            element={
              <ProtectedRoute>
                <StatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movie"
            element={
              <ProtectedRoute>
                <RelationshipMovie />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
        )}
      </AuthProvider>
    </Router>
  );
};


export default App;
