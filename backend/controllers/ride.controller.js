const rideService = require('../services/ride.service');
const rideModel = require('../models/ride.model');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { pickup, destination, vehicleType } = req.body;
  try {
    const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
    // otp is select:false on reads, but the rider needs it once right after booking
    res.status(201).json({ ...ride.toObject() });
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
  const rides = await rideModel.find({ user: req.user._id });
  res.status(200).json(rides);
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
  res.status(200).json(await rideModel.findById(req.params.id));
};

module.exports.deleteRide = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ride id' });
  const result = await rideModel.deleteOne({ _id: req.params.id, user: req.user._id });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Ride not found' });
  res.status(200).json({ message: 'Ride deleted' });
};
