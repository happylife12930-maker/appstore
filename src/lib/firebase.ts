// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtQdomvHmVz64Z_0Syn4j8Plg6inmuigc",
  authDomain: "studio-1514545499-d6b72.firebaseapp.com",
  databaseURL: "https://studio-1514545499-d6b72-default-rtdb.firebaseio.com",
  projectId: "studio-1514545499-d6b72",
  storageBucket: "studio-1514545499-d6b72.firebasestorage.app",
  messagingSenderId: "848832157378",
  appId: "1:848832157378:web:864140e076df67c29c8d5b"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
