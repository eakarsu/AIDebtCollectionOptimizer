import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { features } from '../config/features';
import { fetchItems, fetchDashboardStats, fetchDashboardTrends, fetchRecentActivity } from '../services/api';
import StatCard from '../components/StatCard';
import { BarChart, DonutChart } from '../components/SimpleChart';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const activityIcons = {
  payment: { icon: '$', color: 'var(--success)', bg: 'var(--success-light)' },
  dispute: { icon: '\u2696', color: 'var(--warning)', bg: 'var(--warning-light)' },
  settlement: { icon: '\uD83E\uDD1D', color: '#be185d', bg: '#fce7f3' },
  compliance: { icon: '\uD83D\uDEE1', color: 'var(--danger)', bg: 'var(--danger-light)' },
  campaign: { icon: '\uD83D\uDCE2', color: 'var(--secondary)', bg: '#ede9fe' },
  default: { icon: '\u25CF', color: 'var(--info)', bg: 'var(--info-light)' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsData, trendsData, activityData] = await Promise.allSettled([
          fetchDashboardStats(),
          fetchDashboardTrends(),
          fetchRecentActivity(),
        ]);
        if (statsData.status === 'fulfilled' && !statsData.value.error) setStats(statsData.value);
        if (trendsData.status === 'fulfilled' && !trendsData.value.error) setTrends(trendsData.value);
        if (activityData.status === 'fulfilled' && Array.isArray(activityData.value)) setActivity(activityData.value);
      } catch {}
      setLoading(false);
    };
    load();

    features.forEach(f => {
      fetchItems(f.endpoint).then(data => {
        if (Array.isArray(data)) {
          setCounts(prev => ({ ...prev, [f.key]: data.length }));
        }
      }).catch(() => {});
    });
  }, []);

  // Fallback stats if API doesn't return data
  const statCards = stats ? [
    { title: 'Total Portfolio Value', value: stats.portfolio_value || '$87.5M', change: stats.portfolio_change || '+7.6%', changeType: 'positive', icon: '\uD83D\uDCB0', color: 'blue' },
    { title: 'Total Recovered', value: stats.total_recovered || '$39.6M', change: stats.recovered_change || '+12.3%', changeType: 'positive', icon: '\uD83D\uDCC8', color: 'green' },
    { title: 'Recovery Rate', value: stats.recovery_rate || '45.3%', change: stats.rate_change || '+3.2%', changeType: 'positive', icon: '%', color: 'cyan' },
    { title: 'Active Accounts', value: stats.active_accounts || '1,245', change: stats.accounts_change || '-5.7%', changeType: 'negative', icon: '\uD83D\uDCC1', color: 'purple' },
    { title: 'Pending Disputes', value: stats.pending_disputes || '23', change: stats.disputes_change || '-2', changeType: 'positive', icon: '\u2696', color: 'orange' },
    { title: 'Compliance Score', value: stats.compliance_score || '94.2%', change: stats.compliance_change || '+1.5%', changeType: 'positive', icon: '\uD83D\uDEE1', color: 'green' },
  ] : [
    { title: 'Total Portfolio Value', value: '$87.5M', change: '+7.6%', changeType: 'positive', icon: '\uD83D\uDCB0', color: 'blue' },
    { title: 'Total Recovered', value: '$39.6M', change: '+12.3%', changeType: 'positive', icon: '\uD83D\uDCC8', color: 'green' },
    { title: 'Recovery Rate', value: '45.3%', change: '+3.2%', changeType: 'positive', icon: '%', color: 'cyan' },
    { title: 'Active Accounts', value: '1,245', change: '-5.7%', changeType: 'negative', icon: '\uD83D\uDCC1', color: 'purple' },
    { title: 'Pending Disputes', value: '23', change: '-2', changeType: 'positive', icon: '\u2696', color: 'orange' },
    { title: 'Compliance Score', value: '94.2%', change: '+1.5%', changeType: 'positive', icon: '\uD83D\uDEE1', color: 'green' },
  ];

  const trendData = trends?.monthly || [
    { label: 'Jul', value: 3200 },
    { label: 'Aug', value: 4100 },
    { label: 'Sep', value: 3800 },
    { label: 'Oct', value: 5200 },
    { label: 'Nov', value: 4600 },
    { label: 'Dec', value: 5900 },
    { label: 'Jan', value: 6300 },
    { label: 'Feb', value: 5800 },
  ];

  const statusDist = trends?.status_distribution || [
    { label: 'Active', value: 520, color: 'var(--success)' },
    { label: 'In Negotiation', value: 310, color: 'var(--warning)' },
    { label: 'Payment Plan', value: 215, color: 'var(--info)' },
    { label: 'Disputed', value: 98, color: 'var(--secondary)' },
    { label: 'Delinquent', value: 67, color: 'var(--danger)' },
    { label: 'Settled', value: 35, color: 'var(--gray-400)' },
  ];

  const recentActivity = activity.length > 0 ? activity : [
    { type: 'payment', description: 'Payment of $2,500 received from John Doe', created_at: new Date(Date.now() - 3600000).toISOString() },
    { type: 'dispute', description: 'New dispute filed by Jane Smith - Amount Contested', created_at: new Date(Date.now() - 7200000).toISOString() },
    { type: 'settlement', description: 'Settlement offer accepted by Robert Wilson - $12,000', created_at: new Date(Date.now() - 14400000).toISOString() },
    { type: 'compliance', description: 'Compliance check passed for FDCPA regulation review', created_at: new Date(Date.now() - 28800000).toISOString() },
    { type: 'campaign', description: 'Email campaign "Q1 Recovery" completed with 34% response rate', created_at: new Date(Date.now() - 43200000).toISOString() },
  ];

  const quickActions = [
    { label: 'Add Debtor', icon: '+', color: 'var(--primary)', path: '/feature/debtors' },
    { label: 'Record Payment', icon: '$', color: 'var(--success)', path: '/feature/payments' },
    { label: 'New Campaign', icon: '\uD83D\uDCE2', color: 'var(--secondary)', path: '/feature/campaigns' },
    { label: 'Compliance Check', icon: '\uD83D\uDEE1', color: 'var(--danger)', path: '/feature/compliance' },
  ];

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">AI-Powered Debt Collection Optimization Platform</p>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '20px' }}>Monthly Recovery Trends</h3>
          <BarChart data={trendData} color="var(--primary)" height={200} />
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '20px' }}>Account Status Distribution</h3>
          <DonutChart data={statusDist} size={180} />
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '16px' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentActivity.map((a, i) => {
            const cfg = activityIcons[a.type] || activityIcons.default;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-50)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700, flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: 'var(--gray-700)', fontWeight: 500 }}>{a.description}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                  {timeAgo(a.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {quickActions.map((qa, i) => (
          <button
            key={i}
            className="btn"
            style={{ background: qa.color, color: 'white', padding: '12px 24px', fontSize: '14px' }}
            onClick={() => navigate(qa.path)}
          >
            <span>{qa.icon}</span> {qa.label}
          </button>
        ))}
      </div>

      {/* Features Grid */}
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--gray-800)' }}>
        Features & Modules
      </h2>

      <div className="features-grid">
        {features.map(feature => (
          <div
            key={feature.key}
            className="feature-card"
            onClick={() => navigate(`/feature/${feature.key}`)}
          >
            <div className="feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <div className="feature-count">
              {counts[feature.key] !== undefined ? counts[feature.key] : '...'} items
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
