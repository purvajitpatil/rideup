const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const blackListTokenModel = require('../models/blacklistToken.model');
const { validationResult } = require('express-validator');

module.exports.registerCaptain = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { fullname, email, password, vehicle } = req.body;
  if (await captainModel.findOne({ email })) return res.status(400).json({ message: 'Captain already exist' });
  const hashedPassword = await captainModel.hashPassword(password);
  const captain = await captainService.createCaptain({
    firstname: fullname.firstname,
    lastname: fullname.lastname,
    email,
    password: hashedPassword,
    color: vehicle.color,
    plate: vehicle.plate,
    capacity: vehicle.capacity,
    vehicleType: vehicle.vehicleType,
  });
  const token = captain.generateAuthToken();
  captain.password = undefined;
  res.status(201).json({ token, captain });
};

module.exports.loginCaptain = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  const captain = await captainModel.findOne({ email }).select('+password');
  if (!captain || !(await captain.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
  const token = captain.generateAuthToken();
  res.cookie('token', token);
  captain.password = undefined;
  res.status(200).json({ token, captain });
};

module.exports.getCaptainProfile = async (req, res) => res.status(200).json({ captain: req.captain });

module.exports.logoutCaptain = async (req, res) => {
  const token = req.cookies.token || (req.headers.authorization || '').split(' ')[1];
  await blackListTokenModel.create({ token });
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successfully' });
};

module.exports.setStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const update = { status: req.body.status };
  if (req.body.location) update.location = { ltd: req.body.location.ltd, lng: req.body.location.lng };
  await captainModel.updateOne({ _id: req.captain._id }, { $set: update });
  const captain = await captainModel.findById(req.captain._id);
  res.status(200).json({ captain });
};
