"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function CourierRegisterPage() {
  const router = useRouter();

  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [plaka, setPlaka] = useState("");

  const kayitOl = async () => {
    if (!ad || !telefon || !plaka) {
      alert("Lütfen tüm alanları doldur.");
      return;
    }

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      alert("Bu hesap zaten kayıtlı. Giriş yapın.");
      router.push("/courier-login");
      return;
    }

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: ad,
      role: "courier",
      status: "pending",
      telefon,
      plaka,
    });

    alert("Kurye kaydınız alındı. Admin onayı bekleniyor.");
    router.push("/courier-login");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl mb-4">🛵 Kurye Kayıt</h1>

      <input
        type="text"
        placeholder="Ad Soyad"
        value={ad}
        onChange={(e) => setAd(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <input
        type="text"
        placeholder="Telefon"
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <input
        type="text"
        placeholder="Araç Plakası"
        value={plaka}
        onChange={(e) => setPlaka(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
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