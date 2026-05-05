"use client";

import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function CourierLoginPage() {
  const router = useRouter();

  const googleGiris = async () => {
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("Kayıt bulunamadı. Önce kurye kaydı yapın.");
        return;
      }

      const data = userSnap.data();

      const role = String(data.role || "").trim().toLowerCase();
      const status = String(data.status || "").trim().toLowerCase();

      console.log("Giriş yapan:", user.email);
      console.log("Firestore verisi:", data);
      console.log("role:", role);
      console.log("status:", status);

      if (role !== "courier") {
        alert("Bu hesap kurye hesabı değil. Rol: " + role);
        return;
      }

      if (status !== "approved") {
        alert("Hesabınız henüz admin tarafından onaylanmadı. Durum: " + status);
        return;
      }

      router.push("/courier");
    } catch (error) {
      console.error(error);
      alert("Giriş sırasında hata oldu.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl mb-4">🛵 Kurye Girişi</h1>

      <button
        onClick={googleGiris}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded"
      >
        Google ile giriş yap
      </button>
    </main>
  );
}