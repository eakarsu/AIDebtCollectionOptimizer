require('dotenv').config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}
for (const key of ['DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}
if (process.env.NODE_ENV === 'production' && (!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS.includes('*'))) {
  throw new Error('Production CORS_ORIGINS must be an explicit allowlist');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const debtorRoutes = require('./routes/debtors');
const campaignRoutes = require('./routes/campaigns');
const paymentPlanRoutes = require('./routes/paymentPlans');
const communicationRoutes = require('./routes/communications');
const complianceRoutes = require('./routes/compliance');
const riskRoutes = require('./routes/risk');
const analyticsRoutes = require('./routes/analytics');
const disputeRoutes = require('./routes/disputes');
const paymentRoutes = require('./routes/payments');
const agentRoutes = require('./routes/agents');
const portfolioRoutes = require('./routes/portfolios');
const settlementRoutes = require('./routes/settlements');
const scheduleRoutes = require('./routes/schedules');
const regulatoryRoutes = require('./routes/regulatory');
const predictionRoutes = require('./routes/predictions');
const aiRoutes = require('./routes/ai');
const autoScoreRoutes = require('./routes/autoScore');
const aiNewRoutes = require('./routes/aiNew');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const debtorProfileRoutes = require('./routes/debtorProfile');
const bulkRoutes = require('./routes/bulk');
const reportRoutes = require('./routes/reports');
const settlementCalcRoutes = require('./routes/settlement-calc');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — env-driven allow list (CORS_ORIGINS=https://a.com,https://b.com), fallback '*' in dev.
const corsOrigins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/debtors', debtorRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payment-plans', paymentPlanRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/regulatory', regulatoryRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auto-score', autoScoreRoutes);
app.use('/api/ai', aiNewRoutes);





app.use('/api/ai', require('./routes/debtorSegment'));
app.use('/api/ai', require('./routes/complianceRisk'));
app.use('/api/ai', require('./routes/fraudDetect'));
app.use('/api/ai', require('./routes/settlementOptimize'));
app.use('/api/ai', require('./routes/contactStrategy'));
app.use('/api/ai-features', require('./routes/aiFeatures'));
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/debtor-profile', debtorProfileRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settlement-calc', settlementCalcRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hardship-program-fit', require('./routes/hardshipProgramFit'));
app.use('/api/governed-workflows', require('./routes/governedWorkflow'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schema changes are explicit operator actions via scripts/migrate.sh.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
