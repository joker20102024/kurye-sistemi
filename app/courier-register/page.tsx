"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CourierRegisterPage() {
  const router = useRouter();

  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [plaka, setPlaka] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-80 max-w-full p-3 rounded bg-white text-black placeholder:text-gray-500 outline-none border border-zinc-300";

  const kaydiFirebaseYaz = async (user: User) => {
    const kayitBilgisi = localStorage.getItem("kuryeKayitBilgisi");

    if (!kayitBilgisi) return;

    const bilgiler = JSON.parse(kayitBilgisi);

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      localStorage.removeItem("kuryeKayitBilgisi");
      alert("Bu hesap zaten kayıtlı. Giriş yapın.");
      router.replace("/courier-login");
      return;
    }

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      name: bilgiler.ad,
      role: "courier",
      status: "pending",
      telefon: bilgiler.telefon,
      plaka: bilgiler.plaka,
      createdAt: serverTimestamp(),
    });

    localStorage.removeItem("kuryeKayitBilgisi");

    alert("Kurye kaydınız alındı. Admin onayı bekleniyor.");
    router.replace("/courier-login");
  };

  useEffect(() => {
    const auth = getAuth(app);

    const kontrolEt = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

        const result = await getRedirectResult(auth);

        if (result?.user) {
          await kaydiFirebaseYaz(result.user);
          return;
        }

        if (auth.currentUser) {
          await kaydiFirebaseYaz(auth.currentUser);
        }
      } catch (error) {
        console.error(error);
        alert("Kayıt dönüşünde hata oluştu. Console'u kontrol et.");
      }
    };

    kontrolEt();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser && localStorage.getItem("kuryeKayitBilgisi")) {
          await kaydiFirebaseYaz(currentUser);
        }
      } catch (error) {
        console.error(error);
        alert("Kurye kaydı Firebase'e yazılamadı.");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const kayitOl = async () => {
    if (!ad.trim() || !telefon.trim() || !plaka.trim()) {
      alert("Lütfen tüm alanları doldur.");
      return;
    }

    try {
      setLoading(true);

      localStorage.setItem(
        "kuryeKayitBilgisi",
        JSON.stringify({
          ad: ad.trim(),
          telefon: telefon.trim(),
          plaka: plaka.trim(),
        })
      );

      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error(error);
      alert("Google kayıt başlatılamadı.");
      setLoading(false);
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
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded mt-2 disabled:opacity-50"
      >
        {loading ? "Yönlendiriliyor..." : "Google ile kayıt ol"}
      </button>
    </main>
  );
}