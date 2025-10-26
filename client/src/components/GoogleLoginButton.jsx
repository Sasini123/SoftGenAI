import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
//import jwtDecode from "jwt-decode";
import * as jwtDecode from "jwt-decode"; 

const GoogleLoginButton = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  console.log("Google Client ID:", clientId); // <-- add this line to debug

  const handleSuccess = (credentialResponse) => {
    const token = credentialResponse.credential;
    const userInfo = jwtDecode(token);
    console.log("Google User Info:", userInfo);

    // Send token to backend for verification
    fetch("http://localhost:5000/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Backend Response:", data))
      .catch((err) => console.error("Error sending token:", err));
  };

  const handleError = () => {
    console.log("Google Login Failed");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;
