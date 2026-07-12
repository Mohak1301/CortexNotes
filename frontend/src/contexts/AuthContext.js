import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { apiFetch, setCsrfToken } from '../utils/apiUtils';

const AuthContext = createContext(null);

const readJson = async (response) => response.json().catch(() => ({}));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.AUTH_SESSION, { skipAuthRetry: true });
      const data = await readJson(response);
      if (response.ok) {
        setCsrfToken(data.csrfToken);
        setUser(data.user);
        return data.user;
      }
    } catch {
      // Network errors leave the app signed out without exposing implementation details.
    }
    setCsrfToken();
    setUser(null);
    return null;
  }, []);

  useEffect(() => {
    loadSession().finally(() => setIsAuthLoading(false));
    const handleExpired = () => setUser(null);
    window.addEventListener('cortex:auth-expired', handleExpired);
    return () => window.removeEventListener('cortex:auth-expired', handleExpired);
  }, [loadSession]);

  const authenticate = useCallback(async (endpoint, payload) => {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthRetry: true,
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.error || 'Authentication could not be completed');
    if (data.csrfToken) setCsrfToken(data.csrfToken);
    if (data.user) setUser(data.user);
    return data;
  }, []);

  const login = useCallback((email, password) => authenticate(
    API_ENDPOINTS.AUTH_LOGIN,
    { email, password },
  ), [authenticate]);

  const register = useCallback((name, email, password) => authenticate(
    API_ENDPOINTS.AUTH_REGISTER,
    { name, email, password },
  ), [authenticate]);

  const logout = useCallback(async () => {
    try {
      await apiFetch(API_ENDPOINTS.AUTH_LOGOUT, { method: 'POST', skipAuthRetry: true });
    } finally {
      setCsrfToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthLoading,
    login,
    register,
    logout,
    reloadSession: loadSession,
  }), [user, isAuthLoading, login, register, logout, loadSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
