const express = require('express');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { prompt, context, feature } = req.body;

    const systemPrompts = {
      debtors: 'You are an AI debt collection specialist. Analyze debtor profiles and provide actionable insights for collection strategies. Be empathetic and compliance-aware.',
      campaigns: 'You are an AI marketing strategist for debt collection campaigns. Optimize outreach strategies for maximum recovery while maintaining ethical standards.',
      'payment-plans': 'You are an AI financial advisor specializing in debt repayment plans. Create realistic, debtor-friendly payment structures that maximize recovery.',
      communications: 'You are an AI communication expert for debt collection. Generate empathetic, professional, and FDCPA-compliant message templates.',
      compliance: 'You are an AI compliance officer specializing in debt collection regulations (FDCPA, TCPA, state laws). Provide thorough compliance assessments.',
      risk: 'You are an AI risk analyst for debt collection. Assess collection probability and recommend optimal strategies based on debtor profiles.',
      analytics: 'You are an AI data analyst for debt collection metrics. Provide insights on performance trends and optimization opportunities.',
      disputes: 'You are an AI dispute resolution specialist. Analyze disputes and recommend fair, compliant resolution strategies.',
      payments: 'You are an AI payment processing analyst. Track and optimize payment collection processes.',
      agents: 'You are an AI performance coach for collection agents. Analyze agent metrics and provide improvement recommendations.',
      portfolios: 'You are an AI portfolio analyst for debt collection. Assess portfolio health and recommend optimization strategies.',
      settlements: 'You are an AI settlement negotiation specialist. Calculate optimal settlement offers that balance recovery with debtor capabilities.',
      schedules: 'You are an AI scheduling optimizer for debt collection contacts. Determine optimal contact times and channels.',
      regulatory: 'You are an AI regulatory analyst for the debt collection industry. Monitor and interpret regulatory changes and their impact.',
      predictions: 'You are an AI predictive analyst for debt recovery. Forecast recovery probabilities and recommend strategies.'
    };

    const systemPrompt = systemPrompts[feature] || systemPrompts.debtors;
    const fullPrompt = context ? `Context: ${context}\n\nRequest: ${prompt}` : prompt;

    const result = await callOpenRouter(fullPrompt, systemPrompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
