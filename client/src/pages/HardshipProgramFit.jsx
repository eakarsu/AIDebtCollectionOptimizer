import React, { useState } from 'react';

export default function HardshipProgramFit() {
  const [form, setForm] = useState({ incomeDropPct: 42, medicalFlag: true, priorPayments: 3, balance: 8700, contactConsent: true });
  const [result, setResult] = useState(null);
  const submit = async () => {
    const response = await fetch('/api/hardship-program-fit/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify(form),
    });
    setResult(await response.json());
  };
  return (
    <div className="page">
      <h1>Hardship Program Fit</h1>
      {Object.entries(form).map(([key, value]) => (
        <label key={key}>{key.replace(/([A-Z])/g, ' $1')}
          {typeof value === 'boolean'
            ? <input type="checkbox" checked={value} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
            : <input type="number" value={value} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />}
        </label>
      ))}
      <button onClick={submit}>Score fit</button>
      {result && <section><h2>{result.level.toUpperCase()} · {result.score}/100</h2><ul>{result.actions.map((action) => <li key={action}>{action}</li>)}</ul></section>}
    </div>
  );
}
