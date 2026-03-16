import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';

// Simple CountUp animation hook
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!end) return;
    let startTime = null;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = time - startTime;
      const percent = Math.min(progress / duration, 1);
      // ease-out quintic
      const easeValue = 1 - Math.pow(1 - percent, 5);
      setCount(Math.floor(end * easeValue));
      if (percent < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

const AnimatedNumber = ({ value }) => <span>{useCountUp(value)}</span>;

const ImpactDashboard = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ donors: [], volunteers: [] });
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    const loadImpactData = async () => {
      try {
        const [statsRes, leadRes, trendRes] = await Promise.all([
          api.get('/impact/stats'),
          api.get('/impact/leaderboard'),
          api.get('/impact/weekly-trend')
        ]);
        setStats(statsRes.data.data);
        setLeaderboard(leadRes.data.data);
        setTrendData(trendRes.data.data);
      } catch (err) {
        console.error('Failed to load impact data', err);
      }
    };

    loadImpactData();
    const interval = setInterval(loadImpactData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon, label, val, suffix = '' }) => (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex flex-col items-center justify-center text-white relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-4xl lg:text-5xl font-heading font-black mb-1 drop-shadow-md">
        {stats ? <AnimatedNumber value={val} /> : '0'}{suffix}
      </p>
      <p className="text-sm font-medium text-white/80 tracking-wide uppercase">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Hero Section ── */}
      <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] pt-16 pb-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-6 drop-shadow-lg">
            Together, we're healing the planet 🌍
          </h1>
          <p className="text-xl text-green-100/90 font-medium mb-12">
            Real-time food waste recovery metrics aggregating from every user across the PlatePulse ecosystem.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon="🍽️" label="Meals Saved" val={stats?.totalMealsSaved || 0} />
            <StatCard icon="🌱" label="CO₂ Prev" val={stats?.totalCO2Prevented || 0} suffix=" kg" />
            <StatCard icon="♻️" label="Diverted" val={stats?.totalFoodDivertedKg || 0} suffix=" kg" />
            <StatCard icon="🌿" label="Compost" val={stats?.totalCompostKg || 0} suffix=" kg" />
            <StatCard icon="⚡" label="Biogas" val={stats?.totalBiogasLiters || 0} suffix=" L" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── Charts ── */}
          <div className="lg:w-2/3 space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-heading font-black mb-6">Meals Saved Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#888', fontSize:12, fontWeight:600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#888', fontSize:12}} dx={-10} />
                    <Tooltip cursor={{fill: '#f9f9f9'}} contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="mealsSaved" fill="#2E7D32" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-heading font-black mb-6">Carbon Output Prevented (kg)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#888', fontSize:12, fontWeight:600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#888', fontSize:12}} dx={-10} />
                    <Tooltip contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}} />
                    <Line type="monotone" dataKey="co2Prevented" stroke="#FF9800" strokeWidth={4} dot={{r:6, fill:'#FF9800', strokeWidth:0}} activeDot={{r:8}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Leaderboard ── */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
              <h3 className="text-2xl font-heading font-black mb-6 flex items-center gap-2">🏆 Wall of Fame</h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4">Top Donors & Organizers</h4>
                  {leaderboard.donors.map((d, i) => (
                    <div key={d._id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 flex items-center justify-center font-black text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400 text-sm">{i+1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-black text-sm">{d.orgName || d.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-primary text-sm block">{d.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4">Top Volunteers</h4>
                  {leaderboard.volunteers.map((v, i) => (
                    <div key={v._id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 flex items-center justify-center font-black text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400 text-sm">{i+1}</span>}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold font-heading text-gray-600">
                         {v.name.substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-black text-sm">{v.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-primary text-sm block">{v.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Stats ── */}
      <div className="max-w-7xl mx-auto px-4 mt-8 flex justify-between bg-primary text-white rounded-3xl p-6 shadow-md">
        <div className="font-heading font-black text-xl">🤝 Community Active Now</div>
        <div className="flex gap-6 font-bold">
          <span>{stats?.activeNGOs || 0} Registered NGOs</span>
          <span>•</span>
          <span>{stats?.missionsCompleted || 0} Missions Completed</span>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
