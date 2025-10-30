import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    
    // Navigate to sign in page
    navigate("/signin");
  };

  return (
    <div className="home-container">
      <nav className="home-nav">
        <div className="nav-brand">✨ SoftGenAI</div>
        <button onClick={handleLogout} className="logout-button-nav">
          Log Out
        </button>
      </nav>
      
      <div className="home-content-wrapper">
        <div className="home-hero">
          <h1 className="home-title">Hello, this is homepage</h1>
          
          {user && (
            <div className="user-welcome">
              <div className="user-avatar-large">
                {user.picture ? (
                  <img src={user.picture} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    {(user.name || user.username || user.email)?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="welcome-message">
                Hello, {user.name || user.username || user.email}! 👋
              </h2>
              <p className="user-email-display">{user.email}</p>
            </div>
          )}

          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Quick Start</h3>
              <p>Get started with AI-powered development tools</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Smart Features</h3>
              <p>Explore intelligent code generation and automation</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Track your development progress and insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
