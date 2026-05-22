const router = require('express').Router();

router.post('/score', (req, res) => {
  const { incomeDropPct = 0, medicalFlag = false, priorPayments = 0, balance = 0, contactConsent = true } = req.body || {};
  const score = Math.min(100, Math.round(
    Number(incomeDropPct) * 0.7 +
    (medicalFlag ? 20 : 0) +
    Math.min(20, Number(priorPayments) * 4) +
    Math.min(15, Number(balance) / 1000) +
    (contactConsent ? 0 : 15)
  ));
  res.json({
    feature: 'hardship_program_fit',
    score,
    level: score >= 70 ? 'offer-hardship' : score >= 35 ? 'review' : 'standard-plan',
    actions: [
      Number(incomeDropPct) > 30 && 'Offer reduced payment hardship plan.',
      medicalFlag && 'Route to sensitive hardship handling queue.',
      !contactConsent && 'Use compliant non-phone outreach channel only.',
    ].filter(Boolean),
  });
});

module.exports = router;
