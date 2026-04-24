import React, { useState } from 'react'
import { login, getDefaults } from '../services/api'

export default function LoginPage({ onLogin, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAutoFill = async () => {
    try {
      const defaults = await getDefaults();
      setEmail(defaults.email);
      setPassword(defaults.password);
      showToast('Credentials populated!', 'info');
    } catch (err) {
      showToast('Failed to get defaults', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        onLogin(result.token, result.user);
        showToast('Welcome back!', 'success');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>AI Debt Collection Optimizer</h1>
          <p>Compliance-aware, empathetic AI-powered collections</p>
        </div>

        <button className="btn btn-auto-fill btn-full btn-lg" onClick={handleAutoFill}>
          Auto-Fill Credentials
        </button>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
