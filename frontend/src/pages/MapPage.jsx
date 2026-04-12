import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, Phone, Star, Filter, Truck, Clock, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { getNearbyPharmacies, searchMedicines } from '../utils/api';
import SearchBar from '../components/SearchBar';
import './MapPage.css';

export default function MapPage() {
  const [params]    = useSearchParams();
  const [pharmacies, setPharmacies] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]     = useState(false);
  const [location,   setLocation]    = useState({ lat: 17.3850, lng: 78.4867 });
  const [results,    setResults]     = useState(null);
  const [filter,     setFilter]      = useState('all');
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    if (location) loadPharmacies();
  }, [location]);

  useEffect(() => {
    const q = params.get('q');
    if (q) handleSearch(q);
  }, [params]);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const res = await getNearbyPharmacies(location.lat, location.lng, 15);
      setPharmacies(res.data);
    } catch (err) {
      if (!err.response) {
        setBackendDown(true);
        toast.error('Backend not reachable. Please start the server.');
      } else {
        toast.error('Failed to load pharmacies');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const res = await searchMedicines(query, location.lat, location.lng, 15);
      setResults(res.data);
      setPharmacies(res.data.inventories.map((i) => ({ ...i.pharmacy, distance: i.distance, inventory: i })));
    } catch (err) {
      if (!err.response) {
        setBackendDown(true);
        toast.error('Backend not reachable. Please start the server.');
      } else {
        toast.error('Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigate2Pharmacy = (pharmacy) => {
    const [lng, lat] = pharmacy.location?.coordinates || [78.4867, 17.3850];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const filtered = filter === 'all' ? pharmacies
    : filter === '24h'      ? pharmacies.filter((p) => p.isOpen24)
    : filter === 'delivery' ? pharmacies.filter((p) => p.deliveryAvailable)
    : pharmacies;

  // Simulated map: render as visual grid since no Maps API key
  return (
    <div className="mappage page-enter">
      <div className="mappage-sidebar">
        <div className="mappage-top">
          <h2 className="mappage-title">Pharmacy Map</h2>
          <SearchBar onSearch={handleSearch} loading={loading} />

          {/* Filters */}
          <div className="map-filters">
            {['all', '24h', 'delivery'].map((f) => (
              <button
                key={f}
                className={`map-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === '24h' ? '24h Open' : 'Delivery'}
              </button>
            ))}
          </div>
        </div>

        {/* Backend down banner */}
        {backendDown && (
          <div style={{
            background: 'rgba(255,79,107,0.08)', border: '1px solid rgba(255,79,107,0.25)',
            borderRadius: 10, padding: '10px 14px', margin: '8px 0',
            display: 'flex', alignItems: 'flex-start', gap: 8,
            color: 'var(--accent-red)', fontSize: 12,
          }}>
            <WifiOff size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Server not reachable. Run <code>npm run dev</code> in the backend folder and ensure MongoDB is running.</span>
          </div>
        )}

        {/* Pharmacy list */}
        <div className="pharmacy-list">
          {loading && (
            <div className="map-loading">
              <span className="spinner" />
              <span>Finding pharmacies…</span>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="map-empty">
              <MapPin size={28} />
              <p>No pharmacies found in this area</p>
            </div>
          )}
          {filtered.map((p, i) => (
            <div
              key={p._id || i}
              className={`map-pharm-item ${selected?._id === p._id ? 'active' : ''}`}
              onClick={() => setSelected(p)}
            >
              <div className="map-pharm-num">{i + 1}</div>
              <div className="map-pharm-info">
                <div className="map-pharm-name">
                  {p.name}
                  {p.isOpen24 && <span className="badge badge-blue" style={{fontSize:9}}>24h</span>}
                  {p.deliveryAvailable && <span className="badge badge-teal" style={{fontSize:9}}>Delivery</span>}
                </div>
                <div className="map-pharm-addr">
                  <MapPin size={11} /> {p.address}
                </div>
                <div className="map-pharm-meta">
                  {p.distance !== undefined && (
                    <span className="distance-tag"><Navigation size={11} /> {p.distance} km</span>
                  )}
                  {p.rating > 0 && (
                    <span><Star size={11} style={{color:'var(--accent-gold)'}} /> {p.rating}</span>
                  )}
                  {p.inventory && (
                    <span style={{color:'var(--teal-400)',fontWeight:600}}>₹{p.inventory.price}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map visual */}
      <div className="mappage-map">
        <div className="map-visual">
          <div className="map-grid-bg" />
          {/* Simulated pins */}
          {filtered.map((p, i) => {
            const [pLng, pLat] = p.location?.coordinates || [78.4867, 17.3850];
            // Scale relative to Hyderabad center
            const baseL = 78.36, baseT = 17.52;
            const left = ((pLng - baseL) / 0.2) * 100;
            const top  = ((baseT - pLat) / 0.2) * 100;
            return (
              <div
                key={p._id || i}
                className={`map-pin ${selected?._id === p._id ? 'selected' : ''} ${p.inventory?.stock === 0 ? 'out' : ''}`}
                style={{
                  left: `${Math.max(5, Math.min(92, left))}%`,
                  top:  `${Math.max(5, Math.min(92, top))}%`,
                }}
                onClick={() => setSelected(p)}
                title={p.name}
              >
                <div className="pin-dot">{i + 1}</div>
                <div className="pin-label">{p.name.split(' ')[0]}</div>
              </div>
            );
          })}
          {/* User marker */}
          <div className="user-pin" style={{ left: '50%', top: '50%' }}>
            <div className="user-pin-inner" />
            <div className="user-pin-ring" />
          </div>
          <div className="map-legend">
            <span className="legend-item"><span className="legend-dot teal" /> In Stock</span>
            <span className="legend-item"><span className="legend-dot red" /> Out of Stock</span>
            <span className="legend-item"><span className="legend-dot blue" /> You</span>
          </div>
          <div className="map-note">
            Tip: Add your Google Maps API key in .env for a real interactive map
          </div>
        </div>

        {/* Selected pharmacy panel */}
        {selected && (
          <div className="map-detail-panel">
            <div className="map-detail-header">
              <div>
                <h3>{selected.name}</h3>
                <p><MapPin size={12} /> {selected.address}</p>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="map-detail-body">
              <div className="map-detail-row">
                <Clock size={13} />
                <span>{selected.isOpen24 ? '24 Hours Open' : selected.openHours}</span>
              </div>
              {selected.phone && (
                <div className="map-detail-row">
                  <Phone size={13} />
                  <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                </div>
              )}
              {selected.rating > 0 && (
                <div className="map-detail-row">
                  <Star size={13} style={{ color: 'var(--accent-gold)' }} />
                  <span>{selected.rating} ({selected.totalRatings} reviews)</span>
                </div>
              )}
              {selected.deliveryAvailable && (
                <div className="map-detail-row">
                  <Truck size={13} />
                  <span>Delivery up to {selected.deliveryRadius} km</span>
                </div>
              )}
              {selected.inventory && (
                <div className="map-stock-info">
                  <span style={{color:'var(--teal-400)',fontWeight:700}}>
                    {selected.inventory.stock} units · ₹{selected.inventory.price}
                  </span>
                </div>
              )}
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 10 }}>
              <button className="btn-outline" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13 }}
                onClick={() => navigate2Pharmacy(selected)}>
                <Navigation size={14} /> Navigate
              </button>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="btn-primary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, borderRadius:12 }}>
                  <Phone size={14} /> Call
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
