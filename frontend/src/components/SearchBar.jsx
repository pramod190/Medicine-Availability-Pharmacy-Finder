import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { getSuggestions } from '../utils/api';
import './SearchBar.css';

export default function SearchBar({ onSearch, loading, defaultValue = '' }) {
  const [query, setQuery]         = useState(defaultValue);
  const [suggestions, setSugg]    = useState([]);
  const [showSugg, setShowSugg]   = useState(false);
  const [suggLoading, setSuggLoad]= useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setSugg([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSuggLoad(true);
      try {
        const res = await getSuggestions(query);
        setSugg(res.data);
      } catch { setSugg([]); }
      finally { setSuggLoad(false); }
    }, 300);
  }, [query]);

  const submit = (q) => {
    const val = q || query;
    if (!val.trim()) return;
    setShowSugg(false);
    onSearch(val.trim());
  };

  return (
    <div className="searchbar-wrap">
      <div className="searchbar">
        <Search size={18} className="searchbar-icon" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSugg(true); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          onFocus={() => query.length >= 2 && setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 180)}
          placeholder="Search medicines, generics, brands…"
          className="searchbar-input"
          autoComplete="off"
        />
        {query && (
          <button className="searchbar-clear" onClick={() => { setQuery(''); setSugg([]); inputRef.current?.focus(); }}>
            <X size={14} />
          </button>
        )}
        <button className="searchbar-btn btn-primary" onClick={() => submit()} disabled={loading}>
          {loading ? <span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> : 'Search'}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSugg && (query.length >= 2) && (
        <div className="suggestions">
          {suggLoading ? (
            <div className="sugg-loading"><Loader size={14} className="spin" /> Searching…</div>
          ) : suggestions.length === 0 ? (
            <div className="sugg-empty">No suggestions – press Enter to search anyway</div>
          ) : (
            suggestions.map((m) => (
              <div
                key={m._id}
                className="sugg-item"
                onMouseDown={() => { setQuery(m.name); submit(m.name); }}
              >
                <div className="sugg-name">{m.name}</div>
                <div className="sugg-meta">
                  {m.genericName && <span>{m.genericName}</span>}
                  {m.dosage && <span className="chip" style={{fontSize:10,padding:'2px 8px'}}>{m.dosage}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
