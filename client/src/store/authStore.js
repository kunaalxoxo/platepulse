import { create } from 'zustand';
import api, { setApiToken, bindAuthActions } from '../services/api';

const useAuthStore = create((set, get) => {
  const store = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,

    setToken: (token) => {
      setApiToken(token);
      set({ accessToken: token });
    },

    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

    login: async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data.data.accessToken;
      setApiToken(token);
      set({
        accessToken: token,
        user: data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    },

    register: async (formData) => {
      const { data } = await api.post('/auth/register', formData);
      return data;
    },

    verifyEmail: async (email, otp) => {
      const { data } = await api.post('/auth/verify-email', { email, otp });
      const token = data.data.accessToken;
      setApiToken(token);
      set({
        accessToken: token,
        user: data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    },

    forgotPassword: async (email) => {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    },

    resetPassword: async (payload) => {
      const { data } = await api.post('/auth/reset-password', payload);
      return data;
    },

    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // ignore
      }
      setApiToken(null);
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    },

    loadUser: async () => {
      try {
        // Try to refresh token first (cookie may still be valid)
        const refreshRes = await api.post('/auth/refresh');
        const token = refreshRes.data.data.accessToken;
        setApiToken(token);
        set({ accessToken: token });

        // Then load user
        const { data } = await api.get('/auth/me');
        set({
          user: data.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        setApiToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    },
  };

  return store;
});

// Bind auth actions to api interceptors (avoid circular dep)
bindAuthActions(
  (token) => useAuthStore.getState().setToken(token),
  () => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
);

export default useAuthStore;
