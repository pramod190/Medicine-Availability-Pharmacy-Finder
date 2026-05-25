import { Link } from 'react-router-dom';
import { Bot, FileImage, RefreshCw, FlaskConical, Sparkles, ArrowRight, Zap, HelpCircle } from 'lucide-react';
import './AIHub.css';

const AI_FEATURES = [
  {
    icon:    <Bot size={28} />,
    title:   'MediBot',
    tagline: 'AI Pharmacy Chatbot',
    desc:    'Ask anything about medicines. Get instant AI-powered answers on dosages, side effects, usage, and more — powered by Claude.',
    link:    '/medibot',
    color:   'purple',
    badge:   'Most Popular',
    example: '"What can I take for a fever with body ache?"',
  },
  {
    icon:    <FileImage size={28} />,
    title:   'Prescription Scanner',
    tagline: 'AI Vision OCR',
    desc:    'Upload any doctor prescription image. Claude reads and extracts all medicine names, dosages, and instructions — no typing needed.',
    link:    '/prescription',
    color:   'teal',
    badge:   'Vision AI',
    example: '"Scan my prescription → auto-fill medicines"',
  },
  {
    icon:    <RefreshCw size={28} />,
    title:   'Substitute Engine',
    tagline: 'Smart Alternatives',
    desc:    'Medicine out of stock or too expensive? AI suggests the best clinical substitutes considering dosage equivalence and availability.',
    link:    '/substitutes',
    color:   'blue',
    badge:   'Clinical AI',
    example: '"Crocin 650 is unavailable — what else can I use?"',
  },
  {
    icon:    <FlaskConical size={28} />,
    title:   'Interaction Checker',
    tagline: 'Drug Safety AI',
    desc:    'Enter multiple medicines and AI analyzes every combination for dangerous interactions, mechanisms, and management advice.',
    link:    '/interactions',
    color:   'red',
    badge:   'Safety Critical',
    example: '"Is it safe to take Aspirin + Warfarin + Metformin?"',
  },  {
    icon:    <HelpCircle size={28} />,
    title:   'AI Demo',
    tagline: 'Edge Case Agent',
    desc:    'Open the AI edge-case demo in a new tab to test tricky pharmacy questions and failure modes.',
    link:    '/ai-demo',
    color:   'purple',
    badge:   'New Tab',
    example: '"I am allergic to penicillin — what antibiotics are safe?"',
    newTab:  true,
  },];

const COLOR_MAP = {
  purple: { bg: 'rgba(155,107,255,0.1)', border: 'rgba(155,107,255,0.25)', icon: 'rgba(155,107,255,0.15)', color: 'var(--accent-purple)' },
  teal:   { bg: 'rgba(0,200,150,0.08)',  border: 'rgba(0,200,150,0.2)',    icon: 'rgba(0,200,150,0.15)',   color: 'var(--teal-400)'       },
  blue:   { bg: 'rgba(79,158,255,0.08)', border: 'rgba(79,158,255,0.2)',   icon: 'rgba(79,158,255,0.15)',  color: 'var(--accent-blue)'    },
  red:    { bg: 'rgba(255,79,107,0.08)', border: 'rgba(255,79,107,0.2)',   icon: 'rgba(255,79,107,0.15)',  color: 'var(--accent-red)'     },
};

export default function AIHub() {
  return (
    <div className="aihub page-enter">
      {/* Hero */}
      <section className="aihub-hero">
        <div className="aihub-hero-glow" />
        <div className="aihub-hero-content">
          <div className="aihub-badge">
            <Sparkles size={14} /> Powered by Claude AI
          </div>
          <h1 className="aihub-title">
            AI-Powered<br />
            <span className="aihub-title-gradient">Healthcare Tools</span>
          </h1>
          <p className="aihub-subtitle">
            Four intelligent tools built with Anthropic's Claude — from chatting with a virtual pharmacist
            to scanning prescriptions with computer vision.
          </p>
          <div className="aihub-stats">
            <div className="aihub-stat"><span>Claude</span><p>AI Engine</p></div>
            <div className="aihub-stat-divider" />
            <div className="aihub-stat"><span>4</span><p>AI Tools</p></div>
            <div className="aihub-stat-divider" />
            <div className="aihub-stat"><span>Real-time</span><p>Streaming</p></div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="aihub-features">
        <div className="aihub-features-container">
          {AI_FEATURES.map((f) => {
            const c = COLOR_MAP[f.color];
            return (
              <div
                key={f.title}
                className="aihub-card"
                style={{ '--card-color': c.color, '--card-border': c.border, '--card-bg': c.bg, '--card-icon-bg': c.icon }}
              >
                <div className="aihub-card-top">
                  <div className="aihub-card-icon">{f.icon}</div>
                  <span className="aihub-card-badge">{f.badge}</span>
                </div>
                <div className="aihub-card-body">
                  <div className="aihub-card-tagline">{f.tagline}</div>
                  <h2 className="aihub-card-title">{f.title}</h2>
                  <p className="aihub-card-desc">{f.desc}</p>
                  <div className="aihub-card-example">
                    <Zap size={11} />
                    <em>{f.example}</em>
                  </div>
                </div>
                {f.newTab ? (
                  <a href={f.link} target="_blank" rel="noreferrer" className="aihub-card-btn">
                    Launch {f.title} <ArrowRight size={15} />
                  </a>
                ) : (
                  <Link to={f.link} className="aihub-card-btn">
                    Launch {f.title} <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="aihub-how">
        <div className="aihub-how-container">
          <h2 className="aihub-how-title">How the AI works</h2>
          <div className="aihub-how-grid">
            {[
              { step: '01', icon: '🧠', title: 'Claude AI Backend', desc: 'All features call Anthropic\'s Claude API directly from your backend with structured prompts designed for clinical accuracy.' },
              { step: '02', icon: '👁️', title: 'Vision for OCR',    desc: 'Prescription scanning uses Claude\'s vision capability to read handwritten and printed prescriptions with high accuracy.' },
              { step: '03', icon: '⚡', title: 'Streaming Responses', desc: 'MediBot streams responses token-by-token using Server-Sent Events so answers appear instantly as they\'re generated.' },
              { step: '04', icon: '🔒', title: 'Safe & Responsible', desc: 'All AI responses include appropriate medical disclaimers and recommend consulting healthcare professionals for critical decisions.' },
            ].map((h) => (
              <div key={h.step} className="aihub-how-card card">
                <div className="aihub-how-step">{h.step}</div>
                <div className="aihub-how-icon">{h.icon}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
