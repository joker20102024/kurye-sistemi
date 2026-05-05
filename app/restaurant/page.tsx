"use client";

import { useEffect, useState } from "react";
import { app, db } from "../lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type RestaurantData = {
  restoranAdi?: string;
  restoranAdres?: string;
  restoranTelefon?: string;
  role?: string;
  status?: string;
};

export default function RestaurantPage() {
  const router = useRouter();

  const [musteri, setMusteri] = useState("");
  const [adres, setAdres] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.push("/restaurant-login");
        return;
      }

      setUser(currentUser);

      const userSnap = await getDoc(doc(db, "users", currentUser.uid));

      if (!userSnap.exists()) {
        alert("Restoran kaydı bulunamadı.");
        router.push("/restaurant-login");
        return;
      }

      const data = userSnap.data() as RestaurantData;

      if (data.role !== "restaurant") {
        alert("Bu hesap restoran hesabı değil.");
        router.push("/");
        return;
      }

      if (data.status !== "approved") {
        alert("Restoran hesabınız admin onayı bekliyor.");
        router.push("/restaurant-login");
        return;
      }

      setRestaurant(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const siparisOlustur = async () => {
    if (!musteri || !adres) {
      alert("Boş bırakma!");
      return;
    }

    if (!user || !restaurant) {
      alert("Restoran bilgisi yüklenmedi. Sayfayı yenileyip tekrar dene.");
      return;
    }

    await addDoc(collection(db, "siparisler"), {
      musteri,
      adres,
      kurye: "",
      kuryeId: "",
      durum: "Hazırlanıyor",
      restoranAdi: restaurant.restoranAdi || "Bilinmeyen restoran",
      restoranId: user.uid,
      createdAt: new Date(),
    });

    alert("Sipariş kaydedildi!");
    setMusteri("");
    setAdres("");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Yükleniyor...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl mb-2">🍔 Restoran Paneli</h1>

      <p className="text-zinc-400 mb-4">
        {restaurant?.restoranAdi || "Restoran"}
      </p>

      <input
        type="text"
        placeholder="Müşteri adı"
        value={musteri}
        onChange={(e) => setMusteri(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <input
        type="text"
        placeholder="Adres"
        value={adres}
        onChange={(e) => setAdres(e.target.value)}
        className="w-80 p-3 rounded bg-white text-black"
      />

      <button
        onClick={siparisOlustur}
        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded mt-2"
      >
        Sipariş Oluştur
      </button>
    </main>
  );
}