import { useState } from 'react';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';

const Cart = () => {
  const { cart, removeFromCart, totalPrice, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCheckoutConfirm = () => {
    clearCart();
    navigate('/browse');
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-text">
        <ShoppingBag size={64} className="text-border-gray" />
        <h2 className="font-display text-2xl font-bold text-on-surface">{t('cart.empty')}</h2>
        <p>{t('cart.empty_msg')}</p>
        <Link 
          to="/browse" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {t('cart.browse_btn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-16 py-8">
      <h1 className="font-display text-4xl font-extrabold text-on-surface mb-8">{t('cart.title')}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-surface-gray border border-border-gray rounded-xl">
                <img src={item.artwork} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-on-surface truncate">{item.title}</h3>
                  <p className="text-sm text-muted-text">By {item.editor || item.artist}</p>
                </div>
                <div className="font-mono font-bold text-on-surface">
                  {item.price === 0 ? "FREE" : `$${item.price.toFixed(2)}`}
                </div>
                <button 
                  className="p-2 text-muted-text hover:text-electric-red hover:bg-electric-red/10 rounded-lg transition-colors"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button 
            className="mt-4 text-sm text-muted-text hover:text-electric-red transition-colors"
            onClick={clearCart}
          >
            {t('cart.clear')}
          </button>
        </div>

        {/* Summary */}
        <div className="w-full lg:w-[320px]">
          <div className="bg-surface-gray border border-border-gray rounded-xl p-6 sticky top-24">
            <h2 className="font-display text-xl font-bold text-on-surface mb-4">{t('cart.summary')}</h2>
            <div className="flex justify-between items-center py-2 border-b border-border-gray">
              <span className="text-muted-text">{t('cart.subtotal')}</span>
              <span className="font-mono text-on-surface">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 mb-6">
              <span className="font-bold text-on-surface">{t('cart.total')}</span>
              <span className="font-mono text-xl font-bold text-on-surface">${totalPrice.toFixed(2)}</span>
            </div>
            <button 
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 active:scale-[0.98] transition-all"
              onClick={() => setIsCheckoutOpen(true)}
            >
              {t('cart.checkout')} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        total={totalPrice}
        onConfirm={handleCheckoutConfirm}
        tracks={cart}
      />
    </div>
  );
};

export default Cart;
