import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Lightweight JWT payload parser
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
}

const GoogleLoginButton = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const userInfo = parseJwt(token);
      console.log("Google User Info:", userInfo);

      // Create Firebase credential from Google token
      const credential = GoogleAuthProvider.credential(token);
      
      // Sign in to Firebase with the Google credential
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      let username = user.displayName || userInfo.name || "User";

      if (!userDoc.exists()) {
        // Create new user document in Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          username: username,
          email: user.email,
          picture: user.photoURL || userInfo.picture,
          createdAt: new Date().toISOString(),
          provider: "google",
        });
      } else {
        // Use existing username from Firestore
        username = userDoc.data().username;
      }

      // Store user data in localStorage
      const userData = {
        uid: user.uid,
        username: username,
        email: user.email,
        picture: user.photoURL || userInfo.picture,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("authToken", await user.getIdToken());

      console.log("Google login successful:", userData);
      navigate("/home");
    } catch (err) {
      console.error("Error during Google sign-in:", err);
    }
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
