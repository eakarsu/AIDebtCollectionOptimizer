import React, { useState, useEffect, useCallback } from 'react';
import { fetchItems } from '../services/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function postJson(path, body = {}) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getJson(path) {
  const res = await fetch(`/api${path}`, { headers: headers() });
  return res.json();
}

export default function AIFeatures({ showToast }) {
  const [tab, setTab] = useState('regulatory');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Debtors / disputes for selection
  const [debtors, setDebtors] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [debtorId, setDebtorId] = useState('');
  const [disputeId, setDisputeId] = useState('');

  // History
  const [history, setHistory] = useState([]);
  const [historyFeature, setHistoryFeature] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems('debtors').then((d) => setDebtors(Array.isArray(d) ? d : d.data || [])).catch(() => setDebtors([]));
    fetchItems('disputes').then((d) => setDisputes(Array.isArray(d) ? d : d.data || [])).catch(() => setDisputes([]));
  }, []);

  const run = async (path, body = {}) => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const r = await postJson(path, body);
      if (r.error) {
        setError(r.error);
        if (showToast) showToast(r.error, 'error');
      } else {
        setResult(r);
        if (showToast) showToast('AI run complete');
      }
    } catch (e) {
      setError(e.message);
      if (showToast) showToast(e.message, 'error');
    }
    setRunning(false);
  };

  const loadHistory = useCallback(async (p = 1) => {
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (historyFeature) params.append('feature', historyFeature);
      const r = await getJson(`/ai-features/results?${params.toString()}`);
      setHistory(r.data || []);
      setPage(r.pagination?.page || 1);
      setTotalPages(r.pagination?.totalPages || 1);
    } catch {
      setHistory([]);
    }
  }, [historyFeature]);

  useEffect(() => { if (tab === 'history') loadHistory(1); }, [tab, loadHistory]);

  const TabBtn = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 14px',
        borderRadius: 'var(--radius, 6px)',
        border: 'none',
        cursor: 'pointer',
        background: tab === id ? 'var(--primary, #1976d2)' : 'var(--gray-100, #f3f4f6)',
        color: tab === id ? 'white' : 'var(--gray-700, #374151)',
        fontWeight: 500,
        marginRight: 6,
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>AI Features</h1>

      <div style={{ marginBottom: 20 }}>
        <TabBtn id="regulatory">Regulatory Alerts</TabBtn>
        <TabBtn id="leaderboard">Coaching Leaderboard</TabBtn>
        <TabBtn id="payment-plan">Payment Plan</TabBtn>
        <TabBtn id="dispute">Dispute Triage</TabBtn>
        <TabBtn id="history">History</TabBtn>
      </div>

      {tab === 'regulatory' && (
        <div className="card" style={{ padding: 20 }}>
          <h3>Regulatory Alert Scan</h3>
          <p>Scans recent regulatory items and surfaces high-impact alerts with required actions.</p>
          <button className="btn btn-primary" disabled={running} onClick={() => run('/ai-features/regulatory-alert-scan')}>
            {running ? 'Scanning…' : 'Scan Now'}
          </button>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="card" style={{ padding: 20 }}>
          <h3>Agent Coaching Leaderboard</h3>
          <p>Aggregates active agent KPIs into a leaderboard with AI-generated coaching tips per agent.</p>
          <button className="btn btn-primary" disabled={running} onClick={() => run('/ai-features/coaching-leaderboard')}>
            {running ? 'Building…' : 'Build Leaderboard'}
          </button>
        </div>
      )}

      {tab === 'payment-plan' && (
        <div className="card" style={{ padding: 20 }}>
          <h3>Payment Plan Recommender</h3>
          <p>Generates 3 structured, FDCPA-compliant payment plan options for the selected debtor.</p>
          <div style={{ marginBottom: 12 }}>
            <label>Debtor</label>
            <select value={debtorId} onChange={(e) => setDebtorId(e.target.value)} className="form-input" style={{ width: '100%' }}>
              <option value="">— select —</option>
              {debtors.map((d) => <option key={d.id} value={d.id}>{d.name} (${d.total_debt})</option>)}
            </select>
          </div>
          <button className="btn btn-primary" disabled={!debtorId || running} onClick={() => run(`/ai-features/payment-plan-recommend/${debtorId}`)}>
            {running ? 'Building…' : 'Recommend Plans'}
          </button>
        </div>
      )}

      {tab === 'dispute' && (
        <div className="card" style={{ padding: 20 }}>
          <h3>Dispute Triage</h3>
          <p>Classifies a dispute, scores validity, and recommends a compliant resolution path.</p>
          <div style={{ marginBottom: 12 }}>
            <label>Dispute</label>
            <select value={disputeId} onChange={(e) => setDisputeId(e.target.value)} className="form-input" style={{ width: '100%' }}>
              <option value="">— select —</option>
              {disputes.map((d) => <option key={d.id} value={d.id}>#{d.id} {d.debtor_name} — {d.dispute_type || 'unspecified'}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" disabled={!disputeId || running} onClick={() => run(`/ai-features/dispute-triage/${disputeId}`)}>
            {running ? 'Triaging…' : 'Triage Dispute'}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="card" style={{ padding: 20 }}>
          <h3>AI Run History</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Filter feature</label>
              <select value={historyFeature} onChange={(e) => setHistoryFeature(e.target.value)} className="form-input" style={{ width: '100%' }}>
                <option value="">all</option>
                <option value="regulatory_alert_scan">regulatory_alert_scan</option>
                <option value="coaching_leaderboard">coaching_leaderboard</option>
                <option value="payment_plan_recommend">payment_plan_recommend</option>
                <option value="dispute_triage">dispute_triage</option>
              </select>
            </div>
            <button className="btn btn-secondary" onClick={() => loadHistory(1)}>Reload</button>
          </div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead><tr><th>ID</th><th>Feature</th><th>Debtor</th><th>Success</th><th>Created</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={{ cursor: 'pointer' }} onClick={() => setResult(h.output)}>
                  <td>{h.id}</td>
                  <td>{h.feature}</td>
                  <td>{h.debtor_id || '-'}</td>
                  <td>{h.success ? '✓' : '✕'}</td>
                  <td>{new Date(h.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>No runs yet</td></tr>}
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => loadHistory(page - 1)}>← Prev</button>
            <span style={{ alignSelf: 'center' }}>Page {page} / {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => loadHistory(page + 1)}>Next →</button>
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: 16, marginTop: 16, borderLeft: '4px solid #d32f2f', background: '#ffebee' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h3>Result</h3>
          <pre style={{ background: '#0f172a', color: '#cbd5e1', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 480 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
