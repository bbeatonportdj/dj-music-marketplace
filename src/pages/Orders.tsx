import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { apiUrl } from '../lib/apiBase';
import { Download, Loader2, Clock, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import '../styles/orders.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
}

interface OrderItem {
  id: string;
  price_at_purchase: number;
  track: Track | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  created_at: string;
  order_items: OrderItem[];
}

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(apiUrl('/api/orders'));

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch orders');
        }

        const data = await res.json();
        setOrders(data as Order[]);
      } catch (error: unknown) {
          console.error('Error fetching orders:', error);
          const message = error instanceof Error ? error.message : String(error);
          showNotification('Failed to load orders: ' + message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, showNotification]);

  if (authLoading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <Loader2 size={36} className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const handleDownload = async (trackId: string, trackTitle: string) => {
    setDownloading(trackId);
    try {
      const res = await fetch(apiUrl(`/api/downloads/${trackId}`));

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${trackTitle}.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      showNotification(message, 'error');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'cancelled':
      case 'refunded': return <XCircle size={16} />;
      default: return null;
    }
  };

  return (
    <div className="orders-page">
      <h1 className="orders-title">Order History</h1>

      {loading ? (
        <div className="orders-loading">
          <Loader2 size={36} className="animate-spin" />
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <ShoppingBag size={48} style={{ color: 'var(--text-muted)' }} />
          <h2>No orders yet</h2>
          <p>When you purchase tracks, they will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <span className="order-id">Order #{order.id.split('-')[0]}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className={`order-status status-${order.status}`}>
                  {getStatusIcon(order.status)}
                  {order.status.toUpperCase()}
                </div>
              </div>

              <div className="order-items">
                {order.order_items.map((item) => (
                  <div key={item.id} className="order-item">
                    <img 
                      src={item.track?.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'} 
                      alt={item.track?.title || 'Track'} 
                      className="order-item-thumb"
                    />
                    <div className="order-item-details">
                      <div className="order-item-title">{item.track?.title || 'Unknown Track'}</div>
                      <div className="order-item-artist">{item.track?.artist || 'Unknown Artist'}</div>
                    </div>
                    <div className="order-item-actions">
                      <span className="order-item-price">
                        {item.price_at_purchase === 0 ? 'FREE' : `$${item.price_at_purchase}`}
                      </span>
                      {order.status === 'paid' && item.track && (
                        <button
                          className="download-btn"
                          onClick={() => handleDownload(item.track!.id, item.track!.title)}
                          disabled={downloading === item.track.id}
                        >
                          {downloading === item.track.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  Total: <strong>${order.total_amount}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
