import { create } from 'zustand';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications/mine');
      set({ 
        notifications: res.data.data.notifications,
        unreadCount: res.data.data.unreadCount
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  },

  markRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  },

  addNew: (notification) => {
    set(state => {
      // Avoid duplicates
      if (state.notifications.some(n => n._id === notification.id)) return state;
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },

  toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),
  setOpen: (bool) => set({ isOpen: bool })
}));

export default useNotificationStore;
