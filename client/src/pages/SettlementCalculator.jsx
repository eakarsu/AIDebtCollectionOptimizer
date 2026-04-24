import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateSettlement } from '../services/api';

const s = {
  page: { padding: '32px', maxWidth: '1000px', margin: '0 auto' },
  card: {
    background: 'white', borderRadius: 'var(--radius-lg)', padding: '28px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)',
  },
  form: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' },
  input: {
    padding: '10px 14px', border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'inherit',
    width: '100%', background: 'white',
  },
  select: {
    padding: '10px 14px', border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'inherit',
    width: '100%', background: 'white', cursor: 'pointer',
  },
  slider: { width: '100%', marginTop: '4px' },
  results: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '24px' },
  resultCard: {
    background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
    border: '2px solid var(--gray-200)', transition: 'all 0.2s', cursor: 'default',
  },
  planName: { fontSize: '16px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '16px' },
  planRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' },
  planLabel: { color: 'var(--gray-500)' },
  planValue: { fontWeight: 600, color: 'var(--gray-800)' },
  highlight: {
    fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px',
  },
  savings: {
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
    borderRadius: '10px', background: 'var(--success-light)', color: 'var(--success)',
    fontSize: '12px', fontWeight: 600, marginTop: '12px',
  },
  loading: { textAlign: 'center', padding: '40px', color: 'var(--gray-400)' },
};

const planColors = ['var(--primary)', 'var(--success)', 'var(--info)', 'var(--secondary)'];

function fmtCurrency(v) {
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SettlementCalculator({ showToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    original_amount: '',
    debt_age_days: '',
    risk_level: 'medium',
    payment_history_score: 5,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!form.original_amount || Number(form.original_amount) <= 0) {
      showToast('Please enter a valid original amount', 'error');
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const data = await calculateSettlement({
        original_amount: Number(form.original_amount),
        debt_age_days: Number(form.debt_age_days) || 0,
        risk_level: form.risk_level,
        payment_history_score: Number(form.payment_history_score),
      });
      if (data.error) {
        showToast(data.error, 'error');
      } else if (data.plans || data.options) {
        setResults(data.plans || data.options);
      } else {
        // Generate client-side fallback
        const amount = Number(form.original_amount);
        const ageFactor = Math.min((Number(form.debt_age_days) || 0) / 365, 1);
        const riskFactors = { low: 0.1, medium: 0.2, high: 0.35, critical: 0.5 };
        const riskDiscount = riskFactors[form.risk_level] || 0.2;
        const historyFactor = (10 - Number(form.payment_history_score)) / 20;
        const baseDiscount = Math.min(riskDiscount + ageFactor * 0.15 + historyFactor, 0.6);

        setResults([
          {
            name: 'Lump Sum',
            settlement_amount: amount * (1 - baseDiscount - 0.05),
            discount_percent: ((baseDiscount + 0.05) * 100).toFixed(1),
            monthly_payment: amount * (1 - baseDiscount - 0.05),
            months: 1,
            total_savings: amount * (baseDiscount + 0.05),
          },
          {
            name: '3-Month Plan',
            settlement_amount: amount * (1 - baseDiscount),
            discount_percent: (baseDiscount * 100).toFixed(1),
            monthly_payment: (amount * (1 - baseDiscount)) / 3,
            months: 3,
            total_savings: amount * baseDiscount,
          },
          {
            name: '6-Month Plan',
            settlement_amount: amount * (1 - baseDiscount + 0.03),
            discount_percent: ((baseDiscount - 0.03) * 100).toFixed(1),
            monthly_payment: (amount * (1 - baseDiscount + 0.03)) / 6,
            months: 6,
            total_savings: amount * (baseDiscount - 0.03),
          },
          {
            name: '12-Month Plan',
            settlement_amount: amount * (1 - baseDiscount + 0.08),
            discount_percent: ((baseDiscount - 0.08) * 100).toFixed(1),
            monthly_payment: (amount * (1 - baseDiscount + 0.08)) / 12,
            months: 12,
            total_savings: amount * (baseDiscount - 0.08),
          },
        ]);
      }
    } catch {
      showToast('Calculation failed', 'error');
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '8px' }}>Settlement Calculator</h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>Calculate optimal settlement offers based on debtor parameters</p>

      <div style={s.card}>
        <form onSubmit={handleCalculate}>
          <div style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Original Amount ($)</label>
              <input
                style={s.input}
                type="number"
                step="0.01"
                min="0"
                value={form.original_amount}
                onChange={e => handleChange('original_amount', e.target.value)}
                placeholder="e.g. 25000"
                required
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Debt Age (days)</label>
              <input
                style={s.input}
                type="number"
                min="0"
                value={form.debt_age_days}
                onChange={e => handleChange('debt_age_days', e.target.value)}
                placeholder="e.g. 365"
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Risk Level</label>
              <select
                style={s.select}
                value={form.risk_level}
                onChange={e => handleChange('risk_level', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>
                Payment History Score: <strong>{form.payment_history_score}</strong>/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.payment_history_score}
                onChange={e => handleChange('payment_history_score', e.target.value)}
                style={s.slider}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray-400)' }}>
                <span>Poor (1)</span>
                <span>Excellent (10)</span>
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Settlement Options'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={s.loading}>
          <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--gray-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Calculating optimal settlements...
        </div>
      )}

      {results && !loading && (
        <div style={s.results}>
          {results.map((plan, i) => (
            <div
              key={i}
              style={{ ...s.resultCard, borderColor: planColors[i % planColors.length] + '40' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = planColors[i % planColors.length];
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = planColors[i % planColors.length] + '40';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ ...s.planName, color: planColors[i % planColors.length] }}>{plan.name}</div>
              <div style={{ ...s.highlight, color: planColors[i % planColors.length] }}>
                {fmtCurrency(plan.settlement_amount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '16px' }}>Settlement Amount</div>

              <div style={s.planRow}>
                <span style={s.planLabel}>Discount</span>
                <span style={s.planValue}>{plan.discount_percent}%</span>
              </div>
              <div style={s.planRow}>
                <span style={s.planLabel}>Monthly Payment</span>
                <span style={s.planValue}>{fmtCurrency(plan.monthly_payment)}</span>
              </div>
              <div style={s.planRow}>
                <span style={s.planLabel}>Duration</span>
                <span style={s.planValue}>{plan.months} month{plan.months !== 1 ? 's' : ''}</span>
              </div>

              <div style={s.savings}>
                Total Savings: {fmtCurrency(Math.max(0, plan.total_savings))}
              </div>

              <button
                className="btn btn-primary btn-sm btn-full"
                style={{ marginTop: '16px' }}
                onClick={() => navigate('/feature/settlements')}
              >
                Create Settlement Offer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
