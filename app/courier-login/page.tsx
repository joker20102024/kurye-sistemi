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
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function CourierLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const kuryeKontrolEt = async (user: any) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        role: "courier",
        status: "pending",
      });

      alert("Kurye kaydınız alındı. Admin onayı bekleniyor.");
      return;
    }

    const data = userSnap.data();

    const role = String(data.role || "").trim().toLowerCase();
    const status = String(data.status || "").trim().toLowerCase();

    if (role !== "courier") {
      alert("Bu hesap kurye hesabı değil.");
      return;
    }

    if (status !== "approved") {
      alert("Hesabınız henüz admin tarafından onaylanmadı.");
      return;
    }

    router.replace("/courier");
  };

  useEffect(() => {
    const kontrol = async () => {
      try {
        const auth = getAuth(app);
        await setPersistence(auth, browserLocalPersistence);

        const result = await getRedirectResult(auth);

        if (result?.user) {
          await kuryeKontrolEt(result.user);
        }
      } catch (error) {
        console.error(error);
        alert("Giriş dönüşünde hata oluştu.");
      }
    };

    kontrol();
  }, []);

  const googleGiris = async () => {
    try {
      setLoading(true);

      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error(error);
      alert("Google giriş başlatılamadı.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl text-center">🛵 Kurye Giriş / Kayıt</h1>

      <button
        onClick={googleGiris}
        disabled={loading}
        className="bg-white text-black px-6 py-3 rounded disabled:opacity-50"
      >
        {loading ? "Yönlendiriliyor..." : "Google ile kurye girişi"}
      </button>
    </main>
  );
}