import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

/**
 * AuthContext — manages authentication state globally.
 * Persists user and token in localStorage across sessions.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Initial auth check

  // ─── Initialize from localStorage on app load ─────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('agritech_token');
    const storedUser = localStorage.getItem('agritech_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email, password });
    localStorage.setItem('agritech_token', data.token);
    localStorage.setItem('agritech_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const { data } = await axiosInstance.post('/auth/register', formData);
    localStorage.setItem('agritech_token', data.token);
    localStorage.setItem('agritech_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('agritech_token');
    localStorage.removeItem('agritech_user');
    setToken(null);
    setUser(null);
  }, []);

  // ─── Update local user state (after profile edit) ─────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('agritech_user', JSON.stringify(updatedUser));
  }, []);

  const isAuthenticated = !!token;
  const isLender = user?.role === 'Lender';
  const isRenter = user?.role === 'Renter';

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated, isLender, isRenter, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for clean consumption
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
