import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('wholesale_user') || 'null'),
  token: localStorage.getItem('wholesale_token') || null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authService.login(credentials);
      localStorage.setItem('wholesale_token', data.token);
      localStorage.setItem('wholesale_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('wholesale_token');
    localStorage.removeItem('wholesale_user');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
  isAdmin: () => get().user?.role === 'admin',
  isAuthenticated: () => !!get().token,
}));
