
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAtQdomvHmVz64Z_0Syn4j8Plg6inmuigc",
  authDomain: "nextn-firebase-project.firebaseapp.com",
  projectId: "nextn-firebase-project",
  storageBucket: "nextn-firebase-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456",
  // VAPID Key provided by user for future use
  vapidKey: "BBAzlkhgmRzd_3oYo1SUEW5pgTfne5cVdsMuL_AafKrbX07mNKNgpnVrTzle3jfr0vdSQFyBeFrA3xurJAOdnW4"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
