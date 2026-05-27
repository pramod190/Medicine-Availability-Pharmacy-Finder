import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Zap, Pill, TrendingUp, ArrowRight, LocateFixed, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import SearchBar from '../components/SearchBar';
import PharmacyCard from '../components/PharmacyCard';
import OrderModal from '../components/OrderModal';
import { searchMedicines, getTopSearches, createMedicineRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [trending, setTrending] = useState([]);
  const [orderModal, setOrderModal] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    getTopSearches(7, 8)
      .then((r) => setTrending(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});


    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setLocation({ lat: 17.3850, lng: 78.4867 })
    );
  }, []);

  const handleSearch = async (query) => {
    setLoading(true);
    setLastQuery(query);
    try {
      const res = await searchMedicines(
        query,
        location?.lat,
        location?.lng,
        10
      );
      setResults(res.data);

      if (res.data.inventories.length === 0) {
        toast.info('No stock found nearby. You can broadcast a request!', { autoClose: 4000 });
      }
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (pharmacy) => {
    const [lng, lat] = pharmacy.location.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleBroadcast = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!lastQuery) return;

    try {
      await createMedicineRequest({
        medicineName: lastQuery,
        lat: location?.lat || 17.3850,
        lng: location?.lng || 78.4867,
        radius: 5,
        urgent: false,
      });
      toast.success('Request broadcast to nearby pharmacies!');
    } catch {
      toast.error('Failed to broadcast request');
    }
  };

  return (
    <div className="home page-enter">

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <Pill size={13} />
            Medicine & Pharmacy Finder
          </div>

          <h1 className="hero-title">
            Find medicines,<br />
            <span className="hero-title-accent">instantly nearby</span>
          </h1>

          <p className="hero-subtitle">
            Search for any medicine and discover pharmacies near you with real-time stock updates.
          </p>

          <div className="hero-search-wrap">
            <SearchBar onSearch={handleSearch} loading={loading} />

            {location ? (
              <div className="location-indicator">
                <LocateFixed size={13} />
                <span>Using your location</span>
              </div>
            ) : (
              <div className="location-indicator warn">
                <AlertCircle size={13} />
                <span>Enable location for better results</span>
              </div>
            )}
          </div>

          {/* Trending */}
          {trending.length > 0 && !results && (
            <div className="trending">
              <span className="trending-label">
                <TrendingUp size={13} /> Trending:
              </span>

              <div className="trending-chips">
                {trending.map((t) => (
                  <button
                    key={t.medicineName}
                    className="chip trending-chip"
                    onClick={() => handleSearch(t.medicineName)}
                  >
                    {t.medicineName}
                    <span className="trending-count">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {results && (
        <section className="results-section">
          <div className="results-container">

            <div className="results-header">
              <div>
                <h2 className="results-title">
                  Results for <span className="highlight">"{lastQuery}"</span>
                </h2>
                <p className="results-sub">
                  {results.inventories.length} pharmacies with stock
                  {location && ' · sorted by distance'}
                </p>
              </div>

              <div className="results-actions">
                {results.inventories.length === 0 && (
                  <button className="btn-primary" onClick={handleBroadcast}>
                    <Zap size={15} /> Broadcast Request
                  </button>
                )}

                <button
                  className="btn-outline"
                  onClick={() => navigate(`/map?q=${lastQuery}&lat=${location?.lat}&lng=${location?.lng}`)}
                >
                  <MapPin size={14} /> View on Map
                </button>
              </div>

              {results.inventories.length === 0 && (
                <div className="no-stock-card card" style={{ marginTop: 20, padding: 18, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18 }}>No nearby stock found</h3>
                      <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', maxWidth: 640 }}>
                        We couldn't find any pharmacy nearby with "{lastQuery}" in stock. Send a broadcast request so nearby pharmacies can respond if they have it.
                      </p>
                    </div>
                    <button className="btn-primary" onClick={handleBroadcast}>
                      <Zap size={15} /> Broadcast Request
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pharmacy Grid */}
            {results.inventories.length > 0 && (
              <div className="pharmacies-grid">
                {results.inventories.map((inv) => (
                  <PharmacyCard
                    key={inv._id}
                    pharmacy={inv.pharmacy}
                    inventory={inv}
                    onOrder={(p, i) =>
                      setOrderModal({
                        pharmacy: p,
                        inventory: i,
                        medicine: inv.medicine
                      })
                    }
                    onNavigate={handleNavigate}
                    showStock
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features (FIXED SECTION) */}
      {!results && (
        <section className="features">
          <div className="features-container">
            <div className="features-grid">

              {[
                { icon: '🤖', title: 'MediBot AI', desc: 'Ask our AI pharmacist — dosages, interactions, side effects, advice.', link: '/medibot' },
                { icon: '📋', title: 'Prescription OCR', desc: 'Upload your prescription. AI extracts all medicines automatically.', link: '/prescription' },
                { icon: '🔄', title: 'AI Substitutes', desc: 'Medicine unavailable? AI recommends alternatives.', link: '/substitutes' },
                { icon: '⚗️', title: 'Drug Interactions', desc: 'Check combinations for safety.', link: '/interactions' },
                { icon: '🗺️', title: 'Map View', desc: 'See nearby pharmacies on map.', link: '/map' },
                { icon: '⚡', title: 'Emergency Mode', desc: 'Find nearest pharmacy instantly.', link: '/emergency' },
              ].map((f) => (
                <a
                  href={f.link}
                  key={f.title}
                  className="feature-card card"
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </a>
              ))}

            </div>
          </div>
        </section>
      )}

      {/* Order Modal */}
      {orderModal && (
        <OrderModal
          pharmacy={orderModal.pharmacy}
          medicine={orderModal.medicine}
          inventory={orderModal.inventory}
          onClose={() => setOrderModal(null)}
        />
      )}
    </div>
  );
}