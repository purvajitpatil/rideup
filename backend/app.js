const dotenv = require('dotenv');
dotenv.config({ quiet: true });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');

connectToDb();

const app = express();
const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
// Token is sent in the Authorization header, so credentials/cookies are not required cross-origin.
app.use(cors(origins.length ? { origin: origins } : undefined));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => res.send('Hello World'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

module.exports = app;
