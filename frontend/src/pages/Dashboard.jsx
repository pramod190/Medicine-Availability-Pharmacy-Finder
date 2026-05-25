import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, AlertTriangle, BarChart2, ShoppingBag, RefreshCw, Check, X, Search, Store, MapPin, Phone, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getInventory, updateInventory, deleteInventoryItem,
  getPharmacyOrders, updateOrderStatus, getLowStockAlerts,
} from '../utils/api';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Dashboard.css';

// ── Add Medicine Modal ──────────────────────────────────────────────────────────
function AddMedicineModal({ pharmacyId, onClose, onAdded }) {
  const [search,    setSearch]    = useState('');
  const [results,   setResults]   = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ stock: '', price: '', mrp: '', expiry: '', batchNo: '' });

  const searchMeds = async (q) => {
    setSearch(q);
    if (selected) { setSelected(null); }
    setNoResults(false);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await API.get('/medicines/suggest', { params: { q } });
      setResults(res.data);
      setNoResults(res.data.length === 0);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const selectMedicine = (m) => {
    setSelected(m);
    setSearch(m.name);
    setResults([]);
    setNoResults(false);
  };

  const handleAdd = async () => {
    if (!selected) { toast.warning('Select a medicine first'); return; }
    if (!form.stock || !form.price) { toast.warning('Stock and Price are required'); return; }
    setSaving(true);
    try {
      await updateInventory({
        pharmacyId,
        medicineId: selected._id,
        stock:   parseInt(form.stock),
        price:   parseFloat(form.price),
        mrp:     form.mrp ? parseFloat(form.mrp) : parseFloat(form.price),
        expiry:  form.expiry || undefined,
        batchNo: form.batchNo || undefined,
      });
      toast.success(`${selected.name} added to inventory!`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Plus size={18} /> Add Medicine to Inventory</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Medicine search */}
        <div className="modal-body">
          <div className="form-group">
            <label>Search Medicine *</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input
                style={{ paddingLeft: 34 }}
                value={search}
                onChange={(e) => searchMeds(e.target.value)}
                placeholder="Type medicine name…"
                autoFocus
              />
            </div>
            {searching && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>Searching…</div>}

            {/* Dropdown — use onMouseDown so blur doesn’t fire before click */}
            {results.length > 0 && !selected && (
              <div className="med-search-dropdown">
                {results.map((m) => (
                  <button
                    key={m._id}
                    className="med-search-item"
                    onMouseDown={(e) => { e.preventDefault(); selectMedicine(m); }}
                  >
                    <span style={{ fontWeight:600, fontSize:13 }}>{m.name}</span>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                      {[m.dosage, m.genericName, m.category].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {noResults && !selected && search.length >= 2 && (
              <div style={{ marginTop:6, padding:'8px 12px', background:'var(--bg-elevated)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', fontSize:13 }}>
                <span style={{ color:'var(--text-muted)' }}>No medicine found for “{search}”. </span>
                <span style={{ color:'var(--text-secondary)' }}>Try searching by generic name (e.g. “paracetamol” instead of brand name).</span>
              </div>
            )}

            {/* Selected chip */}
            {selected && (
              <div className="selected-med-chip">
                <span>&#10003; {selected.name}{selected.dosage ? ` — ${selected.dosage}` : ''}</span>
                <button onMouseDown={(e) => { e.preventDefault(); setSelected(null); setSearch(''); setResults([]); setNoResults(false); }}>
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="modal-form-grid">
            <div className="form-group">
              <label>Stock (units) *</label>
              <input type="number" min="0" value={form.stock}
                onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))}
                placeholder="e.g. 50" />
            </div>
            <div className="form-group">
              <label>Selling Price (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 84" />
            </div>
            <div className="form-group">
              <label>MRP (₹)</label>
              <input type="number" min="0" step="0.01" value={form.mrp}
                onChange={(e) => setForm(p => ({ ...p, mrp: e.target.value }))}
                placeholder="e.g. 100" />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" value={form.expiry}
                onChange={(e) => setForm(p => ({ ...p, expiry: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label>Batch No.</label>
              <input value={form.batchNo}
                onChange={(e) => setForm(p => ({ ...p, batchNo: e.target.value }))}
                placeholder="Optional batch number" />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Saving…</> : <><Check size={14}/> Add to Inventory</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Register Pharmacy Modal ─────────────────────────────────────────────────────
function RegisterPharmacyModal({ onClose, onRegistered }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '',
    licenseNo: '', openHours: '09:00-21:00',
    isOpen24: false, deliveryAvailable: true,
    lat: '17.3850', lng: '78.4867',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.phone) {
      toast.warning('Name, Address and Phone are required');
      return;
    }
    setSaving(true);
    try {
      await API.post('/pharmacies', {
        name:              form.name.trim(),
        address:           form.address.trim(),
        phone:             form.phone.trim(),
        email:             form.email.trim() || undefined,
        licenseNo:         form.licenseNo.trim() || undefined,
        openHours:         form.openHours,
        isOpen24:          form.isOpen24,
        deliveryAvailable: form.deliveryAvailable,
        location: {
          type: 'Point',
          coordinates: [parseFloat(form.lng) || 78.4867, parseFloat(form.lat) || 17.3850],
        },
      });
      toast.success('Pharmacy registered successfully! Refresh the page to manage it.');
      onRegistered();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Store size={18} /> Register Your Pharmacy</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-form-grid">
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label><Store size={12} /> Pharmacy Name *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Apollo Pharmacy Banjara Hills" autoFocus />
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label><MapPin size={12} /> Address *</label>
              <input value={form.address} onChange={(e) => set('address', e.target.value)}
                placeholder="Full address including area and city" />
            </div>
            <div className="form-group">
              <label><Phone size={12} /> Phone *</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="e.g. 040-23456789" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="pharmacy@example.com" />
            </div>
            <div className="form-group">
              <label>License No.</label>
              <input value={form.licenseNo} onChange={(e) => set('licenseNo', e.target.value)}
                placeholder="Drug license number" />
            </div>
            <div className="form-group">
              <label><Clock size={12} /> Open Hours</label>
              <input value={form.openHours} onChange={(e) => set('openHours', e.target.value)}
                placeholder="09:00-21:00" />
            </div>
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)}
                placeholder="17.3850" />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)}
                placeholder="78.4867" />
            </div>
          </div>

          <div style={{ display:'flex', gap:24, marginTop:4 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
              <input type="checkbox" checked={form.isOpen24} onChange={(e) => set('isOpen24', e.target.checked)} />
              Open 24 Hours
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
              <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set('deliveryAvailable', e.target.checked)} />
              Delivery Available
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}} /> Registering…</> : <><Check size={14}/> Register Pharmacy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [tab,       setTab]       = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [pharmacy,  setPharmacy]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [editItem,  setEditItem]  = useState(null);
  const [addForm,   setAddForm]   = useState(false);
  const [regModal,  setRegModal]  = useState(false);

  useEffect(() => { loadPharmacy(); }, []);

  useEffect(() => {
    if (!pharmacy) return;
    if (tab === 'inventory') loadInventory();
    if (tab === 'orders')    loadOrders();
    if (tab === 'alerts')    loadAlerts();

    socket?.emit('join-pharmacy', pharmacy._id);
    socket?.on('new-order', (order) => {
      setOrders((prev) => [order, ...prev]);
      toast.info('📦 New order received!');
    });
    socket?.on('inventory-update', (item) => {
      setInventory((prev) => prev.map((i) => (i._id === item._id ? item : i)));
    });
    return () => { socket?.off('new-order'); socket?.off('inventory-update'); };
  }, [pharmacy, tab]);

  const loadPharmacy = async () => {
    try {
      const res = await API.get('/pharmacies');
      const owned = res.data.find((p) => p.owner === user.id || p.owner?._id === user.id);
      setPharmacy(owned || null);
    } catch { toast.error('Failed to load pharmacy data'); }
    finally { setLoading(false); }
  };

  const loadInventory = async () => {
    if (!pharmacy) return;
    try { const res = await getInventory(pharmacy._id); setInventory(res.data); } catch {}
  };

  const loadOrders = async () => {
    if (!pharmacy) return;
    try { const res = await getPharmacyOrders(pharmacy._id); setOrders(res.data); } catch {}
  };

  const loadAlerts = async () => {
    if (!pharmacy) return;
    try { const res = await getLowStockAlerts(pharmacy._id); setAlerts(res.data); } catch {}
  };

  const handleUpdateStock = async (item) => {
    try {
      await updateInventory({
        pharmacyId: pharmacy._id,
        medicineId: item.medicine._id,
        stock:  parseInt(item.editStock),
        price:  parseFloat(item.editPrice),
        mrp:    parseFloat(item.editMrp || item.mrp),
      });
      setInventory((prev) =>
        prev.map((i) => i._id === item._id
          ? { ...i, stock: parseInt(item.editStock), price: parseFloat(item.editPrice), editing: false }
          : i
        )
      );
      toast.success('Stock updated');
      setEditItem(null);
    } catch { toast.error('Update failed'); }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Remove this item from inventory?')) return;
    try {
      await deleteInventoryItem(id);
      setInventory((prev) => prev.filter((i) => i._id !== id));
      toast.success('Item removed');
    } catch { toast.error('Delete failed'); }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status } : o));
      toast.success(`Order ${status}`);
    } catch { toast.error('Status update failed'); }
  };

  const statusColor = (s) => ({
    pending: 'badge-gold', confirmed: 'badge-blue',
    preparing: 'badge-purple', out_for_delivery: 'badge-teal',
    delivered: 'badge-teal', cancelled: 'badge-red',
  }[s] || 'badge-blue');

  if (loading) return (
    <div className="dashboard-loading">
      <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  if (!pharmacy) return (
    <>
      <div className="dashboard-no-pharmacy">
        <Package size={48} />
        <h2>No Pharmacy Found</h2>
        <p>You don't have a pharmacy registered yet.</p>
        <button className="btn-primary" onClick={() => setRegModal(true)}>Register Pharmacy</button>
      </div>
      {regModal && (
        <RegisterPharmacyModal
          onClose={() => setRegModal(false)}
          onRegistered={() => { setLoading(true); loadPharmacy(); }}
        />
      )}
    </>
  );

  return (
    <div className="dashboard page-enter">
      {/* Add Medicine Modal */}
      {addForm && (
        <AddMedicineModal
          pharmacyId={pharmacy._id}
          onClose={() => setAddForm(false)}
          onAdded={loadInventory}
        />
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <p className="section-label">Pharmacy Dashboard</p>
          <h1>{pharmacy.name}</h1>
          <p className="dashboard-addr">{pharmacy.address}</p>
        </div>
        <div className="dashboard-header-actions">
          {user.role === 'admin' && (
            <button className="btn-primary" style={{ display:'flex', alignItems:'center', gap:8 }} onClick={() => setRegModal(true)}>
              <Store size={14} /> Add Pharmacy
            </button>
          )}
          <div className="dashboard-badges">
            {pharmacy.isOpen24 && <span className="badge badge-blue">24h Open</span>}
            {pharmacy.isVerified && <span className="badge badge-teal">✓ Verified</span>}
            <span className="badge badge-gold">⭐ {pharmacy.rating}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {[
          { id: 'inventory', label: 'Inventory', icon: <Package size={15} /> },
          { id: 'orders',    label: 'Orders',    icon: <ShoppingBag size={15} /> },
          { id: 'alerts',    label: 'Alerts',    icon: <AlertTriangle size={15} />, count: alerts.length },
          { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} /> },
        ].map((t) => (
          <button
            key={t.id}
            className={`dash-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
            {t.count > 0 && <span className="tab-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Inventory tab ── */}
      {tab === 'inventory' && (
        <div className="dash-content">
          <div className="dash-toolbar">
            <h2>Stock Management</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }} onClick={loadInventory}>
                <RefreshCw size={13} /> Refresh
              </button>
              <button className="btn-primary" style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }} onClick={() => setAddForm(true)}>
                <Plus size={14} /> Add Medicine
              </button>
            </div>
          </div>

          {inventory.length === 0 ? (
            <div className="dash-empty">
              <Package size={36} />
              <p>No medicines in inventory yet. Click "+ Add Medicine" to get started.</p>
            </div>
          ) : (
            <div className="inventory-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13 }}>
                          {item.medicine?.name}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.medicine?.dosage}</div>
                      </td>
                      <td>
                        <span className="chip" style={{ fontSize:11 }}>{item.medicine?.category}</span>
                      </td>
                      <td>
                        {editItem === item._id ? (
                          <input type="number" defaultValue={item.stock} style={{ width:80 }}
                            onChange={(e) => item.editStock = e.target.value} />
                        ) : (
                          <span style={{ fontWeight:700, color: item.stock <= 10 ? 'var(--accent-gold)' : 'var(--teal-400)' }}>
                            {item.stock}
                          </span>
                        )}
                      </td>
                      <td>
                        {editItem === item._id ? (
                          <input type="number" defaultValue={item.price} style={{ width:80 }}
                            onChange={(e) => item.editPrice = e.target.value} />
                        ) : (
                          <span>₹{item.price}</span>
                        )}
                      </td>
                      <td style={{ fontSize:12 }}>
                        {item.expiry ? new Date(item.expiry).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <span className={`badge ${item.stock === 0 ? 'badge-red' : item.stock <= 10 ? 'badge-gold' : 'badge-teal'}`}>
                          {item.stock === 0 ? 'Out' : item.stock <= 10 ? 'Low' : 'OK'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          {editItem === item._id ? (
                            <>
                              <button className="icon-btn green" onClick={() => handleUpdateStock(item)}><Check size={14}/></button>
                              <button className="icon-btn" onClick={() => setEditItem(null)}><X size={14}/></button>
                            </>
                          ) : (
                            <>
                              <button className="icon-btn" onClick={() => { setEditItem(item._id); item.editStock = item.stock; item.editPrice = item.price; }}>
                                <Edit3 size={13} />
                              </button>
                              <button className="icon-btn red" onClick={() => handleDeleteItem(item._id)}><Trash2 size={13}/></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Orders tab ── */}
      {tab === 'orders' && (
        <div className="dash-content">
          <div className="dash-toolbar">
            <h2>Orders ({orders.length})</h2>
            <button className="btn-outline" style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }} onClick={loadOrders}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="dash-empty"><ShoppingBag size={36} /><p>No orders yet</p></div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-item card">
                  <div className="order-item-header">
                    <div>
                      <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className={`badge ${statusColor(order.status)}`} style={{ marginLeft:10 }}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <div className="order-item-body">
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>
                        {order.user?.name || 'Customer'}
                      </p>
                      <p style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      </p>
                      {order.deliveryAddress && (
                        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>📍 {order.deliveryAddress}</p>
                      )}
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--teal-400)' }}>
                        ₹{order.totalAmount}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{order.paymentMethod}</div>
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <div style={{ display:'flex', gap:10, marginTop:12 }}>
                      <button className="btn-primary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13 }}
                        onClick={() => handleOrderStatus(order._id, 'confirmed')}>
                        <Check size={13} /> Confirm
                      </button>
                      <button className="btn-danger" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13 }}
                        onClick={() => handleOrderStatus(order._id, 'cancelled')}>
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  )}
                  {order.status === 'confirmed' && (
                    <button className="btn-outline" style={{ marginTop:10, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13 }}
                      onClick={() => handleOrderStatus(order._id, 'out_for_delivery')}>
                      Mark Out for Delivery
                    </button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button className="btn-primary" style={{ marginTop:10, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13 }}
                      onClick={() => handleOrderStatus(order._id, 'delivered')}>
                      Mark Delivered
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Alerts tab ── */}
      {tab === 'alerts' && (
        <div className="dash-content">
          <div className="dash-toolbar">
            <h2>Low Stock Alerts</h2>
            <button className="btn-outline" style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }} onClick={loadAlerts}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          {alerts.length === 0 ? (
            <div className="dash-empty">
              <Check size={36} style={{ color:'var(--teal-400)' }} />
              <p>All inventory levels are healthy!</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((a) => (
                <div key={a._id} className={`alert-item card ${a.stock === 0 ? 'alert-critical' : 'alert-warn'}`}>
                  <AlertTriangle size={18} />
                  <div className="alert-info">
                    <div className="alert-med">{a.medicine?.name}</div>
                    <div className="alert-sub">{a.medicine?.dosage} · {a.medicine?.category}</div>
                  </div>
                  <div className="alert-stock">
                    <span style={{ color: a.stock === 0 ? 'var(--accent-red)' : 'var(--accent-gold)', fontWeight:800, fontSize:20, fontFamily:'var(--font-display)' }}>
                      {a.stock}
                    </span>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>units left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Analytics tab ── */}
      {tab === 'analytics' && (
        <div className="dash-content">
          <div className="dash-empty" style={{ paddingTop:60 }}>
            <BarChart2 size={40} style={{ color:'var(--teal-400)' }} />
            <p style={{ marginBottom:16 }}>View detailed demand analytics and trends</p>
            <a href="/analytics" className="btn-primary" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
              Open Analytics Dashboard →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
