import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingHearts from '../components/FloatingHearts';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.toLowerCase().trim(), password);
      navigate('/chat');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
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
            <p>Begin your love story</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-message error">
              <FiAlertCircle style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Register Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="register-name">Your Name</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><FiUser /></span>
                <input
                  id="register-name"
                  type="text"
                  className="form-input"
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Email</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><FiMail /></span>
                <input
                  id="register-email"
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><FiLock /></span>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="form-group">
              <label htmlFor="register-confirm">Confirm Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon"><FiLock /></span>
                <input
                  id="register-confirm"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              id="register-submit"
            >
              <span>
                {loading ? (
                  <>
                    <div className="spinner" />
                    Creating your account...
                  </>
                ) : (
                  <><FaHeart style={{ fontSize: '0.9rem' }} /> Create Account</>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
