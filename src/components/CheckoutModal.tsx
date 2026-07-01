import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, AlertCircle, Upload, LogIn, ExternalLink } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/checkout.css';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: () => void;
  tracks: any[];
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, total, onConfirm, tracks }) => {
  const { showNotification } = useNotifications();
  const { token } = useAuth();
  
  const [step, setStep] = useState<'method' | 'processing' | 'success' | 'loading' | 'auth_required'>('method');
  const [method, setMethod] = useState<'promptpay' | 'stripe'>('stripe');
  const [order, setOrder] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [, setStripeUrl] = useState<string>('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const USD_TO_THB = 35.00;
  const totalThb = total * USD_TO_THB;

  useEffect(() => {
    if (!isOpen) return;

    if (!token) {
      setStep('auth_required');
      return;
    }

    const initOrder = async () => {
      setStep('loading');
      setErrorMsg(null);
      try {
        const paymentMethod = method === 'stripe' ? 'stripe' : 'promptpay';

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            track_ids: tracks.map((t) => t.id),
            payment_method: paymentMethod,
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create order');
        }

        setOrder(data.order);
        setQrCodeUrl(data.qr_code_url || '');

        if (data.order.status === 'paid') {
          setStep('success');
        } else {
          setStep('method');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error initializing order');
        setStep('method');
      }
    };

    initOrder();
  }, [isOpen, token, tracks, method]);

  useEffect(() => {
    if (step === 'method' && method === 'stripe' && order && order.status === 'pending') {
      createStripeSession();
    }
  }, [step, method, order]);

  if (!isOpen) return null;

  const createStripeSession = async () => {
    if (!order) return;
    setStep('processing');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          track_ids: tracks.map((t) => t.id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Stripe session');
      }

      if (data.url) {
        setStripeUrl(data.url);
        setStep('success');
        window.location.href = data.url;
      } else if (data.order?.status === 'paid') {
        setStep('success');
        showNotification('Payment successful!', 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Stripe payment failed. Try again.');
      setStep('method');
    }
  };

  const handlePromptPayVerify = async () => {
    if (!order) return;
    setStep('processing');
    setErrorMsg(null);

    try {
      const dataToSend = new FormData();
      dataToSend.append('orderId', order.id);
      if (slipFile) {
        dataToSend.append('slipFile', slipFile);
      }

      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: dataToSend,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Payment verification failed');
      }

      setStep('success');
      showNotification('Payment verified successfully!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Try again.');
      setStep('method');
    }
  };

  const handleFinish = () => {
    onConfirm();
    onClose();
    setStep('method');
    setOrder(null);
    setQrCodeUrl('');
    setStripeUrl('');
    setSlipFile(null);
    setErrorMsg(null);
  };

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        <button className="close-modal" onClick={onClose}><X size={24} /></button>
        
        {step === 'auth_required' && (
          <div className="checkout-step" style={{ textAlign: 'center', padding: '1rem' }}>
            <AlertCircle size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
            <h2>Sign In Required</h2>
            <p>You need to be signed in to purchase tracks and access downloads.</p>
            <Link to="/auth" className="pay-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }} onClick={onClose}>
              <LogIn size={18} /> Sign In
            </Link>
          </div>
        )}

        {step === 'loading' && (
          <div className="checkout-step processing">
            <div className="spinner"></div>
            <p>Initializing your order...</p>
          </div>
        )}

        {step === 'method' && (
          <div className="checkout-step">
            <h2>Checkout</h2>
            <p className="total-label">
              Total Amount: <strong>${total.toFixed(2)}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>(~ ฿{totalThb.toFixed(2)})</span>
            </p>

            {errorMsg && (
              <div className="checkout-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '13px', marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="payment-methods">
              <div 
                className={`method-card ${method === 'stripe' ? 'active' : ''}`}
                onClick={() => setMethod('stripe')}
              >
                <CreditCard size={32} />
                <span>Credit Card (Stripe)</span>
                <small style={{ opacity: 0.6, fontSize: '11px', marginTop: '2px' }}>Visa, MC, PromptPay</small>
              </div>
              <div 
                className={`method-card ${method === 'promptpay' ? 'active' : ''}`}
                onClick={() => setMethod('promptpay')}
              >
                <Smartphone size={32} />
                <span>PromptPay QR</span>
                <small style={{ opacity: 0.6, fontSize: '11px', marginTop: '2px' }}>Scan & upload slip</small>
              </div>
            </div>

            {method === 'promptpay' ? (
              <div className="qr-section">
                {order && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    Ref: {order.promptpay_ref}
                  </p>
                )}

                {qrCodeUrl ? (
                  <div className="qr-image-wrapper" style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                    <img src={qrCodeUrl} alt="PromptPay QR Code" style={{ borderRadius: '8px', border: '4px solid white', width: '220px', height: '220px' }} />
                  </div>
                ) : (
                  <div className="qr-placeholder">
                    <div className="spinner"></div>
                  </div>
                )}
                <p style={{ fontWeight: '500' }}>Scan QR to pay ฿{totalThb.toFixed(2)} via PromptPay</p>
                
                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Upload Payment Slip (Optional)</label>
                  <label className="slip-upload-zone" style={{ border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '10px 15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <Upload size={16} />
                    <span>{slipFile ? slipFile.name : 'Select slip image'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <button className="pay-btn" onClick={handlePromptPayVerify}>
                  {slipFile ? 'Upload Slip & Verify' : 'I have paid (Simulate)'}
                </button>
              </div>
            ) : (
              <div className="card-section" style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CreditCard size={48} style={{ color: 'var(--accent-color)', marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Pay with Credit Card or PromptPay via Stripe</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  You will be redirected to Stripe's secure checkout page.
                </p>
                <button className="pay-btn" onClick={createStripeSession}>
                  <ExternalLink size={18} /> Pay ${total.toFixed(2)} with Stripe
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="checkout-step processing">
            <div className="spinner"></div>
            <p>Processing your payment...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="checkout-step success">
            <CheckCircle size={64} color="#4ade80" />
            <h2>Payment Successful!</h2>
            <p>Your DJ tracks are now available for download. We've also sent download links to your registered email.</p>
            <button className="pay-btn success" onClick={handleFinish}>
              Back to Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
