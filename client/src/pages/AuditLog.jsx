import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../services/api';
import Pagination from '../components/Pagination';
import FilterPanel from '../components/FilterPanel';

const s = {
  page: { padding: '32px', maxWidth: '1400px', margin: '0 auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'var(--gray-700)', borderBottom: '1px solid var(--gray-100)' },
  actionBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' },
  expandRow: { background: 'var(--gray-50)' },
  jsonBlock: {
    background: 'var(--gray-900)', color: '#a5f3fc', padding: '16px',
    borderRadius: 'var(--radius)', fontSize: '12px', fontFamily: 'monospace',
    overflow: 'auto', maxHeight: '300px', whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
  loading: { textAlign: 'center', padding: '60px', color: 'var(--gray-400)', fontSize: '14px' },
};

const actionColors = {
  create: { bg: 'var(--success-light)', color: 'var(--success)' },
  update: { bg: 'var(--info-light)', color: 'var(--info)' },
  delete: { bg: 'var(--danger-light)', color: 'var(--danger)' },
};

const filters = [
  { name: 'entity_type', label: 'Entity Type', type: 'select', options: ['debtors', 'payments', 'campaigns', 'settlements', 'disputes', 'compliance', 'payment-plans', 'schedules'] },
  { name: 'action', label: 'Action', type: 'select', options: ['create', 'update', 'delete'] },
  { name: 'user', label: 'User', type: 'text' },
  { name: 'date_range', label: 'Date Range', type: 'daterange' },
];

export default function AuditLog({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [filterValues, setFilterValues] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page: String(page), limit: String(limit), ...filterValues };
        // Remove empty values
        Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
        const data = await fetchAuditLogs(params);
        if (Array.isArray(data)) {
          setLogs(data);
          setTotal(data.length);
        } else if (data.data) {
          setLogs(data.data);
          setTotal(data.total || data.data.length);
        } else if (!data.error) {
          setLogs([]);
          setTotal(0);
        }
      } catch {
        showToast && showToast('Failed to load audit logs', 'error');
      }
      setLoading(false);
    };
    load();
  }, [page, limit, filterValues]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatJson = (data) => {
    if (!data) return 'null';
    try {
      if (typeof data === 'string') data = JSON.parse(data);
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const fmtDate = (v) => {
    if (!v) return '--';
    return new Date(v).toLocaleString();
  };

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '8px' }}>Audit Log</h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>Track all changes made to the system</p>

      <FilterPanel
        filters={filters}
        values={filterValues}
        onChange={(v) => { setFilterValues(v); setPage(1); }}
        onReset={() => { setFilterValues({}); setPage(1); }}
      />

      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
        {loading ? (
          <div style={s.loading}>
            <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--gray-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-400)', fontSize: '14px' }}>
            No audit log entries found
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Timestamp</th>
                <th style={s.th}>Action</th>
                <th style={s.th}>Entity</th>
                <th style={s.th}>Entity ID</th>
                <th style={s.th}>User</th>
                <th style={s.th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const ac = actionColors[log.action] || actionColors.update;
                const isExpanded = expandedId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={s.td}>{fmtDate(log.created_at || log.timestamp)}</td>
                      <td style={s.td}>
                        <span style={{ ...s.actionBadge, background: ac.bg, color: ac.color }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={s.td}>{log.entity_type || log.entity || '--'}</td>
                      <td style={s.td}>{log.entity_id || '--'}</td>
                      <td style={s.td}>{log.user_name || log.user || '--'}</td>
                      <td style={s.td}>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                          {isExpanded ? 'Hide' : 'Show'} details
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={s.expandRow}>
                        <td colSpan={6} style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Old Data
                              </div>
                              <pre style={s.jsonBlock}>{formatJson(log.old_data)}</pre>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                New Data
                              </div>
                              <pre style={s.jsonBlock}>{formatJson(log.new_data)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={(v) => { setLimit(v); setPage(1); }}
          total={total}
        />
      </div>
    </div>
  );
}
