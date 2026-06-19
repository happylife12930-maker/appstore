
import { initializeApp, getApps, getApp } from "firebase/app";
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
  vapidKey: "BBAzlkhgmRzd_3oYo1SUEW5pgTfne5cVdsMuL_AafKrbX07mNKNgpnVrTzle3jfr0vdSQFyBeFrA3xurJAOdnW4"
};

// تهيئة التطبيق بطريقة تضمن عدم التكرار
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
