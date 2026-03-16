import { useEffect, useRef } from 'react';
import useNotificationStore from '../../store/notificationStore';
import { useNavigate } from 'react-router-dom';

const NotificationList = () => {
  const { notifications, markRead, markAllRead, isOpen, setOpen } = useNotificationStore();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const handleNotificationClick = (n) => {
    if (!n.isRead) markRead(n._id);
    
    // Auto-navigate based on type metadata if available
    setOpen(false);
    
    switch (n.type) {
      case 'match':
        navigate('/dashboard'); // NGO/Vol dashboard handles nearby
        break;
      case 'accepted':
      case 'delivery_confirmed':
        navigate('/dashboard'); // Check active missions or history
        break;
      case 'waste_assigned':
        navigate('/dashboard'); // Waste plant board handles incoming
        break;
      case 'sale':
        navigate('/dashboard'); // Retail sales tracker
        break;
      case 'claimed':
        navigate('/community');
        break;
      default:
        // Do nothing specific, just marks read
        break;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'match': return '🤝';
      case 'accepted': return '✅';
      case 'expired': return '⏰';
      case 'sale': return '🛒';
      case 'verified': return '🎉';
      case 'waste_assigned': return '♻️';
      case 'claimed': return '👋';
      case 'delivery_confirmed': return '🏆';
      default: return '🔔';
    }
  };

  const timeAgo = (date) => {
    const min = Math.round((Date.now() - new Date(date)) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={dropdownRef} className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up origin-top-right overflow-hidden flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-heading font-black text-text">Notifications</h3>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllRead} className="text-xs font-bold text-primary hover:text-green-700">
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 overscroll-contain">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-text/40">
            <span className="text-3xl block mb-2 opacity-50">📭</span>
            <p className="text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n._id} 
              onClick={() => handleNotificationClick(n)}
              className={`p-4 flex gap-3 cursor-pointer transition hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-green-50/30 border-l-4 border-l-primary' : 'bg-white'}`}
            >
              <div className="text-2xl w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className={`text-sm ${!n.isRead ? 'font-bold text-black' : 'font-semibold text-text/80'}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] font-bold text-text/40 whitespace-nowrap ml-2">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text/60 line-clamp-2 leading-tight">
                  {n.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
