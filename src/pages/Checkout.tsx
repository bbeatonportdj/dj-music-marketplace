import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { showNotification } = useNotifications();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');
  const [loading, setLoading] = useState(false);
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [saveInfo, setSaveInfo] = useState(false);

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.05;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearCart();
      showNotification('Payment successful!', 'success');
      navigate('/payment/success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-8">
          <Link to="/cart" className="hover:text-black">Crate</Link>
          <span>&gt;</span>
          <span className="text-gray-500">Information</span>
          <span>&gt;</span>
          <span className="text-black font-medium">Payment</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Form */}
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-black mb-2">Secure Checkout & Payment</h1>
            <p className="text-[13px] text-blue-600 font-medium mb-8">Secure Checkout & Payment</p>

            <form onSubmit={handleSubmit}>
              {/* Payment Method */}
              <div className="mb-8">
                <h2 className="text-[16px] font-bold text-black mb-4">Payment Method</h2>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="sr-only"
                    />
                    <CreditCard size={24} className={paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'} />
                    <span className={`text-[12px] font-medium ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Credit Card
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="sr-only"
                    />
                    <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-[10px] font-bold">PP</div>
                    <span className={`text-[12px] font-medium ${paymentMethod === 'paypal' ? 'text-blue-600' : 'text-gray-600'}`}>
                      PayPal
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'crypto'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'crypto'}
                      onChange={() => setPaymentMethod('crypto')}
                      className="sr-only"
                    />
                    <div className="w-6 h-6 bg-orange-500 rounded text-white flex items-center justify-center text-[10px] font-bold">₿</div>
                    <span className={`text-[12px] font-medium ${paymentMethod === 'crypto' ? 'text-blue-600' : 'text-gray-600'}`}>
                      Crypto
                    </span>
                  </button>
                </div>

                {/* Card Form */}
                {paymentMethod === 'card' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Expiry Date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                        required
                      />
                      <input
                        type="text"
                        placeholder="CVC"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Name on Card"
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                        required
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-[13px] text-blue-600">You will be redirected to PayPal to complete your purchase.</p>
                  </div>
                )}

                {paymentMethod === 'crypto' && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-[13px] text-orange-600">Pay with Bitcoin, Ethereum, and other cryptocurrencies.</p>
                  </div>
                )}
              </div>

              {/* Billing Information */}
              <div className="mb-8">
                <h2 className="text-[16px] font-bold text-black mb-4">Billing Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                      required
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                      required
                    />
                  </div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-[13px] text-black focus:outline-none focus:border-blue-300"
                    required
                  >
                    <option value="">Country</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="TH">Thailand</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[13px] text-gray-600">Save information for next time</span>
                </label>
              </div>

              {/* Submit Button (Mobile) */}
              <button
                type="submit"
                className="lg:hidden w-full py-3 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                <Lock size={14} />
                {loading ? 'Processing...' : 'Pay and Download'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-[360px] flex-shrink-0">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-[16px] font-bold text-black mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[13px]">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      Track {idx + 1}: "{item.title}" - {item.artist}
                    </span>
                    <span className="text-black font-medium">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="text-black">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Tax (5%):</span>
                  <span className="text-black">${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[18px] font-bold pt-2 border-t border-gray-100">
                  <span className="text-black">Total:</span>
                  <span className="text-black">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button (Desktop) */}
              <button
                type="submit"
                form="checkout-form"
                className="hidden lg:flex w-full mt-6 py-3 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors items-center justify-center gap-2"
                disabled={loading}
                onClick={handleSubmit}
              >
                <Lock size={14} />
                {loading ? 'Processing...' : 'Pay and Download'}
              </button>

              <p className="text-center text-[11px] text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Lock size={10} /> Secure SSL Encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
