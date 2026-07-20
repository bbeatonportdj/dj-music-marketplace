import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc, Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/apiBase';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone'>('email');
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const { t } = useLanguage();
  const { showNotification } = useNotifications();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/browse');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setErrorMsg(msg);
      showNotification(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      showNotification('Login successful!', 'success');
      navigate('/browse');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error || 'Unknown error');
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotLoading) return;

    if (forgotMethod === 'phone') {
      if (!forgotPhone) return;
      setForgotLoading(true);
      try {
        const res = await fetch(apiUrl('/api/auth/forgot-password-phone'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: forgotPhone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
        setOtpMode(true);
        showNotification('OTP code sent to your phone!', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        showNotification(msg, 'error');
      } finally {
        setForgotLoading(false);
      }
      return;
    }

    if (!email) return;
    setForgotLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setForgotSent(true);
      showNotification('Password reset email sent!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpLoading || !otpCode || !forgotPhone) return;
    setOtpLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/verify-phone-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, token: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      showNotification('Phone verified! You are now logged in.', 'success');
      window.location.href = '/browse';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-red/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-red/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Disc size={36} className="text-electric-red" />
          <span className="font-display text-xl font-extrabold tracking-tighter text-on-surface uppercase">BEAT VAULT</span>
        </div>

        {/* Card */}
        <div className="bg-surface-container border border-border-gray rounded-xl p-8">
          {forgotSent ? (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-success-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={48} className="text-success-green" />
              </div>
              <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Check your email</h2>
              <p className="text-muted-text mb-6">
                We've sent a password reset link to <strong className="text-on-surface">{email}</strong>.
                Please check your inbox and follow the instructions.
              </p>
              <button
                className="w-full bg-electric-red text-white py-3 rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all"
                onClick={() => {
                  setForgotMode(false);
                  setForgotSent(false);
                  setEmail('');
                  setPassword('');
                }}
              >
                Back to Sign In
              </button>
            </div>
          ) : forgotMode ? (
            /* Forgot Password Mode */
            <>
              <button
                className="flex items-center gap-2 text-muted-text hover:text-on-surface transition-colors mb-6"
                onClick={() => { setForgotMode(false); setErrorMsg(null); setOtpMode(false); setOtpCode(''); }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
              
              <h1 className="font-display text-2xl font-bold text-on-surface mb-2">
                {otpMode ? 'Enter OTP Code' : 'Reset Password'}
              </h1>
              <p className="text-muted-text mb-6">
                {otpMode
                  ? `Enter the 6-digit code sent to ${forgotPhone}`
                  : 'Choose how you want to reset your password.'
                }
              </p>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-error-container/20 border border-error-container rounded-lg mb-4 text-error-container" role="alert">
                  <AlertCircle size={16} />
                  <span className="text-sm">{errorMsg}</span>
                </div>
              )}

              {otpMode ? (
                <form onSubmit={handleVerifyOtp}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-on-surface mb-2">OTP Code</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full bg-surface-container-lowest border border-border-gray pl-10 pr-4 py-3 rounded-lg text-on-surface placeholder-muted-text focus:border-electric-red outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={otpLoading || otpCode.length < 6} 
                    className="w-full bg-electric-red text-white py-3 rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {otpLoading ? (
                      <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                    ) : (
                      <>Verify & Sign In <ArrowRight size={18} /></>
                    )}
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex gap-2 mb-6">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
                        forgotMethod === 'email' 
                          ? 'bg-electric-red text-white' 
                          : 'bg-surface-container-high text-muted-text hover:text-on-surface'
                      }`}
                      onClick={() => setForgotMethod('email')}
                    >
                      <Mail size={16} /> Email
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${
                        forgotMethod === 'phone' 
                          ? 'bg-electric-red text-white' 
                          : 'bg-surface-container-high text-muted-text hover:text-on-surface'
                      }`}
                      onClick={() => setForgotMethod('phone')}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      Phone
                    </button>
                  </div>

                  <form onSubmit={handleForgotPassword}>
                    {forgotMethod === 'email' ? (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-on-surface mb-2">{t('auth.email')}</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="dj@example.com"
                            className="w-full bg-surface-container-lowest border border-border-gray pl-10 pr-4 py-3 rounded-lg text-on-surface placeholder-muted-text focus:border-electric-red outline-none transition-all"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-on-surface mb-2">Phone Number</label>
                        <div className="relative">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                          <input
                            type="tel"
                            value={forgotPhone}
                            onChange={(e) => setForgotPhone(e.target.value)}
                            placeholder="+66 81 234 5678"
                            className="w-full bg-surface-container-lowest border border-border-gray pl-10 pr-4 py-3 rounded-lg text-on-surface placeholder-muted-text focus:border-electric-red outline-none transition-all"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={forgotLoading} 
                      className="w-full bg-electric-red text-white py-3 rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <><Loader2 size={18} className="animate-spin" /> Sending...</>
                      ) : (
                        <>{forgotMethod === 'email' ? 'Send Reset Link' : 'Send OTP Code'} <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            /* Login Mode */
            <>
              <h1 className="font-display text-2xl font-bold text-on-surface mb-2">{t('auth.welcome')}</h1>
              <p className="text-muted-text mb-6">{t('auth.login_msg')}</p>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-error-container/20 border border-error-container rounded-lg mb-4 text-error-container" role="alert">
                  <AlertCircle size={16} />
                  <span className="text-sm">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-on-surface mb-2">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dj@example.com"
                      className="w-full bg-surface-container-lowest border border-border-gray pl-10 pr-4 py-3 rounded-lg text-on-surface placeholder-muted-text focus:border-electric-red outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-on-surface mb-2">{t('auth.password')}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-lowest border border-border-gray pl-10 pr-12 py-3 rounded-lg text-on-surface placeholder-muted-text focus:border-electric-red outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-on-surface transition-colors"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mb-6">
                  <button
                    type="button"
                    className="text-sm text-electric-red hover:underline"
                    onClick={() => { setForgotMode(true); setErrorMsg(null); }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-electric-red text-white py-3 rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('auth.processing')}</>
                  ) : (
                    <>{t('auth.login')} <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <p className="text-center text-muted-text mt-6">
                {t('auth.no_account')}{' '}
                <Link to="/register" className="text-electric-red hover:underline font-medium">
                  {t('auth.signup')}
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-muted-text text-sm mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
