import { useState, useEffect } from 'react';
import { ShoppingBag, Package, Truck, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { getMyOrders } from '../utils/api';
import './Orders.css';

const STATUS_STEPS = ['pending','confirmed','preparing','out_for_delivery','delivered'];
const STATUS_ICONS = {
  pending:          <Clock size={16} />,
  confirmed:        <Package size={16} />,
  preparing:        <Package size={16} />,
  out_for_delivery: <Truck size={16} />,
  delivered:        <CheckCircle size={16} />,
  cancelled:        <XCircle size={16} />,
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((r) => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusIdx = (s) => STATUS_STEPS.indexOf(s);

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh' }}>
      <span className="spinner" style={{ width:32,height:32,borderWidth:3 }} />
    </div>
  );

  return (
    <div className="orders-page page-enter">
      <div className="orders-container">
        <div className="orders-header">
          <p className="section-label">My Account</p>
          <h1>My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <ShoppingBag size={48} />
            <h2>No orders yet</h2>
            <p>Find medicines and place your first order</p>
            <a href="/" className="btn-primary" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              Search Medicines →
            </a>
          </div>
        ) : (
          <div className="orders-list-page">
            {orders.map((order) => (
              <div key={order._id} className="order-card card">
                <div className="order-card-header">
                  <div>
                    <span className="order-card-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                    <span className={`badge ${order.status === 'cancelled' ? 'badge-red' : order.status === 'delivered' ? 'badge-teal' : 'badge-blue'}`} style={{ marginLeft: 10 }}>
                      {STATUS_ICONS[order.status]}
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                </div>

                {/* Progress bar */}
                {order.status !== 'cancelled' && (
                  <div className="order-progress">
                    {STATUS_STEPS.slice(0, 5).map((s, i) => (
                      <div key={s} className={`progress-step ${i <= statusIdx(order.status) ? 'done' : ''}`}>
                        <div className="progress-dot" />
                        {i < 4 && <div className="progress-line" />}
                        <span>{s.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="order-card-body">
                  <div className="order-pharmacy-info">
                    <MapPin size={13} style={{ color:'var(--teal-400)', flexShrink:0 }} />
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{order.pharmacy?.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{order.pharmacy?.address}</div>
                    </div>
                  </div>
                  <div className="order-items-list">
                    {order.items?.map((item, i) => (
                      <div key={i} className="order-line">
                        <span>{item.name} <span style={{ color:'var(--text-muted)' }}>×{item.quantity}</span></span>
                        <span style={{ color:'var(--teal-400)', fontWeight:600 }}>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-total-row">
                    <span style={{ color:'var(--text-muted)', fontSize:13 }}>
                      {order.deliveryType === 'delivery' ? '🚚 Home Delivery' : '🏪 Store Pickup'} · {order.paymentMethod}
                    </span>
                    <span className="order-grand-total">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
