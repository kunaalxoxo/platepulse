import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import CountdownTimer from '../../components/donations/CountdownTimer';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';

// Default to Hyderabad city centre — all seeded products are within 50 km of this point
const DEFAULT_LAT = 17.3850;
const DEFAULT_LNG = 78.4867;

const ConsumerMarketplace = () => {
  const { user } = useAuthStore();
  const socket = useSocket(null);
  const { items, addItem, removeItem, updateQty, clearCart, getCartTotal } = useCartStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [category, setCategory] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Start with Hyderabad default; update if user grants GPS and they are near Hyderabad
  const [location, setLocation] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Only use real GPS if within ~200 km of Hyderabad (avoids wiping products for remote testers)
        const distFromHyd = Math.sqrt(
          Math.pow(latitude  - DEFAULT_LAT, 2) +
          Math.pow(longitude - DEFAULT_LNG, 2)
        );
        if (distFromHyd < 2) {
          setLocation({ lat: latitude, lng: longitude });
        }
        // else: keep Hyderabad default so products always show
      },
      (err) => console.log('Geo error, using Hyderabad default', err),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category)   params.append('category',   category);
      if (urgentOnly) params.append('urgentOnly',  'true');
      params.append('lat',    location.lat);
      params.append('lng',    location.lng);
      params.append('radius', 100); // 100 km radius to catch all Hyderabad products

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, urgentOnly, location.lat]);

  useEffect(() => {
    if (!socket) return;
    const handlePriceUpdate = (data) => {
      setProducts(prev => prev.map(p =>
        p._id === data.productId
          ? { ...p, finalPrice: data.finalPrice, discountPercent: data.discountPercent, urgentBadge: data.urgentBadge }
          : p
      ));
    };
    socket.on('price_updated', handlePriceUpdate);
    return () => socket.off('price_updated', handlePriceUpdate);
  }, [socket]);

  useEffect(() => {
    if (document.querySelector('script[src*="razorpay"]')) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      alert('Please log in as a consumer to purchase.');
      return;
    }
    try {
      const payload = { items: items.map(i => ({ productId: i._id, quantity: i.quantity })) };
      const { data } = await api.post('/orders/create-order', payload);
      const { orderId, razorpayOrderId, amount, key, currency } = data.data;

      const options = {
        key: key === 'mock_key' ? null : key,
        amount,
        currency,
        name: 'PlatePulse Marketplace',
        description: 'Near-expiry food purchase',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/orders/verify-payment', {
              orderId,
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature || 'mock',
            });
            clearCart();
            setIsCartOpen(false);
            alert('\uD83C\uDF89 Checkout successful! You are helping heal the planet.');
            fetchProducts();
          } catch (verifyErr) {
            alert(verifyErr.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#2E7D32' },
      };

      if (key === 'mock_key') {
        alert('DEV MODE: Simulating Razorpay successful checkout...');
        options.handler({ razorpay_order_id: razorpayOrderId, razorpay_payment_id: 'rzp_mock', razorpay_signature: 'mock' });
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate checkout');
    }
  };

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-black text-text">Food Saver Marketplace</h1>
            <p className="text-sm text-text/60">Quality surplus food from local businesses at up to 80% off.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition border ${
                urgentOnly ? 'bg-red-50 text-red-700 border-red-200' : 'bg-transparent text-text/60 border-gray-200 hover:bg-gray-50'
              }`}
            >
              \uD83D\uDD25 <span className="hidden sm:inline">Last Chance Deals</span>
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition">
              <span className="text-xl">\uD83D\uDED2</span>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-6 overflow-x-auto hide-scrollbar">
          {[{v:'',l:'All'},{v:'packaged',l:'Packaged'},{v:'bakery',l:'Bakery'},{v:'produce',l:'Fresh Produce'},{v:'cooked',l:'Cooked Meals'}].map(c => (
            <button
              key={c.v}
              onClick={() => setCategory(c.v)}
              className={`whitespace-nowrap pb-2 text-sm font-bold transition border-b-2 ${
                category === c.v ? 'border-primary text-primary' : 'border-transparent text-text/50 hover:text-text'
              }`}
            >
              {c.l}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <span className="text-5xl block mb-4 filter grayscale opacity-50">\uD83D\uDED2</span>
            <p className="text-text/60 font-medium">No products match your criteria right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition">
                <div className="relative h-48 bg-gray-50">
                  <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={p.name} />
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {p.urgentBadge && (
                      <span className="bg-red-500 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-sm shadow-md animate-pulse">
                        \uD83D\uDD25 Urgent
                      </span>
                    )}
                    {p.distance !== undefined && (
                      <span className="bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-sm">
                        \uD83D\uDCCD {(p.distance / 1000).toFixed(1)}km
                      </span>
                    )}
                  </div>
                  {p.discountPercent > 0 && (
                    <div className="absolute top-2 right-2 bg-accent text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                      {p.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-text line-clamp-1">{p.name}</h3>
                    <p className="text-xs font-semibold text-primary mb-2 line-clamp-1">{p.retailer?.orgName || 'Local Store'}</p>
                    <div className="flex items-end gap-2 mb-2">
                      <p className="text-2xl font-black text-text">\u20B9{p.finalPrice}</p>
                      <p className="text-sm text-text/40 line-through mb-1">\u20B9{p.mrp}</p>
                    </div>
                    <CountdownTimer expiresAt={p.expiresAt} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text/60">{p.quantity} left in stock</span>
                    <button
                      onClick={() => addItem(p)}
                      className="ml-auto w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition font-black text-xl flex items-center justify-center shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col animate-slide-in-right shadow-2xl border-l border-gray-100">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-heading font-black">Your Checkout Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 font-bold">\u00D7</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <span className="text-4xl block mb-2">\uD83D\uDECD\uFE0F</span><p>Your cart is empty</p>
                </div>
              ) : items.map(item => (
                <div key={item._id} className="flex gap-4 p-3 border border-gray-100 rounded-xl bg-white shadow-sm">
                  <img src={item.image} className="w-20 h-20 rounded-lg object-cover bg-gray-50" alt={item.name} />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                      <button onClick={() => removeItem(item._id)} className="text-red-400 text-xs hover:text-red-600 font-bold ml-2">Del</button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="font-bold text-primary">\u20B9{(item.finalPrice * item.quantity).toFixed(2)}</p>
                      <div className="flex items-center bg-gray-100 rounded-md">
                        <button onClick={() => updateQty(item._id, item.quantity - 1)} className="px-2.5 py-1 text-text/60 hover:text-text font-bold">-</button>
                        <span className="px-2 font-semibold text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item._id, item.quantity + 1)} className="px-2.5 py-1 text-text/60 hover:text-text font-bold">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50/50">
              <div className="flex justify-between text-sm mb-2 text-text/60"><span>Items ({items.length})</span><span>\u20B9{getCartTotal().toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-black mb-5"><span>Subtotal</span><span className="text-primary">\u20B9{getCartTotal().toFixed(2)}</span></div>
              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-md hover:bg-gray-800 disabled:opacity-50 transition transform active:scale-[0.98]"
              >
                Proceed to Payment
              </button>
              <p className="text-[10px] text-center text-text/40 mt-3 font-semibold tracking-wider">SECURED BY RAZORPAY</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerMarketplace;
