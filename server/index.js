require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require('./utils/db');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Register routes 
// Centralized route setup
const setupRoutes = require('./setupRoutes');
setupRoutes(app);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});
// Start server only after DB connection succeeds. This avoids handling
// requests before DB is ready and prevents calling listen() twice.
connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    // Keep process alive for debugging when running under nodemon; exit when
    // not under a supervisor or if desired. We'll exit with failure code.
    process.exit(1);
  });