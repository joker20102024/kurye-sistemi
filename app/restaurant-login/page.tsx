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

export default function RestaurantLoginPage() {
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

      const userSnap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (!userSnap.exists()) {
        alert(
          "Kayıt bulunamadı. Önce restoran kaydı yapın."
        );
        return;
      }

      const data = userSnap.data();

      if (data.role !== "restaurant") {
        alert(
          "Bu hesap restoran hesabı değil."
        );
        return;
      }

      if (data.status !== "approved") {
        alert(
          "Hesabınız admin onayı bekliyor."
        );
        return;
      }

      router.push("/restaurant");
    } catch (error) {
      console.error(error);

      alert(
        "Giriş sırasında hata oluştu."
      );
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl mb-4">
        🍔 Restoran Girişi
      </h1>

      <button
        onClick={googleGiris}
        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded"
      >
        Google ile giriş yap
      </button>
    </main>
  );
}