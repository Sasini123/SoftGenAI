/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const persist = (profile, jwt) => {
    setUser(profile);
    setToken(jwt);
    localStorage.setItem('user', JSON.stringify(profile));
    localStorage.setItem('authToken', jwt);
  };

  const clear = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setInitializing(false);
      return null;
    }

    try {
      const { user: profile } = await apiRequest('/api/auth/me', { token });
      persist(profile, token);
      setInitializing(false);
      return profile;
    } catch (error) {
      console.error('Failed to refresh profile', error.message);
      clear();
      setInitializing(false);
      return null;
    }
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const signup = async ({ username, email, password, displayName }) => {
    setLoading(true);
    try {
      const { user: profile, token: jwt } = await apiRequest('/api/auth/signup', {
        method: 'POST',
        data: { username, email, password, displayName },
      });
      persist(profile, jwt);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const { user: profile, token: jwt } = await apiRequest('/api/auth/login', {
        method: 'POST',
        data: { identifier, password },
      });
      persist(profile, jwt);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initializing,
        signup,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
