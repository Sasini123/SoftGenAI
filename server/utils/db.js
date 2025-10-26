// db.js
const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) throw new Error('Missing MongoDB URI');
  // Modern mongoose / driver enable the correct parser/topology by default.
  // We await the connection so callers can start the server after DB is ready.
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = connectDB;