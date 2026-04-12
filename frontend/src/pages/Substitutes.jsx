import { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle, Info, ChevronRight, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './Substitutes.css';

const REASONS = ['Out of stock', 'Too expensive', 'Allergic reaction', 'Not available locally', 'Doctor recommended change'];
const RISK_COLORS = { safe: 'teal', moderate: 'gold', severe: 'red', unknown: 'blue' };

export default function Substitutes() {
  const navigate = useNavigate();
  const [medicine,   setMedicine]   = useState('');
  const [reason,     setReason]     = useState('Out of stock');
  const [patientInfo,setPatientInfo]= useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);

  const analyze = async () => {
    if (!medicine.trim()) { toast.warning('Enter a medicine name'); return; }
    setLoading(true);
    try {
      const res = await API.post('/ai/substitutes', {
        medicineName: medicine.trim(),
        reason,
        patientInfo: patientInfo.trim(),
      });
      setResult(res.data);
      toast.success('AI analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const availabilityColor = (a = '') => {
    if (a.toLowerCase().includes('otc') || a.toLowerCase().includes('commonly')) return 'teal';
    if (a.toLowerCase().includes('prescription')) return 'gold';
    return 'blue';
  };

  return (
    <div className="subs-page page-enter">
      <div className="subs-container">
        {/* Header */}
        <div className="subs-header">
          <div className="ai-feature-badge purple">
            <Sparkles size={13} /> AI Substitute Engine
          </div>
          <h1>Smart Medicine Substitutes</h1>
          <p>Can't find your medicine? AI recommends the best clinical alternatives</p>
        </div>

        {/* Input form */}
        <div className="subs-form card">
          <div className="subs-form-grid">
            <div className="form-group">
              <label>Medicine you need a substitute for</label>
              <input
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                placeholder="e.g. Crocin 650, Metformin 500mg…"
              />
            </div>
            <div className="form-group">
              <label>Why do you need a substitute?</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Patient context <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(optional — helps AI give better suggestions)</span></label>
            <input
              value={patientInfo}
              onChange={(e) => setPatientInfo(e.target.value)}
              placeholder="e.g. diabetic patient, allergic to penicillin, elderly, pregnancy…"
            />
          </div>
          <button className="btn-primary subs-analyze-btn" onClick={analyze} disabled={loading}>
            {loading
              ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Analyzing…</>
              : <><Sparkles size={16}/> Find Substitutes</>
            }
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="subs-results">
            {/* Summary bar */}
            <div className="subs-summary card">
              <div className="subs-summary-left">
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>Substitutes for</span>
                <span className="subs-orig-name">{result.originalMedicine}</span>
                <span className="badge badge-blue">{result.reason}</span>
              </div>
              {result.consultDoctor && (
                <div className="subs-consult-warn">
                  <AlertTriangle size={14} />
                  Consult your doctor before switching
                </div>
              )}
            </div>

            {/* General advice */}
            {result.generalAdvice && (
              <div className="subs-advice">
                <Info size={15} style={{ flexShrink:0 }} />
                <p>{result.generalAdvice}</p>
              </div>
            )}

            {/* Substitute cards */}
            <div className="subs-grid">
              {result.substitutes?.map((sub, i) => (
                <div key={i} className={`sub-card card ${sub.avoidCombination ? 'sub-warn' : ''}`}>
                  <div className="sub-rank">#{i + 1}</div>
                  <div className="sub-header">
                    <div className="sub-name">{sub.name}</div>
                    {sub.genericName && <div className="sub-generic">{sub.genericName}</div>}
                  </div>

                  <div className="sub-badges">
                    <span className={`badge badge-${availabilityColor(sub.availability)}`}>
                      {sub.availability}
                    </span>
                    {sub.sameClass && (
                      <span className="badge badge-teal">Same Drug Class</span>
                    )}
                    {sub.equivalentDose && (
                      <span className="chip" style={{fontSize:11}}>{sub.equivalentDose}</span>
                    )}
                  </div>

                  {sub.notes && (
                    <p className="sub-notes">
                      <CheckCircle size={12} style={{ color:'var(--teal-400)', flexShrink:0 }} />
                      {sub.notes}
                    </p>
                  )}
                  {sub.cautions && (
                    <p className="sub-caution">
                      <AlertTriangle size={12} style={{ flexShrink:0 }} />
                      {sub.cautions}
                    </p>
                  )}

                  <button
                    className="btn-outline sub-find-btn"
                    onClick={() => navigate(`/?search=${encodeURIComponent(sub.name.split(' ')[0])}`)}
                  >
                    <Search size={13} /> Find in Pharmacies <ChevronRight size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn-outline subs-reset-btn" onClick={() => setResult(null)}>
              <RefreshCw size={14} /> Try Another Medicine
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
