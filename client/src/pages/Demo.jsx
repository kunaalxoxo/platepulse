import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Data ────────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 1,
    badge: '1 / 7',
    gradient: 'from-[#1B5E20] to-[#2E7D32]',
    title: 'Welcome to PlatePulse',
    subtitle: 'A Smart Food Redistribution Platform',
    body: 'PlatePulse connects surplus food from restaurants, bakeries, and events directly to NGOs, volunteers, and communities — reducing waste and fighting hunger.',
    stats: [
      { icon: '🍽️', value: '50K+',  label: 'Meals Saved' },
      { icon: '👥', value: '2,000+', label: 'Active Users' },
      { icon: '🌍', value: '12',     label: 'Cities' },
      { icon: '🌿', value: '12T',    label: 'CO₂ Reduced' },
    ],
  },
  {
    id: 2,
    badge: '2 / 7',
    gradient: 'from-[#1A237E] to-[#3949AB]',
    title: 'The Problem We Solve',
    subtitle: 'Food Waste is a Crisis',
    body: '40% of all food produced is wasted while 820 million people go hungry every day. PlatePulse bridges this gap with real-time technology.',
    stats: [
      { icon: '🗑️', value: '1.3B T',  label: 'Food Wasted Yearly' },
      { icon: '😔', value: '820M',    label: 'People Hungry' },
      { icon: '💸', value: '₹92,000Cr', label: 'Economic Loss (India)' },
      { icon: '🌡️', value: '8%',      label: 'Global Emissions' },
    ],
  },
  {
    id: 3,
    badge: '3 / 7',
    gradient: 'from-[#4527A0] to-[#6A1B9A]',
    title: 'How PlatePulse Works',
    subtitle: 'Simple. Fast. Impactful.',
    body: 'Our 4-step process connects food donors with those in need in under 30 minutes — powered by real-time matching, maps, and volunteer networks.',
    steps: [
      { num: '01', icon: '🍱', title: 'Donor Lists Food',      desc: 'Restaurants, bakeries, events upload surplus food with photos, quantity & expiry time.' },
      { num: '02', icon: '📋', title: 'NGO Claims It',         desc: 'Nearby NGOs browse available donations and claim what they need with one click.' },
      { num: '03', icon: '🚴', title: 'Volunteer Picks Up',    desc: 'Volunteers accept pickup missions and earn reward points for every delivery.' },
      { num: '04', icon: '❤️', title: 'Impact Tracked',        desc: 'Every meal saved is tracked in real-time. Donors, NGOs and volunteers see their impact.' },
    ],
  },
  {
    id: 4,
    badge: '4 / 7',
    gradient: 'from-[#1B5E20] to-[#827717]',
    title: 'Who Uses PlatePulse?',
    subtitle: '6 User Roles, One Platform',
    body: 'PlatePulse serves every actor in the food rescue ecosystem — from the donor to the final beneficiary.',
    roles: [
      { icon: '🍳', title: 'Donors',       desc: 'Restaurants, hotels, bakeries, events',  color: 'bg-green-50   border-green-200' },
      { icon: '🏢', title: 'NGOs',         desc: 'Claim donations for distribution',        color: 'bg-blue-50    border-blue-200' },
      { icon: '🚴', title: 'Volunteers',   desc: 'Pick up & deliver food, earn points',     color: 'bg-purple-50  border-purple-200' },
      { icon: '🏪', title: 'Retailers',    desc: 'List near-expiry deals on marketplace',   color: 'bg-orange-50  border-orange-200' },
      { icon: '🛒', title: 'Consumers',    desc: 'Buy discounted food, reduce waste',       color: 'bg-yellow-50  border-yellow-200' },
      { icon: '♻️', title: 'Waste Plants', desc: 'Process unrescued food into compost',     color: 'bg-red-50     border-red-200' },
    ],
  },
  {
    id: 5,
    badge: '5 / 7',
    gradient: 'from-[#006064] to-[#00838F]',
    title: 'Key Features',
    subtitle: 'Everything in One Platform',
    body: 'From live donation listings to interactive maps, leaderboards, and real-time impact dashboards — PlatePulse has it all.',
    features: [
      { icon: '🗺️', title: 'Live Food Map',        desc: 'Color-coded markers show available donations, NGO claims, and volunteer assignments in real-time.',      link: '/map' },
      { icon: '🛍️', title: 'Eco Marketplace',      desc: 'Near-expiry products at 20–50% discount. Zero waste, maximum savings.',                               link: '/marketplace' },
      { icon: '📊', title: 'Impact Dashboard',     desc: 'Track meals saved, CO₂ reduced, and environmental impact with live charts.',                           link: '/impact' },
      { icon: '🤝', title: 'Community Share',      desc: 'Residents share home-cooked surplus food freely with neighbours.',                                      link: '/community' },
      { icon: '🏆', title: 'Gamified Leaderboard', desc: 'Volunteers earn points & badges for every pickup. Top donors get featured on the hero wall.',           link: '/dashboard' },
      { icon: '🔔', title: 'Real-time Alerts',     desc: 'Socket-powered instant notifications for new donations, claims, and urgent expiry warnings.',           link: '/dashboard' },
    ],
  },
  {
    id: 6,
    badge: '6 / 7',
    gradient: 'from-[#0D47A1] to-[#1565C0]',
    title: 'Our Impact So Far',
    subtitle: 'Real Numbers. Real Change.',
    body: 'Since launch, PlatePulse has saved thousands of meals and helped communities across 12 cities. Here\'s what the data shows.',
    impact: [
      { icon: '🍽️', value: '52,340',  label: 'Meals Saved' },
      { icon: '🌿', value: '12,800 kg', label: 'CO₂ Prevented' },
      { icon: '📦', value: '8,600 kg',  label: 'Food Waste Diverted' },
      { icon: '👥', value: '2,400+',   label: 'Active Volunteers' },
      { icon: '🏢', value: '180+',     label: 'NGO Partners' },
      { icon: '❤️', value: '340+',     label: 'Food Donors' },
    ],
  },
  {
    id: 7,
    badge: '7 / 7',
    gradient: 'from-[#1B5E20] to-[#2E7D32]',
    title: 'Try It Live',
    subtitle: 'Explore the Full App',
    body: 'PlatePulse is fully functional. Click any feature below to explore the live app and see how it works in real-time.',
    cta: [
      { icon: '📊', label: 'Dashboard',    desc: 'Manage donations & missions',     link: '/dashboard', color: 'bg-[#2E7D32]' },
      { icon: '🗺️', label: 'Food Map',     desc: 'See live locations',               link: '/map',        color: 'bg-[#1565C0]' },
      { icon: '🛍️', label: 'Marketplace',  desc: 'Browse discounted food',          link: '/marketplace', color: 'bg-[#6A1B9A]' },
      { icon: '📈', label: 'Impact Stats', desc: 'View real metrics',                link: '/impact',      color: 'bg-[#E65100]' },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

const Demo = () => {
  const navigate  = useNavigate();
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef  = useRef(null);
  const slide     = SLIDES[current];

  // Auto-play
  useEffect(() => {
    if (autoPlay) {
      timerRef.current = setInterval(() => {
        setCurrent(c => (c + 1) % SLIDES.length);
      }, 4000);
    }
    return () => clearInterval(timerRef.current);
  }, [autoPlay, current]);

  const goTo   = (i) => { clearInterval(timerRef.current); setCurrent(i); };
  const prev   = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next   = () => goTo((current + 1) % SLIDES.length);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">

      {/* ── Top Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/10 flex items-center justify-between px-6 py-3" style={{marginTop: '64px'}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2E7D32] rounded-lg flex items-center justify-center font-black text-white text-sm">P</div>
          <span className="font-bold text-white">PlatePulse Demo</span>
          <span className="text-xs bg-[#2E7D32]/20 text-[#4CAF50] border border-[#2E7D32]/40 px-2 py-0.5 rounded-full font-semibold">Presentation Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
              autoPlay ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/20 text-white/60 hover:text-white'
            }`}
          >
            <span>{autoPlay ? '⏸' : '▶'}</span> Auto Play
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full text-sm font-bold transition"
          >
            Open App →
          </button>
        </div>
      </div>

      {/* ── Slide Area ── */}
      <div className="flex-1 flex flex-col" style={{paddingTop: '128px', paddingBottom: '80px'}}>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/10 fixed z-40" style={{top: '128px'}}>
          <div
            className="h-full bg-[#2E7D32] transition-all duration-500"
            style={{ width: `${((current + 1) / SLIDES.length) * 100}%` }}
          />
        </div>

        <div className="max-w-5xl mx-auto w-full px-4 flex flex-col gap-6">

          {/* Header card */}
          <div className={`rounded-2xl bg-gradient-to-br ${slide.gradient} p-8 md:p-10`}>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full mb-4 inline-block">{slide.badge}</span>
            <h1 className="text-3xl md:text-5xl font-black mb-2">{slide.title}</h1>
            <p className="text-white/80 text-lg font-semibold mb-3">{slide.subtitle}</p>
            <p className="text-white/70 text-base max-w-2xl">{slide.body}</p>
          </div>

          {/* Slide-specific content */}

          {/* Stats grid — slides 1, 2 */}
          {slide.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {slide.stats.map((s, i) => (
                <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-[#2E7D32]/50 transition">
                  <span className="text-3xl">{s.icon}</span>
                  <span className="text-2xl font-black text-white">{s.value}</span>
                  <span className="text-xs text-white/50 font-semibold text-center">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Steps — slide 3 */}
          {slide.steps && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {slide.steps.map((s, i) => (
                <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-6 relative hover:border-[#2E7D32]/50 transition">
                  <span className="absolute top-4 right-4 text-3xl font-black text-white/10">{s.num}</span>
                  <span className="text-3xl mb-3 block">{s.icon}</span>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-white/50 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Roles — slide 4 */}
          {slide.roles && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {slide.roles.map((r, i) => (
                <div key={i} className={`${r.color} border rounded-2xl p-5 flex flex-col items-center text-center gap-2 hover:scale-105 transition`}>
                  <span className="text-3xl">{r.icon}</span>
                  <h3 className="font-black text-gray-800 text-sm">{r.title}</h3>
                  <p className="text-gray-500 text-xs">{r.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Features — slide 5 */}
          {slide.features && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slide.features.map((f, i) => (
                <div
                  key={i}
                  onClick={() => navigate(f.link)}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-[#2E7D32]/60 hover:bg-[#2E7D32]/5 transition group"
                >
                  <div className="w-10 h-10 bg-[#2E7D32]/20 rounded-xl flex items-center justify-center text-xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-white/50 text-sm mb-3">{f.desc}</p>
                  <span className="text-[#4CAF50] text-sm font-semibold group-hover:underline">Explore →</span>
                </div>
              ))}
            </div>
          )}

          {/* Impact — slide 6 */}
          {slide.impact && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {slide.impact.map((item, i) => (
                <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-blue-500/40 transition">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-2xl md:text-3xl font-black text-white">{item.value}</span>
                  <span className="text-xs text-white/50 font-semibold text-center">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA — slide 7 */}
          {slide.cta && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {slide.cta.map((c, i) => (
                <div
                  key={i}
                  onClick={() => navigate(c.link)}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3 cursor-pointer hover:scale-105 transition group"
                >
                  <div className="w-14 h-14 bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-3xl">{c.icon}</div>
                  <h3 className="font-black text-white">{c.label}</h3>
                  <p className="text-white/50 text-xs">{c.desc}</p>
                  <button
                    className={`w-full py-2 ${c.color} text-white rounded-xl text-sm font-bold hover:opacity-90 transition`}
                  >
                    Open →
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur border-t border-white/10 flex items-center justify-between px-6 py-3">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2 px-5 py-2 border border-white/20 rounded-full text-sm font-semibold text-white/70 hover:text-white hover:border-white/40 disabled:opacity-30 transition"
        >
          ← Previous
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === current ? 'w-6 h-2.5 bg-[#2E7D32]' : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={current === SLIDES.length - 1 ? () => navigate('/') : next}
          className="flex items-center gap-2 px-5 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full text-sm font-bold transition"
        >
          {current === SLIDES.length - 1 ? 'Open App →' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default Demo;
