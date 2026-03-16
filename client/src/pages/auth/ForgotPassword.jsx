import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [step, setStep] = useState(0); // 0 = email, 1 = otp + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try {
      await forgotPassword(email);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword({ email, otp: code, newPassword });
      navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-primary">🌿 PlatePulse</h1>
          <p className="text-text/60 mt-2">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {/* Step 0: Email */}
          {step === 0 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <p className="text-sm text-text/60 mb-4">Enter your email address and we'll send you a code to reset your password.</p>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Email</label>
                <input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-60">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Step 1: OTP + New Password */}
          {step === 1 && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-sm text-text/60 text-center mb-2">
                Enter the code sent to <strong className="text-primary">{email}</strong>
              </p>
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input key={idx} ref={(el) => (otpRefs.current[idx] = el)}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" />
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">New Password</label>
                <input type="password" required minLength={8} value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Confirm Password</label>
                <input type="password" required value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition" placeholder="Repeat password" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-60">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setStep(0)} className="w-full text-sm text-text/50 hover:text-text">
                ← Use a different email
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-text/60">
            Remember your password?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-secondary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
