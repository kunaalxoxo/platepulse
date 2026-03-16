import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ROLES = [
  { key: 'donor', icon: '🍽️', label: 'Donor', desc: 'Restaurants, hotels, event organizers' },
  { key: 'retail', icon: '🏪', label: 'Retailer', desc: 'Supermarkets, bakeries, grocery stores' },
  { key: 'ngo', icon: '🤝', label: 'NGO', desc: 'Charities and food distribution orgs' },
  { key: 'volunteer', icon: '🚴', label: 'Volunteer', desc: 'Community transport members' },
  { key: 'consumer', icon: '🛒', label: 'Consumer', desc: 'Buy discounted near-expiry items' },
  { key: 'waste_plant', icon: '♻️', label: 'Waste Plant', desc: 'Waste processing facilities' },
  { key: 'admin', icon: '⚙️', label: 'Admin', desc: 'Platform administrator' },
];

const ORG_ROLES = ['donor', 'retail', 'ngo', 'waste_plant'];

// All roles redirect to /dashboard — the router renders the right component based on role
const ROLE_REDIRECTS = {
  donor: '/dashboard',
  ngo: '/dashboard',
  retail: '/dashboard',
  volunteer: '/dashboard',
  consumer: '/marketplace',
  waste_plant: '/dashboard',
  admin: '/dashboard',
};

const STEPS = ['Role', 'Info', 'Location', 'Verify'];

const Register = () => {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm] = useState({
    role: '', name: '', email: '', password: '', confirmPassword: '',
    phone: '', orgName: '', address: '', lat: 0, lng: 0,
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const updateForm = (key, val) => { setForm((p) => ({ ...p, [key]: val })); setError(''); };

  const validateStep = () => {
    switch (step) {
      case 0: if (!form.role) { setError('Please select a role'); return false; } break;
      case 1:
        if (!form.name) { setError('Name is required'); return false; }
        if (!form.email) { setError('Email is required'); return false; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return false; }
        break;
      case 2:
        if (ORG_ROLES.includes(form.role) && !form.orgName) { setError('Organization name is required'); return false; }
        break;
    }
    return true;
  };

  const handleRegister = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password,
        role: form.role, phone: form.phone,
        ...(ORG_ROLES.includes(form.role) && { orgName: form.orgName }),
        ...(form.lat && { location: { coordinates: [form.lng, form.lat], address: form.address } }),
      };
      await register(payload);
      setResendCooldown(30);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 2) { handleRegister(); return; }
    setStep(step + 1);
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    if (pasted.length > 0) otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const data = await verifyEmail(form.email, code);
      const role = data.data.user.role;
      navigate(ROLE_REDIRECTS[role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true); setError('');
    try {
      await register({
        name: form.name, email: form.email, password: form.password,
        role: form.role, phone: form.phone,
        ...(ORG_ROLES.includes(form.role) && { orgName: form.orgName }),
      });
      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP');
    } finally { setLoading(false); }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({ ...p, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setError('');
      },
      () => setError('Could not get your location'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-heading font-bold text-primary">🌿 PlatePulse</h1>
          <p className="text-text/60 mt-1">Create your account</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i <= step ? 'bg-primary text-white' : 'bg-gray-200 text-text/40'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-primary' : 'text-text/40'}`}>{s}</span>
              {i < 3 && <div className={`w-8 h-0.5 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {step === 0 && (
            <div>
              <h2 className="text-xl font-heading font-bold text-text mb-4">Choose your role</h2>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button key={r.key} type="button" onClick={() => updateForm('role', r.key)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      form.role === r.key ? 'border-primary bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <span className="text-2xl">{r.icon}</span>
                    <p className="font-semibold text-sm mt-2 text-text">{r.label}</p>
                    <p className="text-xs text-text/50 mt-0.5 leading-tight">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-text mb-2">Basic Information</h2>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Full Name</label>
                <input type="text" required value={form.name} onChange={(e) => updateForm('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Email</label>
                <input type="email" required value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Password</label>
                <input type="password" required minLength={8} value={form.password} onChange={(e) => updateForm('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Confirm Password</label>
                <input type="password" required value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="Repeat password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="+91 98765 43210" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-heading font-bold text-text mb-2">Location & Details</h2>
              {ORG_ROLES.includes(form.role) && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Organization Name</label>
                  <input type="text" required value={form.orgName} onChange={(e) => updateForm('orgName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="Your org name" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => updateForm('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="Street, City, State" />
              </div>
              <button type="button" onClick={handleUseLocation}
                className="w-full py-3 border-2 border-dashed border-primary/40 text-primary font-medium rounded-xl hover:bg-green-50 transition flex items-center justify-center gap-2">
                📍 Use my current location
              </button>
              {form.lat !== 0 && (
                <p className="text-xs text-secondary font-medium text-center">
                  ✅ Location captured: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <h2 className="text-xl font-heading font-bold text-text mb-2">Verify Your Email</h2>
              <p className="text-sm text-text/60 mb-6">
                We sent a 6-digit code to <strong className="text-primary">{form.email}</strong>
              </p>
              <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input key={idx} ref={(el) => (otpRefs.current[idx] = el)}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" />
                ))}
              </div>
              <button onClick={handleVerify} disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-60">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <p className="mt-4 text-sm text-text/50">
                Didn't receive a code?{' '}
                {resendCooldown > 0 ? (
                  <span className="text-text/40">Resend in {resendCooldown}s</span>
                ) : (
                  <button onClick={handleResend} className="text-primary font-medium hover:underline">Resend OTP</button>
                )}
              </p>
            </div>
          )}

          {step < 3 && (
            <div className="flex items-center justify-between mt-6">
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 text-text/60 font-medium hover:text-text transition">← Back</button>
              ) : <div />}
              <button onClick={handleNext} disabled={loading}
                className="px-8 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-60">
                {loading ? 'Please wait...' : step === 2 ? 'Create Account' : 'Next →'}
              </button>
            </div>
          )}

          {step === 0 && (
            <p className="mt-6 text-center text-sm text-text/60">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:text-secondary">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
