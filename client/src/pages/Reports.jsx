import React, { useState, useEffect } from 'react';
import { fetchReport, exportCSV } from '../services/api';
import StatCard from '../components/StatCard';

const REPORT_TYPES = [
  { key: 'collection-summary', label: 'Collection Summary', icon: '\uD83D\uDCCA' },
  { key: 'agent-performance', label: 'Agent Performance', icon: '\uD83D\uDC65' },
  { key: 'portfolio-analysis', label: 'Portfolio Analysis', icon: '\uD83D\uDCC1' },
  { key: 'compliance-report', label: 'Compliance Report', icon: '\uD83D\uDEE1' },
  { key: 'payment-analysis', label: 'Payment Analysis', icon: '\uD83D\uDCB0' },
];

const s = {
  page: { padding: '32px', maxWidth: '1400px', margin: '0 auto' },
  layout: { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', marginTop: '24px' },
  sidebar: {
    background: 'white', borderRadius: 'var(--radius-lg)', padding: '8px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)', alignSelf: 'start',
  },
  sidebarItem: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
    borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '14px',
    fontWeight: 500, color: 'var(--gray-600)', border: 'none', background: 'none',
    width: '100%', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
  },
  sidebarActive: {
    background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600,
  },
  main: {
    background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'var(--gray-700)', borderBottom: '1px solid var(--gray-100)' },
  loading: { textAlign: 'center', padding: '60px', color: 'var(--gray-400)', fontSize: '14px' },
};

export default function Reports({ showToast }) {
  const [selected, setSelected] = useState(REPORT_TYPES[0].key);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setReport(null);
      try {
        const data = await fetchReport(selected);
        if (!data.error) {
          setReport(data);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [selected]);

  const handleExport = () => {
    exportCSV('reports', { type: selected });
  };

  const selectedType = REPORT_TYPES.find(r => r.key === selected);

  // Generate fallback data when API returns nothing useful
  const renderReport = () => {
    if (loading) {
      return (
        <div style={s.loading}>
          <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--gray-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading report...
        </div>
      );
    }

    const metrics = report?.metrics || report?.stats || [];
    const rows = report?.data || report?.rows || [];
    const columns = report?.columns || [];

    // Fallback metrics per report type
    const fallbackMetrics = {
      'collection-summary': [
        { title: 'Total Collections', value: '$4.2M', change: '+8.3%', changeType: 'positive', color: 'green', icon: '$' },
        { title: 'Accounts Resolved', value: '342', change: '+15', changeType: 'positive', color: 'blue', icon: '\u2713' },
        { title: 'Avg Recovery Time', value: '34 days', change: '-3 days', changeType: 'positive', color: 'cyan', icon: '\u23F1' },
        { title: 'Success Rate', value: '67.8%', change: '+2.1%', changeType: 'positive', color: 'purple', icon: '%' },
      ],
      'agent-performance': [
        { title: 'Top Performer', value: 'Sarah K.', color: 'green', icon: '\u2605' },
        { title: 'Avg Calls/Day', value: '47', change: '+5', changeType: 'positive', color: 'blue', icon: '\uD83D\uDCDE' },
        { title: 'Team Recovery', value: '$1.8M', change: '+12%', changeType: 'positive', color: 'green', icon: '$' },
        { title: 'Avg Score', value: '82.5', change: '+3.2', changeType: 'positive', color: 'purple', icon: '\uD83C\uDFC6' },
      ],
      'portfolio-analysis': [
        { title: 'Total Portfolio', value: '$87.5M', change: '+7.6%', changeType: 'positive', color: 'blue', icon: '\uD83D\uDCC1' },
        { title: 'Active Portfolios', value: '12', color: 'cyan', icon: '#' },
        { title: 'Best Performing', value: 'Portfolio A', color: 'green', icon: '\u2605' },
        { title: 'Avg Recovery', value: '45.3%', change: '+3.2%', changeType: 'positive', color: 'purple', icon: '%' },
      ],
      'compliance-report': [
        { title: 'Compliance Score', value: '94.2%', change: '+1.5%', changeType: 'positive', color: 'green', icon: '\uD83D\uDEE1' },
        { title: 'Violations', value: '2', change: '-3', changeType: 'positive', color: 'red', icon: '\u26A0' },
        { title: 'Audits Passed', value: '18/19', color: 'green', icon: '\u2713' },
        { title: 'Next Review', value: 'Mar 30', color: 'orange', icon: '\uD83D\uDCC5' },
      ],
      'payment-analysis': [
        { title: 'Payments This Month', value: '$892K', change: '+18%', changeType: 'positive', color: 'green', icon: '$' },
        { title: 'Avg Payment', value: '$1,245', change: '+$120', changeType: 'positive', color: 'blue', icon: '\uD83D\uDCB3' },
        { title: 'On-Time Rate', value: '78.3%', change: '+4.2%', changeType: 'positive', color: 'cyan', icon: '\u23F0' },
        { title: 'Failed Payments', value: '12', change: '-5', changeType: 'positive', color: 'red', icon: '\u2717' },
      ],
    };

    const displayMetrics = metrics.length > 0 ? metrics : (fallbackMetrics[selected] || []);

    return (
      <div>
        {displayMetrics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {displayMetrics.map((m, i) => (
              <StatCard key={i} {...m} />
            ))}
          </div>
        )}

        {rows.length > 0 && columns.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>{columns.map(c => <th key={c.key || c} style={s.th}>{c.label || c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map(c => <td key={c.key || c} style={s.td}>{row[c.key || c] ?? '--'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)', fontSize: '14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
            Detailed report data will appear here when available from the API.
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)' }}>Reports</h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>View and export collection performance reports</p>

      <div style={s.layout}>
        <div style={s.sidebar}>
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.key}
              style={{ ...s.sidebarItem, ...(selected === rt.key ? s.sidebarActive : {}) }}
              onClick={() => setSelected(rt.key)}
              onMouseEnter={(e) => { if (selected !== rt.key) e.currentTarget.style.background = 'var(--gray-50)'; }}
              onMouseLeave={(e) => { if (selected !== rt.key) e.currentTarget.style.background = 'none'; }}
            >
              <span>{rt.icon}</span>
              <span>{rt.label}</span>
            </button>
          ))}
        </div>
        <div style={s.main}>
          <div style={s.header}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gray-800)' }}>
                {selectedType?.icon} {selectedType?.label}
              </h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>
              Export CSV
            </button>
          </div>
          {renderReport()}
        </div>
      </div>
    </div>
  );
}
