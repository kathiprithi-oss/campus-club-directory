function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = req.get('x-admin-token');
  if (!expected) return res.status(503).json({ error: 'Admin management is not configured on the server.' });
  if (typeof supplied !== 'string' || supplied.length !== expected.length || !safeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'A valid admin token is required for this action.' });
  }
  next();
}
function safeEqual(a, b) {
  const crypto = require('node:crypto');
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
module.exports = { requireAdmin };
