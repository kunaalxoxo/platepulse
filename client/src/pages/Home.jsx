import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const Home = () => {
  const { user } = useAuthStore();
  const [impactStats, setImpactStats] = useState({ totalMealsSaved: 0, totalCO2Prevented: 0, activeNGOs: 0 });
  const [recentLive, setRecentLive] = useState([]);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const res = await api.get('/impact/stats');
        setImpactStats({
          totalMealsSaved: res.data.data.general.totalMealsSaved,
          totalCO2Prevented: res.data.data.general.totalCO2Prevented,
          activeNGOs: res.data.data.general.activeNGOs || 120
        });
      } catch(e) {}
    };
    
    const fetchDonations = async () => {
      try {
        // We use map markers public search trick to pull 3 local ones if we don't have a public paginated endpoint available without token
        const res = await api.get('/map/markers?lat=20&lng=78&radius=10000000&types=donations');
        setRecentLive(res.data.data.donations.slice(0, 3));
      } catch(e) {}
    }

    fetchImpact();
    fetchDonations();
    
    const interval = setInterval(fetchImpact, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex justify-center bg-surface overflow-x-hidden">
      <div className="w-full">
        {/* ── SECTION 1: HERO ── */}
        <section className="relative min-h-[90vh] bg-gradient-to-br from-[#1b4332] via-[#2E7D32] to-[#4CAF50] flex items-center px-4 overflow-hidden pt-16">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="text-left animate-slide-in-right">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-widest backdrop-blur-md mb-6 border border-white/30">
                🌱 Fighting Food Waste Together
              </span>
              <h1 className="text-5xl md:text-7xl font-heading font-black text-white leading-[1.1] tracking-tight mb-6">
                Rescue Food.<br/>
                <span className="text-[#FFC107]">Feed Communities.</span><br/>
                Heal the Planet.
              </h1>
              <p className="text-green-50 text-lg md:text-xl font-medium mb-10 max-w-xl leading-relaxed">
                PlatePulse intelligently bridges the gap between surplus food and verified distributors in real-time. Join the network catching meals before they expire.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!user && <Link to="/register?role=donor" className="bg-white text-primary font-black text-base md:text-lg px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform text-center whitespace-nowrap">Donate Surplus Food 🍽️</Link>}
                {user && <Link to="/dashboard" className="bg-white text-primary font-black text-base md:text-lg px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform text-center whitespace-nowrap">Go to Dashboard 📊</Link>}
                <Link to="/map" className="border-2 border-white/50 bg-white/10 backdrop-blur-sm text-white font-bold text-base md:text-lg px-8 py-4 rounded-full hover:bg-white/20 transition-all text-center whitespace-nowrap hover:border-white">Explore Live Map 🗺️</Link>
              </div>
            </div>
            
            <div className="hidden lg:block relative h-[500px]">
              {/* Floating Emjois Animation CSS handled in global.css */}
              <div className="absolute top-10 left-10 text-7xl animate-float" style={{animationDelay: '0s'}}>🍛</div>
              <div className="absolute top-40 right-10 text-7xl animate-float" style={{animationDelay: '1.2s'}}>🥗</div>
              <div className="absolute bottom-20 left-20 text-7xl animate-float" style={{animationDelay: '2.4s'}}>🥖</div>
              <div className="absolute top-1/2 left-1/2 text-8xl animate-float drop-shadow-2xl z-20" style={{animationDelay: '0.6s'}}>🍱</div>
              <div className="absolute bottom-10 right-20 text-7xl animate-float" style={{animationDelay: '1.8s'}}>🍎</div>
              <div className="absolute rounded-full w-[400px] h-[400px] bg-white/5 blur-3xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"></div>
            </div>
          </div>
          
          {/* Bottom Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
             <svg viewBox="0 0 1440 120" className="w-full h-auto text-[#1a1a1a] fill-current" preserveAspectRatio="none">
                <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
             </svg>
          </div>
        </section>

        {/* ── SECTION 2: LIVE IMPACT BAR ── */}
        <section className="bg-[#1a1a1a] py-8 md:py-12 px-4 relative z-20">
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center md:justify-between gap-8 md:gap-4 text-center">
            <div className="w-full sm:w-auto">
              <span className="block text-4xl md:text-5xl mb-2">🍽️</span>
              <h3 className="text-3xl md:text-5xl font-heading font-black text-white mb-1" style={{fontVariantNumeric: 'tabular-nums'}}>{impactStats.totalMealsSaved.toLocaleString()}</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Meals Saved</p>
            </div>
            <div className="w-full sm:w-auto">
              <span className="block text-4xl md:text-5xl mb-2">🌱</span>
              <h3 className="text-3xl md:text-5xl font-heading font-black text-white mb-1" style={{fontVariantNumeric: 'tabular-nums'}}>{Math.round(impactStats.totalCO2Prevented).toLocaleString()}<span className="text-2xl text-gray-500">kg</span></h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">CO₂ Prevented</p>
            </div>
            <div className="w-full sm:w-auto">
              <span className="block text-4xl md:text-5xl mb-2">🤝</span>
              <h3 className="text-3xl md:text-5xl font-heading font-black text-white mb-1" style={{fontVariantNumeric: 'tabular-nums'}}>{impactStats.activeNGOs}+</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Verified NGO Partners</p>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: HOW IT WORKS ── */}
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">The Process</h2>
            <h3 className="text-3xl md:text-4xl font-heading font-black text-text">Four steps to zero food waste</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
             <div className="hidden lg:block absolute top-12 left-10 right-10 h-0.5 bg-gray-200 z-0 border-t-2 border-dashed border-gray-300"></div>
             {[
               { icon: '🍽️', title: 'Donors List Food', desc: 'Restaurants & orgs post surplus meals with one tap before closing.' },
               { icon: '🚚', title: 'NGOs Collect', desc: 'Verified NGOs and active volunteers accept missions and pick up nearby.' },
               { icon: '🏷️', title: 'Earn Discounts', desc: 'Near-expiry items automatically drop in price, sold at up to 80% off.' },
               { icon: '♻️', title: 'Zero Waste', desc: 'Fully expired food routes to verified organic waste and biogas plants.' }
             ].map((step, i) => (
               <div key={i} className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-shadow border border-gray-100 p-8 text-center relative z-10 flex flex-col items-center">
                 <div className="w-8 h-8 rounded-full bg-primary text-white font-black flex items-center justify-center absolute -top-4 shadow-md">{i+1}</div>
                 <div className="text-5xl mb-6 bg-surface w-20 h-20 rounded-full flex items-center justify-center">{step.icon}</div>
                 <h4 className="font-heading font-black text-lg mb-3">{step.title}</h4>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
               </div>
             ))}
          </div>
        </section>

        {/* ── SECTION 4: ROLE CARDS ── */}
        <section className="py-24 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-heading font-black text-text">Join PlatePulse as...</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { role: 'donor', icon: '🍽️', name: 'Donor', desc: 'Share surplus food from your restaurant, hotel, or private event heavily combating localized waste.' },
                { role: 'retail', icon: '🏪', name: 'Retail', desc: 'List near-expiry supermarket stock with dynamic programmatic discounts increasing sell-through.' },
                { role: 'ngo', icon: '🤝', name: 'NGO', desc: 'Collect and distribute donated food directly to those in need utilizing our smart-mapping app.' },
                { role: 'volunteer', icon: '🚴', name: 'Volunteer', desc: 'Help transport food bounding between nodes. Earn reward points, level up, and build trust.' },
                { role: 'consumer', icon: '🛒', name: 'Consumer', desc: 'Buy perfectly fresh, safe food at massive discounts via our fully integrated marketplace checkout.' },
                { role: 'waste_plant', icon: '♻️', name: 'Waste Plant', desc: 'Convert fundamentally expired food waste into compost and biogas tracking carbon offsets.' }
              ].map((r, i) => (
                <div key={i} onClick={() => window.location.href = `/register?role=${r.role}`} className="bg-surface rounded-3xl p-8 cursor-pointer group hover:bg-primary transition-colors duration-300 border border-transparent hover:border-green-600">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">{r.icon}</div>
                  <h4 className="font-heading font-black text-xl mb-3 group-hover:text-white transition-colors">{r.name}</h4>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 group-hover:text-green-100 transition-colors">{r.desc}</p>
                  <span className="inline-flex font-bold text-sm text-primary group-hover:text-white items-center gap-1">Join as {r.name} <span className="text-lg leading-none">→</span></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: LIVE DONATIONS PREVIEW ── */}
        {recentLive.length > 0 && (
          <section className="py-24 px-4 bg-surface">
            <div className="max-w-7xl mx-auto">
               <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
                 <div>
                    <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> Live Right Now</h2>
                    <h3 className="text-3xl font-heading font-black text-text">Fresh Food Pending Pickup</h3>
                 </div>
                 <Link to="/map" className="font-bold text-primary hover:text-green-800 bg-white px-6 py-3 rounded-full shadow-sm hover:shadow-md transition">View All on Map →</Link>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {recentLive.map((doc, idx) => (
                   <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                      {doc.image && <div className="h-48 w-full"><img src={doc.image} className="w-full h-full object-cover" /></div>}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-lg">{doc.name}</h4>
                           <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase px-2 py-1 rounded">Available</span>
                        </div>
                        <p className="text-sm text-primary font-semibold mb-4">{doc.donor?.orgName}</p>
                        <Link to="/map" className="block w-full py-3 bg-gray-50 text-center rounded-xl font-bold text-sm hover:bg-gray-100 transition">Locate 📍</Link>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </section>
        )}

        {/* ── SECTION 6: CTA BANNER ── */}
        <section className="py-24 px-4 bg-primary text-center">
           <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-6">Join 500+ volunteers making a difference today.</h2>
              <p className="text-green-100 text-lg md:text-xl mb-10 font-medium">Earn points, collect gamified badges, help your community, and drastically reduce carbon emissions.</p>
              <Link to="/register?role=volunteer" className="inline-block bg-white text-primary font-black text-lg px-10 py-5 rounded-full shadow-2xl hover:scale-105 transition-transform">Become a Volunteer 🚀</Link>
           </div>
        </section>

        {/* ── SECTION 7: FOOTER ── */}
        <footer className="bg-[#0f0f0f] text-gray-400 py-16 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xl">P</div>
                <span className="font-heading font-black text-xl tracking-tight text-white">PlatePulse</span>
              </div>
              <p className="font-medium max-w-xs leading-relaxed">Turning absolute surplus directly into local sustenance. Intelligent food redistribution algorithms.</p>
            </div>
            <div>
               <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
               <ul className="space-y-3 font-semibold text-sm">
                 <li><Link to="/map" className="hover:text-white transition">Live Map</Link></li>
                 <li><Link to="/impact" className="hover:text-white transition">Global Impact</Link></li>
                 <li><Link to="/marketplace" className="hover:text-white transition">Discounted Marketplace</Link></li>
                 <li><Link to="/community" className="hover:text-white transition">Community Sharing</Link></li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Get Started</h4>
               <ul className="space-y-3 font-semibold text-sm">
                 <li><Link to="/login" className="hover:text-white transition">Log In</Link></li>
                 <li><Link to="/register" className="text-primary hover:text-green-400 transition">Create an Account →</Link></li>
               </ul>
               <p className="mt-8 text-xs font-bold text-gray-600 block">Built for a sustainable future 🌱</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs font-semibold gap-4">
             <p>© 2026 PlatePulse. All rights reserved.</p>
             <div className="flex gap-6">
               <span className="hover:text-white cursor-pointer">Privacy</span>
               <span className="hover:text-white cursor-pointer">Terms</span>
             </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Home;
