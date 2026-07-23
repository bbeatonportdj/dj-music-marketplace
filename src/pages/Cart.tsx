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
    <div className="min-h-screen bg-white pb-24">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 z-10 text-white">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight leading-[1.1]">
              Elevate Your Set With Premium Edits & Music.
            </h1>
            <p className="text-blue-100 text-base lg:text-lg max-w-md leading-relaxed">
              Explore the latest House genre crate.
            </p>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative w-[320px] h-[200px] lg:w-[400px] lg:h-[260px]">
              <img 
                src="https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=800&q=80" 
                alt="DJ Turntable" 
                className="w-full h-full object-cover rounded-lg opacity-80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-black mb-6">My Crate</h2>
            
            {cart.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <ShoppingCart size={48} className="text-gray-200" />
                <p className="text-[14px] text-gray-500">Your crate is empty</p>
                <button 
                  className="px-5 py-2.5 bg-blue-600 text-white text-[13px] font-semibold rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => navigate('/browse')}
                >
                  Browse Tracks
                </button>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-[2fr_100px_40px] gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <span>TRACK TITLE</span>
                  <span className="text-right">PRICE</span>
                  <span></span>
                </div>

                {/* Cart Items */}
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr] lg:grid-cols-[2fr_100px_40px] gap-3 lg:gap-4 items-center px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    {/* Track Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {item.artwork ? (
                          <img src={item.artwork} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart size={14} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-black truncate">{item.title}</p>
                        <p className="text-[12px] text-gray-500 truncate">{item.artist}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <span className="text-[13px] text-black text-right font-semibold">
                      {item.price === 0 ? 'FREE' : `$${item.price.toFixed(2)}`}
                    </span>

                    {/* Remove Button */}
                    <button
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
            <div className="sticky top-24 bg-gray-50 rounded-lg p-6">
              <h3 className="text-[14px] font-bold text-black mb-4">SUMMARY</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Total Price</span>
                  <span className="text-black font-semibold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Discount Code */}
              <div className="mb-6">
                <p className="text-[12px] text-gray-500 mb-2">Discount Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Discount Code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-[13px] text-black placeholder-gray-400 focus:outline-none focus:border-blue-300"
                  />
                  <button className="px-4 py-2 bg-black text-white text-[12px] font-semibold rounded hover:bg-gray-800 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                className="w-full py-3 bg-black text-white text-[13px] font-semibold rounded hover:bg-blue-600 transition-colors"
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
