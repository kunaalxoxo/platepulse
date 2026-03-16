import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import QRScanner from '../../components/qr/QRScanner';

const VolunteerDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('available');
  const [missions, setMissions] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationReady, setLocationReady] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationReady(true);
      },
      () => {
        console.log('Geo denied on VolunteerDashboard');
        setLocationReady(true); // unblock loading state
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'available') {
        if (!location.lat) {
          setMissions([]);
          return;
        }
        const res = await api.get(`/donations?status=available&lat=${location.lat}&lng=${location.lng}&radius=25`);
        setMissions(res.data.data);
      } else if (activeTab === 'my_missions') {
        const res = await api.get('/missions/my-missions');
        setMyMissions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationReady) fetchData();
  }, [activeTab, locationReady]);

  // Re-fetch when location updates after initial GPS resolves
  useEffect(() => {
    if (location.lat && activeTab === 'available') fetchData();
  }, [location.lat]);

  const handleAccept = async (donationId) => {
    try {
      await api.post(`/missions/accept/${donationId}`);
      alert('Mission Accepted! 🚀');
      setActiveTab('my_missions');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept mission');
    }
  };

  const handleScanQR = async (token) => {
    setShowScanner(false);
    try {
      const res = await api.post('/qr/verify', { token });
      const action = res.data.data.action;
      alert(`✅ Success: ${action.replace('_', ' ').toUpperCase()}`);
      fetchData();
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.message}`);
    }
  };

  const badgeObj = {
    none: { icon: '⚪', label: 'Rookie' },
    bronze: { icon: '🥉', label: 'Bronze' },
    silver: { icon: '🥈', label: 'Silver' },
    gold: { icon: '🥇', label: 'Gold' },
    hero: { icon: '🏆', label: 'Hero' },
  }[user?.badge || 'none'];

  const getProgress = () => {
    const pts = user?.points || 0;
    if (pts >= 1000) return { pct: 100, next: 'Maxed Out' };
    if (pts >= 500) return { pct: (pts - 500) / 500 * 100, next: `${1000 - pts} to Hero` };
    if (pts >= 200) return { pct: (pts - 200) / 300 * 100, next: `${500 - pts} to Gold` };
    if (pts >= 50) return { pct: (pts - 50) / 150 * 100, next: `${200 - pts} to Silver` };
    return { pct: pts / 50 * 100, next: `${50 - pts} to Bronze` };
  };

  const prog = getProgress();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {showScanner && <QRScanner onScan={handleScanQR} onCancel={() => setShowScanner(false)} />}

      <h1 className="text-3xl font-heading font-bold text-text mb-6">Volunteer Hub</h1>

      <div className="flex gap-2 mb-6 bg-gray-50 p-1.5 rounded-2xl w-full">
        <button onClick={() => setActiveTab('available')} className={`flex-1 py-2.5 rounded-xl font-medium transition text-sm ${activeTab === 'available' ? 'bg-primary text-white shadow-md' : 'text-text/60'}`}>Available Missions</button>
        <button onClick={() => setActiveTab('my_missions')} className={`flex-1 py-2.5 rounded-xl font-medium transition text-sm ${activeTab === 'my_missions' ? 'bg-primary text-white shadow-md' : 'text-text/60'}`}>My Missions</button>
        <button onClick={() => setActiveTab('badges')} className={`flex-1 py-2.5 rounded-xl font-medium transition text-sm ${activeTab === 'badges' ? 'bg-primary text-white shadow-md' : 'text-text/60'}`}>Points & Badges</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {loading && activeTab !== 'badges' && <p className="text-center text-text/50 py-10">Loading...</p>}

        {!loading && activeTab === 'available' && (
          <div className="space-y-4">
            {!location.lat && (
              <p className="p-4 bg-yellow-50 text-yellow-800 rounded-xl font-medium">
                📍 Location access denied — enable GPS to see missions near you.
              </p>
            )}
            {location.lat && missions.length === 0 && (
              <p className="text-center text-text/50 py-10">No missions available nearby right now.</p>
            )}
            {missions.map(m => (
              <div key={m._id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center hover:shadow-md transition">
                <div className="flex-1 w-full flex justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{m.name}</h3>
                    <p className="text-sm text-text/60">{m.pickupLocation.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-primary font-bold text-sm bg-green-50 px-2 py-1 rounded-md mb-1">📍 {m.distance?.toFixed(1) || 0}km</span>
                    <span className="block text-xs font-bold text-yellow-600">🏆 50 pts</span>
                  </div>
                </div>
                <button onClick={() => handleAccept(m._id)} className="w-full md:w-auto px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-green-700">Accept</button>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'my_missions' && (
          <div className="space-y-4">
            {myMissions.length === 0 ? (
              <p className="text-center text-text/50 py-10">You have no active missions.</p>
            ) : (
              myMissions.map(m => (
                <div key={m._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">{m.donation?.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 uppercase rounded-full">{m.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm mb-4">📍 {m.pickupAddress}</p>
                  {m.status !== 'delivered' && m.status !== 'declined' && (
                    <button onClick={() => setShowScanner(true)} className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800">📷 Scan Delivery QR</button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="flex flex-col items-center justify-center py-10">
            <span className="text-6xl mb-4">{badgeObj.icon}</span>
            <h2 className="text-2xl font-bold">{badgeObj.label} Status</h2>
            <p className="text-4xl font-heading font-black text-primary my-6">{user?.points || 0} Points</p>
            <div className="w-full max-w-sm mt-4">
              <div className="flex justify-between text-xs font-bold text-text/60 mb-1">
                <span>Progress</span><span>{prog.next}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${prog.pct}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
