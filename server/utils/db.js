// db.js
const mongoose = require('mongoose');

/**
 * Connect to MongoDB using mongoose.
 * - Validates the URI is present.
 * - Catches common DNS / SRV errors and prints actionable guidance.
 *
 * @param {string} uri - MongoDB connection string (from env)
 */
async function connectDB(uri) {
  if (!uri) throw new Error('Missing MongoDB URI (set MONGODB_URI in your .env)');

  try {
    // await the connection so caller can start the HTTP server after DB ready
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (err) {
    // Provide clearer troubleshooting guidance for common SRV / DNS failures.
    if (err && (err.code === 'ENOTFOUND' || (err.message && err.message.includes('querySrv')))) {
      console.error('\nMongoDB SRV/DNS lookup failed. This usually means Node could not resolve the Atlas SRV record.');
      console.error(' - Check that your MONGODB_URI is correct (cluster host and name).');
      console.error(' - Ensure you have network access / DNS resolution (try `nslookup <your-cluster>.mongodb.net`).');
      console.error(' - If you are behind a firewall, proxy, or corporate network, allow DNS/SRV records or use a standard connection string (mongodb://host:port).');
      console.error(' - For Atlas, make sure your cluster exists and the hostname matches (and your IP is whitelisted if required).\n');
    }

    // Re-throw so the caller (typically index.js) can handle process exit / retries.
    throw err;
  }
}

module.exports = connectDB;