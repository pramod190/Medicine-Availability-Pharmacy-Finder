import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Pill, Search, MapPin, LayoutDashboard, ShoppingBag,
  Bell, LogOut, Menu, X, Activity, Bot, FlaskConical, RefreshCw, FileImage
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [aiOpen,     setAiOpen]     = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const coreLinks = [
    { to: '/',          icon: <Search size={15} />,       label: 'Search'    },
    { to: '/map',       icon: <MapPin size={15} />,        label: 'Map'       },
    { to: '/emergency', icon: <Activity size={15} />,      label: 'Emergency' },
  ];

  const aiLinks = [
    { to: '/medibot',      icon: <Bot size={15} />,         label: 'MediBot',      desc: 'AI pharmacy chatbot'         },
    { to: '/prescription', icon: <FileImage size={15} />,   label: 'Prescription', desc: 'Scan & extract medicines'    },
    { to: '/substitutes',  icon: <RefreshCw size={15} />,   label: 'Substitutes',  desc: 'Find medicine alternatives'  },
    { to: '/interactions', icon: <FlaskConical size={15} />,label: 'Interactions', desc: 'Check drug interactions'     },
  ];

  const authLinks = user ? [
    ...(user.role === 'pharmacy_admin' || user.role === 'admin'
      ? [{ to: '/dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard' }]
      : []),
    { to: '/orders',    icon: <ShoppingBag size={15} />, label: 'Orders'    },
    { to: '/reminders', icon: <Bell size={15} />,        label: 'Reminders' },
  ] : [];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon"><Pill size={18} /></div>
          <span className="logo-text">Medi<span>Find</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links desktop">
          {coreLinks.map((l) => (
            <Link key={l.to} to={l.to} className={`nav-link ${pathname === l.to ? 'active' : ''}`}>
              {l.icon}{l.label}
            </Link>
          ))}

          {/* AI dropdown */}
          <div className="ai-dropdown-wrap" onMouseEnter={() => setAiOpen(true)} onMouseLeave={() => setAiOpen(false)}>
            <Link to="/ai" className="aihub-nav-link" style={{display:"none"}} /><button className={`nav-link ai-trigger ${aiLinks.some(l => pathname === l.to) ? 'active' : ''}`}>
              <Bot size={15} /> AI Features ✦
            </button>
            {aiOpen && (
              <div className="ai-dropdown">
                <div className="ai-dropdown-label">Powered by Claude</div>
                <Link to="/ai" className="ai-dropdown-item ai-hub-item" onClick={() => setAiOpen(false)}>
                  <div className="ai-dropdown-icon" style={{background:"rgba(155,107,255,0.15)"}}><Sparkles size={15} style={{color:"var(--accent-purple)"}} /></div>
                  <div>
                    <div className="ai-dropdown-name">AI Hub</div>
                    <div className="ai-dropdown-desc">All AI features in one place</div>
                  </div>
                </Link>
                {aiLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="ai-dropdown-item" onClick={() => setAiOpen(false)}>
                    <div className="ai-dropdown-icon">{l.icon}</div>
                    <div>
                      <div className="ai-dropdown-name">{l.label}</div>
                      <div className="ai-dropdown-desc">{l.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {authLinks.map((l) => (
            <Link key={l.to} to={l.to} className={`nav-link ${pathname === l.to ? 'active' : ''}`}>
              {l.icon}{l.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="navbar-right">
          {user ? (
            <>
              <div className="notif-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={18} />
                {unread > 0 && <span className="notif-badge">{unread}</span>}
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                      {unread > 0 && <span className="badge badge-teal">{unread} new</span>}
                    </div>
                    {notifications.length === 0
                      ? <p className="notif-empty">No notifications yet</p>
                      : notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                            <span className="notif-dot" /><p>{n.message}</p>
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
              <div className="user-pill">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login"    className="btn-outline" style={{ padding:'8px 16px', borderRadius:8, fontSize:13 }}>Login</Link>
              <Link to="/register" className="btn-primary" style={{ padding:'8px 16px', borderRadius:8, fontSize:13 }}>Sign Up</Link>
            </div>
          )}
          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {[...coreLinks, ...aiLinks, ...authLinks].map((l) => (
            <Link key={l.to} to={l.to} className={`nav-link ${pathname === l.to ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              {l.icon}{l.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link to="/login"    className="btn-outline" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="btn-primary" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
          {user && (
            <button className="btn-outline" onClick={() => { logout(); navigate('/login'); setMobileOpen(false); }}>
              <LogOut size={14} /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
