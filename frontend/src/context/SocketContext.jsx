import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    try {
      // Use polling first then upgrade to websocket
      // websocket-only fails on Render free tier during cold start
      socketRef.current = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 20000,
      });

      socketRef.current.on('connect', () => setConnected(true));
      socketRef.current.on('disconnect', () => setConnected(false));
      socketRef.current.on('connect_error', () => setConnected(false));

      if (user) {
        socketRef.current.emit('join-user', user.id);
      }

      socketRef.current.on('order-update', (data) => {
        addNotification({ type: 'order', message: `Order ${data.orderId} is now ${data.status}`, data });
      });

      socketRef.current.on('request-fulfilled', (data) => {
        addNotification({ type: 'request', message: `${data.pharmacy.name} has ${data.medicineName}!`, data });
      });

      socketRef.current.on('stock-update', (data) => {
        addNotification({ type: 'stock', message: `Stock updated`, data });
      });
    } catch (err) {
      console.warn('Socket connection failed (non-fatal):', err.message);
    }

    return () => {
      try { socketRef.current?.disconnect(); } catch (_) {}
    };
  }, [user]);

  const addNotification = (notif) => {
    setNotifications((prev) => [{ ...notif, id: Date.now(), read: false }, ...prev].slice(0, 50));
  };

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, notifications, markRead, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
