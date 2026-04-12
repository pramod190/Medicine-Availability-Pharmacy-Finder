import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 45000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect on 401 if we're NOT already on the login/register page
    if (
      err.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

// ── Helper functions ──────────────────────────────────────
export const searchMedicines = (name, lat, lng, radius, emergency) =>
  API.get('/medicines/search', { params: { name, lat, lng, radius, emergency } });

export const getSuggestions = (q) =>
  API.get('/medicines/suggest', { params: { q } });

export const getMedicine = (id) => API.get(`/medicines/${id}`);
export const getSubstitutes = (id) => API.get(`/medicines/${id}/substitutes`);

export const getNearbyPharmacies = (lat, lng, radius) =>
  API.get('/pharmacies/nearby', { params: { lat, lng, radius } });

export const getPharmacy = (id) => API.get(`/pharmacies/${id}`);
export const getPharmacyInventory = (id) => API.get(`/pharmacies/${id}/inventory`);

export const getInventory = (pharmacyId) =>
  API.get(`/inventory/pharmacy/${pharmacyId}`);
export const updateInventory = (data) => API.post('/inventory/update', data);
export const deleteInventoryItem = (id) => API.delete(`/inventory/${id}`);
export const getLowStockAlerts = (pharmacyId) =>
  API.get(`/inventory/alerts/${pharmacyId}`);

export const createOrder = (data) => API.post('/orders', data);
export const getMyOrders = () => API.get('/orders/my-orders');
export const getPharmacyOrders = (pharmacyId) =>
  API.get(`/orders/pharmacy/${pharmacyId}`);
export const updateOrderStatus = (id, status) =>
  API.put(`/orders/${id}/status`, { status });

export const getTopSearches = (days, limit) =>
  API.get('/analytics/top-searches', { params: { days, limit } });
export const getDailyTrends = (days, medicine) =>
  API.get('/analytics/daily-trends', { params: { days, medicine } });
export const getLowStockReport = (pharmacyId) =>
  API.get('/analytics/low-stock', { params: { pharmacyId } });
export const getAnalyticsSummary = () => API.get('/analytics/summary');
export const getCategoryStats = () => API.get('/analytics/categories');

export const createMedicineRequest = (data) => API.post('/requests', data);
export const getMyRequests = () => API.get('/requests/my');
export const respondToRequest = (id, data) =>
  API.post(`/requests/${id}/respond`, data);

export const uploadPrescription = (formData) =>
  API.post('/prescription/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
