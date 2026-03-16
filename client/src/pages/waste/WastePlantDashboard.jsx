import { useState, useEffect } from 'react';
import api from '../../services/api';

const WastePlantDashboard = () => {
  const [activeTab, setActiveTab] = useState('incoming'); // incoming, completed, impact
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [form, setForm] = useState({ compostKg: '', biogasLiters: '', feedKg: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // We rely on backend filtering to grab pending vs completed
      const statusParam = activeTab === 'completed' ? 'completed' : 'pending';
      const res = await api.get(`/waste/my-requests?status=${statusParam}`);
      setRequests(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'incoming' || activeTab === 'completed') {
      fetchRequests();
    }
  }, [activeTab]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/waste/${selectedReq._id}/confirm`, form);
      alert('✅ Impact logged successfully!');
      setSelectedReq(null);
      setForm({ compostKg: '', biogasLiters: '', feedKg: '' });
      fetchRequests(); // Refresh the active list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getImpactTotals = () => {
    // If we wanted to, we could hit a dedicated stats endpoint for the user, 
    // but in this mockup we'll sum over the local 'completed' fetch if we had all data.
    // For simplicity, we just aggregate the currently loaded array since normally this would 
    // be paginated and backed by a server route.
    return {
      compost: requests.reduce((sum, r) => sum + (r.compostKg || 0), 0),
      biogas: requests.reduce((sum, r) => sum + (r.biogasLiters || 0), 0),
      feed: requests.reduce((sum, r) => sum + (r.feedKg || 0), 0)
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-black mb-2">Waste Plant Dashboard 🌱</h1>
      <p className="text-text/60 mb-8">Process expired food and track your facility's environmental impact.</p>

      <div className="flex gap-2 mb-8 border-b border-gray-100 pb-4">
        <button onClick={() => setActiveTab('incoming')} className={`px-6 py-2 rounded-xl font-medium transition ${activeTab === 'incoming' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>Incoming Pickups</button>
        <button onClick={() => setActiveTab('completed')} className={`px-6 py-2 rounded-xl font-medium transition ${activeTab === 'completed' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>Completed</button>
        <button onClick={() => { setActiveTab('impact'); fetchRequests(); /* trigger load of completed data for stats */ }} className={`px-6 py-2 rounded-xl font-medium transition ${activeTab === 'impact' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>Impact Stats</button>
      </div>

      {loading ? (
        <p className="text-center py-20 text-text/50">Loading data...</p>
      ) : activeTab === 'incoming' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.length === 0 ? <p className="col-span-full text-center text-text/50 py-12">No pending pickups. We'll notify you when expired food is mapped to your plant.</p> : requests.map(r => (
            <div key={r._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full mb-3 inline-block">Pending Collection</span>
                <h3 className="font-bold text-lg mb-1">{r.donation?.name || 'Unknown Item'}</h3>
                <p className="text-text/60 text-sm mb-4">{r.donation?.quantity} {r.donation?.quantityUnit} ({r.donation?.category})</p>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-6 text-sm flex gap-2">
                  <span>📍</span><span className="text-text/80">{r.donation?.pickupLocation?.address || 'GPS Coordinates Provided'}</span>
                </div>
              </div>
              <button onClick={() => setSelectedReq(r)} className="w-full py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-md">
                Enter Process Report
              </button>
            </div>
          ))}
        </div>
      ) : activeTab === 'completed' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b border-gray-100 font-bold text-text/60 uppercase text-xs">
                 <tr><th className="px-6 py-4">Item Processed</th><th className="px-6 py-4">Date Confirmed</th><th className="px-6 py-4 text-right">Compost (kg)</th><th className="px-6 py-4 text-right">Biogas (L)</th><th className="px-6 py-4 text-right">Feed (kg)</th></tr>
               </thead>
               <tbody>
                 {requests.length === 0 ? <tr><td colSpan="5" className="px-6 py-12 text-center text-text/50">No completed jobs yet.</td></tr> : requests.map(r => (
                   <tr key={r._id} className="border-b border-gray-50">
                     <td className="px-6 py-4 font-bold">{r.donation?.name}</td>
                     <td className="px-6 py-4 text-text/60">{new Date(r.confirmedAt).toLocaleDateString()}</td>
                     <td className="px-6 py-4 text-right text-green-700 font-bold">+{r.compostKg || 0}</td>
                     <td className="px-6 py-4 text-right text-blue-700 font-bold">+{r.biogasLiters || 0}</td>
                     <td className="px-6 py-4 text-right text-yellow-700 font-bold">+{r.feedKg || 0}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {[{ l: 'Total Compost Generated', v: `${getImpactTotals().compost} kg`, i: '🌿', c: 'text-green-600', b: 'bg-green-50' },
               { l: 'Total Biogas Produced', v: `${getImpactTotals().biogas} L`, i: '⚡', c: 'text-blue-600', b: 'bg-blue-50' },
               { l: 'Animal Feed Directed', v: `${getImpactTotals().feed} kg`, i: '🐄', c: 'text-yellow-600', b: 'bg-yellow-50' },
               { l: 'Est. CO₂ Prevented', v: `${(getImpactTotals().compost * 2.5).toFixed(1)} kg`, i: '🌍', c: 'text-primary', b: 'bg-primary/10' }]
              .map((stat, idx) => (
               <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                 <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${stat.b} opacity-50 flex items-center justify-center text-4xl`}>{stat.i}</div>
                 <p className="text-sm font-medium text-text/60 mb-2 relative z-10">{stat.l}</p>
                 <p className={`text-4xl font-heading font-black relative z-10 ${stat.c}`}>{stat.v}</p>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* ── Submission Modal ── */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading font-black">Process Report</h2>
              <button onClick={() => setSelectedReq(null)} className="text-2xl font-bold text-gray-400 hover:text-black">&times;</button>
            </div>
            
            <p className="text-sm text-text/60 mb-6">Enter the yields generated by processing <strong className="text-black">{selectedReq.donation?.name}</strong>.</p>
            
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                 <label className="block text-sm font-bold mb-1">Compost Generated (kg)</label>
                 <input type="number" step="0.1" min="0" value={form.compostKg} onChange={e=>setForm({...form, compostKg: e.target.value})} className="w-full border px-4 py-2 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="e.g. 5.2" />
              </div>
              <div>
                 <label className="block text-sm font-bold mb-1">Biogas Produced (Liters)</label>
                 <input type="number" step="0.1" min="0" value={form.biogasLiters} onChange={e=>setForm({...form, biogasLiters: e.target.value})} className="w-full border px-4 py-2 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 15.0" />
              </div>
              <div>
                 <label className="block text-sm font-bold mb-1">Animal Feed (kg)</label>
                 <input type="number" step="0.1" min="0" value={form.feedKg} onChange={e=>setForm({...form, feedKg: e.target.value})} className="w-full border px-4 py-2 rounded-xl focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500" placeholder="e.g. 2.0" />
              </div>
              
              <button type="submit" disabled={submitting || (!form.compostKg && !form.biogasLiters && !form.feedKg)} className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4 hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Authenticating...' : 'Sign & Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WastePlantDashboard;
