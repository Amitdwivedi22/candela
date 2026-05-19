import type { FirebaseApp } from "firebase/app";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";

const requiredFirebaseEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseEnvVars = Object.entries(requiredFirebaseEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingFirebaseEnvVars.length > 0) {
  console.error(
    `Missing Firebase env vars: ${missingFirebaseEnvVars.join(", ")}`
  );
}

const isFirebaseConfigured = missingFirebaseEnvVars.length === 0;
const firebaseConfigErrorMessage = isFirebaseConfigured
  ? ""
  : `Firebase is not fully configured. Missing: ${missingFirebaseEnvVars.join(", ")}.`;

const firebaseConfig = {
  apiKey: requiredFirebaseEnvVars.apiKey ?? "",
  authDomain: requiredFirebaseEnvVars.authDomain ?? "",
  projectId: requiredFirebaseEnvVars.projectId ?? "",
  storageBucket: requiredFirebaseEnvVars.storageBucket ?? "",
  messagingSenderId: requiredFirebaseEnvVars.messagingSenderId ?? "",
  appId: requiredFirebaseEnvVars.appId ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const auth: Auth | null = app ? getAuth(app) : null;

if (typeof window !== "undefined" && auth) {
  // Keep browser-only auth persistence out of the server bundle.
  void setPersistence(auth, browserLocalPersistence);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, firebaseConfigErrorMessage, googleProvider, isFirebaseConfigured };
