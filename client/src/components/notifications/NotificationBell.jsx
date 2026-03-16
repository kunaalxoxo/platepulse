import { useEffect } from 'react';
import useNotificationStore from '../../store/notificationStore';
import NotificationList from './NotificationList';

const NotificationBell = () => {
  const { unreadCount, toggleOpen, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const displayCount = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="relative">
      <button 
        onClick={toggleOpen}
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
            {displayCount}
          </span>
        )}
      </button>
      
      <NotificationList />
    </div>
  );
};

export default NotificationBell;
