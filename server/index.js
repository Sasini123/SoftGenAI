require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require("express");
const cors = require("cors");
const connectDB = require('./utils/db');
const dotenv = require("dotenv");
const initSocket = require('./socket');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register routes 
// Centralized route setup
const setupRoutes = require('./setupRoutes');
setupRoutes(app);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});
// Start server only after DB connection succeeds. This avoids handling
// requests before DB is ready and prevents calling listen() twice.
// Try to connect to DB. In production we require it, but for local development
// it's helpful to start the server even if the DB is not reachable.
connectDB(process.env.MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message || err);
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting because NODE_ENV=production and DB is required.');
      process.exit(1);
    }
    console.warn('Continuing to start server without DB connection (development mode).');
    server.listen(PORT, () => console.log(`Server running (no DB) on http://localhost:${PORT}`));
  });

// NOTE: server is started after DB connection succeeds above. Avoid calling
// app.listen here to prevent attempting to start the server twice.
