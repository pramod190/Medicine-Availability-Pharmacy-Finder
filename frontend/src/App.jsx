import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { Login, Register } from './pages/Auth';
import Emergency from './pages/Emergency';
import MapPage from './pages/MapPage';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Reminders from './pages/Reminders';
import PrescriptionOCR from './pages/PrescriptionOCR';
import Substitutes from './pages/Substitutes';
import InteractionChecker from './pages/InteractionChecker';
import MediBot from './pages/MediBot';
import AIHub from './pages/AIHub';
import AIDemo from './pages/AIDemo';

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/emergency"   element={<Emergency />} />
        <Route path="/map"         element={<MapPage />} />
        <Route path="/analytics"   element={<Analytics />} />
        <Route path="/ai" element={<AIHub />} />
        <Route path="/medibot"     element={<MediBot />} />
        <Route path="/substitutes" element={<Substitutes />} />
        <Route path="/interactions"element={<InteractionChecker />} />
        <Route path="/prescription" element={<Protected><PrescriptionOCR /></Protected>} />
        <Route path="/ai-demo" element={<AIDemo />} />
        <Route path="/dashboard"   element={<Protected roles={['pharmacy_admin','admin']}><Dashboard /></Protected>} />
        <Route path="/orders"      element={<Protected><Orders /></Protected>} />
        <Route path="/reminders"   element={<Protected><Reminders /></Protected>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3500} newestOnTop closeOnClick theme="dark" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
}
