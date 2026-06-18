import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('hungdv:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('hungdv:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    setUser(data.user);
  };

  const logout = async () => {
    await logoutRequest().catch(() => {});
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user),
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
