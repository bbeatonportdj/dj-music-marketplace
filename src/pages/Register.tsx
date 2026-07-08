import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle, Shield, Headphones, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import '../styles/register.css';

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

  const { user, signUp, signInWithGoogle, signInWithFacebook } = useAuth();
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
      const { error } = await signUp(email, password, undefined, fullName.trim());
      if (error) throw new Error(error);
      setSignUpSuccess(true);
      showNotification('Account created! Check your email to verify.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      showNotification(error || 'Google login failed', 'error');
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    const { error } = await signInWithFacebook();
    if (error) {
      showNotification(error || 'Facebook login failed', 'error');
      setLoading(false);
    }
  };

  if (signUpSuccess) {
    return (
      <div className="register-page">
        <div className="register-success">
          <div className="register-success-icon">
            <CheckCircle size={48} />
          </div>
          <h2>Check your email</h2>
          <p>
            We've sent a verification link to <strong>{email}</strong>. 
            Please check your inbox and verify your account to continue.
          </p>
          <Link to="/auth" className="register-btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-layout">
        {/* Left: Brand Visual */}
        <div className="register-brand">
          <div className="register-brand-bg" />
          <div className="register-brand-overlay" />
          <div className="register-brand-content">
            <div className="register-brand-header">
              <h1 className="register-brand-title">DJ Music Marketplace</h1>
              <p className="register-brand-subtitle">
                The elite ecosystem for professional music producers and performance DJs.
              </p>
            </div>
            <div className="register-brand-card">
              <div className="register-wave">
                <span className="register-wave-bar" style={{ animationDelay: '0.1s' }} />
                <span className="register-wave-bar" style={{ animationDelay: '0.3s' }} />
                <span className="register-wave-bar" style={{ animationDelay: '0.5s' }} />
                <span className="register-wave-bar" style={{ animationDelay: '0.2s' }} />
                <span className="register-wave-bar" style={{ animationDelay: '0.4s' }} />
              </div>
              <p className="register-brand-quote">
                "This platform changed how I source tracks for my sets."
              </p>
              <p className="register-brand-author">— Alex Rivera, Global Headliner</p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="register-form-wrap">
          <div className="register-form-container">
            <div className="register-form-header">
              <h2>Create your profile</h2>
              <p>Join the professional marketplace for elite sounds.</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {errorMsg && (
                <div className="register-error">
                  {errorMsg}
                </div>
              )}

              <div className="register-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="register-input"
                />
              </div>

              <div className="register-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@studio.com"
                  className="register-input"
                  required
                />
              </div>

              <div className="register-row">
                <div className="register-field">
                  <label htmlFor="password">Password</label>
                  <div className="register-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="register-input"
                      required
                    />
                    <button
                      type="button"
                      className="register-eye"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="register-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="register-input-wrap">
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="register-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="register-checkbox">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  I agree to the <Link to="#">Terms of Service</Link> and <Link to="#">Privacy Policy</Link>.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="register-btn-primary"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Creating Account...</>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="register-divider">
              <span>Or continue with</span>
            </div>

            <div className="register-social">
              <button type="button" className="register-social-btn" onClick={handleGoogleLogin} disabled={loading}>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button type="button" className="register-social-btn" onClick={handleFacebookLogin} disabled={loading}>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                </svg>
                Facebook
              </button>
            </div>

            <p className="register-signin-link">
              Already have an account?{' '}
              <Link to="/auth">Sign In</Link>
            </p>

            <div className="register-trust">
              <div className="register-trust-item">
                <Shield size={20} />
                <span>Secure Payments</span>
              </div>
              <div className="register-trust-item">
                <Headphones size={20} />
                <span>Lossless Audio</span>
              </div>
              <div className="register-trust-item">
                <FileText size={20} />
                <span>Clear Licenses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
