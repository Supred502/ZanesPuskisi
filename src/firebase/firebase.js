import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyDcT6NgqXUQV4Ztjt3MIcqyQgdeJmqTshk",
  authDomain: "zanes-puskisi-web.firebaseapp.com",
  projectId: "zanes-puskisi-web",
  storageBucket: "zanes-puskisi-web.firebasestorage.app",
  messagingSenderId: "406838089052",
  appId: "1:406838089052:web:cdfe0362db80cf7b021d99",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Firebase App Check (recommended for public sites).
// Uses reCAPTCHA v3 (invisible scoring) when configured.
try {
  const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
  if (siteKey) {
    // Dev convenience: set VITE_APPCHECK_DEBUG_TOKEN=true to log a debug token.
    // Then register it in Firebase Console -> App Check -> Manage debug tokens.
    if (import.meta.env.DEV && import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
      if (typeof window !== "undefined") {
        window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
} catch {
  // ignore App Check init errors
}

// Exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
