import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import './MediBot.css';

const EDGE_TEST_CASES = [
  {
    label: 'Missing dosage information',
    text: 'I have a prescription for Amoxicillin. What dosage should I take if it is for a child?',
  },
  {
    label: 'Multiple interactions',
    text: 'Can I safely take Aspirin, Warfarin, and Ibuprofen together?',
  },
  {
    label: 'Unknown medicine name',
    text: 'I found a medicine called "Xalafi" in my cabinet. Is it safe and what is it for?',
  },
  {
    label: 'Pregnancy safety',
    text: 'I am 6 months pregnant and have a headache. Which pain relievers are safest?',
  },
  {
    label: 'Prescription shorthand',
    text: 'Rx: Tab. Metformin 500mg BD after food. What does BD mean and when should I take this?',
  },
  {
    label: 'Allergy alert',
    text: 'I am allergic to penicillin. Which antibiotics should I avoid if I need a throat infection treatment?',
  },
  {
    label: 'High-risk dosage',
    text: 'Is 1200mg of Acetaminophen in one day too much for an adult?',
  },
  {
    label: 'Expired medication',
    text: 'Can I take expired Cetirizine tablets from last year if I need allergy relief?',
  },
];

function TypingDots() {
  return (
    <div className="typing-dots">
      <span />
      <span />
      <span />
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*{1,2}[^*]+\*{1,2})/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={j}>{part.slice(1, -1)}</em>;
      return part;
    });

    const trimmed = line.trimStart();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={i} style={{ display:'flex', gap:6, marginBottom:2 }}>
          <span style={{ color:'var(--teal-400)', flexShrink:0 }}>•</span>
          <span>{rendered}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      return <div key={i} style={{ marginBottom:2 }}>{rendered}</div>;
    }

    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
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
            {msg.content && <div className="chat-text" style={{ whiteSpace: 'pre-wrap' }}>{renderMarkdown(msg.content)}</div>}
            <TypingDots />
          </>
        ) : (
          <div className="chat-text" style={{ whiteSpace: 'pre-wrap' }}>{isBot ? renderMarkdown(msg.content) : msg.content}</div>
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

export default function AIDemo() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to the AI Demo agent! This demo is built to test edge cases for medicine chat behavior. Select a test case or type your own question to see how the agent responds.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addUserMessage = (text) => {
    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    return userMsg;
  };

  const sendMessage = async (text) => {
    const query = (text || input).trim();
    if (!query || loading) return;
    setInput('');
    const userMsg = addUserMessage(query);
    const history = messages.filter((item) => !item.streaming);

    setLoading(true);
    const botId = Date.now();
    setMessages((prev) => [...prev, { id: botId, role: 'assistant', content: '', streaming: true, timestamp: botId }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          message: query,
          history: history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error(`Chat request failed (${response.status})`);
      const reader = response.body.getReader();
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
          try { data = JSON.parse(line.slice(6)); } catch { continue; }
          if (data.error) throw new Error(data.error);
          if (data.text) {
            accumulated += data.text;
            setMessages((prev) => prev.map((msg) => msg.id === botId ? { ...msg, content: accumulated } : msg));
          }
          if (data.done) {
            doneReceived = true;
            setMessages((prev) => prev.map((msg) => msg.id === botId ? { ...msg, streaming: false } : msg));
          }
        }
      }

      if (!doneReceived) {
        setMessages((prev) => prev.map((msg) => msg.id === botId ? { ...msg, streaming: false } : msg));
      }
    } catch (err) {
      setMessages((prev) => prev.map((msg) => msg.id === botId ? { ...msg, streaming: false, content: 'Sorry, there was an error processing the demo. Please retry.' } : msg));
      toast.error(err.message?.includes('401') ? 'Please log in again' : `Demo request failed: ${err.message || 'unknown error'}`);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleTestCase = (text) => sendMessage(text);

  return (
    <div className="medibot-page page-enter">
      <div className="medibot-sidebar">
        <div className="medibot-brand">
          <div className="medibot-logo"><Sparkles size={18} /></div>
          <div>
            <div className="medibot-brand-name">AI Edge Demo</div>
            <div className="medibot-brand-sub">New tab demo for edge case testing</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        <div className="starter-section">
          <p className="starter-label"><HelpCircle size={12} /> Edge Test Cases</p>
          {EDGE_TEST_CASES.map((test, index) => (
            <button
              key={index}
              className="starter-btn"
              onClick={() => handleTestCase(test.text)}
              disabled={loading}
            >
              <span className="starter-icon">{index + 1}</span>
              <span>{test.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-divider" />

        <div className="medibot-capabilities">
          <p className="starter-label">What this demo covers</p>
          {[
            'Missing or ambiguous dosage',
            'Drug interaction warnings',
            'Unknown medicine names',
            'Allergy and pregnancy safety',
            'Expired medication guidance',
          ].map((text, idx) => (
            <div key={idx} className="capability-item">
              <span style={{ marginRight: 8 }}>•</span><span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="medibot-chat">
        <div className="chat-messages">
          {messages.map((msg, idx) => <Message key={idx} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <div className="chat-input-wrap">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type an edge case question or paste prescription shorthand..."
              disabled={loading}
              className="chat-input"
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Send size={16} />}
            </button>
          </div>
          <p className="chat-hint">Use the edge cases above or try your own pharmacy question.</p>
        </div>
      </div>
    </div>
  );
}
