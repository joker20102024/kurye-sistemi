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
import { doc, getDoc } from "firebase/firestore";

export default function CourierLoginPage() {
  const router = useRouter();

  const googleGiris = async () => {
    try {
      const auth = getAuth(app);
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

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
    } catch (error) {
      console.error(error);
      alert("Kurye girişi sırasında hata oluştu.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl">🛵 Kurye Giriş</h1>

      <button
        onClick={googleGiris}
        className="bg-white text-black px-6 py-3 rounded"
      >
        Google ile kurye girişi
      </button>
    </main>
  );
}