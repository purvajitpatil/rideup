const rideService = require('../services/ride.service');
const rideModel = require('../models/ride.model');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { sendMessageToSocketId } = require('../socket');

const safeForCaptain = (ride) => {
  const o = ride.toObject();
  delete o.otp; // captains must get the OTP from the rider
  if (o.user) delete o.user.socketId;
  return o;
};

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { pickup, destination, vehicleType } = req.body;
  try {
    const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
    res.status(201).json({ ...ride.toObject() }); // the rider sees the OTP once, right after booking

    // notify nearby captains in the background
    (async () => {
      const captains = await rideService.getCaptainsInRadius(pickup, vehicleType);
      const withUser = await rideModel.findById(ride._id).populate('user');
      captains.forEach((c) => sendMessageToSocketId(c.socketId, 'new-ride', safeForCaptain(withUser)));
    })().catch((e) => console.log('notify captains failed:', e.message));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    res.status(200).json(await rideService.getFare(req.query.pickup, req.query.destination));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports.listRides = async (req, res) => {
  const rides = await rideModel.find({ user: req.user._id }).populate('captain');
  res.status(200).json(rides);
};

module.exports.getActiveRide = async (req, res) => {
  const ride = await rideService.activeRideFor({ user: req.user._id });
  res.status(200).json(ride || null);
};

module.exports.getCaptainActiveRide = async (req, res) => {
  const ride = await rideService.activeRideFor({ captain: req.captain._id });
  res.status(200).json(ride ? safeForCaptain(ride) : null);
};

module.exports.getOpenRides = async (req, res) => {
  const rides = await rideService.getOpenRidesNear(req.captain);
  res.status(200).json(rides.map(safeForCaptain));
};

module.exports.getRide = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ride id' });
  const ride = await rideModel.findOne({ _id: req.params.id, user: req.user._id });
  if (!ride) return res.status(404).json({ message: 'Ride not found' });
  res.status(200).json(ride);
};

module.exports.updateRideStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ride id' });
  const result = await rideModel.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { status: req.body.status } });
  if (result.matchedCount === 0) return res.status(404).json({ message: 'Ride not found' });
  const ride = await rideModel.findById(req.params.id).populate('captain');
  if (req.body.status === 'cancelled' && ride.captain) sendMessageToSocketId(ride.captain.socketId, 'ride-cancelled', { rideId: ride._id });
  res.status(200).json(ride);
};

module.exports.deleteRide = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ride id' });
  const result = await rideModel.deleteOne({ _id: req.params.id, user: req.user._id });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Ride not found' });
  res.status(200).json({ message: 'Ride deleted' });
};

// ---- captain actions ----
module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const ride = await rideService.confirmRide({ rideId: req.body.rideId, captain: req.captain });
    sendMessageToSocketId(ride.user.socketId, 'ride-confirmed', ride.toObject());
    res.status(200).json(safeForCaptain(ride));
  } catch (err) { res.status(409).json({ message: err.message }); }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const ride = await rideService.startRide({ rideId: req.body.rideId, otp: req.body.otp, captain: req.captain });
    sendMessageToSocketId(ride.user.socketId, 'ride-started', ride.toObject());
    res.status(200).json(safeForCaptain(ride));
  } catch (err) { res.status(400).json({ message: err.message }); }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const ride = await rideService.endRide({ rideId: req.body.rideId, captain: req.captain });
    sendMessageToSocketId(ride.user.socketId, 'ride-ended', ride.toObject());
    res.status(200).json(safeForCaptain(ride));
  } catch (err) { res.status(400).json({ message: err.message }); }
};
