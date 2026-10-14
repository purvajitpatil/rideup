const mapService = require('../services/maps.service');
const { validationResult } = require('express-validator');

module.exports.getCoordinates = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    res.status(200).json(await mapService.getAddressCoordinate(req.query.address));
  } catch (e) { res.status(404).json({ message: 'Coordinates not found' }); }
};
module.exports.getDistanceTime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    res.status(200).json(await mapService.getDistanceTime(req.query.origin, req.query.destination));
  } catch (e) { res.status(404).json({ message: 'No routes found' }); }
};
module.exports.getAutoCompleteSuggestions = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    res.status(200).json(await mapService.getAutoCompleteSuggestions(req.query.input));
  } catch (e) { res.status(500).json({ message: 'Unable to fetch suggestions' }); }
};
