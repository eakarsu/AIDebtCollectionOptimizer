import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDebtorProfile, fetchDebtorSummary } from '../services/api';
import StatCard from '../components/StatCard';
import ActivityTimeline from '../components/ActivityTimeline';

const s = {
  page: { padding: '32px', maxWidth: '1400px', margin: '0 auto' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: {
    width: '40px', height: '40px', borderRadius: 'var(--radius)',
    border: '1.5px solid var(--gray-300)', background: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '18px', transition: 'all 0.2s',
  },
  name: { fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)' },
  badges: { display: 'flex', gap: '8px', marginTop: '4px' },
  badge: {
    padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
    fontWeight: 600, textTransform: 'capitalize',
  },
  tabs: {
    display: 'flex', gap: '4px', marginBottom: '24px',
    borderBottom: '2px solid var(--gray-200)', paddingBottom: '0',
  },
  tab: {
    padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    color: 'var(--gray-500)', border: 'none', background: 'none',
    borderBottom: '2px solid transparent', marginBottom: '-2px',
    transition: 'all 0.2s', fontFamily: 'inherit',
  },
  tabActive: {
    color: 'var(--primary)', borderBottomColor: 'var(--primary)',
  },
  section: {
    background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { marginBottom: '12px' },
  fieldLabel: { fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' },
  fieldValue: { fontSize: '14px', color: 'var(--gray-800)', fontWeight: 500 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'var(--gray-700)', borderBottom: '1px solid var(--gray-100)' },
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  loading: { textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '40px', color: 'var(--gray-400)', fontSize: '14px' },
};

const statusColors = {
  active: { bg: 'var(--success-light)', color: 'var(--success)' },
  in_negotiation: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  payment_plan: { bg: 'var(--info-light)', color: 'var(--info)' },
  disputed: { bg: '#ede9fe', color: 'var(--secondary)' },
  delinquent: { bg: 'var(--danger-light)', color: 'var(--danger)' },
  settled: { bg: 'var(--gray-100)', color: 'var(--gray-600)' },
  closed: { bg: 'var(--gray-100)', color: 'var(--gray-500)' },
};

const riskColors = {
  low: { bg: 'var(--success-light)', color: 'var(--success)' },
  medium: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  high: { bg: 'var(--danger-light)', color: 'var(--danger)' },
  critical: { bg: '#fee2e2', color: '#991b1b' },
};

function fmtCurrency(v) {
  if (v === null || v === undefined) return '--';
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(v) {
  if (!v) return '--';
  return new Date(v).toLocaleDateString();
}

const TABS = ['Overview', 'Payments', 'Plans', 'Settlements', 'Disputes', 'Schedule', 'Timeline'];

export default function DebtorProfile({ showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, summaryData] = await Promise.allSettled([
          fetchDebtorProfile(id),
          fetchDebtorSummary(id),
        ]);
        if (profileData.status === 'fulfilled' && !profileData.value.error) {
          setProfile(profileData.value);
        } else {
          setError('Failed to load debtor profile');
        }
        if (summaryData.status === 'fulfilled' && !summaryData.value.error) {
          setSummary(summaryData.value);
        }
      } catch {
        setError('Connection error');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loading}>
          <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--gray-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading debtor profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <button style={s.backBtn} onClick={() => navigate('/feature/debtors')}>&larr;</button>
            <h1 style={s.name}>Debtor Not Found</h1>
          </div>
        </div>
        <div style={{ ...s.section, textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--gray-500)', marginBottom: '16px' }}>{error || 'The requested debtor profile could not be found.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/feature/debtors')}>Back to Debtors</button>
        </div>
      </div>
    );
  }

  const debtor = profile.debtor || profile;
  const payments = profile.payments || [];
  const plans = profile.plans || [];
  const settlements = profile.settlements || [];
  const disputes = profile.disputes || [];
  const schedules = profile.schedules || [];
  const timeline = profile.timeline || profile.activities || [];

  const sc = statusColors[debtor.status] || statusColors.active;
  const rc = riskColors[debtor.risk_level] || riskColors.medium;

  const summaryCards = [
    { title: 'Total Debt', value: fmtCurrency(summary?.total_debt || debtor.total_debt), color: 'red', icon: '\uD83D\uDCB3' },
    { title: 'Total Paid', value: fmtCurrency(summary?.total_paid || 0), color: 'green', icon: '\u2713' },
    { title: 'Remaining', value: fmtCurrency(summary?.remaining || debtor.total_debt), color: 'orange', icon: '\u23F3' },
    { title: 'Risk Score', value: summary?.risk_score || debtor.risk_score || '--', color: 'purple', icon: '\uD83D\uDCCA' },
  ];

  const renderTable = (cols, rows) => {
    if (!rows || rows.length === 0) return <div style={s.empty}>No records found</div>;
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr>{cols.map(c => <th key={c.key} style={s.th}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c.key} style={s.td}>
                    {c.format === 'currency' ? fmtCurrency(row[c.key]) :
                     c.format === 'date' ? fmtDate(row[c.key]) :
                     c.format === 'badge' ? (
                       <span className={`badge badge-${getBadgeType(row[c.key])}`}>
                         {String(row[c.key] || '').replace(/_/g, ' ')}
                       </span>
                     ) : (row[c.key] ?? '--')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div style={s.section}>
            <div style={s.grid2}>
              <div>
                <div style={s.field}><div style={s.fieldLabel}>Full Name</div><div style={s.fieldValue}>{debtor.name}</div></div>
                <div style={s.field}><div style={s.fieldLabel}>Email</div><div style={s.fieldValue}>{debtor.email || '--'}</div></div>
                <div style={s.field}><div style={s.fieldLabel}>Phone</div><div style={s.fieldValue}>{debtor.phone || '--'}</div></div>
                <div style={s.field}><div style={s.fieldLabel}>Address</div><div style={s.fieldValue}>{debtor.address || '--'}</div></div>
              </div>
              <div>
                <div style={s.field}><div style={s.fieldLabel}>Account Number</div><div style={s.fieldValue}>{debtor.account_number || '--'}</div></div>
                <div style={s.field}><div style={s.fieldLabel}>Total Debt</div><div style={s.fieldValue}>{fmtCurrency(debtor.total_debt)}</div></div>
                <div style={s.field}><div style={s.fieldLabel}>Status</div><div style={s.fieldValue}><span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{(debtor.status || '').replace(/_/g, ' ')}</span></div></div>
                <div style={s.field}><div style={s.fieldLabel}>Created</div><div style={s.fieldValue}>{fmtDate(debtor.created_at)}</div></div>
              </div>
            </div>
            {debtor.notes && (
              <div style={{ marginTop: '16px' }}>
                <div style={s.fieldLabel}>Notes</div>
                <div style={{ ...s.fieldValue, whiteSpace: 'pre-wrap', marginTop: '4px' }}>{debtor.notes}</div>
              </div>
            )}
          </div>
        );
      case 'Payments':
        return (
          <div style={s.section}>
            {renderTable(
              [
                { key: 'payment_date', label: 'Date', format: 'date' },
                { key: 'amount', label: 'Amount', format: 'currency' },
                { key: 'payment_method', label: 'Method' },
                { key: 'status', label: 'Status', format: 'badge' },
                { key: 'reference_number', label: 'Reference' },
              ],
              payments,
            )}
          </div>
        );
      case 'Plans':
        return (
          <div style={s.section}>
            {renderTable(
              [
                { key: 'plan_amount', label: 'Plan Amount', format: 'currency' },
                { key: 'monthly_payment', label: 'Monthly', format: 'currency' },
                { key: 'duration_months', label: 'Duration' },
                { key: 'status', label: 'Status', format: 'badge' },
                { key: 'start_date', label: 'Start', format: 'date' },
              ],
              plans,
            )}
          </div>
        );
      case 'Settlements':
        return (
          <div style={s.section}>
            {renderTable(
              [
                { key: 'original_amount', label: 'Original', format: 'currency' },
                { key: 'settlement_amount', label: 'Settlement', format: 'currency' },
                { key: 'discount_percent', label: 'Discount %' },
                { key: 'status', label: 'Status', format: 'badge' },
                { key: 'offered_date', label: 'Offered', format: 'date' },
              ],
              settlements,
            )}
          </div>
        );
      case 'Disputes':
        return (
          <div style={s.section}>
            {renderTable(
              [
                { key: 'dispute_type', label: 'Type' },
                { key: 'amount_disputed', label: 'Amount', format: 'currency' },
                { key: 'status', label: 'Status', format: 'badge' },
                { key: 'priority', label: 'Priority', format: 'badge' },
                { key: 'filed_date', label: 'Filed', format: 'date' },
              ],
              disputes,
            )}
          </div>
        );
      case 'Schedule':
        return (
          <div style={s.section}>
            {renderTable(
              [
                { key: 'contact_type', label: 'Type' },
                { key: 'scheduled_date', label: 'Date', format: 'date' },
                { key: 'channel', label: 'Channel', format: 'badge' },
                { key: 'status', label: 'Status', format: 'badge' },
                { key: 'agent_name', label: 'Agent' },
              ],
              schedules,
            )}
          </div>
        );
      case 'Timeline':
        return (
          <div style={s.section}>
            <ActivityTimeline activities={timeline} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/feature/debtors')}>&larr;</button>
          <div>
            <h1 style={s.name}>{debtor.name}</h1>
            <div style={s.badges}>
              <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{(debtor.status || '').replace(/_/g, ' ')}</span>
              {debtor.risk_level && <span style={{ ...s.badge, background: rc.bg, color: rc.color }}>Risk: {debtor.risk_level}</span>}
              {debtor.account_number && <span style={{ ...s.badge, background: 'var(--gray-100)', color: 'var(--gray-600)' }}>#{debtor.account_number}</span>}
            </div>
          </div>
        </div>
        <div style={s.actions}>
          <button className="btn btn-success btn-sm" onClick={() => navigate('/feature/payments')}>Record Payment</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/feature/payment-plans')}>Create Plan</button>
          <button className="btn btn-warning btn-sm" onClick={() => navigate('/feature/settlements')}>Settlement Offer</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/feature/debtors')}>Log Note</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {summaryCards.map((sc, i) => (
          <StatCard key={i} {...sc} />
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(tab => (
          <button
            key={tab}
            style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}

function getBadgeType(value) {
  if (!value) return 'default';
  const v = String(value).toLowerCase();
  if (['active', 'pass', 'completed', 'approved', 'settled', 'accepted', 'low'].includes(v)) return 'success';
  if (['warning', 'in_negotiation', 'negotiating', 'proposed', 'pending', 'medium', 'draft', 'paused', 'new', 'in_progress', 'stable'].includes(v)) return 'warning';
  if (['critical', 'fail', 'delinquent', 'defaulted', 'rejected', 'overdue', 'expired', 'declined', 'failed', 'high'].includes(v)) return 'danger';
  if (['disputed', 'investigating', 'under_review', 'on_hold'].includes(v)) return 'info';
  return 'default';
}
