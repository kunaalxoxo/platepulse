import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import api from '../../services/api';

const COLORS = ['#2E7D32', '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ data: [], page: 1, hasNext: false });
  const [donations, setDonations] = useState({ data: [], page: 1, hasNext: false });
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'analytics') fetchStats();
    if (activeTab === 'users') fetchUsers(1, true, search);
    if (activeTab === 'donations') fetchDonations(1, true);
  }, [activeTab, roleFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      // Pass current search value directly to avoid stale closure
      const timer = setTimeout(() => fetchUsers(1, true, search), 400);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // searchTerm param avoids stale closure when called from debounce
  const fetchUsers = async (page = 1, reset = false, searchTerm = search) => {
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=20&search=${searchTerm}&role=${roleFilter}`);
      setUsers(prev => ({
        data: reset ? res.data.data : [...prev.data, ...res.data.data],
        page: res.data.pagination.page,
        hasNext: res.data.pagination.hasNext
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDonations = async (page = 1, reset = false) => {
    try {
      const res = await api.get(`/admin/donations?page=${page}&limit=20`);
      setDonations(prev => ({
        data: reset ? res.data.data : [...prev.data, ...res.data.data],
        page,
        hasNext: res.data.data.length === 20
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const verifyUser = async (id) => {
    if(!window.confirm('Verify this user?')) return;
    try {
      await api.patch(`/admin/users/${id}/verify`);
      setUsers(prev => ({...prev, data: prev.data.map(u => u._id === id ? {...u, isVerified: true} : u)}));
    } catch (err) { alert('Failed to verify'); }
  };

  const suspendUser = async (id, currentStatus) => {
    if(!window.confirm(`Are you sure you want to ${currentStatus ? 'restore' : 'suspend'} this user?`)) return;
    try {
      await api.patch(`/admin/users/${id}/suspend`);
      setUsers(prev => ({...prev, data: prev.data.map(u => u._id === id ? {...u, isSuspended: !currentStatus} : u)}));
    } catch (err) { alert('Failed to suspend'); }
  };

  const TabButton = ({ id, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap
      ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-black'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-heading font-black text-3xl mb-1">Command Center</h1>
          <p className="text-gray-500 text-sm font-semibold">PlatePulse Platform Administration</p>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-100 mb-8 scrollbar-hide">
        <TabButton id="overview" label="Overview" />
        <TabButton id="users" label="Users & Access" />
        <TabButton id="donations" label="Global Logistics" />
        <TabButton id="analytics" label="System Analytics" />
      </div>

      {activeTab === 'overview' && stats && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" title="Total Users" val={stats.totalUsers} />
            <StatCard icon="🍽️" title="Total Donations" val={stats.totalDonations} />
            <StatCard icon="🚚" title="Active Missions" val={stats.activeMissions} />
            <StatCard icon="♻️" title="Waste Processed" val={`${stats.wasteProcessedKg}kg`} highlight />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-heading font-black text-lg mb-6">User Signups (Last 8 Weeks)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.signupsByWeek.map(d=>({ week: `Wk ${d._id}`, count: d.count }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="week" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-heading font-black text-lg mb-6">Resource Allocation by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.donationsByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="_id">
                      {stats.donationsByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder="Search name or email..." className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 font-semibold text-sm focus:outline-none focus:border-primary" value={search} onChange={e=>setSearch(e.target.value)} />
            <select className="bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-primary" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="donor">Donors</option>
              <option value="ngo">NGOs</option>
              <option value="volunteer">Volunteers</option>
              <option value="retail">Retail</option>
              <option value="consumer">Consumers</option>
              <option value="waste_plant">Waste Plants</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hidden sm:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-500 font-black">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Trust</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.data.map(u => (
                  <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{u.name.substring(0,2).toUpperCase()}</div>}
                        <div><p className="font-bold">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="p-4"><span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">{u.role}</span></td>
                    <td className="p-4 font-bold text-primary">{u.trustScore || 50}/100</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {u.isVerified ? <span className="text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded">✅ Verified</span> : <span className="text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-1 rounded">⏳ Pending</span>}
                        {u.isSuspended && <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">🚨 Banned</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!u.isVerified && <button onClick={()=>verifyUser(u._id)} className="text-xs font-bold text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition">Approve</button>}
                      <button onClick={()=>suspendUser(u._id, u.isSuspended)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${u.isSuspended ? 'text-gray-600 bg-gray-100 border border-gray-200' : 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'}`}>
                        {u.isSuspended ? 'Restore' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden space-y-4">
            {users.data.map(u => (
              <div key={u._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  {u.avatar ? <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{u.name.substring(0,2).toUpperCase()}</div>}
                  <div><p className="font-bold leading-tight">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">{u.role}</span>
                  <span className="font-bold text-sm text-primary">{u.trustScore || 50} Trust</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {!u.isVerified && <button onClick={()=>verifyUser(u._id)} className="text-xs font-bold text-green-600 bg-green-50 py-2 rounded-lg">Approve</button>}
                  <button onClick={()=>suspendUser(u._id, u.isSuspended)} className={`col-span-1 text-xs font-bold py-2 rounded-lg ${u.isSuspended ? 'text-gray-600 bg-gray-100' : 'text-red-600 bg-red-50'}`}>{u.isSuspended ? 'Restore' : 'Suspend'}</button>
                </div>
              </div>
            ))}
          </div>

          {users.hasNext && <button onClick={()=>fetchUsers(users.page + 1, false, search)} className="w-full py-3 text-sm font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl transition">Load More Users</button>}
        </div>
      )}

      {activeTab === 'analytics' && stats && (
         <div className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatCard title="New Signups (7d)" val={`+${stats.newUsersThisWeek}`} />
             <StatCard title="Active Logistics" val={stats.activeMissions} />
             <StatCard title="System Health" val="Stable 🟢" />
           </div>
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-heading font-black text-lg mb-6">30-Day Platform Delta</h3>
              <div className="h-80 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200 text-gray-400 font-bold text-sm">
                 [Advanced High-Frequency Logistics Chart Placeholder]
              </div>
           </div>
         </div>
      )}

      {activeTab === 'donations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-500 font-black">
                  <th className="p-4">Item</th>
                  <th className="p-4">Donor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {donations.data.map(d => (
                  <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <p className="font-bold">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.quantity} {d.quantityUnit} • {d.category}</p>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">{d.donor?.orgName || d.donor?.name || 'Unknown'}</td>
                    <td className="p-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        d.status === 'available' ? 'bg-green-100 text-green-800' :
                        d.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                       }`}>{d.status}</span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-500">
                      Created: {new Date(d.createdAt).toLocaleDateString()}<br/>
                      {d.assignedTo ? `Assigned: ${d.assignedTo.name}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {donations.hasNext && <button onClick={()=>fetchDonations(donations.page + 1)} className="w-full py-3 text-sm font-bold text-gray-500 hover:text-black hover:bg-gray-50 rounded-xl transition">Load More Logistics</button>}
        </div>
      )}

    </div>
  );
};

const StatCard = ({ icon, title, val, highlight }) => (
  <div className={`p-6 rounded-3xl border ${highlight ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white border-gray-100 shadow-sm'}`}>
    {icon && <div className="text-3xl mb-3">{icon}</div>}
    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-green-100' : 'text-gray-400'}`}>{title}</p>
    <p className="font-heading font-black text-3xl">{val}</p>
  </div>
);

export default AdminDashboard;
