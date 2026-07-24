import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart } = useCart();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [discountCode, setDiscountCode] = useState('');

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      showNotification('Please sign in to checkout', 'error');
      navigate('/auth');
      return;
    }
    if (cart.length === 0) {
      showNotification('Your crate is empty', 'error');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FC4239] mb-1">Cart</p>
          <h1 className="text-3xl font-extrabold text-white">My Crate</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <ShoppingCart size={24} className="text-white/25" />
                </div>
                <p className="text-[14px] text-white/45">Your crate is empty</p>
                <button 
                  className="px-5 py-2.5 bg-[#FC4239] text-white text-[13px] font-semibold rounded-lg hover:bg-[#e03a32] transition-colors"
                  onClick={() => navigate('/browse')}
                >
                  Browse Tracks
                </button>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-[2fr_100px_40px] gap-4 px-4 py-3 border-b border-white/5 bg-white/[0.02] text-[10px] font-semibold text-white/45 uppercase tracking-[0.15em]">
                  <span>TRACK TITLE</span>
                  <span className="text-right">PRICE</span>
                  <span></span>
                </div>

                {/* Cart Items */}
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="group grid grid-cols-[1fr] lg:grid-cols-[2fr_100px_40px] gap-3 lg:gap-4 items-center px-4 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Track Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white/5 rounded flex-shrink-0 overflow-hidden">
                        {item.artwork ? (
                          <img src={item.artwork} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart size={14} className="text-white/25" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-white truncate">{item.title}</p>
                        <p className="text-[12px] text-white/45 truncate">{item.artist}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <span className="text-[13px] text-white text-right font-semibold">
                      {item.price === 0 ? 'FREE' : `$${item.price.toFixed(2)}`}
                    </span>

                    {/* Remove Button */}
                    <button
                      className="p-2 text-white/25 hover:text-[#FC4239] transition-colors"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <div className="sticky top-24 bg-[#0F0F0F] rounded-xl p-6 border border-white/[0.06]">
              <h3 className="text-[13px] font-bold text-white mb-4 uppercase tracking-wider">Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/45">Total Price</span>
                  <span className="text-white font-semibold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Discount Code */}
              <div className="mb-6">
                <p className="text-[11px] text-white/45 mb-2 font-mono uppercase tracking-wider">Discount Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#FC4239]/50"
                  />
                  <button className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[12px] font-semibold rounded-lg hover:bg-white/10 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                className="w-full py-3 bg-[#FC4239] text-white text-[13px] font-semibold rounded-lg hover:bg-[#e03a32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
