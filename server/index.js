require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const debtorProfileRoutes = require('./routes/debtorProfile');
const bulkRoutes = require('./routes/bulk');
const reportRoutes = require('./routes/reports');
const settlementCalcRoutes = require('./routes/settlement-calc');
const userRoutes = require('./routes/users');

const { runMigrations } = require('./seeds/migrations');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
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
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/debtor-profile', debtorProfileRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settlement-calc', settlementCalcRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Run migrations then start server
runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to run migrations:', err.message);
    // Start server anyway to not block on migration failures
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (migrations failed)`);
    });
  });
