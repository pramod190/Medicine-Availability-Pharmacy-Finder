import { useState } from 'react';
import { Sparkles, Plus, X, AlertTriangle, CheckCircle, Zap, Shield, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../utils/api';
import './InteractionChecker.css';

const RISK_CONFIG = {
  safe:     { color: 'var(--teal-400)',    bg: 'rgba(0,200,150,0.1)',   label: 'Safe Combination',   icon: <CheckCircle size={18} /> },
  moderate: { color: 'var(--accent-gold)', bg: 'rgba(245,200,66,0.1)',  label: 'Moderate Risk',       icon: <AlertTriangle size={18} /> },
  severe:   { color: 'var(--accent-red)',  bg: 'rgba(255,79,107,0.1)',  label: 'Severe Interaction',  icon: <Zap size={18} /> },
  unknown:  { color: 'var(--accent-blue)', bg: 'rgba(79,158,255,0.1)',  label: 'Unknown — Check',     icon: <Info size={18} /> },
};

const SEVERITY_BADGE = {
  mild:     'badge-teal',
  moderate: 'badge-gold',
  severe:   'badge-red',
};

const COMMON_COMBOS = [
  ['Aspirin', 'Warfarin'],
  ['Metformin', 'Alcohol'],
  ['Paracetamol', 'Ibuprofen', 'Aspirin'],
  ['Amlodipine', 'Atorvastatin'],
  ['Azithromycin', 'Cetirizine'],
];

export default function InteractionChecker() {
  const [medicines,  setMedicines]  = useState(['', '']);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [expanded,   setExpanded]   = useState({});

  const updateMed = (i, val) => setMedicines((prev) => prev.map((m, idx) => idx === i ? val : m));
  const addMed    = () => medicines.length < 10 && setMedicines((p) => [...p, '']);
  const removeMed = (i) => medicines.length > 2 && setMedicines((p) => p.filter((_, idx) => idx !== i));

  const check = async () => {
    const filled = medicines.filter((m) => m.trim());
    if (filled.length < 2) { toast.warning('Enter at least 2 medicines'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await API.post('/ai/interactions', { medicines: filled });
      setResult(res.data);
      toast.success('Interaction analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const loadCombo = (combo) => {
    setMedicines([...combo, ...Array(Math.max(0, 2 - combo.length)).fill('')]);
    setResult(null);
  };

  const riskCfg = result ? (RISK_CONFIG[result.overallRisk] || RISK_CONFIG.unknown) : null;

  return (
    <div className="interact-page page-enter">
      <div className="interact-container">
        {/* Header */}
        <div className="interact-header">
          <div className="ai-feature-badge red">
            <Shield size={13} /> AI Interaction Checker
          </div>
          <h1>Drug Interaction Checker</h1>
          <p>Add multiple medicines — AI checks every combination for dangerous interactions</p>
        </div>

        <div className="interact-layout">
          {/* Input panel */}
          <div className="interact-input-panel card">
            <div className="interact-panel-title">Enter Medicines</div>

            <div className="med-inputs">
              {medicines.map((med, i) => (
                <div key={i} className="med-input-row">
                  <div className="med-input-num">{i + 1}</div>
                  <input
                    value={med}
                    onChange={(e) => updateMed(i, e.target.value)}
                    placeholder={`Medicine ${i + 1}…`}
                    onKeyDown={(e) => e.key === 'Enter' && i === medicines.length - 1 && addMed()}
                  />
                  {medicines.length > 2 && (
                    <button className="med-remove-btn" onClick={() => removeMed(i)}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button className="add-med-btn" onClick={addMed} disabled={medicines.length >= 10}>
              <Plus size={14} /> Add Medicine
            </button>

            <div className="divider" />

            {/* Common combos */}
            <div>
              <p className="interact-combos-label">Try common combinations:</p>
              <div className="interact-combos">
                {COMMON_COMBOS.map((combo, i) => (
                  <button key={i} className="combo-chip" onClick={() => loadCombo(combo)}>
                    {combo.join(' + ')}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary interact-check-btn" onClick={check} disabled={loading}>
              {loading
                ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Checking…</>
                : <><Shield size={16}/> Check Interactions</>
              }
            </button>
          </div>

          {/* Results panel */}
          <div className="interact-results-panel">
            {!result && !loading && (
              <div className="interact-empty card">
                <Shield size={44} style={{ color:'var(--text-muted)', marginBottom:16 }} />
                <h3>How it works</h3>
                <ol>
                  <li>Enter 2 or more medicines</li>
                  <li>AI checks all pair combinations</li>
                  <li>See severity ratings and recommendations</li>
                  <li>Get management advice for each interaction</li>
                </ol>
                <div className="interact-legend">
                  {Object.entries(RISK_CONFIG).map(([k, v]) => (
                    <div key={k} className="legend-row">
                      <span style={{ color: v.color }}>{v.icon}</span>
                      <span>{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="interact-loading card">
                <span className="spinner" style={{ width:36,height:36,borderWidth:3 }} />
                <p>AI is analyzing drug interactions…</p>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>Checking all combinations</span>
              </div>
            )}

            {result && riskCfg && (
              <div className="interact-result-wrap">
                {/* Overall risk banner */}
                <div
                  className="risk-banner"
                  style={{ background: riskCfg.bg, borderColor: riskCfg.color + '40' }}
                >
                  <div className="risk-banner-left" style={{ color: riskCfg.color }}>
                    {riskCfg.icon}
                    <div>
                      <div className="risk-label">{riskCfg.label}</div>
                      <div className="risk-summary">{result.summary}</div>
                    </div>
                  </div>
                  {result.consultDoctorUrgently && (
                    <div className="risk-urgent">
                      <AlertTriangle size={14} /> See doctor urgently
                    </div>
                  )}
                </div>

                {/* Interactions list */}
                {result.interactions?.length > 0 && (
                  <div className="interactions-section">
                    <h3 className="interact-section-title">
                      ⚠️ Interactions Found ({result.interactions.length})
                    </h3>
                    {result.interactions.map((inter, i) => (
                      <div key={i} className="interaction-card card">
                        <div
                          className="interaction-header"
                          onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
                        >
                          <div className="interaction-drugs">
                            {inter.drugs.map((d, j) => (
                              <span key={j} className="drug-tag">
                                {d}
                                {j < inter.drugs.length - 1 && <span className="drug-plus">+</span>}
                              </span>
                            ))}
                          </div>
                          <div className="interaction-right">
                            <span className={`badge ${SEVERITY_BADGE[inter.severity] || 'badge-blue'}`}>
                              {inter.severity}
                            </span>
                            {inter.avoidCombination && (
                              <span className="badge badge-red">Avoid</span>
                            )}
                            {expanded[i] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </div>
                        </div>
                        {expanded[i] && (
                          <div className="interaction-detail">
                            <div className="interaction-row">
                              <span>What happens</span>
                              <p>{inter.description}</p>
                            </div>
                            {inter.mechanism && (
                              <div className="interaction-row">
                                <span>Mechanism</span>
                                <p>{inter.mechanism}</p>
                              </div>
                            )}
                            <div className="interaction-row management">
                              <span>Management</span>
                              <p>{inter.management}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Safe combos */}
                {result.safeToTakeTogether?.length > 0 && (
                  <div className="safe-section">
                    <h3 className="interact-section-title">
                      ✅ Safe Combinations
                    </h3>
                    {result.safeToTakeTogether.map((s, i) => (
                      <div key={i} className="safe-item">
                        <CheckCircle size={14} style={{ color:'var(--teal-400)', flexShrink:0 }} />
                        <span className="safe-drugs">{s.drugs.join(' + ')}</span>
                        {s.note && <span className="safe-note">— {s.note}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div className="recommendations card">
                    <h3 className="interact-section-title" style={{ marginBottom:12 }}>
                      💡 Recommendations
                    </h3>
                    <ul className="rec-list">
                      {result.recommendations.map((r, i) => (
                        <li key={i}><ChevronUp size={12} style={{ transform:'rotate(90deg)' }} />{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
