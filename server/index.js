const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OAuth2Client } = require("google-auth-library");

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


app.get("/", (req, res) => {
  res.send("Backend is running...");
});


app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, name, email, picture } = payload;

    // Optionally: save user to database here

    res.json({
      id: sub,
      name,
      email,
      picture,
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
