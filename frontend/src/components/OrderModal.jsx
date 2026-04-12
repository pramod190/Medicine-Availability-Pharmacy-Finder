import { useState } from 'react';
import { X, Truck, ShoppingBag, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { createOrder } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './OrderModal.css';

export default function OrderModal({ pharmacy, medicine, inventory, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty]         = useState(1);
  const [address, setAddress] = useState('');
  const [type, setType]       = useState('delivery');
  const [payment, setPayment] = useState('cash');
  const [loading, setLoading] = useState(false);

  const total = (inventory.price * qty).toFixed(2);

  const handleOrder = async () => {
    if (!user) { navigate('/login'); return; }
    if (type === 'delivery' && !address.trim()) {
      toast.warning('Please enter a delivery address');
      return;
    }
    setLoading(true);
    try {
      await createOrder({
        pharmacyId: pharmacy._id,
        items: [{ medicine: medicine._id, name: medicine.name, quantity: qty, price: inventory.price }],
        deliveryAddress: address,
        deliveryType: type,
        paymentMethod: payment,
      });
      toast.success('Order placed successfully! 🎉');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Place Order</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Medicine info */}
          <div className="order-medicine card">
            <div className="order-med-name">{medicine.name}</div>
            <div className="order-med-meta">
              <span className="chip">{medicine.form}</span>
              {medicine.genericName && <span className="chip">{medicine.genericName}</span>}
            </div>
            <div className="order-price">₹{inventory.price} <span>per unit</span></div>
          </div>

          {/* Pharmacy */}
          <div className="order-pharmacy">
            <MapPin size={13} />
            <span><strong>{pharmacy.name}</strong> – {pharmacy.address}</span>
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label>Quantity</label>
            <div className="qty-control">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(inventory.stock, qty + 1))}>+</button>
            </div>
            <span className="form-hint">{inventory.stock} available</span>
          </div>

          {/* Delivery type */}
          <div className="form-group">
            <label>Delivery Type</label>
            <div className="type-toggle">
              <button
                className={type === 'delivery' ? 'active' : ''}
                onClick={() => setType('delivery')}
              >
                <Truck size={14} /> Home Delivery
              </button>
              <button
                className={type === 'pickup' ? 'active' : ''}
                onClick={() => setType('pickup')}
              >
                <ShoppingBag size={14} /> Store Pickup
              </button>
            </div>
          </div>

          {type === 'delivery' && (
            <div className="form-group">
              <label>Delivery Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full delivery address…"
                rows={3}
              />
            </div>
          )}

          {/* Payment */}
          <div className="form-group">
            <label>Payment Method</label>
            <select value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="cash">Cash on Delivery</option>
              <option value="online">Online Payment</option>
              <option value="card">Card</option>
            </select>
          </div>

          {/* Total */}
          <div className="order-total">
            <span>Total Amount</span>
            <span className="order-total-amt">₹{total}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleOrder} disabled={loading}>
            {loading ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
