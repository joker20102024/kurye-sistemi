"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function CourierLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const apkMi = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("wv") || ua.includes("android");
  };

  const kuryeKontrol = async (user: User) => {
    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
      alert("Kurye kaydınız bulunamadı. Önce kayıt olun.");
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
    const auth = getAuth(app);

    const kontrolEt = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

        const result = await getRedirectResult(auth);

        if (result?.user) {
          await kuryeKontrol(result.user);
          return;
        }

        if (auth.currentUser && localStorage.getItem("kuryeLoginBekliyor")) {
          localStorage.removeItem("kuryeLoginBekliyor");
          await kuryeKontrol(auth.currentUser);
        }
      } catch (error) {
        console.error(error);
        alert("Kurye giriş dönüşünde hata oluştu.");
      }
    };

    kontrolEt();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && localStorage.getItem("kuryeLoginBekliyor")) {
        localStorage.removeItem("kuryeLoginBekliyor");
        await kuryeKontrol(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const googleGiris = async () => {
    try {
      setLoading(true);

      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      if (apkMi()) {
        localStorage.setItem("kuryeLoginBekliyor", "1");
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        await kuryeKontrol(result.user);
      }
    } catch (error) {
      console.error(error);
      alert("Kurye girişi sırasında hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl">🛵 Kurye Giriş</h1>

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