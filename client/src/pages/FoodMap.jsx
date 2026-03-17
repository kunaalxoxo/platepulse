import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from '../components/donations/CountdownTimer';
import api from '../services/api';

// Fix Leaflet's default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // India center fallback

// Custom colored pin icons
const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 6.5 8 18 8 18s8-11.5 8-18c0-4.4-3.6-8-8-8z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="8" r="3" fill="white" opacity="0.9"/>
    </svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
  });

const ICONS = {
  donation_urgent: makeIcon('#F44336'),
  donation_soon:   makeIcon('#FFC107'),
  donation_ok:     makeIcon('#4CAF50'),
  product:         makeIcon('#2563EB'),
  community:       makeIcon('#9333EA'),
  waste:           makeIcon('#6B7280'),
  user:            makeIcon('#4285F4'),
};

const getDonationIcon = (expiresAt) => {
  const hrs = (new Date(expiresAt).getTime() - Date.now()) / 3600000;
  if (hrs < 6) return ICONS.donation_urgent;
  if (hrs < 24) return ICONS.donation_soon;
  return ICONS.donation_ok;
};

// Helper: fly map to new center when GPS resolves
const FlyToLocation = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 13, { duration: 1.2 }); }, [center]);
  return null;
};

const FoodMap = () => {
  const navigate = useNavigate();
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [locationReady, setLocationReady] = useState(false);
  const [userLocated, setUserLocated] = useState(false);
  const [data, setData] = useState({ donations: [], products: [], community: [], wastePlants: [] });
  const [loading, setLoading] = useState(false);

  const [radius, setRadius] = useState(50);
  const [types, setTypes] = useState({ donations: true, products: true, community: true, waste_plants: true });
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setUserLocated(true);
        setLocationReady(true);
      },
      () => {
        console.warn('Geo denied — using India default');
        setLocationReady(true);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const fetchMarkers = async () => {
    try {
      setLoading(true);
      const activeTypes = Object.keys(types).filter(t => types[t]).join(',');
      if (!activeTypes) { setData({ donations: [], products: [], community: [], wastePlants: [] }); return; }
      const res = await api.get(
        `/map/markers?lat=${center[0]}&lng=${center[1]}&radius=${radius}&types=${activeTypes}`
      );
      setData(res.data.data);
    } catch (err) { console.error('Map fetch failed', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (locationReady) fetchMarkers(); }, [locationReady]);

  const handleApplyFilters = () => { fetchMarkers(); setMobileFilterOpen(false); };

  const filterItems = (items) => {
    if (!items) return [];
    return items.filter(item => {
      if (item.expiresAt && expiryFilter !== 'all') {
        const hrs = (new Date(item.expiresAt).getTime() - Date.now()) / 3600000;
        if (expiryFilter === '24h' && hrs > 24) return false;
        if (expiryFilter === '6h' && hrs > 6) return false;
        if (expiryFilter === '1h' && hrs > 1) return false;
      }
      return true;
    });
  };

  const getCoords = (doc) => {
    const c =
      doc.pickupLocation?.coordinates ||
      doc.storeLocation?.coordinates ||
      doc.location?.coordinates;
    return c ? [c[1], c[0]] : null; // GeoJSON [lng, lat] → Leaflet [lat, lng]
  };

  const PopupCard = ({ item, type }) => (
    <div className="w-52 font-sans">
      {item.image && (
        <img src={item.image} className="w-full h-28 object-cover rounded-lg mb-2 bg-gray-50" />
      )}
      <div className="flex justify-between items-start mb-0.5">
        <h3 className="font-bold text-gray-900 leading-tight text-sm">
          {item.name || item.orgName}
        </h3>
        {type === 'product' && item.discountPercent > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
            {item.discountPercent}% OFF
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-green-700 mb-1 truncate">
        {item.donor?.orgName || item.retailer?.orgName || item.postedBy?.name || ''}
      </p>
      {item.category && (
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
          📁 {item.category}
        </p>
      )}
      {item.expiresAt && (
        <div className="mb-3 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
          <CountdownTimer expiresAt={item.expiresAt} />
        </div>
      )}
      {type === 'donation' && (
        <button onClick={() => navigate('/dashboard')}
          className="w-full py-1.5 bg-green-700 text-white font-bold text-xs rounded-lg">
          View Delivery Mission
        </button>
      )}
      {type === 'product' && (
        <button onClick={() => navigate('/marketplace')}
          className="w-full py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg">
          Buy in Marketplace (₹{item.finalPrice})
        </button>
      )}
      {type === 'community' && (
        <button onClick={() => navigate('/community')}
          className="w-full py-1.5 bg-purple-600 text-white font-bold text-xs rounded-lg">
          Claim Portion ({item.claimedCount}/{item.claimedByLimit})
        </button>
      )}
      {type === 'waste' && (
        <p className="w-full py-1.5 bg-gray-700 text-white font-bold text-xs rounded-lg text-center">
          ♻️ Waste Plant
        </p>
      )}
    </div>
  );

  return (
    <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Mobile filter toggle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] md:hidden">
        <button onClick={() => setMobileFilterOpen(true)}
          className="bg-white px-6 py-2.5 rounded-full shadow-lg font-bold text-sm border border-gray-100 text-black whitespace-nowrap">
          🔍 Filter Map
        </button>
      </div>

      {/* Filter panel */}
      <div
        className={`fixed inset-0 bg-black/50 z-[999] md:bg-transparent md:pointer-events-none md:absolute flex flex-col justify-end md:justify-start transition-opacity duration-300 ${
          mobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'
        }`}
        onClick={(e) => e.target === e.currentTarget && setMobileFilterOpen(false)}
      >
        <div className={`w-full md:w-80 bg-white h-[75vh] md:h-full md:border-r border-gray-100 shadow-2xl md:shadow-md flex flex-col transform transition-transform duration-300 md:translate-y-0 relative pointer-events-auto rounded-t-3xl md:rounded-none ${
          mobileFilterOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'
        }`}>
          <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto mt-4 mb-2 md:hidden" />
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-heading font-black text-xl">Map Filters</h2>
            <button onClick={() => setMobileFilterOpen(false)} className="md:hidden text-2xl font-bold text-gray-400">&times;</button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-8">
            {/* Type toggles */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-text/40 mb-3">Resource Type</h4>
              <div className="space-y-3">
                {[['donations','🍽️ Donations','primary'],['products','🏪 Discounted Retail','blue-600'],['community','🤝 Community P2P','purple-600'],['waste_plants','♻️ Waste Plants','gray-500']].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={types[key]} onChange={e => setTypes({...types, [key]: e.target.checked})} className="w-4 h-4 accent-primary" />
                    <span className="font-bold">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-text/40 mb-3">Urgency</h4>
              <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
                {[['all','All'],['24h','<24h'],['6h','<6h'],['1h','<1h']].map(([v,l]) => (
                  <button key={v} onClick={() => setExpiryFilter(v)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      expiryFilter === v ? 'bg-white shadow-sm text-black' : 'text-text/50'
                    }`}>{l}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-xs uppercase tracking-widest text-text/40">Search Radius</h4>
                <span className="font-bold text-primary text-sm">{radius}km</span>
              </div>
              <input type="range" min="1" max="100" value={radius} onChange={e => setRadius(e.target.value)} className="w-full accent-primary" />
            </div>

            {/* Legend */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-text/40 mb-3">Pin Legend</h4>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Donation (safe)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> Donation (expires &lt;24h)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Donation (urgent &lt;6h)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Discounted Retail</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span> Community Share</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block"></span> Waste Plant</div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-50 bg-gray-50/50">
            <button onClick={handleApplyFilters}
              className="w-full bg-black text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition">
              {loading ? 'Scanning Map...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-full md:pl-80">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={5}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fly to user location once GPS resolves */}
          {locationReady && <FlyToLocation center={center} />}

          {/* User location dot */}
          {userLocated && (
            <Marker position={center} icon={ICONS.user}>
              <Popup><strong>📍 You are here</strong></Popup>
            </Marker>
          )}

          {/* Radius circle */}
          {userLocated && (
            <Circle
              center={center}
              radius={radius * 1000}
              pathOptions={{ color: '#2E7D32', fillColor: '#2E7D32', fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }}
            />
          )}

          {/* Donation markers */}
          {filterItems(data.donations).map(doc => {
            const pos = getCoords(doc);
            if (!pos) return null;
            return (
              <Marker key={doc._id} position={pos} icon={getDonationIcon(doc.expiresAt)}>
                <Popup><PopupCard item={doc} type="donation" /></Popup>
              </Marker>
            );
          })}

          {/* Product markers */}
          {filterItems(data.products).map(doc => {
            const pos = getCoords(doc);
            if (!pos) return null;
            return (
              <Marker key={doc._id} position={pos} icon={ICONS.product}>
                <Popup><PopupCard item={doc} type="product" /></Popup>
              </Marker>
            );
          })}

          {/* Community markers */}
          {filterItems(data.community).map(doc => {
            const pos = getCoords(doc);
            if (!pos) return null;
            return (
              <Marker key={doc._id} position={pos} icon={ICONS.community}>
                <Popup><PopupCard item={doc} type="community" /></Popup>
              </Marker>
            );
          })}

          {/* Waste plant markers */}
          {(data.wastePlants || []).map(doc => {
            const pos = getCoords(doc);
            if (!pos) return null;
            return (
              <Marker key={doc._id} position={pos} icon={ICONS.waste}>
                <Popup><PopupCard item={doc} type="waste" /></Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default FoodMap;
