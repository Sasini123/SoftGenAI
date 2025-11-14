// db.js 
const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    // Throw an informative error so the caller can decide how to handle it
    throw new Error('Missing MongoDB URI. Set MONGODB_URI in your .env file');
  }

  // Connect using modern mongoose defaults. Return the connection promise so
  // the caller can await it and decide whether to start the server.
  return mongoose.connect(uri)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      // Provide additional context for DNS lookup failures or auth issues
      console.error('MongoDB connection error:', err.message || err);
      throw err;
    });
}

module.exports = connectDB;