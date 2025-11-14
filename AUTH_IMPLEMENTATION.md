# SoftGenAI Authentication Implementation

This project now includes both **Google OAuth** and **Traditional (Email/Password)** authentication.

## 📋 Features Implemented

### Frontend (React + Vite)
- ✅ Google Sign-In using `@react-oauth/google`
- ✅ Traditional Sign Up (username, email, password)
- ✅ Traditional Sign In (email, password)
- ✅ Home page with user info display
- ✅ Logout functionality
- ✅ Form validation and error messages
- ✅ Automatic navigation after successful auth
- ✅ Clean, responsive UI with CSS animations

### Backend (Node.js + Express)
- ✅ POST `/api/auth/google` - Google OAuth verification
- ✅ POST `/api/auth/signup` - Traditional signup
- ✅ POST `/api/auth/login` - Traditional login
- ✅ CORS enabled for frontend requests
- ✅ Environment variable support

## 🗂️ File Structure

```
client/src/
├── App.jsx                           # Main app with routing
├── main.jsx                          # App entry point
├── components/
│   └── GoogleLoginButton.jsx        # Google OAuth button
└── routes/
    ├── Login.jsx                     # Google login page
    ├── SignUp.jsx                    # Traditional signup page
    ├── SignIn.jsx                    # Traditional signin page
    ├── Home.jsx                      # Protected home page
    ├── Auth.css                      # Shared auth styles
    └── Home.css                      # Home page styles

server/
└── index.js                          # Express server with all endpoints
```

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id_here
```

Start the server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Start the development server:
```bash
npm run dev
```

## 🔐 Routes

- `/` - Redirects to Sign In
- `/signin` - Traditional sign in page
- `/signup` - Traditional sign up page
- `/login` - Google OAuth login page
- `/home` - Protected home page (after successful auth)

## 🔄 Authentication Flow

### Traditional Sign Up
1. User enters username, email, and password
2. Frontend validates inputs
3. POST request to `/api/auth/signup`
4. Backend creates user (in-memory for now)
5. Success → Navigate to `/home`

### Traditional Sign In
1. User enters email and password
2. Frontend validates inputs
3. POST request to `/api/auth/login`
4. Backend verifies credentials
5. Success → Store user data in localStorage → Navigate to `/home`

### Google Sign In
1. User clicks Google Sign-In button
2. Google OAuth flow completes
3. Frontend receives credential token
4. POST token to `/api/auth/google`
5. Backend verifies with Google
6. Success → Store user data in localStorage → Navigate to `/home`

## ⚠️ Important Notes for Production

### Security Improvements Needed:

1. **Password Hashing**: Install and use `bcrypt`
   ```bash
   npm install bcrypt
   ```
   
2. **Database**: Replace in-memory storage with MongoDB or PostgreSQL
   ```bash
   npm install mongoose  # for MongoDB
   # or
   npm install pg        # for PostgreSQL
   ```

3. **JWT Tokens**: Implement JWT for session management
   ```bash
   npm install jsonwebtoken
   ```

4. **Environment Variables**: Never commit `.env` files
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation

5. **Input Validation**: Add validation library
   ```bash
   npm install express-validator
   ```

6. **HTTPS**: Use HTTPS in production
7. **Rate Limiting**: Add rate limiting to prevent brute force
   ```bash
   npm install express-rate-limit
   ```

## 📝 Sample Backend Enhancement (Production-Ready)

```javascript
// Install: npm install bcrypt jsonwebtoken
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Signup with hashed password
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Save to database
  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });
  
  // Generate JWT
  const token = jwt.sign(
    { userId: user.id }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  res.json({ token, user: { id: user.id, username, email } });
});

// Login with password verification
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  // Compare passwords
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  // Generate JWT
  const token = jwt.sign(
    { userId: user.id }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  res.json({ token, user: { id: user.id, username: user.username, email } });
});
```

## 🎨 UI Features

- Modern gradient backgrounds
- Smooth animations and transitions
- Responsive design (mobile-friendly)
- Loading states during API calls
- Error message displays
- Form validation feedback

## 🐛 Troubleshooting

### Issue: Google login not working
- Check if `VITE_GOOGLE_CLIENT_ID` is set correctly in client `.env`
- Check if `GOOGLE_CLIENT_ID` is set correctly in server `.env`
- Verify Google OAuth consent screen is configured

### Issue: Cannot connect to backend
- Make sure backend is running on port 5000
- Check CORS configuration
- Verify fetch URLs match backend port

### Issue: User data not persisting
- Current implementation uses in-memory storage (resets on server restart)
- Implement a database for production use

## 📦 Dependencies

### Frontend
- react
- react-router-dom
- @react-oauth/google
- jwt-decode

### Backend
- express
- cors
- dotenv
- google-auth-library

## 🤝 Contributing

1. Add database integration (MongoDB/PostgreSQL)
2. Implement JWT tokens
3. Add password hashing with bcrypt
4. Add input validation
5. Add rate limiting
6. Add email verification
7. Add password reset functionality

---

**Note**: This is a development implementation. Please implement the security improvements mentioned above before deploying to production!
