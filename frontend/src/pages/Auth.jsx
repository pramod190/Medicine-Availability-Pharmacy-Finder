import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Eye, EyeOff, WifiOff, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './Auth.css';

// ── Shared server status banner ────────────────────────────────────────────────
function ServerBanner({ status }) {
  if (status === 'ok') return null;
  if (status === 'checking') return null;
  return (
    <div style={{
      background: 'rgba(255,79,107,0.08)', border: '1px solid rgba(255,79,107,0.3)',
      borderRadius: 10, padding: '10px 14px', marginBottom: 18,
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13,
      color: 'var(--accent-red)',
    }}>
      <WifiOff size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <strong>Backend not reachable.</strong>
        <br />
        Start the server: <code>cd backend &amp;&amp; npm run dev</code>
        <br />
        Also ensure <strong>MongoDB</strong> is running on port 27017.
      </div>
    </div>
  );
}

// ── Seed hint banner ───────────────────────────────────────────────────────────
function SeedBanner({ show }) {
  if (!show) return null;
  return (
    <div style={{
      background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.35)',
      borderRadius: 10, padding: '10px 14px', marginBottom: 18,
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13,
      color: 'var(--accent-gold)',
    }}>
      <Database size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <strong>Demo users not found.</strong> Run the seed script first:
        <br />
        <code>cd backend &amp;&amp; npm run seed</code>
        <br />
        This creates demo accounts with password: <strong>password123</strong>
      </div>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────────
export function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setF]       = useState({ email: '', password: '' });
  const [loading, setL]    = useState(false);
  const [show, setShow]    = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'ok' | 'down'
  const [showSeedHint, setShowSeedHint] = useState(false);

  // Ping backend on mount
  useEffect(() => {
    API.get('/health')
      .then(() => setServerStatus('ok'))
      .catch((err) => {
        if (!err.response) setServerStatus('down');
        else setServerStatus('ok'); // server responded (even with error = it's up)
      });
  }, []);

  const handle = async (e) => {
    e.preventDefault();
    if (serverStatus === 'down') {
      toast.error('Backend server is not running. Please start it first.');
      return;
    }
    setL(true);
    setShowSeedHint(false);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'pharmacy_admin' ? '/dashboard' : '/');
    } catch (err) {
      if (!err.response) {
        setServerStatus('down');
        toast.error('Cannot reach server. Is the backend running?');
      } else if (err.response?.status === 400) {
        toast.error('Invalid email or password. Check credentials or register a new account.');
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally { setL(false); }
  };

  const demoLogin = async (email) => {
    if (serverStatus === 'down') {
      toast.error('Backend is not running. Start the server first.');
      return;
    }
    const password = 'password123';
    setF({ email, password });
    setL(true);
    setShowSeedHint(false);
    try {
      const user = await login(email, password);
      toast.success(`Logged in as ${user.name}!`);
      navigate(user.role === 'pharmacy_admin' ? '/dashboard' : '/');
    } catch (err) {
      if (!err.response) {
        setServerStatus('down');
        toast.error('Cannot reach server. Is the backend running?');
      } else if (err.response?.status === 400) {
        // Most likely seed not run
        setShowSeedHint(true);
        toast.error('Demo user not found. Run: cd backend && npm run seed');
      } else {
        toast.error('Demo login failed. Please try again.');
      }
    } finally { setL(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"><Pill size={20} /></div>
          <span className="logo-text">Medi<span>Find</span></span>
        </div>
        <h2>Welcome back</h2>
        <p className="auth-subtitle">Sign in to continue to MediFind</p>

        <ServerBanner status={serverStatus} />
        <SeedBanner show={showSeedHint} />

        {serverStatus === 'ok' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: 'var(--teal-400)', marginBottom: 14,
          }}>
            <CheckCircle size={13} /> Server connected
          </div>
        )}

        <form onSubmit={handle} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setF({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div className="pass-wrap">
              <input
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setF({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="pass-eye" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading
              ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              : 'Sign In'
            }
          </button>
        </form>

        <div className="auth-demo">
          <p className="auth-demo-label">
            Quick demo login <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              (run <code>npm run seed</code> first)
            </span>:
          </p>
          <div className="auth-demo-btns">
            <button className="demo-btn" onClick={() => demoLogin('priya@example.com')} disabled={loading}>
              👤 User
            </button>
            <button className="demo-btn" onClick={() => demoLogin('ravi@pharmacy.com')} disabled={loading}>
              🏥 Pharmacy
            </button>
            <button className="demo-btn" onClick={() => demoLogin('admin@medifind.com')} disabled={loading}>
              ⚙️ Admin
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Demo password: <code>password123</code>
          </p>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

// ── Register ───────────────────────────────────────────────────────────────────
export function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setF] = useState({ name: '', email: '', password: '', phone: '', role: 'user' });
  const [loading, setL]    = useState(false);
  const [show, setShow]    = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    API.get('/health')
      .then(() => setServerStatus('ok'))
      .catch((err) => {
        if (!err.response) setServerStatus('down');
        else setServerStatus('ok');
      });
  }, []);

  const handle = async (e) => {
    e.preventDefault();
    if (serverStatus === 'down') {
      toast.error('Backend server is not running. Please start it first.');
      return;
    }
    if (form.password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    setL(true);
    try {
      const user = await register(form);
      toast.success(`Account created! Welcome, ${user.name.split(' ')[0]}!`);
      navigate(form.role === 'pharmacy_admin' ? '/dashboard' : '/');
    } catch (err) {
      if (!err.response) {
        setServerStatus('down');
        toast.error('Cannot reach server. Is the backend running?');
      } else if (err.response?.status === 400) {
        toast.error(err.response.data?.message || 'Email already in use or invalid data.');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed. Try again.');
      }
    } finally { setL(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon"><Pill size={20} /></div>
          <span className="logo-text">Medi<span>Find</span></span>
        </div>
        <h2>Create account</h2>
        <p className="auth-subtitle">Join MediFind to find medicines instantly</p>

        <ServerBanner status={serverStatus} />

        {serverStatus === 'ok' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: 'var(--teal-400)', marginBottom: 14,
          }}>
            <CheckCircle size={13} /> Server connected
          </div>
        )}

        <form onSubmit={handle} className="auth-form">
          <div className="auth-field">
            <label>Full Name</label>
            <input type="text" placeholder="Your Name" value={form.name}
              onChange={(e) => setF({ ...form, name: e.target.value })} required />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setF({ ...form, email: e.target.value })} required />
          </div>
          <div className="auth-field">
            <label>Phone <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input type="tel" placeholder="9XXXXXXXXX" value={form.phone}
              onChange={(e) => setF({ ...form, phone: e.target.value })} />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div className="pass-wrap">
              <input type={show ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password}
                onChange={(e) => setF({ ...form, password: e.target.value })} required minLength={6} />
              <button type="button" className="pass-eye" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label>I am a…</label>
            <div className="role-toggle">
              {[
                { val: 'user',           label: '👤 Patient' },
                { val: 'pharmacy_admin', label: '🏥 Pharmacy Owner' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.val}
                  className={`role-btn ${form.role === r.val ? 'active' : ''}`}
                  onClick={() => setF({ ...form, role: r.val })}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading
              ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              : 'Create Account'
            }
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
