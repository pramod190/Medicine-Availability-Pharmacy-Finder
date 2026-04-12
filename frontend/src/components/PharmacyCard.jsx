import { MapPin, Phone, Clock, Star, Truck, Zap, Navigation } from 'lucide-react';
import './PharmacyCard.css';

export default function PharmacyCard({ pharmacy, inventory, onOrder, onNavigate, showStock = true }) {
  const stockColor = (stock) => {
    if (stock <= 0)  return 'var(--accent-red)';
    if (stock <= 10) return 'var(--accent-gold)';
    return 'var(--teal-400)';
  };

  const stockLabel = (stock) => {
    if (stock <= 0)  return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div className="pharm-card card">
      <div className="pharm-card-header">
        <div className="pharm-info">
          <div className="pharm-name-row">
            <h3 className="pharm-name">{pharmacy.name}</h3>
            {pharmacy.isVerified && (
              <span className="badge badge-teal" style={{ fontSize: 9 }}>✓ Verified</span>
            )}
            {pharmacy.isOpen24 && (
              <span className="badge badge-blue" style={{ fontSize: 9 }}>24h</span>
            )}
          </div>
          <div className="pharm-meta">
            <span><MapPin size={12} /> {pharmacy.address}</span>
            {pharmacy.distance !== undefined && (
              <span className="distance-tag"><Navigation size={12} /> {pharmacy.distance} km</span>
            )}
          </div>
        </div>
        <div className="pharm-rating">
          <Star size={13} className="star-icon" />
          <span>{pharmacy.rating || '—'}</span>
          {pharmacy.totalRatings > 0 && (
            <span className="rating-count">({pharmacy.totalRatings})</span>
          )}
        </div>
      </div>

      <div className="pharm-tags">
        {pharmacy.openHours && (
          <span className="chip"><Clock size={11} /> {pharmacy.openHours}</span>
        )}
        {pharmacy.phone && (
          <a href={`tel:${pharmacy.phone}`} className="chip phone-chip">
            <Phone size={11} /> {pharmacy.phone}
          </a>
        )}
        {pharmacy.deliveryAvailable && (
          <span className="chip"><Truck size={11} /> Delivery up to {pharmacy.deliveryRadius}km</span>
        )}
      </div>

      {showStock && inventory && (
        <div className="pharm-stock">
          <div className="stock-indicator">
            <div
              className="stock-dot"
              style={{ background: stockColor(inventory.stock) }}
            />
            <span
              className="stock-label"
              style={{ color: stockColor(inventory.stock) }}
            >
              {stockLabel(inventory.stock)}
            </span>
            {inventory.stock > 0 && (
              <span className="stock-qty">({inventory.stock} units)</span>
            )}
          </div>
          <div className="price-row">
            {inventory.price && (
              <span className="price">₹{inventory.price}</span>
            )}
            {inventory.mrp && inventory.mrp !== inventory.price && (
              <span className="mrp">MRP ₹{inventory.mrp}</span>
            )}
          </div>

          <div className="stock-bar" style={{ marginTop: 8 }}>
            <div
              className="stock-bar-fill"
              style={{
                width: `${Math.min((inventory.stock / 100) * 100, 100)}%`,
                background: stockColor(inventory.stock),
              }}
            />
          </div>
        </div>
      )}

      <div className="pharm-actions">
        {onNavigate && (
          <button
            className="btn-outline pharm-btn"
            onClick={() => onNavigate(pharmacy)}
          >
            <Navigation size={14} /> Navigate
          </button>
        )}
        {onOrder && inventory?.stock > 0 && (
          <button
            className="btn-primary pharm-btn"
            onClick={() => onOrder(pharmacy, inventory)}
          >
            <Truck size={14} /> Order Now
          </button>
        )}
        {inventory?.stock <= 0 && (
          <span className="out-of-stock-msg">
            <Zap size={13} /> Request Medicine
          </span>
        )}
      </div>
    </div>
  );
}
