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
              <h1 className="register-brand-title">BEAT VAULT</h1>
              <p className="register-brand-subtitle">
                1,800+ tracks across 17 genres with BPM, Key & Version info.
              </p>
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
