const mongoose = require('mongoose');

let isConnecting = false;

async function connectToDb(maxRetries = 5) {
  if (isConnecting) return;
  isConnecting = true;

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.DB_CONNECT, {
        // These options are defaults in Mongoose 7.x but kept for clarity
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // IPv4 only to avoid IPv6 DNS issues in some environments
      });
      console.log('Connected to DB');
      isConnecting = false;
      return;
    } catch (err) {
      lastError = err;
      console.log(`DB connect attempt ${attempt}/${maxRetries} failed:`, err.message);
      // Wait before retrying — exponential backoff: 2s, 4s, 8s, 16s (capped at maxRetries)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  isConnecting = false;
  console.log('Failed to connect to DB after all retries. App may behave unexpectedly.');
  // Don't throw — let the app start so health checks work; individual routes will return 500 until DB comes back
}

module.exports = connectToDb;
