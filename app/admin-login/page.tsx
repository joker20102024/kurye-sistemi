"use client";

import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";

const ADMIN_EMAIL = "inisiye666@gmail.com";

export default function AdminLoginPage() {
  const router = useRouter();

  const googleGiris = async () => {
    try {
      const auth = getAuth(app);

      await setPersistence(
        auth,
        browserLocalPersistence
      );

      const provider =
        new GoogleAuthProvider();

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      const user = result.user;

      if (user.email !== ADMIN_EMAIL) {
        alert("Bu hesap admin değil.");
        return;
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: "admin",
          status: "approved",
        }
      );

      router.push("/admin");
    } catch (error) {
      console.error(error);

      alert(
        "Admin girişinde hata oluştu."
      );
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl">
        👑 Admin Girişi
      </h1>

      <button
        onClick={googleGiris}
        className="bg-purple-600 px-6 py-3 rounded"
      >
        Google ile admin girişi
      </button>
    </main>
  );
}