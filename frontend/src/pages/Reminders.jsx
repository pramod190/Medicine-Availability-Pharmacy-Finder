import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Reminders.css';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily', 'Every 6 hours', 'Weekly', 'As needed'];
const TIMES = ['06:00 AM','07:00 AM','08:00 AM','09:00 AM','12:00 PM','02:00 PM','06:00 PM','08:00 PM','10:00 PM'];

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [adding, setAdding]       = useState(false);
  const [form, setF]              = useState({ medicine:'', dose:'', time:'08:00 AM', frequency:'Once daily' });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    API.get('/auth/profile')
      .then((r) => setReminders(r.data.reminders || []))
      .catch(() => {});
  }, []);

  const save = async (updated) => {
    setSaving(true);
    try {
      const res = await API.put('/auth/reminders', { reminders: updated });
      setReminders(res.data);
      toast.success('Reminders saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const addReminder = () => {
    if (!form.medicine.trim()) { toast.warning('Enter a medicine name'); return; }
    const updated = [...reminders, { ...form, active: true }];
    save(updated);
    setAdding(false);
    setF({ medicine:'', dose:'', time:'08:00 AM', frequency:'Once daily' });
  };

  const toggleReminder = (i) => {
    const updated = reminders.map((r, idx) => idx === i ? { ...r, active: !r.active } : r);
    save(updated);
  };

  const deleteReminder = (i) => {
    const updated = reminders.filter((_, idx) => idx !== i);
    save(updated);
  };

  return (
    <div className="reminders-page page-enter">
      <div className="reminders-container">
        <div className="reminders-header">
          <div>
            <p className="section-label">Health Management</p>
            <h1>Medicine Reminders</h1>
            <p className="reminders-sub">Never miss a dose with scheduled alerts</p>
          </div>
          <button className="btn-primary" onClick={() => setAdding(true)} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Plus size={16} /> Add Reminder
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="add-reminder-card card">
            <h3 className="add-title">New Reminder</h3>
            <div className="add-form">
              <div className="add-row">
                <div className="auth-field" style={{ flex:2 }}>
                  <label>Medicine Name</label>
                  <input value={form.medicine} onChange={(e) => setF({ ...form, medicine: e.target.value })}
                    placeholder="e.g. Metformin 500mg" />
                </div>
                <div className="auth-field" style={{ flex:1 }}>
                  <label>Dose</label>
                  <input value={form.dose} onChange={(e) => setF({ ...form, dose: e.target.value })}
                    placeholder="e.g. 1 tablet" />
                </div>
              </div>
              <div className="add-row">
                <div className="auth-field" style={{ flex:1 }}>
                  <label>Time</label>
                  <select value={form.time} onChange={(e) => setF({ ...form, time: e.target.value })}>
                    {TIMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="auth-field" style={{ flex:1 }}>
                  <label>Frequency</label>
                  <select value={form.frequency} onChange={(e) => setF({ ...form, frequency: e.target.value })}>
                    {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn-primary" onClick={addReminder} disabled={saving}
                  style={{ display:'flex', alignItems:'center', gap:7, fontSize:14 }}>
                  {saving ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : <><CheckCircle size={14}/> Save Reminder</>}
                </button>
                <button className="btn-outline" onClick={() => setAdding(false)} style={{fontSize:14}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Reminders list */}
        {reminders.length === 0 && !adding ? (
          <div className="reminders-empty">
            <Bell size={48} />
            <h2>No reminders set</h2>
            <p>Add your first medicine reminder to stay on track</p>
          </div>
        ) : (
          <div className="reminders-list">
            {reminders.map((r, i) => (
              <div key={i} className={`reminder-card card ${!r.active ? 'inactive' : ''}`}>
                <div className="reminder-left">
                  <div className="reminder-icon">
                    <Bell size={16} style={{ color: r.active ? 'var(--teal-400)' : 'var(--text-muted)' }} />
                  </div>
                  <div className="reminder-info">
                    <div className="reminder-name">{r.medicine}</div>
                    {r.dose && <div className="reminder-dose">{r.dose}</div>}
                    <div className="reminder-schedule">
                      <span><Clock size={11} /> {r.time}</span>
                      <span>· {r.frequency}</span>
                    </div>
                  </div>
                </div>
                <div className="reminder-right">
                  <label className="toggle-switch" title={r.active ? 'Disable' : 'Enable'}>
                    <input type="checkbox" checked={!!r.active} onChange={() => toggleReminder(i)} />
                    <span className="toggle-slider" />
                  </label>
                  <button className="icon-btn red" onClick={() => deleteReminder(i)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
