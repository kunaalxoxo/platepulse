import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useSocket from '../../hooks/useSocket';
import api from '../../services/api';
import DonationCard from '../../components/donations/DonationCard';
import QRScanner from '../../components/qr/QRScanner';

const NGODashboard = () => {
  const { user } = useAuthStore();
  const socket = useSocket(user?._id);
  
  const [activeTab, setActiveTab] = useState('nearby'); // 'nearby' | 'missions'
  const [donations, setDonations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Geolocation scope
  const [location, setLocation] = useState({ lat: null, lng: null });
  
  // QR Scope
  const [showScanner, setShowScanner] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.log('Geo error', err),
      { enableHighAccuracy: true }
    );
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'nearby') {
        if (!location.lat) return;
        const res = await api.get(`/donations?status=available&lat=${location.lat}&lng=${location.lng}&radius=25`);
        setDonations(res.data.data);
      } else {
        const res = await api.get('/missions/my-missions');
        setMissions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, location.lat]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMatch = (data) => {
      alert(`🔔 New donation match nearby! ${data.donationName} is ${data.distance}km away.`);
      if (activeTab === 'nearby') fetchData();
    };

    const handleDonationAccepted = () => {
      if (activeTab === 'missions') fetchData();
    };

    socket.on('new_match', handleNewMatch);
    socket.on('donation_accepted', handleDonationAccepted);

    return () => {
      socket.off('new_match', handleNewMatch);
      socket.off('donation_accepted', handleDonationAccepted);
    };
  }, [socket, activeTab]);

  const handleAcceptDonation = async (donationId) => {
    try {
      await api.post(`/missions/accept/${donationId}`);
      alert('✅ Donation accepted! A QR code has been generated for pickup.');
      setActiveTab('missions');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept donation');
    }
  };

  const handleScanQR = async (token) => {
    setShowScanner(false);
    setQrLoading(true);
    try {
      const res = await api.post('/qr/verify', { token });
      const action = res.data.data.action;
      if (action === 'pickup_confirmed') {
        alert('✅ Pickup confirmed! Food is now in transit.');
      } else if (action === 'delivery_confirmed') {
        alert('✅ Delivery confirmed! Great work!');
      }
      fetchData(); // refresh missions
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.message || 'Invalid or expired QR code'}`);
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {showScanner && <QRScanner onScan={handleScanQR} onCancel={() => setShowScanner(false)} />}

      <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text">NGO Dashboard</h1>
          <p className="text-text/60 mt-1">Accept local donations and manage active distribution runs.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('nearby')}
          className={`px-6 py-2.5 rounded-xl font-medium transition ${activeTab === 'nearby' ? 'bg-primary text-white shadow-md' : 'bg-white text-text/60 hover:bg-gray-50'}`}>
          Nearby Donations
        </button>
        <button onClick={() => setActiveTab('missions')}
          className={`px-6 py-2.5 rounded-xl font-medium transition ${activeTab === 'missions' ? 'bg-primary text-white shadow-md' : 'bg-white text-text/60 hover:bg-gray-50'}`}>
          Active Missions 🚀
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && <p className="text-center py-12 text-text/50">Loading data...</p>}
        {qrLoading && <p className="text-center py-4 text-primary font-bold animate-pulse">Verifying QR Token...</p>}

        {!loading && activeTab === 'nearby' && (
          <>
            {!location.lat && <p className="p-4 bg-yellow-50 text-yellow-800 rounded-xl">📍 Waiting for GPS location to find donations...</p>}
            {donations.length === 0 && location.lat && (
              <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-12 text-center text-text/50">
                <p>No nearby donations available right now. We'll notify you when food is shared!</p>
              </div>
            )}
            {donations.map(d => (
              <DonationCard key={d._id} donation={d} showAcceptButton={true} onAccept={handleAcceptDonation} />
            ))}
          </>
        )}

        {!loading && activeTab === 'missions' && (
          <>
            {missions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-12 text-center text-text/50">
                <p>No active missions. Check the Nearby tab to find donations to pick up.</p>
              </div>
            ) : (
              missions.map(m => (
                <div key={m._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold">{m.donation?.name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 uppercase rounded-full">
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-text/60 mb-4">{m.donation?.quantity} {m.donation?.category}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-text/80 mb-2">
                      <span className="text-xl">🏭</span>
                      <span>From: {m.pickupAddress}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className={`h-2 flex-1 rounded-full ${['pending', 'declined'].includes(m.status) ? 'bg-gray-200' : 'bg-primary'}`}></div>
                      <div className={`h-2 flex-1 rounded-full ${['in_transit', 'delivered'].includes(m.status) ? 'bg-primary' : 'bg-gray-200'}`}></div>
                      <div className={`h-2 flex-1 rounded-full ${m.status === 'delivered' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="flex justify-between text-xs text-text/50 mt-1 font-medium">
                      <span>Accepted</span>
                      <span>In Transit</span>
                      <span>Delivered</span>
                    </div>
                  </div>

                  {m.status !== 'delivered' && m.status !== 'declined' && (
                    <div className="md:w-48 flex flex-col items-center justify-center border-l md:border-l-gray-100 md:pl-6">
                      <button onClick={() => setShowScanner(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition">
                        <span>📷</span> Scan QR Code
                      </button>
                      <p className="text-xs text-center text-text/50 mt-2">Scan at pickup and dropoff to verify chain-of-custody.</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;
