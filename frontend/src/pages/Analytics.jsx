import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { TrendingUp, Search, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';
import { getTopSearches, getDailyTrends, getLowStockReport, getAnalyticsSummary, getCategoryStats } from '../utils/api';
import './Analytics.css';

const COLORS = ['#00c896','#4f9eff','#f5c842','#ff4f6b','#9b6bff','#00e8b5','#ff8c42','#22c55e'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [topSearches, setTopSearches] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [lowStock,    setLowStock]    = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [days,        setDays]        = useState(7);

  const load = async () => {
    setLoading(true);
    try {
      const [top, daily, stock, sum, cats] = await Promise.all([
        getTopSearches(days, 10),
        getDailyTrends(days),
        getLowStockReport(),
        getAnalyticsSummary(),
        getCategoryStats(),
      ]);
      setTopSearches(Array.isArray(top.data)   ? top.data   : []);
      setDailyTrends(Array.isArray(daily.data) ? daily.data : []);
      setLowStock(Array.isArray(stock.data)    ? stock.data : []);
      setSummary(sum.data || null);
      setCategories(Array.isArray(cats.data)   ? cats.data  : []);
    } catch (err) {
      console.error('Analytics load error:', err);
      // Keep empty arrays — don't crash the page
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => { load(); }, [days]);

  const statCards = summary ? [
    { label: 'Searches Today',  value: summary.searchesToday,  icon: <Search size={20} />,       color: 'teal'   },
    { label: 'Total Searches',  value: summary.totalSearches,  icon: <TrendingUp size={20} />,   color: 'blue'   },
    { label: 'Total Orders',    value: summary.totalOrders,    icon: <ShoppingBag size={20} />,  color: 'purple' },
    { label: 'Pending Orders',  value: summary.pendingOrders,  icon: <AlertTriangle size={20}/>, color: 'gold'   },
  ] : [];

  return (
    <div className="analytics page-enter">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div>
            <p className="section-label">Demand Intelligence</p>
            <h1>Analytics Dashboard</h1>
          </div>
          <div className="analytics-controls">
            <div className="day-tabs">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  className={`day-tab ${days === d ? 'active' : ''}`}
                  onClick={() => setDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button className="btn-outline refresh-btn" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {loading && !summary ? (
          <div className="analytics-loading">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <span>Loading analytics…</span>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="stats-grid">
              {statCards.map((s) => (
                <div key={s.label} className={`stat-card card stat-${s.color}`}>
                  <div className="stat-icon">{s.icon}</div>
                  <div>
                    <div className="stat-value">{s.value?.toLocaleString()}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row 1 */}
            <div className="charts-row">
              {/* Top searches bar chart */}
              <div className="chart-card card">
                <div className="chart-header">
                  <h3>Top Searched Medicines</h3>
                  <span className="badge badge-teal">Last {days} days</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topSearches} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,150,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="medicineName" type="category" width={110} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Searches" radius={[0, 4, 4, 0]}>
                      {topSearches.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Daily trend line chart */}
              <div className="chart-card card">
                <div className="chart-header">
                  <h3>Daily Search Volume</h3>
                  <span className="badge badge-blue">Trend</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dailyTrends} margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,150,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Searches"
                      stroke="var(--teal-400)"
                      strokeWidth={2.5}
                      dot={{ fill: 'var(--teal-400)', r: 3 }}
                      activeDot={{ r: 5, fill: 'var(--teal-300)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts row 2 */}
            <div className="charts-row">
              {/* Category pie */}
              <div className="chart-card card chart-small">
                <div className="chart-header">
                  <h3>Search by Category</h3>
                  <span className="badge badge-purple">Distribution</span>
                </div>
                <div className="pie-wrap">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {categories.slice(0, 6).map((c, i) => (
                      <div key={c.category} className="pie-legend-item">
                        <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
                        <span>{c.category}</span>
                        <span className="legend-count">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Low stock table */}
              <div className="chart-card card chart-wide">
                <div className="chart-header">
                  <h3>Low Stock Alerts</h3>
                  <span className="badge badge-red">{lowStock.length} items</span>
                </div>
                {lowStock.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    ✅ All inventory levels are healthy
                  </div>
                ) : (
                  <div className="low-stock-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Pharmacy</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStock.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                                {item.medicine?.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {item.medicine?.dosage}
                              </div>
                            </td>
                            <td style={{ fontSize: 12 }}>{item.pharmacy?.name}</td>
                            <td>
                              <span style={{
                                fontWeight: 700,
                                color: item.stock === 0 ? 'var(--accent-red)' : 'var(--accent-gold)'
                              }}>
                                {item.stock}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${item.stock === 0 ? 'badge-red' : 'badge-gold'}`}>
                                {item.stock === 0 ? 'Out' : 'Low'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
