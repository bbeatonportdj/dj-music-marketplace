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
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <h1 className="text-3xl font-extrabold text-black mb-8 tracking-tight">DJ MARKETPLACE.</h1>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-black">User Authentication</h2>
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
                className="w-12 h-6 bg-gray-200 rounded-full cursor-pointer relative block"
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isSignIn ? 'left-1' : 'left-7'}`} />
              </label>
            </div>
          </div>

          {/* User Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-md transition-colors ${
                userType === 'dj'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setUserType('dj')}
            >
              Join as DJ
            </button>
            <button
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-md transition-colors ${
                userType === 'artist'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              onClick={() => setUserType('artist')}
            >
              Join as Artist
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300 transition-colors pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[13px] text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/auth" className="text-blue-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 bg-gray-100 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        <img 
          src="https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=800&q=80" 
          alt="DJ Equipment" 
          className="relative z-10 w-[80%] max-w-[500px] rounded-lg shadow-2xl"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <p className="text-2xl font-extrabold text-white drop-shadow-lg">Elevate Your Sound.</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
