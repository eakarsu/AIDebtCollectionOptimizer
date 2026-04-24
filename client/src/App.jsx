import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import FeaturePage from './pages/FeaturePage'
import DebtorProfile from './pages/DebtorProfile'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AuditLog from './pages/AuditLog'
import SettlementCalculator from './pages/SettlementCalculator'
import Header from './components/Header'
import Toast from './components/Toast'

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.error) { handleLogout(); return; }
          setUser(data);
        })
        .catch(() => handleLogout());
    }
  }, [token]);

  const handleLogin = (tok, usr) => {
    localStorage.setItem('token', tok);
    setToken(tok);
    setUser(usr);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!token) {
    return (
      <>
        <LoginPage onLogin={handleLogin} showToast={showToast} />
        {toast && <Toast {...toast} />}
      </>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feature/:featureKey" element={<FeaturePage showToast={showToast} />} />
          <Route path="/debtor/:id" element={<DebtorProfile showToast={showToast} />} />
          <Route path="/reports" element={<Reports showToast={showToast} />} />
          <Route path="/settings" element={<Settings showToast={showToast} user={user} />} />
          <Route path="/audit" element={<AuditLog showToast={showToast} />} />
          <Route path="/calculator" element={<SettlementCalculator showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {toast && <Toast {...toast} />}
      </div>
    </BrowserRouter>
  );
}
