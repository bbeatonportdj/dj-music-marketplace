import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';
import '../styles/auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { t } = useLanguage();
  const { showNotification } = useNotifications();
  const { user, signIn, signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/browse');
    }
  }, [user, navigate]);

  // Handle OAuth redirect from Supabase: exchange Supabase user for server JWT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOauth = params.get('oauth') === '1';
    const provider = params.get('provider');
    if (!isOauth || !provider) return;

    (async () => {
      if (!supabase) {
        showNotification('OAuth is not configured on this client.', 'error');
        return;
      }

      try {
        // supabase v2: getSession, fallback to session()
        let userObj: unknown = null;
        const sb = supabase as unknown as Record<string, unknown> | null;
        const authObj = sb?.['auth'] as Record<string, unknown> | undefined;
        if (authObj && typeof authObj['getSession'] === 'function') {
          const resp = await (authObj['getSession'] as unknown as () => Promise<unknown>)();
          const respObj = resp as Record<string, unknown> | undefined;
          const data = respObj?.['data'] as Record<string, unknown> | undefined;
          const session = data?.['session'] as Record<string, unknown> | undefined;
          userObj = session?.['user'] ?? null;
        } else if (authObj && typeof authObj['session'] === 'function') {
          const sess = (authObj['session'] as unknown as () => unknown)();
          const session = sess as Record<string, unknown> | undefined;
          userObj = session?.['user'] ?? null;
        }

        if (!userObj || typeof userObj !== 'object') {
          showNotification('OAuth session not found. Try signing in again.', 'error');
          return;
        }

        const u = userObj as Record<string, unknown>;
        const oauth_id = typeof u.id === 'string' ? u.id : undefined;
        const email = typeof u.email === 'string' ? u.email : undefined;
        const meta = u.user_metadata as Record<string, unknown> | undefined;
        const display_name = meta && (typeof meta.full_name === 'string' ? meta.full_name : (typeof meta.name === 'string' ? meta.name : undefined)) || (email ? email.split('@')[0] : undefined);

        const res = await fetch(apiUrl('/api/auth/oauth'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, email, display_name, oauth_id }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'OAuth exchange failed');
        }

        localStorage.setItem('jwt_token', data.token);
        // Force reload to let AuthProvider pick up the token and load user
        window.location.href = '/browse';
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showNotification(msg || 'OAuth flow failed', 'error');
      }
    })();
  }, [showNotification]);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setErrorMsg(null);

    if (isSignUp && password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setErrorMsg(msg);
      showNotification(msg, 'error');
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setErrorMsg(msg);
      showNotification(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSignUpSuccess(true);
        showNotification(
          '✅ Signed up! Check your email to verify your account.',
          'success'
        );
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        showNotification(
          '🎵 Login successful!',
          'success'
        );
        navigate('/browse');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error || 'Unknown error');
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
      </div>

      <div className="auth-card-wrapper">
        {/* Logo */}
        <div className="auth-logo">
          <Disc size={36} style={{ color: 'var(--accent-color)' }} />
          <span>RunMusic-storeDj</span>
        </div>

        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${!isSignUp ? 'active' : ''}`}
              onClick={() => setIsSignUp(false)}
            >
              {t('auth.login')}
            </button>
            <button
              className={`auth-tab ${isSignUp ? 'active' : ''}`}
              onClick={() => setIsSignUp(true)}
            >
              {t('auth.signup')}
            </button>
          </div>

          <div className="auth-form-area">
            {signUpSuccess ? (
              <div className="auth-success-state">
                <div className="auth-success-icon">
                  <CheckCircle size={48} />
                </div>
                <h2>Check your email</h2>
                <p>
                  We've sent a verification link to {email}. Please check your inbox and verify your account to continue.
                </p>
                <button 
                  className="auth-submit-btn" 
                  onClick={() => {
                    setSignUpSuccess(false);
                    setIsSignUp(false);
                  }}
                >
                  {t('auth.login')}
                </button>
              </div>
            ) : (
              <>
                <h1 className="auth-title">
                  {isSignUp ? t('auth.create') : t('auth.welcome')}
                </h1>
                <p className="auth-subtitle">
                  {isSignUp ? t('auth.signup_msg') : t('auth.login_msg')}
                </p>

                {errorMsg && (
                  <div className="auth-error-message" role="alert">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAuth} className="auth-form">
                  <div className="auth-input-group">
                    <label>{t('auth.email')}</label>
                    <div className="auth-input-wrapper">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="dj@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label>{t('auth.password')}</label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="auth-input-group">
                      <label>Confirm Password</label>
                      <div className="auth-input-wrapper">
                        <Lock size={16} className="auth-input-icon" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="auth-submit-btn">
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> {t('auth.processing')}</>
                    ) : (
                      <>
                        {isSignUp ? t('auth.signup') : t('auth.login')}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-divider">
                  <span>{t('auth.or_continue_with') || 'Or continue with'}</span>
                </div>

                <div className="social-auth-buttons">
                  <button 
                    type="button" 
                    className="social-btn google-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button 
                    type="button" 
                    className="social-btn facebook-btn"
                    onClick={handleFacebookLogin}
                    disabled={loading}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                      <path d="M16.671 15.542l.532-3.469h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.514V5.006s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.469h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z" fill="#ffffff"/>
                    </svg>
                    Facebook
                  </button>
                </div>

                <p className="auth-switch-text">
                  {isSignUp ? t('auth.have_account') : t('auth.no_account')}{' '}
                  <span
                    className="auth-switch-link"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? t('auth.login') : t('auth.signup')}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="auth-footer-note">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
