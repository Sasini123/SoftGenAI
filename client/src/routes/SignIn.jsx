import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Auth.css";

const SignIn = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.username || !formData.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      // First, find the user by username in Firestore to get their email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", formData.username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      // Get the user's email from Firestore
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userEmail = userData.email;

      // Sign in with email and password using Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userEmail,
        formData.password
      );

      const user = userCredential.user;

      // Store user data in localStorage
      const storedUserData = {
        uid: user.uid,
        username: userData.username,
        email: user.email,
      };
      localStorage.setItem("user", JSON.stringify(storedUserData));
      localStorage.setItem("authToken", await user.getIdToken());

      console.log("Login successful:", storedUserData);
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);

      // Handle Firebase-specific errors
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Invalid username or password");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid username or password");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container auth-container-full">
      <div className="auth-card auth-card-centered">
        <div className="auth-brand-inline">
          <h1>SoftGenAI</h1>
          <p>Welcome back! Sign in to continue</p>
        </div>

        <h2 className="auth-title">Sign In</h2>
        <p className="auth-subtitle">Use your username and password</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={loading}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
