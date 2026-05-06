import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCt9ldSWeYMmUKx-0Frk7FbGuB4jGUOjbs",
  authDomain: "kuryesystem-a88ad.firebaseapp.com",
  projectId: "kuryesystem-a88ad",
  storageBucket: "kuryesystem-a88ad.firebasestorage.app",
  messagingSenderId: "401001062514",
  appId: "1:401001062514:web:2df9d72ebdc5b32ef8a2eb",
};

export const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth = getAuth(app);

if (typeof window !== "undefined") {
  setPersistence(
    auth,
    browserLocalPersistence
  ).catch((error) => {
    console.log(
      "Persistence hatası:",
      error
    );
  });
}

export const db = getFirestore(app);