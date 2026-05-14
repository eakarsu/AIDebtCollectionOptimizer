
// // === Batch 02 Gaps & Frontend Mounts ===
import CfPredictiveContactStrategy from './pages/CfPredictiveContactStrategy';
import CfDynamicSettlementOptimization from './pages/CfDynamicSettlementOptimization';
import CfFraudDetection from './pages/CfFraudDetection';
import CfPredictiveComplianceRisk from './pages/CfPredictiveComplianceRisk';
import CfDebtorSegmentationTargeting from './pages/CfDebtorSegmentationTargeting';
import GapCriticalOnly1AiEndpointFor30RoutesMissingScoreDebt from './pages/GapCriticalOnly1AiEndpointFor30RoutesMissingScoreDebt';
import GapNoPhoneSystemIntegrationForAutomatedOutreachSmsEmail from './pages/GapNoPhoneSystemIntegrationForAutomatedOutreachSmsEmail';
import GapLimitedCreditBureauIntegration from './pages/GapLimitedCreditBureauIntegration';
import GapNoAutomatedFdcpaTcpaComplianceValidationEngine from './pages/GapNoAutomatedFdcpaTcpaComplianceValidationEngine';
import GapNoWebhooks from './pages/GapNoWebhooks';
import GapNoMobileApiSurface from './pages/GapNoMobileApiSurface';
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
import AIFeatures from './pages/AIFeatures'
import AINewFeatures from './pages/AINewFeatures'
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
          <Route path="/ai-features" element={<AIFeatures showToast={showToast} />} />
          <Route path="/ai-new" element={<AINewFeatures showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" />} />
        
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/predictive-contact-strategy" element={<CfPredictiveContactStrategy />} />
        <Route path="/cf/dynamic-settlement-optimization" element={<CfDynamicSettlementOptimization />} />
        <Route path="/cf/fraud-detection" element={<CfFraudDetection />} />
        <Route path="/cf/predictive-compliance-risk" element={<CfPredictiveComplianceRisk />} />
        <Route path="/cf/debtor-segmentation-targeting" element={<CfDebtorSegmentationTargeting />} />
        <Route path="/gap/critical-only-1-ai-endpoint-for-30-routes-missing-score-debt" element={<GapCriticalOnly1AiEndpointFor30RoutesMissingScoreDebt />} />
        <Route path="/gap/no-phone-system-integration-for-automated-outreach-sms-email" element={<GapNoPhoneSystemIntegrationForAutomatedOutreachSmsEmail />} />
        <Route path="/gap/limited-credit-bureau-integration" element={<GapLimitedCreditBureauIntegration />} />
        <Route path="/gap/no-automated-fdcpa-tcpa-compliance-validation-engine" element={<GapNoAutomatedFdcpaTcpaComplianceValidationEngine />} />
        <Route path="/gap/no-webhooks" element={<GapNoWebhooks />} />
        <Route path="/gap/no-mobile-api-surface" element={<GapNoMobileApiSurface />} />
      </Routes>
        {toast && <Toast {...toast} />}
      </div>
    </BrowserRouter>
  );
}
