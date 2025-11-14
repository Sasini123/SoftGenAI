import React from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  return (
    <div className="auth-container auth-container-full">
      <div className="auth-card auth-card-centered">
        <div className="auth-brand-inline">
          <h1>✨ SoftGenAI</h1>
          <p>Quick and secure Google authentication</p>
        </div>

        <h2 className="auth-title">Sign In with Google</h2>
        <p className="auth-subtitle">One click to get started</p>
        
        <div style={{ marginTop: "32px", marginBottom: "32px" }}>
          <GoogleLoginButton />
        </div>

        <div className="auth-footer">
          <p>
            Prefer username?{" "}
            <Link to="/signin" className="auth-link">
              Sign In with Username
            </Link>
          </p>
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="auth-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
