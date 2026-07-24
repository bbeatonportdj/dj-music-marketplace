import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { showNotification } = useNotifications();
  
  const [isSignIn, setIsSignIn] = useState(true);
  const [userType, setUserType] = useState<'dj' | 'artist'>('dj');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(email, password);
      showNotification('Welcome back!', 'success');
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-8">
            <img src="/logo.png" alt="DJ Marketplace" className="h-10 w-auto" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-white">User Authentication</h2>
            <div className="relative">
              <input
                type="checkbox"
                id="authToggle"
                className="sr-only"
                checked={!isSignIn}
                onChange={() => setIsSignIn(!isSignIn)}
              />
              <label
                htmlFor="authToggle"
                className="w-12 h-6 bg-white/10 rounded-full cursor-pointer relative block"
              >
                <div className={`absolute top-1 w-4 h-4 bg-[#FC4239] rounded-full transition-transform ${isSignIn ? 'left-1' : 'left-7'}`} />
              </label>
            </div>
          </div>

          {/* User Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-colors ${
                userType === 'dj'
                  ? 'bg-[#FC4239] text-white'
                  : 'bg-white/5 text-white/45 hover:bg-white/10'
              }`}
              onClick={() => setUserType('dj')}
            >
              Join as DJ
            </button>
            <button
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-colors ${
                userType === 'artist'
                  ? 'bg-[#FC4239] text-white'
                  : 'bg-white/5 text-white/45 hover:bg-white/10'
              }`}
              onClick={() => setUserType('artist')}
            >
              Join as Artist
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-white/45 uppercase tracking-[0.15em] mb-2 font-mono">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#FC4239]/50 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-white/45 uppercase tracking-[0.15em] mb-2 font-mono">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#FC4239]/50 transition-colors pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#FC4239] text-white text-[13px] font-semibold rounded-lg hover:bg-[#e03a32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] text-white/45 mt-6">
            Already have an account?{' '}
            <Link to="/auth" className="text-[#FC4239] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 bg-[#0F0F0F] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FC4239]/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 text-center px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">Elevate Your Sound.</h2>
          <p className="text-white/65 text-[15px]">Join 37,000+ DJs already using DJ Marketplace.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
