const crypto = require('crypto');
const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const mapService = require('./maps.service');

const RADIUS_M = 20000; // captains within 20 km of the pickup are notified

async function getFare(pickup, destination) {
  if (!pickup || !destination) throw new Error('Pickup and destination are required');
  const { distance, duration } = await mapService.getDistanceTime(pickup, destination);
  const rate = {
    auto: { base: 30, perKm: 10, perMin: 2 },
    car: { base: 50, perKm: 15, perMin: 3 },
    moto: { base: 20, perKm: 8, perMin: 1.5 },
  };
  const km = distance.value / 1000, min = duration.value / 60;
  const calc = (r) => Math.round(r.base + km * r.perKm + min * r.perMin);
  return { auto: calc(rate.auto), car: calc(rate.car), moto: calc(rate.moto) };
}
module.exports.getFare = getFare;

const getOtp = (num) => crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();

module.exports.createRide = async ({ user, pickup, destination, vehicleType }) => {
  if (!user || !pickup || !destination || !vehicleType) throw new Error('All fields are required');
  const fare = await getFare(pickup, destination);
  const { distance, duration } = await mapService.getDistanceTime(pickup, destination);
  return rideModel.create({
    user, pickup, destination, otp: getOtp(6),
    fare: fare[vehicleType], distance: distance.value, duration: duration.value, vehicleType,
  });
};

// vehicle the rider asked for -> captain vehicle types that can serve it
const SERVES = { auto: ['auto'], car: ['car'], moto: ['motorcycle'] };

module.exports.getCaptainsInRadius = async (pickup, vehicleType) => {
  const point = await mapService.getAddressCoordinate(pickup);
  const captains = await captainModel.find({ status: 'active', 'vehicle.vehicleType': { $in: SERVES[vehicleType] || [] } });
  return captains.filter((c) => c.location && typeof c.location.ltd === 'number' && mapService.haversine(point, c.location) <= RADIUS_M);
};

module.exports.getOpenRidesNear = async (captain) => {
  if (!captain.location || typeof captain.location.ltd !== 'number') return [];
  const types = Object.keys(SERVES).filter((k) => SERVES[k].includes(captain.vehicle.vehicleType));
  const pending = await rideModel.find({ status: 'pending', captain: { $exists: false }, vehicleType: { $in: types } }).populate('user').sort({ _id: -1 }).limit(20);
  const out = [];
  for (const r of pending) {
    try {
      const pt = await mapService.getAddressCoordinate(r.pickup);
      if (mapService.haversine(pt, captain.location) <= RADIUS_M) out.push(r);
    } catch (e) { /* unresolvable pickup: skip */ }
  }
  return out;
};

const full = (id) => rideModel.findOne({ _id: id }).populate('user').populate('captain').select('+otp');

module.exports.confirmRide = async ({ rideId, captain }) => {
  // atomic: only one captain can take a pending ride
  const r = await rideModel.updateOne({ _id: rideId, status: 'pending', captain: { $exists: false } }, { $set: { status: 'accepted', captain: captain._id } });
  if (r.matchedCount === 0) throw new Error('Ride is no longer available');
  return full(rideId);
};

module.exports.startRide = async ({ rideId, otp, captain }) => {
  const ride = await full(rideId);
  if (!ride || String(ride.captain && ride.captain._id) !== String(captain._id)) throw new Error('Ride not found');
  if (ride.status !== 'accepted') throw new Error('Ride is not accepted');
  if (ride.otp !== String(otp)) throw new Error('Invalid OTP');
  await rideModel.updateOne({ _id: rideId }, { $set: { status: 'ongoing' } });
  return full(rideId);
};

module.exports.endRide = async ({ rideId, captain }) => {
  const ride = await full(rideId);
  if (!ride || String(ride.captain && ride.captain._id) !== String(captain._id)) throw new Error('Ride not found');
  if (ride.status !== 'ongoing') throw new Error('Ride is not ongoing');
  await rideModel.updateOne({ _id: rideId }, { $set: { status: 'completed' } });
  return full(rideId);
};

module.exports.activeRideFor = (filter) =>
  rideModel.findOne({ ...filter, status: { $in: ['pending', 'accepted', 'ongoing'] } }).sort({ _id: -1 }).populate('user').populate('captain').select('+otp');
