const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const captainSchema = new mongoose.Schema({
  fullname: {
    firstname: { type: String, required: true, minlength: [3, 'Firstname must be at least 3 characters long'] },
    lastname: { type: String, minlength: [3, 'Lastname must be at least 3 characters long'] },
  },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  socketId: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  vehicle: {
    color: { type: String, required: true, minlength: [3, 'Color must be at least 3 characters long'] },
    plate: { type: String, required: true, minlength: [3, 'Plate must be at least 3 characters long'] },
    capacity: { type: Number, required: true, min: [1, 'Capacity must be at least 1'] },
    vehicleType: { type: String, required: true, enum: ['car', 'motorcycle', 'auto'] },
  },
  location: { ltd: { type: Number }, lng: { type: Number } },
});

captainSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};
captainSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};
captainSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('captain', captainSchema);
