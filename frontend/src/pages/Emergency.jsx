import { useState, useEffect } from 'react';
import { Zap, Phone, Navigation, AlertTriangle, Loader, MapPin, Clock, WifiOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { searchMedicines, createMedicineRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Emergency.css';

const EMERGENCY_MEDS = [
  { name: 'Insulin', icon: '💉', category: 'Diabetes' },
  { name: 'Aspirin', icon: '❤️', category: 'Cardiac' },
  { name: 'Epinephrine', icon: '⚡', category: 'Allergy' },
  { name: 'Salbutamol Inhaler', icon: '🫁', category: 'Asthma' },
  { name: 'Paracetamol 500mg', icon: '🌡️', category: 'Fever' },
  { name: 'ORS Electrolyte', icon: '💧', category: 'Dehydration' },
  { name: 'Ondansetron 4mg', icon: '🤢', category: 'Vomiting' },
  { name: 'Nitroglycerine', icon: '💊', category: 'Angina' },
];

export default function Emergency() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [location, setLocation]   = useState(null);
  const [locError, setLocError]   = useState(false);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => { setLocError(true); setLocation({ lat: 17.3850, lng: 78.4867 }); }
    );
  }, []);

  const search = async (q) => {
    const name = q || query;
    if (!name.trim()) return;
    setLoading(true);
    setQuery(name);
    setBackendDown(false);
    try {
      const res = await searchMedicines(name, location?.lat, location?.lng, 15, true);
      setResults(res.data);
      if (!res.data?.inventories?.length) {
        toast.info('No stock found nearby. Try broadcasting a request to pharmacies.');
      }
    } catch (err) {
      const isNetwork = !err.response;
      if (isNetwork) {
        setBackendDown(true);
        toast.error('Cannot connect to server. Is the backend running?');
      } else {
        toast.error('Emergency search failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const callPharmacy = (phone) => window.open(`tel:${phone}`);

  const navigate2 = (pharmacy) => {
    const [lng, lat] = pharmacy.location?.coordinates || [78.4867, 17.3850];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const broadcast = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await createMedicineRequest({
        medicineName: query,
        lat: location?.lat || 17.3850,
        lng: location?.lng || 78.4867,
        radius: 5,
        urgent: true,
      });
      toast.success(`🚨 Urgent request sent to ${res.data.notifiedPharmacies} pharmacies!`);
    } catch {
      toast.error('Failed to broadcast. Please ensure you are logged in and server is running.');
    }
  };

  const topResult = results?.inventories?.[0];

  return (
    <div className="emergency page-enter">
      {/* Header */}
      <div className="emergency-header">
        <div className="emergency-icon-wrap">
          <Zap size={28} />
        </div>
        <div>
          <h1>Emergency Medicine Finder</h1>
          <p>Instantly locate the nearest pharmacy with confirmed stock</p>
        </div>
        {locError && (
          <div className="loc-warning">
            <AlertTriangle size={13} />
            Using default location (Hyderabad). Enable GPS for accurate results.
          </div>
        )}
      </div>

      {/* Backend down banner */}
      {backendDown && (
        <div style={{
          background: 'rgba(255,79,107,0.1)', border: '1px solid rgba(255,79,107,0.3)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-red)',
        }}>
          <WifiOff size={18} />
          <div>
            <strong>Server not reachable.</strong> Make sure the backend is running on port 5000
            and MongoDB is connected. Run <code>npm run dev</code> in the backend folder.
          </div>
        </div>
      )}

      {/* Quick search */}
      <div className="emergency-search-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Type medicine name and press Enter…"
          className="emergency-input"
          autoFocus
        />
        <button className="emergency-btn" onClick={() => search()} disabled={loading}>
          {loading ? <Loader size={18} className="spin" /> : <><Zap size={18} /> Find Now</>}
        </button>
      </div>

      {/* Quick select pills */}
      {!results && (
        <div className="quick-meds">
          <p className="section-label">Common Emergency Medicines</p>
          <div className="quick-grid">
            {EMERGENCY_MEDS.map((m) => (
              <button key={m.name} className="quick-pill" onClick={() => search(m.name)}>
                <span className="quick-icon">{m.icon}</span>
                <div>
                  <div className="quick-name">{m.name}</div>
                  <div className="quick-cat">{m.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top result */}
      {topResult && (
        <div className="emergency-result">
          <div className="closest-badge">
            <Zap size={12} /> Closest with Stock
          </div>
          <div className="closest-card">
            <div className="closest-left">
              <div className="closest-name">{topResult.pharmacy.name}</div>
              <div className="closest-address">
                <MapPin size={13} /> {topResult.pharmacy.address}
              </div>
              {topResult.distance !== undefined && (
                <div className="closest-distance">
                  <Navigation size={13} /> {topResult.distance} km away
                </div>
              )}
              <div className="closest-hours">
                <Clock size={13} />
                {topResult.pharmacy.isOpen24 ? '24 Hours Open' : topResult.pharmacy.openHours}
              </div>
              <div className="closest-stock-row">
                <span className="closest-stock-dot" />
                <span>{topResult.stock} units in stock</span>
                <span className="closest-price">₹{topResult.price}</span>
              </div>
            </div>
            <div className="closest-actions">
              <button className="emergency-call-btn" onClick={() => callPharmacy(topResult.pharmacy.phone)}>
                <Phone size={18} /> Call Now
              </button>
              <button className="emergency-nav-btn" onClick={() => navigate2(topResult.pharmacy)}>
                <Navigation size={18} /> Navigate
              </button>
            </div>
          </div>

          {results.inventories.length > 1 && (
            <div className="other-results">
              <p className="section-label" style={{ marginBottom: 12 }}>Other Nearby Options</p>
              <div className="other-list">
                {results.inventories.slice(1, 5).map((inv) => (
                  <div key={inv._id} className="other-item">
                    <div className="other-info">
                      <span className="other-name">{inv.pharmacy.name}</span>
                      <span className="other-dist">
                        {inv.distance !== undefined ? `${inv.distance} km` : ''}
                      </span>
                    </div>
                    <div className="other-right">
                      <span className="other-stock">{inv.stock} units · ₹{inv.price}</span>
                      <div className="other-btns">
                        <button onClick={() => callPharmacy(inv.pharmacy.phone)}><Phone size={13} /></button>
                        <button onClick={() => navigate2(inv.pharmacy)}><Navigation size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.inventories.length === 0 && (
            <div className="no-emergency-stock">
              <AlertTriangle size={32} />
              <h3>No stock found nearby</h3>
              <p>Broadcast an urgent request to pharmacies within 5km</p>
              <button className="emergency-btn" onClick={broadcast}>
                <Zap size={16} /> Broadcast Urgent Request
              </button>
            </div>
          )}

          <button
            className="btn-outline"
            style={{ marginTop: 16, width: '100%', justifyContent: 'center', display: 'flex', gap: 6, alignItems: 'center' }}
            onClick={() => { setResults(null); setBackendDown(false); }}
          >
            ← New Search
          </button>
        </div>
      )}
    </div>
  );
}
