import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiUrl } from '../lib/apiBase';
import '../styles/payment-success.css';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID provided');
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch(apiUrl(`/api/stripe/session-status?session_id=${sessionId}`));
        const data = await res.json();

        if (res.ok && (data.status === 'complete' || data.payment_status === 'paid')) {
          setStatus('success');
          setMessage('Your payment was successful! Tracks are now available for download.');
        } else if (res.ok) {
          setStatus('loading');
          setMessage('Payment is being processed...');
          // Retry after 2s
          setTimeout(checkSession, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify payment');
        }
      } catch {
        setStatus('error');
        setMessage('Failed to connect to server');
      }
    };

    checkSession();
  }, [sessionId]);

  return (
    <div className="payment-success-wrapper">
      <div className="payment-success-card">
        {status === 'loading' && (
          <>
            <Loader size={48} className="spinner" style={{ margin: '0 auto 1rem', color: 'var(--accent-color)' }} />
            <h2>Verifying Payment</h2>
            <p>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={64} color="#4ade80" style={{ margin: '0 auto 1rem' }} />
            <h2>Payment Successful!</h2>
            <p>{message}</p>
            <div className="payment-actions">
              <Link to="/orders" className="btn-primary">My Orders</Link>
              <Link to="/browse" className="btn-secondary">Browse More</Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} color="#f87171" style={{ margin: '0 auto 1rem' }} />
            <h2>Payment Verification Failed</h2>
            <p>{message}</p>
            <div className="payment-actions">
              <Link to="/orders" className="btn-primary">Check Orders</Link>
              <Link to="/cart" className="btn-secondary">Back to Cart</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
