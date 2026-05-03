import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyACtZBGMbTwt6qOCv2bC0EKZdCYenlHg14",
  authDomain: "candela-9032b.firebaseapp.com",
  projectId: "candela-9032b",
  storageBucket: "candela-9032b.firebasestorage.app",
  messagingSenderId: "908419781941",
  appId: "1:908419781941:web:f79cbecc7be18643ce687c",
  measurementId: "G-TPZB8PW0RN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { app, auth, googleProvider };
