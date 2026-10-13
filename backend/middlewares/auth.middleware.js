const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const blackListTokenModel = require('../models/blacklistToken.model');
const jwt = require('jsonwebtoken');

const getToken = (req) => req.cookies.token || (req.headers.authorization || '').split(' ')[1];

async function verify(req, res, Model) {
  const token = getToken(req);
  if (!token) return { fail: res.status(401).json({ message: 'Unauthorized' }) };
  if (await blackListTokenModel.findOne({ token })) return { fail: res.status(401).json({ message: 'Unauthorized' }) };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doc = await Model.findById(decoded._id);
    if (!doc) return { fail: res.status(401).json({ message: 'Unauthorized' }) };
    return { doc };
  } catch (err) {
    return { fail: res.status(401).json({ message: 'Unauthorized' }) };
  }
}

module.exports.authUser = async (req, res, next) => {
  const r = await verify(req, res, userModel);
  if (r.fail) return;
  req.user = r.doc;
  return next();
};
module.exports.authCaptain = async (req, res, next) => {
  const r = await verify(req, res, captainModel);
  if (r.fail) return;
  req.captain = r.doc;
  return next();
};
