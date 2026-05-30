import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingHearts from '../components/FloatingHearts';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-bg" />
      <FloatingHearts count={18} />

      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <span className="auth-logo-icon">
              <FaHeart style={{ color: '#f43f5e', fontSize: '3.2rem', filter: 'drop-shadow(0 0 18px rgba(244,63,94,0.5))' }} />
            </span>
            <h1>Lovedale</h1>
            <p>Welcome back, sweetheart</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-message error">
              <FiAlertCircle style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><FiMail /></span>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><FiLock /></span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your secret password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              id="login-submit"
            >
              <span>
                {loading ? (
                  <>
                    <div className="spinner" />
                    Connecting hearts...
                  </>
                ) : (
                  <><FaHeart style={{ fontSize: '0.9rem' }} /> Sign In</>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
