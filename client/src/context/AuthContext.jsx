import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('lovedale_token'));
  const [loading, setLoading] = useState(true);

  // Set or clear token in localStorage and axios defaults
  const saveToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('lovedale_token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      localStorage.removeItem('lovedale_token');
      delete api.defaults.headers.common['Authorization'];
    }
    setToken(newToken);
  }, []);

  // Verify existing token on mount
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Session verification failed:', error);
        saveToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveToken(data.token);
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
    });
    return data;
  };

  // Login
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveToken(data.token);
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
    });
    return data;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      saveToken(null);
      setUser(null);
    }
  };

  // Fetch profile
  const fetchProfile = async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
