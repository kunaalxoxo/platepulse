import { useState, useEffect } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import CountdownTimer from '../components/donations/CountdownTimer';
import api from '../services/api';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center
const LIBRARIES = ['places'];

// Helper to create circular colored SVG markers
const createMarkerIcon = (color) => ({
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
  fillColor: color,
  fillOpacity: 1,
  strokeColor: 'white',
  strokeWeight: 2,
  scale: 1.5,
  anchor: { x: 12, y: 22 } // Aligns the tip to the coordinate
});

const FoodMap = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [location, setLocation] = useState(defaultCenter);
  const [data, setData] = useState({ donations: [], products: [], community: [], wastePlants: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Filter State
  const [radius, setRadius] = useState(50);
  const [types, setTypes] = useState({ donations: true, products: true, community: true, waste_plants: true });
  const [expiryFilter, setExpiryFilter] = useState('all'); // all, 24h, 6h, 1h
  const [categories, setCategories] = useState({ cooked: true, produce: true, packaged: true, bakery: true, dairy: true });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn('Geo access denied, using default map center'),
      { enableHighAccuracy: true }
    );
  }, []);

  const fetchMarkers = async () => {
    try {
      setLoading(true);
      const activeTypes = Object.keys(types).filter(t => types[t]).join(',');
      if (!activeTypes) {
        setData({ donations: [], products: [], community: [], wastePlants: [] });
        return;
      }
      const res = await api.get(`/map/markers?lat=${location.lat}&lng=${location.lng}&radius=${radius}&types=${activeTypes}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Map fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(data).length === 0) fetchMarkers();
  }, [location]); // initial fetch once GPS locks

  const handleApplyFilters = () => {
    fetchMarkers();
    setMobileFilterOpen(false);
  };

  // Client-side filtering for Expiry and Category to avoid re-fetching rapidly
  const filterByExpiryAndCategory = (items) => {
    if (!items) return [];
    return items.filter(item => {
      // Waste plants don't have categories/expiry
      if (!item.expiresAt && !item.category) return true;

      // Category check
      if (item.category && categories[item.category] === false) return false;

      // Expiry check
      if (item.expiresAt && expiryFilter !== 'all') {
        const hrsLeft = (new Date(item.expiresAt).getTime() - Date.now()) / 3600000;
        if (expiryFilter === '24h' && hrsLeft > 24) return false;
        if (expiryFilter === '6h' && hrsLeft > 6) return false;
        if (expiryFilter === '1h' && hrsLeft > 1) return false;
      }
      return true;
    });
  };

  const getDonationColor = (expiresAt) => {
    const hrsLeft = (new Date(expiresAt).getTime() - Date.now()) / 3600000;
    if (hrsLeft < 6) return '#F44336'; // Red
    if (hrsLeft < 24) return '#FFC107'; // Yellow
    return '#4CAF50'; // Green
  };

  if (loadError) return <div className="bg-red-50 p-10 text-center m-10 text-red-600 font-bold rounded-2xl">Error loading Google Maps API</div>;
  if (!isLoaded) return <div className="h-screen flex text-text/50 items-center justify-center font-bold">Loading Food Map...</div>;

  return (
    <div className="relative" style={{ height: 'calc(100vh - 64px)' }}>
      
      {/* ── Overlay Filter Button (Mobile only) ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 md:hidden">
        <button onClick={() => setMobileFilterOpen(true)} className="bg-white px-6 py-2.5 rounded-full shadow-lg font-bold text-sm border border-gray-100 text-black whitespace-nowrap">
           🔍 Filter Map Options
        </button>
      </div>

      {/* ── Desktop Sidebar & Mobile Bottom Sheet ── */}
      <div className={`
        fixed inset-0 bg-black/50 z-20 md:bg-transparent md:pointer-events-none md:absolute flex flex-col justify-end md:justify-start transition-opacity duration-300
        ${mobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
      `} onClick={(e) => e.target === e.currentTarget && setMobileFilterOpen(false)}>
        
        <div className={`
          w-full md:w-80 bg-white h-[75vh] md:h-full md:border-r border-gray-100 shadow-2xl md:shadow-md flex flex-col transform transition-transform duration-300 md:translate-y-0 relative pointer-events-auto rounded-t-3xl md:rounded-none
          ${mobileFilterOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        `}>
          {/* Mobile Handle */}
          <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>
          
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-heading font-black text-xl">Map Filters</h2>
            <button onClick={() => setMobileFilterOpen(false)} className="md:hidden text-2xl font-bold text-gray-400">&times;</button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-8">
            <div>
               <h4 className="font-bold text-xs uppercase tracking-widest text-text/40 mb-3">Resource Type</h4>
               <div className="space-y-3">
                 <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={types.donations} onChange={e=>setTypes({...types, donations: e.target.checked})} className="w-4 h-4 accent-primary" /> <span className="font-bold">🍽️ Donations</span></label>
                 <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={types.products} onChange={e=>setTypes({...types, products: e.target.checked})} className="w-4 h-4 accent-blue-600" /> <span className="font-bold">🏪 Discounted Retail</span></label>
                 <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={types.community} onChange={e=>setTypes({...types, community: e.target.checked})} className="w-4 h-4 accent-purple-600" /> <span className="font-bold">🤝 Community P2P</span></label>
                 <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={types.waste_plants} onChange={e=>setTypes({...types, waste_plants: e.target.checked})} className="w-4 h-4 accent-gray-500" /> <span className="font-bold">♻️ Waste Plants</span></label>
               </div>
            </div>

            <div>
               <h4 className="font-bold text-xs uppercase tracking-widest text-text/40 mb-3">Urgency (Time Left)</h4>
               <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
                 <button onClick={()=>setExpiryFilter('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${expiryFilter==='all'?'bg-white shadow-sm text-black':'text-text/50'}`}>All</button>
                 <button onClick={()=>setExpiryFilter('24h')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${expiryFilter==='24h'?'bg-yellow-100 text-yellow-800 shadow-sm':'text-text/50'}`}>&lt; 24h</button>
                 <button onClick={()=>setExpiryFilter('6h')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${expiryFilter==='6h'?'bg-orange-100 text-orange-800 shadow-sm':'text-text/50'}`}>&lt; 6h</button>
                 <button onClick={()=>setExpiryFilter('1h')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${expiryFilter==='1h'?'bg-red-100 text-red-800 shadow-sm':'text-text/50'}`}>&lt; 1h</button>
               </div>
            </div>
            
            <div>
               <div className="flex justify-between items-center mb-3">
                 <h4 className="font-bold text-xs uppercase tracking-widest text-text/40">Search Radius</h4>
                 <span className="font-bold text-primary text-sm">{radius}km</span>
               </div>
               <input type="range" min="1" max="100" value={radius} onChange={e=>setRadius(e.target.value)} className="w-full accent-primary" />
            </div>
          </div>

          <div className="p-6 border-t border-gray-50 bg-gray-50/50">
            <button onClick={handleApplyFilters} className="w-full bg-black text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition">
              {loading ? 'Scanning Map...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Google Map Container ── */}
      <div className="w-full h-full md:pl-80 bg-gray-100">
        <GoogleMap mapContainerStyle={mapContainerStyle} center={location} zoom={13} options={{ zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}>
          
          {/* Render User Location Marker slightly distinct */}
          {location.lat !== defaultCenter.lat && (
            <MarkerF position={location} icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#4285F4', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white' }} zIndex={999} />
          )}

          {/* Donations */}
          {filterByExpiryAndCategory(data.donations).map(doc => (
            <MarkerF key={doc._id} position={{lat: doc.pickupLocation.coordinates[1], lng: doc.pickupLocation.coordinates[0]}} icon={createMarkerIcon(getDonationColor(doc.expiresAt))} onClick={() => setSelectedMarker({ type: 'donation', payload: doc })} />
          ))}

          {/* Products */}
          {filterByExpiryAndCategory(data.products).map(doc => (
            <MarkerF key={doc._id} position={{lat: doc.storeLocation.coordinates[1], lng: doc.storeLocation.coordinates[0]}} icon={createMarkerIcon('#2563EB')} onClick={() => setSelectedMarker({ type: 'product', payload: doc })} />
          ))}

          {/* Community Shares */}
          {filterByExpiryAndCategory(data.community).map(doc => (
            <MarkerF key={doc._id} position={{lat: doc.location.coordinates[1], lng: doc.location.coordinates[0]}} icon={createMarkerIcon('#9333EA')} onClick={() => setSelectedMarker({ type: 'community', payload: doc })} />
          ))}
          
          {/* Waste Plants */}
          {data.wastePlants && data.wastePlants.map(doc => (
            <MarkerF key={doc._id} position={{lat: doc.location.coordinates[1], lng: doc.location.coordinates[0]}} icon={createMarkerIcon('#6B7280')} onClick={() => setSelectedMarker({ type: 'waste', payload: doc })} />
          ))}

          {/* Info Window */}
          {selectedMarker && (
            <InfoWindowF 
              position={{
                lat: selectedMarker.payload.pickupLocation?.coordinates[1] || selectedMarker.payload.storeLocation?.coordinates[1] || selectedMarker.payload.location.coordinates[1], 
                lng: selectedMarker.payload.pickupLocation?.coordinates[0] || selectedMarker.payload.storeLocation?.coordinates[0] || selectedMarker.payload.location.coordinates[0]
              }}
              onCloseClick={() => setSelectedMarker(null)}
              options={{ pixelOffset: new window.google.maps.Size(0, -35) }}
            >
              <div className="w-48 sm:w-60 font-sans p-1">
                {selectedMarker.payload.image && (
                  <img src={selectedMarker.payload.image} className="w-full h-28 object-cover rounded-lg mb-3 shadow-sm bg-gray-50" />
                )}
                
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 leading-tight">{selectedMarker.payload.name || selectedMarker.payload.orgName}</h3>
                  {selectedMarker.type === 'product' && selectedMarker.payload.discountPercent > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-black px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{selectedMarker.payload.discountPercent}% OFF</span>
                  )}
                </div>

                <p className="text-xs font-semibold text-primary mb-2 line-clamp-1">{selectedMarker.payload.donor?.orgName || selectedMarker.payload.retailer?.orgName || selectedMarker.payload.postedBy?.name}</p>

                {selectedMarker.payload.category && <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">📁 {selectedMarker.payload.category}</p>}
                
                {selectedMarker.payload.expiresAt && <div className="mb-4 bg-gray-50 p-1.5 rounded-lg border border-gray-100"><CountdownTimer expiresAt={selectedMarker.payload.expiresAt} /></div>}
                
                {selectedMarker.type === 'donation' && (
                  <button onClick={() => navigate('/dashboard')} className="w-full py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-green-700 transition">View Delivery Mission</button>
                )}
                {selectedMarker.type === 'product' && (
                  <button onClick={() => navigate('/marketplace')} className="w-full py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition">Buy in Marketplace (₹{selectedMarker.payload.finalPrice})</button>
                )}
                {selectedMarker.type === 'community' && (
                  <button onClick={() => navigate('/community')} className="w-full py-2 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-700 transition">Claim Portion ({selectedMarker.payload.claimedCount}/{selectedMarker.payload.claimedByLimit})</button>
                )}
                {selectedMarker.type === 'waste' && (
                  <p className="w-full py-2 bg-gray-800 text-white font-bold text-sm rounded-lg text-center mt-3">Waste Plant</p>
                )}
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default FoodMap;
