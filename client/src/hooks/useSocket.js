import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';

const VITE_API_URL_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

// Simple minimal Toast utility built in to prevent loading hefty UI libs if unnecessary 
const showToast = (message, type = 'default') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : type === 'warning' ? 'bg-yellow-500' : 'bg-gray-900';
  
  toast.className = `${bg} text-white px-5 py-3 rounded-xl shadow-xl font-bold text-sm transform transition-all duration-300 translate-x-full opacity-0 max-w-sm pointer-events-auto`;
  toast.innerText = message;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.className = toast.className.replace('translate-x-full opacity-0', 'translate-x-0 opacity-100');
  }, 10);

  // Auto remove
  setTimeout(() => {
    toast.className = toast.className.replace('translate-x-0 opacity-100', 'translate-x-full opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

let globalSocket = null;

const useSocket = (customEventHandler = null) => {
  const { accessToken } = useAuthStore();
  const { addNew } = useNotificationStore();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setSocket(null);
      }
      return;
    }

    if (!globalSocket) {
      globalSocket = io(VITE_API_URL_BASE, {
        auth: { token: accessToken },
        transports: ['websocket']
      });

      // Global Handlers
      globalSocket.on('new_notification', (data) => {
        addNew(data);
        showToast(data.title || 'New Notification');
      });

      globalSocket.on('new_match', () => showToast('New donation nearby!', 'success'));
      globalSocket.on('donation_accepted', () => showToast('Donation mission accepted!', 'info'));
      globalSocket.on('pickup_confirmed', () => showToast('Pickup confirmed!', 'success'));
      globalSocket.on('delivery_confirmed', () => showToast('Delivery confirmed! 🎉', 'success'));
      globalSocket.on('waste_assigned', () => showToast('New expired package assigned to your plant ♻️', 'warning'));
    }

    setSocket(globalSocket);

    return () => {
      // We don't necessarily disconnect on hook unmount, only on logout (handled above)
      // This ensures notifications stay active while navigating
    };
  }, [accessToken, addNew]);

  return socket;
};

export default useSocket;
export { showToast };
