import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const Profile = () => {
  const { user, loadUser } = useAuthStore();
  const [stats, setStats] = useState(null);

  const getInitialForm = () => ({
    name: user?.name || '',
    phone: user?.phone || '',
    orgName: user?.orgName || '',
    address: user?.location?.address || ''
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(getInitialForm);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/users/stats');
        setStats(res.data.data);
      } catch (err) { console.error('Failed to load stats', err); }
    };
    fetchStats();
  }, []);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
      setEditing(true);
    }
  };

  // Reset form to current user values on cancel
  const handleCancel = () => {
    setForm(getInitialForm());
    setAvatarPreview(user?.avatar || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditing(false);
  };

  const handleSave = async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('phone', form.phone);
    if (form.orgName) formData.append('orgName', form.orgName);
    formData.append('location', JSON.stringify({ address: form.address, coordinates: [0, 0] }));
    if (fileInputRef.current?.files[0]) formData.append('image', fileInputRef.current.files[0]);
    try {
      await api.patch('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await loadUser();
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally { setSubmitting(false); }
  };

  const calculateTrustScoreVisual = (score) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const strokeColor = score < 40 ? '#EF4444' : score < 70 ? '#EAB308' : '#16A34A';
    const msg = score < 40 ? 'Build trust by completing more deliveries.' : score < 70 ? 'Good standing — keep it up!' : 'Excellent! Community heavily trusts you.';
    return { circumference, strokeDashoffset, strokeColor, msg };
  };

  if (!user) return <div className="p-20 text-center">Loading profile...</div>;

  const trustVis = calculateTrustScoreVisual(user.trustScore || 50);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-primary/10"></div>
            <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white relative z-10" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary text-white flex items-center justify-center font-black text-4xl border-4 border-white shadow-md relative z-10">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition duration-300 z-20">
                <span className="text-white text-2xl mb-1">📷</span><span className="text-white font-bold text-xs uppercase">Edit</span>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
            </div>

            <div className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                {!editing ? <p className="font-bold text-lg">{user.name}</p> : <input className="w-full border-b-2 border-primary outline-none py-1 font-bold" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
              </div>
              <div className="flex justify-between items-center">
                <span className="bg-gray-100 text-gray-600 font-black uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-full">{user.role}</span>
                <span className="text-sm font-bold text-text/50">{user.email}</span>
              </div>
              {(user.role === 'donor' || user.role === 'retail' || user.role === 'ngo') && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">Organization Name</label>
                  {!editing ? <p className="font-semibold">{user.orgName || 'Not Set'}</p> : <input className="w-full border-b-2 border-primary outline-none py-1" value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} placeholder="e.g. PlatePulse Bank" />}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">Phone</label>
                {!editing ? <p className="font-semibold">{user.phone || 'Not Set'}</p> : <input type="tel" className="w-full border-b-2 border-primary outline-none py-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91..." />}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4">Location</label>
                {!editing ? <p className="font-semibold text-sm">{user.location?.address || 'Not Set'}</p> : <input className="w-full border-b-2 border-primary outline-none py-1 text-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address..." />}
              </div>
            </div>

            {!editing ? (
              <button onClick={() => setEditing(true)} className="w-full p-3 font-bold border-2 border-gray-100 rounded-xl mt-8 hover:bg-gray-50 transition">Edit Profile</button>
            ) : (
              <div className="w-full flex gap-3 mt-8">
                <button onClick={handleCancel} className="flex-1 p-3 font-bold border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSave} disabled={submitting} className="flex-1 p-3 font-bold bg-black text-white rounded-xl shadow-md hover:bg-gray-800 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-2/3 space-y-6">
          {user.role !== 'consumer' && user.role !== 'waste_plant' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="relative w-32 h-32 flex justify-center items-center shrink-0">
                  <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
                    <circle cx="64" cy="64" r="54" fill="transparent" stroke={trustVis.strokeColor} strokeWidth="12" strokeDasharray={trustVis.circumference} strokeDashoffset={trustVis.strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <span className="text-3xl font-heading font-black">{user.trustScore || 50}</span>
                    <span className="text-[10px] font-bold text-gray-400">/ 100</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-heading font-black mb-1">Trust Score</h3>
                  <p className="text-sm text-text/60">{trustVis.msg}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] p-6 rounded-3xl shadow-sm text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-heading font-black mb-1">Community Level</h3>
                  <p className="text-green-100 text-sm">Accumulate points to reach the Hero Tier.</p>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-heading font-black text-3xl">{user.points || 0} pts</span>
                    <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">{user.badge || 'Bronze'}</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FFC107] w-1/3 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <h3 className="font-heading font-black text-xl mb-4 mt-8 px-2">Lifetime Impact Statistics</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats && Object.entries(stats).map(([key, val]) => (
              <div key={key} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 text-center">
                <p className="text-text/50 text-xs font-bold uppercase tracking-widest mb-1 line-clamp-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="font-heading font-black text-3xl text-primary">{val}</p>
              </div>
            ))}
            {!stats && <div className="col-span-full py-8 text-center text-gray-400 font-bold animate-pulse">Aggregating records...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
