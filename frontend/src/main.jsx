import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

// ── Error Boundary — prevents blank page on crash ─────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0f1a', color: '#fff', fontFamily: 'sans-serif',
          padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#ff4f6b', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#8892a4', marginBottom: 24, maxWidth: 400 }}>
            The app encountered an error. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00c896', color: '#000', border: 'none',
              padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
            }}
          >
            Refresh Page
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: 24, color: '#ff4f6b', fontSize: 11,
              textAlign: 'left', maxWidth: 600, overflow: 'auto',
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
