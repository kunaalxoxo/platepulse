import { useState, useEffect } from 'react';

const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt) - Date.now();
      return difference > 0 ? difference : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (timeLeft <= 0) {
    return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-md">Expired</span>;
  }

  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const hoursTotal = timeLeft / 3600000;
  let colorClass = 'text-red-600 font-medium animate-pulse';
  if (hoursTotal > 24) colorClass = 'text-green-600 font-medium';
  else if (hoursTotal > 6) colorClass = 'text-yellow-500 font-medium';

  let displayString = '';
  if (days > 0) displayString = `${days}d ${hours}h remaining`;
  else if (hours > 0) displayString = `${hours}h ${minutes}m remaining`;
  else displayString = `${minutes}m ${seconds}s remaining`;

  return <span className={`text-sm ${colorClass}`}>⏱️ {displayString}</span>;
};

export default CountdownTimer;
