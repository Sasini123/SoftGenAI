// Firebase is still available for legacy authentication flows. While the app now uses
// custom backend auth, keeping this file avoids breaking existing Firebase utilities.
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyCxaKvBnyZrIpFqSzV6GrL4GzavjcEHfA4",
	authDomain: "softgenai-fc813.firebaseapp.com",
	projectId: "softgenai-fc813",
	storageBucket: "softgenai-fc813.firebasestorage.app",
	messagingSenderId: "110125983459",
	appId: "1:110125983459:web:beed0bac1d1d9e7c2087d6",
	measurementId: "G-RJM4GCPM2M"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
export const firebaseRemoved = true;