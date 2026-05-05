"use client";

import { useRouter } from "next/navigation";
import { app, db } from "../lib/firebase";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function CourierLoginPage() {
  const router = useRouter();

  const googleGiris = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

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

    if (data.role !== "courier") {
      alert("Bu hesap kurye hesabı değil.");
      return;
    }

    if (data.status !== "approved") {
      alert("Hesabınız henüz admin tarafından onaylanmadı.");
      return;
    }

    router.push("/courier");
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl">🛵 Kurye Giriş / Kayıt</h1>

      <button
        onClick={googleGiris}
        className="bg-white text-black px-6 py-3 rounded"
      >
        Google ile kurye girişi
      </button>
    </main>
  );
}