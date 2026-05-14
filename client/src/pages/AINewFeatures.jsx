import React, { useState } from 'react';

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

const tools = [
  {
    id: 'score-debtor',
    title: 'Score Debtor',
    icon: '🎯',
    desc: 'Stateless debtor recovery-likelihood score and recommended strategy.',
    endpoint: '/ai/score-debtor',
    fields: [
      { name: 'debtor_profile', label: 'Debtor Profile (JSON or text)', type: 'textarea', required: true,
        placeholder: '{"name":"Jane Doe","age":34,"balance":3500,"days_past_due":92}' },
      { name: 'payment_history', label: 'Payment History (optional)', type: 'textarea',
        placeholder: '[{"date":"2024-09-01","amount":50,"status":"paid"}]' },
      { name: 'communication_history', label: 'Communication History (optional)', type: 'textarea',
        placeholder: '[{"date":"2024-10-12","channel":"call","outcome":"voicemail"}]' },
    ],
    resultKey: 'score',
  },
  {
    id: 'predict-payment-likelihood',
    title: 'Predict Payment Likelihood',
    icon: '📈',
    desc: 'Probability the debtor pays within a horizon (days), with drivers.',
    endpoint: '/ai/predict-payment-likelihood',
    fields: [
      { name: 'debtor_profile', label: 'Debtor Profile (JSON or text)', type: 'textarea', required: true },
      { name: 'horizon_days', label: 'Horizon Days (1-365)', type: 'number', placeholder: '30' },
    ],
    resultKey: 'prediction',
  },
  {
    id: 'optimize-settlement-offer',
    title: 'Optimize Settlement Offer',
    icon: '💼',
    desc: 'Recommended settlement amount, structure, and negotiation script.',
    endpoint: '/ai/optimize-settlement-offer',
    fields: [
      { name: 'debtor_profile', label: 'Debtor Profile (JSON or text)', type: 'textarea', required: true },
      { name: 'original_balance', label: 'Original Balance', type: 'number', placeholder: '5000' },
      { name: 'hardship_indicators', label: 'Hardship Indicators (optional)', type: 'textarea',
        placeholder: '{"job_loss":true,"medical":false}' },
    ],
    resultKey: 'recommendation',
  },
  {
    id: 'detect-fraud',
    title: 'Detect Fraud',
    icon: '🚨',
    desc: 'Fraud-pattern detection on a debtor record.',
    endpoint: '/ai/detect-fraud',
    fields: [
      { name: 'debtor_record', label: 'Debtor Record (JSON or text)', type: 'textarea', required: true },
      { name: 'application_data', label: 'Application Data (optional)', type: 'textarea' },
      { name: 'payment_history', label: 'Payment History (optional)', type: 'textarea' },
    ],
    resultKey: 'assessment',
  },
  {
    id: 'analyze-payment-pattern',
    title: 'Analyze Payment Pattern',
    icon: '📊',
    desc: 'Cadence, partial-payment behavior, and trend analysis.',
    endpoint: '/ai/analyze-payment-pattern',
    fields: [
      { name: 'debtor_profile', label: 'Debtor Profile (optional)', type: 'textarea' },
      { name: 'payment_history', label: 'Payment History (JSON or text)', type: 'textarea', required: true },
    ],
    resultKey: 'analysis',
  },
  {
    id: 'schedule-optimal-contact',
    title: 'Schedule Optimal Contact',
    icon: '🕒',
    desc: 'Best contact windows (FDCPA/TCPA-compliant) for a debtor.',
    endpoint: '/ai/schedule-optimal-contact',
    fields: [
      { name: 'debtor_profile', label: 'Debtor Profile (JSON or text)', type: 'textarea', required: true },
      { name: 'communication_history', label: 'Communication History (optional)', type: 'textarea' },
      { name: 'channel', label: 'Channel (email/sms/call/mail, optional)', type: 'text', placeholder: 'email' },
    ],
    resultKey: 'schedule',
  },
];

export default function AINewFeatures({ showToast }) {
  const [activeId, setActiveId] = useState(tools[0].id);
  const [form, setForm] = useState({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const tool = tools.find(t => t.id === activeId);

  const switchTool = (id) => {
    setActiveId(id);
    setForm({});
    setResult(null);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    const missing = tool.fields.find(f => f.required && (!form[f.name] || !String(form[f.name]).trim()));
    if (missing) {
      setError(`${missing.label} is required`);
      return;
    }
    const payload = {};
    for (const f of tool.fields) {
      const v = form[f.name];
      if (v === undefined || v === '') continue;
      if (f.type === 'textarea') {
        try { payload[f.name] = JSON.parse(v); } catch { payload[f.name] = v; }
      } else if (f.type === 'number') {
        payload[f.name] = parseInt(v, 10);
      } else {
        payload[f.name] = v;
      }
    }
    setRunning(true);
    try {
      const r = await postJson(tool.endpoint, payload);
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

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 4 }}>AI New Features</h1>
      <p style={{ color: 'var(--gray-600, #6b7280)', marginBottom: 16 }}>
        Stateless debtor risk scoring and payment-likelihood prediction.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => switchTool(t.id)}
            style={{
              padding: 14,
              borderRadius: 8,
              textAlign: 'left',
              border: activeId === t.id ? '2px solid var(--primary, #1976d2)' : '2px solid var(--gray-200, #e5e7eb)',
              background: activeId === t.id ? 'rgba(25,118,210,0.06)' : '#fff',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-600, #6b7280)', marginTop: 4 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid var(--gray-200, #e5e7eb)' }}>
          <h2 style={{ marginBottom: 16 }}>{tool.icon} {tool.title}</h2>
          {tool.fields.map(f => (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                {f.label}{f.required && <span style={{ color: 'red' }}> *</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  rows={5}
                  placeholder={f.placeholder || ''}
                  value={form[f.name] || ''}
                  onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                  style={{ width: '100%', padding: 8, border: '1px solid var(--gray-300, #d1d5db)', borderRadius: 4, fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  placeholder={f.placeholder || ''}
                  value={form[f.name] || ''}
                  onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                  style={{ width: '100%', padding: 8, border: '1px solid var(--gray-300, #d1d5db)', borderRadius: 4 }}
                />
              )}
            </div>
          ))}
          <button
            onClick={submit}
            disabled={running}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              borderRadius: 6,
              background: 'var(--primary, #1976d2)',
              color: 'white',
              border: 'none',
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running ? 0.7 : 1
            }}
          >
            {running ? 'Running...' : 'Run'}
          </button>
          {error && (
            <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', color: '#991b1b', borderRadius: 4, fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid var(--gray-200, #e5e7eb)' }}>
          <h2 style={{ marginBottom: 16 }}>Result</h2>
          {running && <div style={{ color: 'var(--gray-600, #6b7280)' }}>Running AI analysis...</div>}
          {!running && !result && (
            <div style={{ color: 'var(--gray-400, #9ca3af)', fontSize: 13 }}>No result yet. Run a tool to see output.</div>
          )}
          {result && (
            <pre style={{
              background: 'var(--gray-50, #f9fafb)',
              padding: 12,
              borderRadius: 4,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 600,
              whiteSpace: 'pre-wrap'
            }}>
              {typeof result[tool.resultKey] === 'string' ? result[tool.resultKey] : JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
