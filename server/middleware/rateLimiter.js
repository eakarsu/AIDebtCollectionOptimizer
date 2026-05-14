const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  validate: false,
  keyGenerator: (req) => {
    if (req.user) return `user:${req.user.id}`;
    const addr = req.socket ? req.socket.remoteAddress : '';
    const raw = req.headers['x-forwarded-for'] || addr || '';
    return String(raw).split(',')[0].trim().replace(/^::ffff:/, '');
  },
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' }
});

module.exports = { aiRateLimiter };
