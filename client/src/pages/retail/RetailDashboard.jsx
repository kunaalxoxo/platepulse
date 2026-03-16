import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

const RetailDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: '', category: 'packaged', mrp: '', quantity: '', expiresAt: '', address: '', lat: null, lng: null });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationMode, setLocationMode] = useState('manual');
  const [previewDisc, setPreviewDisc] = useState(0);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/my-products');
      setProducts(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'sales') fetchSales();
  }, [activeTab]);

  useEffect(() => {
    if (form.expiresAt) {
      const days = (new Date(form.expiresAt).getTime() - Date.now()) / 86400000;
      if (days < 1) setPreviewDisc(80);
      else if (days < 2) setPreviewDisc(70);
      else if (days < 4) setPreviewDisc(40);
      else if (days < 7) setPreviewDisc(20);
      else setPreviewDisc(0);
    }
  }, [form.expiresAt]);

  const handleLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocationMode('gps');
        setError('');
      },
      () => setError('Could not get GPS. Enter address manually.'),
      { enableHighAccuracy: true }
    );
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('mrp', form.mrp);
    formData.append('quantity', form.quantity);
    formData.append('expiresAt', new Date(form.expiresAt).toISOString());
    formData.append('storeLocation', JSON.stringify({
      address: form.address,
      coordinates: form.lat && form.lng ? [form.lng, form.lat] : [0, 0]
    }));
    if (image) formData.append('image', image);
    try {
      await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ name: '', category: 'packaged', mrp: '', quantity: '', expiresAt: '', address: '', lat: null, lng: null });
      setImage(null); setPreview(''); setLocationMode('manual');
      alert('Product listed successfully!');
      setActiveTab('inventory');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list product');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchInventory();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const salesStats = {
    totalOrders: orders.length,
    revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    itemsSold: orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-text mb-2">Retail Dashboard</h1>
      <p className="text-text/60 mb-8">Manage near-expiry inventory and track marketplace sales.</p>

      <div className="flex gap-2 mb-8 border-b border-gray-100 pb-4">
        <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-xl font-medium transition ${activeTab === 'inventory' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>Inventory</button>
        <button onClick={() => setActiveTab('add_product')} className={`px-6 py-2 rounded-xl font-medium transition ${activeTab === 'add_product' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>Add Product</button>
        <button onClick={() => setActiveTab('sales')} className={`px-6 py-2 rounded-xl font-medium transition ${activeTab === 'sales' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>Sales Tracker</button>
      </div>

      {activeTab === 'add_product' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">List Item to Marketplace</h2>
          {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Product Name</label><input type="text" required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                  <option value="packaged">Packaged Food</option>
                  <option value="bakery">Bakery</option>
                  <option value="dairy">Dairy</option>
                  <option value="produce">Fresh Produce</option>
                  <option value="cooked">Cooked/Prepared</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">MRP (₹)</label><input type="number" required min="1" value={form.mrp} onChange={e=>setForm({...form, mrp: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Quantity</label><input type="number" required min="1" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date & Time</label>
                <input type="datetime-local" required value={form.expiresAt} onChange={e=>setForm({...form, expiresAt: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="flex flex-col justify-end">
                {form.expiresAt && form.mrp ? (
                  <p className="text-sm px-4 py-2.5 bg-green-50 text-green-800 rounded-xl font-medium border border-green-100">
                    ✨ Auto-Markdown: {previewDisc}% OFF → ₹{(form.mrp * (1 - previewDisc/100)).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-xs text-text/50">Expiry date powers dynamic markdown pricing.</p>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium">Store Address *</label>
                <button type="button" onClick={handleLocation} className="text-xs text-primary font-bold flex items-center gap-1">
                  📍 Use GPS {locationMode === 'gps' && <span className="text-green-600">✓</span>}
                </button>
              </div>
              <input type="text" required value={form.address} onChange={e=>setForm({...form, address: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Street, City, State" />
              {locationMode === 'gps' && form.lat && <p className="text-xs text-green-600 font-medium mt-1">✅ GPS coordinates captured — accurate map pin</p>}
              {locationMode === 'manual' && <p className="text-xs text-text/40 mt-1">Tip: Use GPS for accurate map pin placement</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Image *</label>
              <input type="file" required accept="image/*" onChange={e => { setImage(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0])); }} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              {preview && <img src={preview} alt="Preview" className="h-32 mt-3 rounded-xl object-cover" />}
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3 bg-primary text-white font-bold rounded-xl mt-4 hover:bg-green-700 transition disabled:opacity-60">
              {submitting ? 'Listing...' : 'Publish to Marketplace 🚀'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? <p className="p-8 text-center text-text/50">Loading inventory...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-text/60">
                  <tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Action</th></tr>
                </thead>
                <tbody>
                  {products.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-text/50">No products listed yet.</td></tr> : products.map(p => (
                    <tr key={p._id} className="border-b border-gray-50 last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                          <div><p className="font-bold">{p.name}</p><p className="text-xs text-text/50">Expires {new Date(p.expiresAt).toLocaleDateString()}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="line-through text-text/40 mr-2">₹{p.mrp}</span><span className="font-bold text-primary">₹{p.finalPrice}</span>
                        {p.discountPercent > 0 && <span className="ml-2 bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{p.discountPercent}% OFF</span>}
                      </td>
                      <td className="px-6 py-4 font-medium">{p.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.isActive && <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 font-medium">Deactivate</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-text/60 text-sm font-medium">Total Revenue</p><p className="text-3xl font-bold font-heading">₹{salesStats.revenue.toFixed(2)}</p></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-text/60 text-sm font-medium">Items Sold</p><p className="text-3xl font-bold font-heading">{salesStats.itemsSold}</p></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-text/60 text-sm font-medium">Orders</p><p className="text-3xl font-bold font-heading">{salesStats.totalOrders}</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-lg mb-4">Recent Sales</h3>
            <div className="space-y-3">
              {orders.length === 0 ? <p className="text-text/50">No sales yet.</p> : orders.map(o => (
                <div key={o._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl">
                  <div><p className="font-bold">Order #{o._id.toString().slice(-6)}</p><p className="text-sm text-text/60">{new Date(o.createdAt).toLocaleString()}</p></div>
                  <div className="text-right"><p className="font-bold text-lg">₹{o.totalAmount.toFixed(2)}</p><span className="bg-green-100 text-green-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">{o.paymentStatus}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailDashboard;
