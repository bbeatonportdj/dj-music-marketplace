import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle, Shield, Headphones, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const { user, signUp } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/browse');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const { error, user } = await signUp(email, password, undefined, fullName.trim());
      if (error) throw new Error(error);
      if (user) {
        showNotification('Welcome! Account created and signed in.', 'success');
      } else {
        setSignUpSuccess(true);
        showNotification('Account created! Check your email to verify.', 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (signUpSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md mx-4 bg-surface-gray border border-border-gray rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-success-green" />
          </div>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Check your email</h2>
          <p className="text-muted-text mb-6">
            We've sent a verification link to <strong className="text-on-surface">{email}</strong>. 
            Please check your inbox and verify your account to continue.
          </p>
          <Link 
            to="/auth" 
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-4xl mx-4 bg-surface-gray border border-border-gray rounded-xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left: Brand Visual */}
        <div className="hidden lg:flex lg:w-[400px] bg-surface-container relative items-center justify-center p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-red/20 to-transparent" />
          <div className="relative z-10">
            <h1 className="font-display text-4xl font-extrabold text-on-surface mb-4">BEAT VAULT</h1>
            <p className="text-muted-text">
              1,800+ tracks across 17 genres with BPM, Key & Version info.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Create your profile</h2>
            <p className="text-muted-text text-sm">Join the professional marketplace for elite sounds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-electric-red/10 border border-electric-red/20 rounded-lg text-electric-red text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-surface-container border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@studio.com"
                className="w-full px-4 py-3 bg-surface-container border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-surface-container border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors pr-12"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-mono text-muted-text uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-surface-container border border-border-gray rounded-lg text-on-surface placeholder:text-border-gray focus:outline-none focus:border-electric-red transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-electric-red"
              />
              <span className="text-sm text-muted-text">
                I agree to the <Link to="#" className="text-electric-red hover:underline">Terms of Service</Link> and <Link to="#" className="text-electric-red hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Creating Account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-text">
            Already have an account?{' '}
            <Link to="/auth" className="text-electric-red hover:underline">Sign In</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border-gray flex justify-center gap-8">
            <div className="flex items-center gap-2 text-muted-text">
              <Shield size={18} />
              <span className="font-mono text-xs uppercase tracking-wider">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-muted-text">
              <Headphones size={18} />
              <span className="font-mono text-xs uppercase tracking-wider">Lossless Audio</span>
            </div>
            <div className="flex items-center gap-2 text-muted-text">
              <FileText size={18} />
              <span className="font-mono text-xs uppercase tracking-wider">Clear Licenses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
