import React from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  return (
    <div className="auth-container auth-container-full">
      <div className="auth-card auth-card-centered">
        <div className="auth-brand-inline">
          <h1>✨ SoftGenAI</h1>
          <p>Secure collaboration workspace</p>
        </div>

        <h2 className="auth-title">Choose how you want to sign in</h2>
        <p className="auth-subtitle">Use your workspace credentials to continue</p>

        <div className="auth-footer" style={{ marginTop: "32px" }}>
          <p>
            Ready to work together?{" "}
            <Link to="/signin" className="auth-link">
              Sign In
            </Link>
          </p>
          <p>
            Need an account?{" "}
            <Link to="/signup" className="auth-link">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
