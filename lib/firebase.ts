import { initializeApp, getApps } from "firebase/app";

// Public web config (not secret: access is decided by firestore.rules / storage.rules).
export const firebaseConfig = {
  apiKey: "AIzaSyDcT6NgqXUQV4Ztjt3MIcqyQgdeJmqTshk",
  authDomain: "zanes-puskisi-web.firebaseapp.com",
  projectId: "zanes-puskisi-web",
  storageBucket: "zanes-puskisi-web.firebasestorage.app",
  messagingSenderId: "406838089052",
  appId: "1:406838089052:web:cdfe0362db80cf7b021d99",
};

export const app = getApps()[0] ?? initializeApp(firebaseConfig);

// Mirror of the admin list in firestore.rules and storage.rules: keep all three in sync.
export const ADMIN_UIDS = [
  "NLL2HDQcDPVezIih8OKLJ0CCaGl2", // Edijs
  "auIgf2eZJkQQffUD0bR4ZYuuArj2", // Loreta
  "hMWGIjyc3uR61GW12VdNYVV49px2", // Zane
];
