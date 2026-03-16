import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

const CommunityShare = () => {
  const { user } = useAuthStore();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(10);
  const [location, setLocation] = useState({ lat: null, lng: null });

  // Post form
  const [form, setForm] = useState({ name: '', category: 'cooked', quantity: '', address: '', lat: 0, lng: 0, expiresAt: '', claimedByLimit: 1 });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log('Location required for community P2P maps'),
      { enableHighAccuracy: true }
    );
  }, []);

  const fetchShares = async () => {
    if (!location.lat) return;
    try {
      setLoading(true);
      const res = await api.get(`/community?lat=${location.lat}&lng=${location.lng}&radius=${radius}`);
      setShares(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [location.lat, location.lng, radius]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('quantity', form.quantity);
    formData.append('claimedByLimit', form.claimedByLimit);
    formData.append('expiresAt', new Date(form.expiresAt).toISOString());
    formData.append('location', JSON.stringify({ address: form.address, coordinates: [form.lng, form.lat] }));
    if (image) formData.append('image', image);

    try {
      await api.post('/community', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Shared with community! 💚');
      setForm({ name: '', category: 'cooked', quantity: '', address: '', lat: 0, lng: 0, expiresAt: '', claimedByLimit: 1 });
      setImage(null); setPreview('');
      fetchShares(); // sync feed natively
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (id) => {
    try {
      await api.post(`/community/${id}/claim`);
      alert('Tapped to claim! Check with the uploader to arrange pickup.');
      fetchShares();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim');
    }
  };

  const handleGPS = () => {
    if (!location.lat) return alert('GPS Loading...');
    setForm(f => ({ ...f, lat: location.lat, lng: location.lng }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ── Left Side: Post ── */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-2xl font-heading font-black mb-2">Share Food 🏡</h2>
            <p className="text-sm text-text/60 mb-6">Have extra groceries or cooked meals? Post them here for locals to claim.</p>
            
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <input type="text" required placeholder="What are you sharing? (e.g. 5x Apples)" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary outline-none text-sm">
                  <option value="cooked">Cooked Food</option><option value="produce">Fresh Produce</option><option value="packaged">Packaged</option>
                </select>
                <input type="number" required placeholder="Qty" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text/40 mb-1 ml-1">Photo Required</label>
                <input type="file" required accept="image/*" onChange={e => { setImage(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0])); }} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-text cursor-pointer" />
                {preview && <img src={preview} className="h-24 w-full object-cover rounded-xl mt-2" />}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text/40 mb-1 ml-1">Claim Limit</label>
                  <input type="number" min="1" required value={form.claimedByLimit} onChange={e=>setForm({...form, claimedByLimit: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-text/40 mb-1 ml-1">Expiry</label>
                   <input type="datetime-local" required value={form.expiresAt} onChange={e=>setForm({...form, expiresAt: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1"><label className="block text-xs font-bold uppercase tracking-wider text-text/40 ml-1">Pickup Location</label><button type="button" onClick={handleGPS} className="text-xs text-primary font-bold">📍 Use My GPS</button></div>
                <input type="text" required placeholder="General neighborhood or address" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary outline-none" />
                {form.lat !== 0 && <p className="text-[10px] text-green-600 font-bold ml-1 mt-1">Coordinates bound</p>}
              </div>

              <button type="submit" disabled={submitting || form.lat === 0} className="w-full py-3 bg-black text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition disabled:opacity-50">
                {submitting ? 'Posting...' : 'Share Now 🚀'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right Side: Feed ── */}
        <div className="lg:w-2/3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-heading font-black">Community Feed</h2>
            <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-text/50">Radius: {radius}km</span>
               <input type="range" min="1" max="50" value={radius} onChange={e => setRadius(e.target.value)} className="w-32 accent-primary" />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-center py-20 text-text/50">Loading local items...</p> : 
             !location.lat ? <p className="text-center py-20 text-yellow-600 font-bold bg-yellow-50 rounded-2xl">Location access required to view nearby shares.</p> :
             shares.length === 0 ? (
               <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center text-text/50">
                 <span className="text-4xl block mb-4">🏠</span>
                 <p className="font-medium">No community shares found within {radius}km.</p>
                 <p className="text-sm mt-1 text-text/40">Be the first to share something from your kitchen.</p>
               </div>
             ) : shares.map(share => {
               const isPoster = share.postedBy._id === user?._id;
               const claimedFull = share.claimedCount >= share.claimedByLimit;
               const pct = (share.claimedCount / share.claimedByLimit) * 100;

               return (
                 <div key={share._id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-5">
                   <img src={share.image} className="w-full sm:w-32 h-32 object-cover rounded-2xl bg-gray-50 shrink-0" />
                   
                   <div className="flex-1 flex flex-col justify-between">
                     <div>
                       <div className="flex justify-between items-start">
                         <h3 className="font-bold text-lg leading-tight">{share.name}</h3>
                         <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-bold text-primary whitespace-nowrap">📍 {share.distance?.toFixed(1) || 0}km</span>
                       </div>
                       
                       <div className="flex items-center gap-2 mt-2">
                         {share.postedBy.avatar ? <img src={share.postedBy.avatar} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-gray-200" />}
                         <span className="text-xs font-semibold text-text/60">{share.postedBy.name}</span>
                         <span className="text-xs text-text/30">•</span>
                         <span className="text-xs text-text/60 bg-gray-50 px-2 py-0.5 rounded uppercase">{share.category}</span>
                       </div>
                     </div>
                     
                     <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                       <div className="w-full sm:w-48">
                         <div className="flex justify-between text-[10px] font-bold text-text/40 mb-1 uppercase tracking-wider">
                           <span>Claimed</span><span>{share.claimedCount} / {share.claimedByLimit}</span>
                         </div>
                         <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-500 rounded-full ${claimedFull ? 'bg-red-500' : pct > 50 ? 'bg-orange-500' : 'bg-green-500'}`} style={{width: `${pct}%`}} />
                         </div>
                       </div>
                       
                       <button onClick={() => handleClaim(share._id)} disabled={isPoster || claimedFull} className={`w-full sm:w-auto px-6 py-2 rounded-xl font-bold shadow-sm transition ${isPoster ? 'bg-gray-100 text-gray-400' : claimedFull ? 'bg-red-50 text-red-500 opacity-50' : 'bg-primary text-white hover:bg-green-700 active:scale-95'}`}>
                         {isPoster ? "Your Post" : claimedFull ? "All Claimed" : "Tap to Claim"}
                       </button>
                     </div>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityShare;
