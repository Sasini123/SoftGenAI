require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require('./utils/db');
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

app.use(cors());
app.use(express.json());

// Register routes 
// Centralized route setup
const setupRoutes = require('./setupRoutes');
setupRoutes(app);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory user storage (Replace with a database in production!)
// For production, use MongoDB/PostgreSQL and bcrypt for password hashing
const users = [];

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

// Helper: generate JWT for a user (do NOT include password)
function generateTokenForUser(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Traditional Sign Up endpoint
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // In production, hash the password using bcrypt!
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString(), // In production, use proper ID generation
      username,
      email,
      password, // Store hashed password in production!
      createdAt: new Date(),
    };

    users.push(newUser);

    // Don't send password back to client
    const { password: _, ...userWithoutPassword } = newUser;

    // Generate token for the new user
    const token = generateTokenForUser(userWithoutPassword);

    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Traditional Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by username
    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // In production, compare hashed passwords using bcrypt!
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = password === user.password; // Simplified for demo

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Don't send password back to client
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateTokenForUser(userWithoutPassword);

    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Google Authentication endpoint
app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, name, email, picture } = payload;

    // Find or create user in in-memory store
    let user = users.find((u) => u.email === email);
    if (!user) {
      user = {
        id: sub,
        username: name,
        email,
        picture,
        createdAt: new Date(),
      };
      users.push(user);
    }

    // Generate JWT for our frontend sessions
    const appToken = generateTokenForUser(user);

    res.json({
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        picture: user.picture || picture,
      },
      token: appToken,
      message: "Google user verified successfully!",
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(400).json({ error: "Invalid Google token" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
