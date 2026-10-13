const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/create', authMiddleware.authUser,
  body('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
  body('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
  body('vehicleType').isString().isIn(['auto', 'car', 'moto']).withMessage('Invalid vehicle type'),
  rideController.createRide);

router.get('/get-fare', authMiddleware.authUser,
  query('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup'),
  query('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination'),
  rideController.getFare);

router.get('/', authMiddleware.authUser, rideController.listRides);
router.get('/:id', authMiddleware.authUser, rideController.getRide);
router.put('/:id', authMiddleware.authUser,
  body('status').isIn(['pending', 'accepted', 'ongoing', 'completed', 'cancelled']).withMessage('Invalid status'),
  rideController.updateRideStatus);
router.delete('/:id', authMiddleware.authUser, rideController.deleteRide);

module.exports = router;
