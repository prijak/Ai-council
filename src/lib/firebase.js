import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth        = getAuth(firebaseApp);
export const db          = getFirestore(firebaseApp);

// Provider with explicit scopes — required for redirect flow to complete properly
export const provider = new GoogleAuthProvider();
provider.addScope("email");
provider.addScope("profile");
// Force account selection every time (prevents silent failures with cached accounts)
provider.setCustomParameters({ prompt: "select_account" });

// GA4 — loads only in browser, only if measurementId is set
export let analytics = null;
isSupported().then(yes => {
  if (yes && firebaseConfig.measurementId) {
    analytics = getAnalytics(firebaseApp);
  }
});