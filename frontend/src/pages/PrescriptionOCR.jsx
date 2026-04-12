import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, Loader, CheckCircle, Pill, AlertCircle, Sparkles, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './PrescriptionOCR.css';

export default function PrescriptionOCR() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [file,     setFile]    = useState(null);
  const [preview,  setPreview] = useState(null);
  const [loading,  setLoading] = useState(false);
  const [result,   setResult]  = useState(null);

  const onDrop = useCallback((accepted) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1, maxSize: 8 * 1024 * 1024,
  });

  const analyze = async () => {
    if (!user) { toast.info('Please login to use AI features'); navigate('/login'); return; }
    if (!file) { toast.warning('Upload a prescription image first'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('prescription', file);
      const res = await API.post('/ai/prescription-ocr', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.extracted);
      toast.success('Prescription analyzed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OCR failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const searchMedicine = (name) => navigate(`/?search=${encodeURIComponent(name)}`);

  return (
    <div className="ocr-page page-enter">
      <div className="ocr-container">
        {/* Header */}
        <div className="ocr-header">
          <div className="ocr-ai-badge">
            <Sparkles size={13} /> AI-Powered
          </div>
          <h1>Prescription Scanner</h1>
          <p>Upload your doctor's prescription — AI will extract all medicines automatically</p>
        </div>

        <div className="ocr-layout">
          {/* Upload area */}
          <div className="ocr-left">
            <div
              {...getRootProps()}
              className={`ocr-dropzone ${isDragActive ? 'drag' : ''} ${preview ? 'has-image' : ''}`}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="ocr-preview-wrap">
                  <img src={preview} alt="Prescription" className="ocr-preview-img" />
                  <div className="ocr-preview-overlay">
                    <p>Click or drag to replace</p>
                  </div>
                </div>
              ) : (
                <div className="ocr-placeholder">
                  <div className="ocr-upload-icon">
                    <FileImage size={36} />
                  </div>
                  <p className="ocr-drop-title">
                    {isDragActive ? 'Drop your prescription here' : 'Upload Prescription'}
                  </p>
                  <p className="ocr-drop-sub">JPG, PNG, WebP up to 8MB</p>
                  <button className="btn-outline ocr-browse-btn" type="button">
                    <Upload size={14} /> Browse File
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn-primary ocr-analyze-btn"
              onClick={analyze}
              disabled={!file || loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> Analyzing with AI…</>
              ) : (
                <><Sparkles size={16} /> Analyze Prescription</>
              )}
            </button>

            {loading && (
              <div className="ocr-progress">
                <div className="ocr-progress-steps">
                  {['Reading image…', 'Identifying medicines…', 'Extracting dosages…', 'Structuring data…'].map((s, i) => (
                    <div key={i} className="ocr-step">
                      <Loader size={12} className="spin" style={{ color: 'var(--teal-400)' }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results area */}
          <div className="ocr-right">
            {!result && !loading && (
              <div className="ocr-empty-state">
                <div className="ocr-empty-icon"><Sparkles size={32} /></div>
                <h3>AI will extract:</h3>
                <ul>
                  {['Medicine names & brands','Dosages & strengths','Frequency & duration','Special instructions','Doctor & patient info'].map((i) => (
                    <li key={i}><CheckCircle size={13} /> {i}</li>
                  ))}
                </ul>
              </div>
            )}

            {result && (
              <div className="ocr-result">
                <div className="ocr-result-header">
                  <CheckCircle size={18} style={{ color:'var(--teal-400)' }} />
                  <h3>Extraction Complete</h3>
                  <span className="badge badge-teal">{result.medicines?.length} medicines found</span>
                </div>

                {/* Patient / Doctor info */}
                {(result.patientName || result.doctorName || result.date) && (
                  <div className="ocr-meta-card">
                    {result.patientName && <div className="ocr-meta-row"><span>Patient</span><strong>{result.patientName}</strong></div>}
                    {result.doctorName  && <div className="ocr-meta-row"><span>Doctor</span><strong>{result.doctorName}</strong></div>}
                    {result.date        && <div className="ocr-meta-row"><span>Date</span><strong>{result.date}</strong></div>}
                  </div>
                )}

                {/* Medicines list */}
                <div className="ocr-medicines">
                  {result.medicines?.map((med, i) => (
                    <div key={i} className="ocr-med-card">
                      <div className="ocr-med-header">
                        <div className="ocr-med-icon"><Pill size={14} /></div>
                        <div className="ocr-med-name">{med.name}</div>
                        {med.dosage && <span className="chip" style={{fontSize:11}}>{med.dosage}</span>}
                      </div>
                      <div className="ocr-med-details">
                        {med.frequency    && <div className="ocr-med-detail"><span>Frequency</span>{med.frequency}</div>}
                        {med.duration     && <div className="ocr-med-detail"><span>Duration</span>{med.duration}</div>}
                        {med.instructions && (
                          <div className="ocr-med-detail instruction">
                            <AlertCircle size={11} />{med.instructions}
                          </div>
                        )}
                      </div>
                      <button
                        className="ocr-search-btn btn-outline"
                        onClick={() => searchMedicine(med.name)}
                      >
                        <Search size={13} /> Find in Pharmacies
                      </button>
                    </div>
                  ))}
                </div>

                {result.notes && (
                  <div className="ocr-notes">
                    <AlertCircle size={13} />
                    <span>{result.notes}</span>
                  </div>
                )}

                <button
                  className="btn-primary ocr-find-all-btn"
                  onClick={() => result.medicines?.[0] && searchMedicine(result.medicines[0].name)}
                >
                  <Search size={15} /> Find All Medicines Nearby
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
