import React from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";

const Login = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>Login with Google</h2>
      <GoogleLoginButton />
    </div>
  );
};

export default Login;
