import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem('agrisync_token');

    if (!token) {
      setLoading(false);
      return undefined;
    }

    api.get('/auth/me')
      .then((response) => {
        if (alive) setCurrentUser(response.data.user || null);
      })
      .catch(() => {
        if (!alive) return;
        localStorage.removeItem('agrisync_token');
        setCurrentUser(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data || {};
    if (!token || !user) throw new Error('The server returned an invalid login response.');
    localStorage.setItem('agrisync_token', token);
    setCurrentUser(user);
    return { token, user };
  };

  const register = async (details) => {
    const response = await api.post('/auth/register', details);
    const { token, user } = response.data || {};
    if (!token || !user) throw new Error('The server returned an invalid registration response.');
    localStorage.setItem('agrisync_token', token);
    setCurrentUser(user);
    return { token, user };
  };

  const logout = () => {
    localStorage.removeItem('agrisync_token');
    setCurrentUser(null);
  };

  const value = useMemo(() => ({ currentUser, loading, login, register, logout }), [currentUser, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
