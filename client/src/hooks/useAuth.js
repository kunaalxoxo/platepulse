import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import * as authService from '../services/authService';

const useAuth = () => {
  const { user, login: setLogin, logout: setLogout } = useAuthStore();

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials);
    setLogin(data.data.user, data.data.accessToken);
    return data;
  }, [setLogin]);

  const register = useCallback(async (userData) => {
    const { data } = await authService.register(userData);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setLogout();
  }, [setLogout]);

  return { user, login, register, logout, isAuthenticated: !!user };
};

export default useAuth;
