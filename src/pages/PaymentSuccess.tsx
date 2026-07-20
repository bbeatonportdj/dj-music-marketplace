import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiUrl } from '../lib/apiBase';

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
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md mx-4 bg-surface-gray border border-border-gray rounded-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader size={48} className="animate-spin text-electric-red mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Verifying Payment</h2>
            <p className="text-muted-text">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={64} className="text-success-green mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Payment Successful!</h2>
            <p className="text-muted-text mb-6">{message}</p>
            <div className="flex gap-3">
              <Link 
                to="/orders" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all"
              >
                My Orders
              </Link>
              <Link 
                to="/browse" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-gray border border-border-gray rounded-lg text-muted-text hover:text-on-surface hover:border-electric-red transition-all"
              >
                Browse More
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={64} className="text-electric-red mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-on-surface mb-2">Payment Verification Failed</h2>
            <p className="text-muted-text mb-6">{message}</p>
            <div className="flex gap-3">
              <Link 
                to="/orders" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Check Orders
              </Link>
              <Link 
                to="/cart" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-gray border border-border-gray rounded-lg text-muted-text hover:text-on-surface hover:border-electric-red transition-all"
              >
                Back to Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
