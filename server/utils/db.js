// db.js 
const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) throw new Error('Missing MongoDB URI');
  return mongoose.connect(uri, {
    // these are defaults in modern mongoose, but safe to include
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('Connected to MongoDB');
  });
}

module.exports = connectDB;