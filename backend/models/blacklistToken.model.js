const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  // entries expire after 24h, the same lifetime as the JWT
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

module.exports = mongoose.model('BlacklistToken', blacklistTokenSchema);
