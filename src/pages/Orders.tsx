import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { apiUrl } from '../lib/apiBase';
import { Download, Loader2, Clock, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-electric-red" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

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
      case 'paid': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'cancelled':
      case 'refunded': return <XCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-16 py-8">
      <h1 className="font-display text-3xl font-extrabold text-on-surface mb-8">Order History</h1>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4 text-muted-text">
          <Loader2 size={36} className="animate-spin text-electric-red" />
          <p className="font-mono text-sm uppercase tracking-wider">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-muted-text">
          <ShoppingBag size={48} className="opacity-30" />
          <h2 className="font-display text-xl font-bold text-on-surface">No orders yet</h2>
          <p>When you purchase tracks, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-surface-gray border border-border-gray rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-border-gray">
                <div>
                  <span className="font-mono font-bold text-on-surface">Order #{order.id.split('-')[0]}</span>
                  <span className="text-xs text-muted-text ml-3">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  order.status === 'paid' ? 'bg-success-green/10 text-success-green' :
                  order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-electric-red/10 text-electric-red'
                }`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>

              <div className="divide-y divide-border-gray">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.track?.artwork_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'} 
                        alt={item.track?.title || 'Track'} 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium text-on-surface">{item.track?.title || 'Unknown Track'}</div>
                        <div className="text-sm text-muted-text">{item.track?.artist || 'Unknown Artist'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-text">
                        {item.price_at_purchase === 0 ? 'FREE' : `$${item.price_at_purchase}`}
                      </span>
                      {order.status === 'paid' && item.track && (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 bg-electric-red text-white rounded-lg text-xs font-bold red-glow"
                          onClick={() => handleDownload(item.track!.id, item.track!.title)}
                          disabled={downloading === item.track.id}
                        >
                          {downloading === item.track.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-border-gray text-right">
                <span className="text-muted-text">Total: </span>
                <span className="font-mono font-bold text-on-surface">${order.total_amount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
