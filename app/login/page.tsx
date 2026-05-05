"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { app } from "../lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const auth = getAuth(app);

  // 🔐 Email login
  const emailGiris = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (email.includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/courier");
      }
    } catch (error) {
      alert("Email giriş hatalı");
      console.error(error);
    }
  };

  // 🔥 Google login
  const googleGiris = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      if (user.email?.includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/courier");
      }
    } catch (error) {
      alert("Google giriş hatalı");
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl mb-4">🔐 Giriş</h1>

      {/* EMAIL */}
      <input
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <button
        onClick={emailGiris}
        className="bg-blue-500 px-6 py-2 rounded"
      >
        Email ile giriş
      </button>

      <div className="text-gray-400">veya</div>

      {/* GOOGLE */}
      <button
        onClick={googleGiris}
        className="bg-white text-black px-6 py-2 rounded"
      >
        Google ile giriş
      </button>
    </main>
  );
}