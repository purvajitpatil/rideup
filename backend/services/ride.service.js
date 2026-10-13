const crypto = require('crypto');
const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');

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
    fare: fare[vehicleType], distance: distance.value, duration: duration.value,
  });
};
