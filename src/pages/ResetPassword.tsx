import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../context/NotificationContext';
import '../styles/auth.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  // Extract tokens from URL hash (Supabase sends them as hash fragments)
  useEffect(() => {
    const handleReset = async () => {
      try {
        const query = new URLSearchParams(window.location.search);

        // Supabase sends access_token and refresh_token in the URL hash
        const accessToken = query.get('access_token') || getHashParam('access_token');
        const refreshToken = query.get('refresh_token') || getHashParam('refresh_token');

        if (accessToken && refreshToken) {
        // Set the session with the tokens
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error.message);
            setErrorMsg('Invalid or expired reset link. Please request a new one.');
          }
        } else {
          // Check if there's a type=recovery in the URL (Supabase v2 format)
          const type = query.get('type') || getHashParam('type');
          if (type === 'recovery') {
            // Supabase already handled the session, just proceed
          } else {
            setErrorMsg('Invalid reset link. Please request a new one.');
          }
        }
      } catch (err) {
        console.error('Reset error:', err);
        setErrorMsg('Failed to verify reset link.');
      } finally {
        setVerifying(false);
      }
    };

    handleReset();
  }, []);

  const getHashParam = (key: string): string | null => {
    const hashStr = window.location.hash.substring(1);
    const params = new URLSearchParams(hashStr);
    return params.get(key);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      showNotification('Password updated successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-page">
        <div className="auth-bg">
          <div className="auth-bg-circle auth-bg-circle-1" />
          <div className="auth-bg-circle auth-bg-circle-2" />
        </div>
        <div className="auth-card-wrapper">
          <div className="auth-logo">
            <Disc size={36} style={{ color: 'var(--accent-color)' }} />
            <span>DJ Music Marketplace</span>
          </div>
          <div className="auth-card">
            <div className="auth-form-area" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
              <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
      </div>

      <div className="auth-card-wrapper">
        <div className="auth-logo">
          <Disc size={36} style={{ color: 'var(--accent-color)' }} />
          <span>DJ Music Marketplace</span>
        </div>

        <div className="auth-card">
          <div className="auth-form-area">
            {success ? (
              <div className="auth-success-state">
                <div className="auth-success-icon">
                  <CheckCircle size={48} />
                </div>
                <h2>Password Updated!</h2>
                <p>Your password has been changed successfully. You can now sign in with your new password.</p>
                <button
                  className="auth-submit-btn"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </button>
              </div>
            ) : errorMsg && !newPassword ? (
              <div className="auth-error-state" style={{ textAlign: 'center', padding: '20px' }}>
                <AlertCircle size={48} style={{ color: '#ff3b30', marginBottom: '16px' }} />
                <h2 style={{ marginBottom: '8px' }}>Reset Link Expired</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{errorMsg}</p>
                <button
                  className="auth-submit-btn"
                  onClick={() => navigate('/auth')}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <h1 className="auth-title">Set New Password</h1>
                <p className="auth-subtitle">Enter your new password below.</p>

                {errorMsg && (
                  <div className="auth-error-message" role="alert">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="auth-input-group">
                    <label>New Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  <div className="auth-input-group">
                    <label>Confirm New Password</label>
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

                  <button type="submit" disabled={loading} className="auth-submit-btn">
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Updating...</>
                    ) : (
                      <>Update Password</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
