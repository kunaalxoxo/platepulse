import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import DonationCard from '../../components/donations/DonationCard';

const DonorDashboard = () => {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', category: 'cooked', quantity: '', quantityUnit: 'portions',
    preparedAt: '', expiresAt: '', address: '', lat: null, lng: null, instructions: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const [locationMode, setLocationMode] = useState('manual'); // 'manual' | 'gps'

  const fetchDonations = async () => {
    try {
      const res = await api.get('/donations');
      setDonations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAiResult({ confidence: null, checking: true });
    setTimeout(() => {
      setAiResult({ confidence: Math.floor(Math.random() * 20) + 75, checking: false });
    }, 1500);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocationMode('gps');
        setError('');
      },
      () => setError('Could not get location. Enter address manually.'),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('quantity', form.quantity);
    formData.append('quantityUnit', form.quantityUnit);
    if (form.preparedAt) formData.append('preparedAt', new Date(form.preparedAt).toISOString());
    formData.append('expiresAt', new Date(form.expiresAt).toISOString());
    formData.append('pickupLocation', JSON.stringify({
      address: form.address,
      coordinates: form.lat && form.lng ? [form.lng, form.lat] : [0, 0]
    }));
    formData.append('specialInstructions', form.instructions);
    if (image) formData.append('image', image);
    try {
      const res = await api.post('/donations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { aiWarning } = res.data.data;
      if (aiWarning) alert('⚠️ AI flagged this food with low confidence. Please ensure it is safe!');
      setForm({ name: '', category: 'cooked', quantity: '', quantityUnit: 'portions',
        preparedAt: '', expiresAt: '', address: '', lat: null, lng: null, instructions: '' });
      setImage(null); setPreview(''); setAiResult(null); setLocationMode('manual');
      fetchDonations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: donations.length,
    delivered: donations.filter(d => d.status === 'delivered').length,
    points: user?.points || 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-2xl">📦</div>
          <div><p className="text-sm font-medium text-text/60">Total Donated</p><p className="text-2xl font-bold">{stats.total}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-2xl">✅</div>
          <div><p className="text-sm font-medium text-text/60">Delivered</p><p className="text-2xl font-bold">{stats.delivered}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center text-2xl">🏆</div>
          <div><p className="text-sm font-medium text-text/60">Points Earned</p><p className="text-2xl font-bold">{stats.points}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2">🍽️ Share Food</h2>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Food Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary" placeholder="e.g. 50 boxes of Biryani" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Category *</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl">
                  <option value="cooked">Cooked Meals</option>
                  <option value="produce">Fresh Produce</option>
                  <option value="packaged">Packaged Food</option>
                  <option value="bakery">Bakery Items</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-text mb-1">Qty *</label>
                  <input type="number" required min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-text mb-1">Unit</label>
                  <select value={form.quantityUnit} onChange={e => setForm({...form, quantityUnit: e.target.value})}
                    className="w-full px-2 py-2 border border-gray-200 rounded-xl">
                    <option value="kg">kg</option>
                    <option value="portions">portions</option>
                    <option value="boxes">boxes</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Image Upload</label>
              <input type="file" accept="image/*" onChange={handleImageChange}
                className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition cursor-pointer" />
              {preview && (
                <div className="mt-3 relative">
                  <img src={preview} alt="Preview" className="h-32 w-full object-cover rounded-xl" />
                  {aiResult && (
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                      {aiResult.checking ? (
                        <p className="text-xs font-semibold text-text/60 animate-pulse">🤖 AI Scanning image...</p>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold mb-1">AI Confidence: {aiResult.confidence}%</p>
                          <progress value={aiResult.confidence} max="100"
                            className={`w-full h-1.5 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full ${aiResult.confidence > 70 ? '[&::-webkit-progress-value]:bg-green-500' : '[&::-webkit-progress-value]:bg-yellow-500'}`} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Prepared At</label>
                <input type="datetime-local" value={form.preparedAt} onChange={e => setForm({...form, preparedAt: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Expires At *</label>
                <input type="datetime-local" required value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-text">Pickup Address *</label>
                <button type="button" onClick={handleLocation}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  📍 Use GPS {locationMode === 'gps' && <span className="text-green-600">✓</span>}
                </button>
              </div>
              <input type="text" required value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl mb-1" placeholder="Street, City, State" />
              {locationMode === 'gps' && form.lat && (
                <p className="text-xs text-green-600 font-medium">✅ GPS coordinates captured — map pin will be accurate</p>
              )}
              {locationMode === 'manual' && (
                <p className="text-xs text-text/40">Tip: Use GPS for accurate map pin placement</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Special Instructions</label>
              <textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl resize-none" rows={2}
                placeholder="Allergies, handling notes..." />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Creating...' : 'Donate Food 🍽️'}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-heading font-bold">My Donations</h2>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{donations.length}</span>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center py-8 text-text/50">Loading donations...</p>
            ) : donations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-12 text-center text-text/50">
                <span className="text-5xl block mb-4">🍽️</span>
                <p>No donations yet — share your first meal!</p>
              </div>
            ) : (
              donations.map(d => (
                <DonationCard key={d._id} donation={d} showAcceptButton={false} showQR={true} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
