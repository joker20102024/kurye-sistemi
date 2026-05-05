"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function RestoranKayitPage() {
  const router = useRouter();

  const [restoranAdi, setRestoranAdi] = useState("");
  const [restoranAdres, setRestoranAdres] = useState("");
  const [restoranTelefon, setRestoranTelefon] = useState("");

  const kayitOl = async () => {
    if (!restoranAdi || !restoranAdres || !restoranTelefon) {
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
      alert("Bu Google hesabı zaten kayıtlı. Giriş sayfasından giriş yapın.");
      router.push("/restaurant-login");
      return;
    }

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      role: "restaurant",
      status: "pending",
      restoranAdi,
      restoranAdres,
      restoranTelefon,
    });

    alert("Restoran kaydınız alındı. Admin onayı bekleniyor.");
    router.push("/restaurant-login");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl mb-4">🍔 Restoran Kayıt</h1>

      <input
        type="text"
        placeholder="Restoran adı"
        value={restoranAdi}
        onChange={(e) => setRestoranAdi(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <input
        type="text"
        placeholder="Restoran adresi"
        value={restoranAdres}
        onChange={(e) => setRestoranAdres(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <input
        type="text"
        placeholder="Restoran telefon numarası"
        value={restoranTelefon}
        onChange={(e) => setRestoranTelefon(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <button
        onClick={kayitOl}
        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded mt-2"
      >
        Google ile kayıt ol
      </button>
    </main>
  );
}