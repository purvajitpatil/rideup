// Allowed frontend origins (comma-separated in CORS_ORIGIN). Empty = allow all.
const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
module.exports = { origins };
