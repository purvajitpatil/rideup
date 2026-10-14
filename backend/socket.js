const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { origins } = require('./config');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
const rideModel = require('./models/ride.model');
const blackListTokenModel = require('./models/blacklistToken.model');

let io;

function initializeSocket(server) {
  io = new Server(server, { cors: { origin: origins.length ? origins : '*' } });

  // Every socket must present a valid, non-blacklisted JWT and say whether it is a rider or a captain.
  io.use(async (socket, next) => {
    try {
      const { token, role } = socket.handshake.auth || {};
      if (!token || !['user', 'captain'].includes(role)) return next(new Error('Unauthorized'));
      if (await blackListTokenModel.findOne({ token })) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const Model = role === 'captain' ? captainModel : userModel;
      if (!(await Model.findById(decoded._id))) return next(new Error('Unauthorized'));
      socket.data = { role, id: decoded._id };
      next();
    } catch (e) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const { role, id } = socket.data;
    const Model = role === 'captain' ? captainModel : userModel;
    await Model.updateOne({ _id: id }, { $set: { socketId: socket.id } });

    socket.on('update-location-captain', async (loc) => {
      if (role !== 'captain' || !loc || typeof loc.ltd !== 'number' || typeof loc.lng !== 'number') return;
      await captainModel.updateOne({ _id: id }, { $set: { location: { ltd: loc.ltd, lng: loc.lng } } });
      // forward to the rider of this captain's active ride so the map can follow the car
      const ride = await rideModel.findOne({ captain: id, status: { $in: ['accepted', 'ongoing'] } }).populate('user');
      if (ride && ride.user && ride.user.socketId) {
        io.to(ride.user.socketId).emit('captain-moved', { rideId: ride._id, location: { ltd: loc.ltd, lng: loc.lng } });
      }
    });
  });
}

function sendMessageToSocketId(socketId, event, data) {
  if (io && socketId) io.to(socketId).emit(event, data);
}

module.exports = { initializeSocket, sendMessageToSocketId };
