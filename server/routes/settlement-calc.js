const express = require('express');
const router = express.Router();

// POST /api/settlement-calc/calculate
router.post('/calculate', (req, res) => {
  try {
    const { original_amount, debt_age_days, risk_level, payment_history_score } = req.body;

    if (!original_amount || original_amount <= 0) {
      return res.status(400).json({ error: 'original_amount must be a positive number' });
    }

    // Calculate factors (all in percentage points of discount)
    // Age factor: older debt gets higher discount (0-15%)
    const ageDays = debt_age_days || 0;
    let ageFactor = 0;
    if (ageDays > 365) ageFactor = 15;
    else if (ageDays > 180) ageFactor = 10;
    else if (ageDays > 90) ageFactor = 5;
    else ageFactor = 2;

    // Risk factor: higher risk gets higher discount (0-15%)
    const riskMap = { low: 2, medium: 5, high: 10, critical: 15 };
    const riskFactor = riskMap[risk_level] || 5;

    // Payment history factor: poor history gets higher discount (0-10%)
    // payment_history_score: 0 (worst) to 100 (best)
    const historyScore = payment_history_score != null ? payment_history_score : 50;
    const historyFactor = Math.round((100 - historyScore) / 10);

    // Build settlement options
    const options = [
      {
        type: 'lump_sum',
        description: 'One-time lump sum payment',
        months: 0,
        baseDiscount: 50,
        minRate: 40,
        maxRate: 60
      },
      {
        type: '3_month_plan',
        description: '3-month installment plan',
        months: 3,
        baseDiscount: 32,
        minRate: 60,
        maxRate: 75
      },
      {
        type: '6_month_plan',
        description: '6-month installment plan',
        months: 6,
        baseDiscount: 20,
        minRate: 75,
        maxRate: 85
      },
      {
        type: '12_month_plan',
        description: '12-month installment plan',
        months: 12,
        baseDiscount: 10,
        minRate: 85,
        maxRate: 95
      }
    ];

    const settlementOptions = options.map(opt => {
      const totalDiscount = opt.baseDiscount + ageFactor + riskFactor + historyFactor;
      // Ensure payment percentage stays within the allowed range
      let paymentPercentage = 100 - totalDiscount;
      paymentPercentage = Math.max(opt.minRate, Math.min(opt.maxRate, paymentPercentage));

      const settlementAmount = Math.round(original_amount * (paymentPercentage / 100) * 100) / 100;
      const savings = Math.round((original_amount - settlementAmount) * 100) / 100;
      const monthlyPayment = opt.months > 0
        ? Math.round((settlementAmount / opt.months) * 100) / 100
        : settlementAmount;

      return {
        type: opt.type,
        description: opt.description,
        paymentPercentage,
        discountPercentage: Math.round((100 - paymentPercentage) * 100) / 100,
        settlementAmount,
        savings,
        monthlyPayment,
        months: opt.months || 1
      };
    });

    res.json({
      originalAmount: original_amount,
      factors: {
        ageFactor,
        riskFactor,
        historyFactor,
        debtAgeDays: ageDays,
        riskLevel: risk_level || 'medium',
        paymentHistoryScore: historyScore
      },
      options: settlementOptions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
