// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxaKvBnyZrIpFqSzV6GrL4GzavjcEHfA4",
  authDomain: "softgenai-fc813.firebaseapp.com",
  projectId: "softgenai-fc813",
  storageBucket: "softgenai-fc813.firebasestorage.app",
  messagingSenderId: "110125983459",
  appId: "1:110125983459:web:beed0bac1d1d9e7c2087d6",
  measurementId: "G-RJM4GCPM2M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };