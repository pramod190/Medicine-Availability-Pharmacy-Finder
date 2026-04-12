import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Pill, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import './MediBot.css';

const STARTER_QUESTIONS = [
  { icon: '🤒', text: 'What can I take for fever and headache?' },
  { icon: '💊', text: 'What is the correct dosage of Metformin 500mg?' },
  { icon: '⚠️', text: 'Can I take Paracetamol and Ibuprofen together?' },
  { icon: '🌙', text: 'Which antihistamines are safe to take at night?' },
  { icon: '🍽️', text: 'Should I take Pantoprazole before or after meals?' },
  { icon: '📋', text: 'What are common side effects of Azithromycin?' },
];

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  );
}

// Lightweight markdown renderer: bold, bullets, line-breaks
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold: **text** or *text*
    const parts = line.split(/(\*{1,2}[^*]+\*{1,2})/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={j}>{part.slice(1, -1)}</em>;
      return part;
    });
    // Bullet lines
    const trimmed = line.trimStart();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return <div key={i} style={{ display:'flex', gap:6, marginBottom:2 }}><span style={{color:'var(--teal-400)',flexShrink:0}}>•</span><span>{rendered}</span></div>;
    }
    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      return <div key={i} style={{ marginBottom:2 }}>{rendered}</div>;
    }
    // Empty line → spacing
    if (!line.trim()) return <div key={i} style={{ height:6 }} />;
    return <div key={i}>{rendered}</div>;
  });
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`chat-msg ${isBot ? 'bot' : 'user'}`}>
      <div className={`chat-avatar ${isBot ? 'bot' : 'user'}`}>
        {isBot ? <Bot size={15} /> : <User size={15} />}
      </div>
      <div className={`chat-bubble ${isBot ? 'bot' : 'user'}`}>
        {msg.streaming ? (
          <>
            {msg.content && <div className="chat-text" style={{whiteSpace:'pre-wrap'}}>{renderMarkdown(msg.content)}</div>}
            <TypingDots />
          </>
        ) : (
          <div className="chat-text" style={{whiteSpace:'pre-wrap'}}>{isBot ? renderMarkdown(msg.content) : msg.content}</div>
        )}
        {msg.timestamp && (
          <div className="chat-time">
            {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediBot() {
  const [messages,  setMessages]  = useState([
    {
      role:      'assistant',
      content:   "Hi! I'm MediBot 👋 — your AI pharmacy assistant powered by Gemini.\n\nI can help you with medicine information, dosages, side effects, and answer questions about your prescriptions. What would you like to know?",
      timestamp: Date.now(),
    },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, timestamp: Date.now() };
    const history  = messages.filter((m) => !m.streaming);

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Add streaming placeholder
    const botId = Date.now();
    setMessages((prev) => [...prev, { id: botId, role: 'assistant', content: '', streaming: true, timestamp: botId }]);

    const clearStreaming = (content) =>
      setMessages((prev) =>
        prev.map((m) => m.id === botId ? { ...m, streaming: false, ...(content ? { content } : {}) } : m)
      );

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({
          message: msg,
          history: history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error(`Chat request failed (${response.status})`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let doneReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let data;
          try { data = JSON.parse(line.slice(6)); }
          catch { continue; } // skip malformed SSE lines only

          if (data.error) throw new Error(data.error);

          if (data.text) {
            accumulated += data.text;
            setMessages((prev) =>
              prev.map((m) => m.id === botId ? { ...m, content: accumulated } : m)
            );
          }

          if (data.done) {
            doneReceived = true;
            setMessages((prev) =>
              prev.map((m) => m.id === botId ? { ...m, streaming: false } : m)
            );
          }
        }
      }

      // Safety: if server closed without sending done event
      if (!doneReceived) {
        setMessages((prev) =>
          prev.map((m) => m.id === botId ? { ...m, streaming: false } : m)
        );
      }
    } catch (err) {
      clearStreaming('Sorry, I encountered an error. Please check your connection and try again.');
      toast.error(err.message?.includes('401') ? 'Please log in again' : 'Chat failed — ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      // Guarantee streaming is cleared even if something unexpected happened
      setMessages((prev) =>
        prev.map((m) => m.id === botId && m.streaming ? { ...m, streaming: false } : m)
      );
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! I'm MediBot — ask me anything about medicines.",
      timestamp: Date.now(),
    }]);
  };

  return (
    <div className="medibot-page page-enter">
      {/* Sidebar */}
      <div className="medibot-sidebar">
        <div className="medibot-brand">
          <div className="medibot-logo"><Sparkles size={18} /></div>
          <div>
            <div className="medibot-brand-name">MediBot</div>
            <div className="medibot-brand-sub">AI Pharmacy Assistant</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        <div className="starter-section">
          <p className="starter-label"><HelpCircle size={12} /> Quick Questions</p>
          {STARTER_QUESTIONS.map((q, i) => (
            <button key={i} className="starter-btn" onClick={() => sendMessage(q.text)} disabled={loading}>
              <span className="starter-icon">{q.icon}</span>
              <span>{q.text}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="medibot-capabilities">
          <p className="starter-label">I can help with</p>
          {[
            { icon: <Pill size={13} />, text: 'Medicine information' },
            { icon: <AlertTriangle size={13} />, text: 'Side effects & warnings' },
            { icon: <TrendingUp size={13} />, text: 'Dosage guidance' },
            { icon: <RefreshCw size={13} />, text: 'Generic alternatives' },
          ].map((c, i) => (
            <div key={i} className="capability-item">
              {c.icon}<span>{c.text}</span>
            </div>
          ))}
        </div>

        <button className="clear-chat-btn" onClick={clearChat}>
          <RefreshCw size={13} /> Clear Chat
        </button>

        <div className="medibot-disclaimer">
          <AlertTriangle size={11} />
          MediBot provides general information only. Always consult a doctor for medical decisions.
        </div>
      </div>

      {/* Chat area */}
      <div className="medibot-chat">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <div className="chat-input-wrap">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about any medicine, dosage, side effects…"
              disabled={loading}
              className="chat-input"
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              {loading
                ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} />
                : <Send size={16} />
              }
            </button>
          </div>
          <p className="chat-hint">Powered by Gemini · Press Enter to send</p>
        </div>
      </div>
    </div>
  );
}
