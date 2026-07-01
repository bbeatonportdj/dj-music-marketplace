import { useState } from 'react';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutModal from '../components/CheckoutModal';
import '../styles/cart.css';

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
      <div className="cart-empty">
        <ShoppingBag size={64} className="empty-icon" />
        <h2>{t('cart.empty')}</h2>
        <p>{t('cart.empty_msg')}</p>
        <Link to="/browse" className="browse-btn">{t('cart.browse_btn')}</Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>{t('cart.title')}</h1>
      <div className="cart-content">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.artwork} alt={item.title} />
              <div className="item-details">
                <h3>{item.title}</h3>
                <p>By {item.editor || item.artist}</p>
              </div>
              <div className="item-price">
                {item.price === 0 ? "FREE" : `$${item.price.toFixed(2)}`}
              </div>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button className="clear-btn" onClick={clearCart}>{t('cart.clear')}</button>
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h2>{t('cart.summary')}</h2>
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>{t('cart.total')}</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" onClick={() => setIsCheckoutOpen(true)}>
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
