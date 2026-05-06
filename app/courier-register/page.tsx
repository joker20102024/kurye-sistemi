"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CourierRegisterPage() {
  const router = useRouter();

  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [plaka, setPlaka] = useState("");

  const inputClass =
    "w-80 max-w-full p-3 rounded bg-white text-black placeholder:text-gray-500 outline-none border border-zinc-300";

  const kayitOl = async () => {
    try {
      if (!ad.trim() || !telefon.trim() || !plaka.trim()) {
        alert("Lütfen tüm alanları doldur.");
        return;
      }

      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        alert("Bu hesap zaten kayıtlı. Giriş yapın.");
        router.replace("/courier-login");
        return;
      }

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: ad.trim(),
        role: "courier",
        status: "pending",
        telefon: telefon.trim(),
        plaka: plaka.trim(),
        createdAt: serverTimestamp(),
      });

      alert("Kurye kaydınız alındı. Admin onayı bekleniyor.");
      router.replace("/courier-login");
    } catch (error) {
      console.error(error);
      alert("Kurye kaydı sırasında hata oluştu.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl mb-4">🛵 Kurye Kayıt</h1>

      <input
        type="text"
        placeholder="Ad Soyad"
        value={ad}
        onChange={(e) => setAd(e.target.value)}
        className={inputClass}
      />

      <input
        type="text"
        placeholder="Telefon"
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
        className={inputClass}
      />

      <input
        type="text"
        placeholder="Araç Plakası"
        value={plaka}
        onChange={(e) => setPlaka(e.target.value)}
        className={inputClass}
      />

      <button
        onClick={kayitOl}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded mt-2"
      >
        Google ile kayıt ol
      </button>
    </main>
  );
}