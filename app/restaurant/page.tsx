"use client";

import { useEffect, useState } from "react";
import { app, db } from "../lib/firebase";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
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
  const [restaurant, setRestaurant] =
    useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.push("/restaurant-login");
          return;
        }

        setUser(currentUser);

        const userSnap = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (!userSnap.exists()) {
          alert("Restoran kaydı bulunamadı.");
          router.push("/restaurant-login");
          return;
        }

        const data =
          userSnap.data() as RestaurantData;

        const role = String(data.role || "")
          .trim()
          .toLowerCase();

        const status = String(data.status || "")
          .trim()
          .toLowerCase();

        if (role !== "restaurant") {
          alert("Bu hesap restoran hesabı değil.");
          router.push("/");
          return;
        }

        if (status !== "approved") {
          alert(
            "Restoran hesabınız admin onayı bekliyor."
          );
          router.push("/restaurant-login");
          return;
        }

        setRestaurant(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [router]);

  const siparisOlustur = async () => {
    if (!musteri || !adres) {
      alert("Boş bırakma!");
      return;
    }

    if (!user || !restaurant) {
      alert(
        "Restoran bilgisi yüklenmedi. Sayfayı yenileyip tekrar dene."
      );
      return;
    }

    await addDoc(collection(db, "siparisler"), {
      musteri,
      adres,
      kurye: "",
      kuryeId: "",
      durum: "Hazırlanıyor",
      restoranAdi:
        restaurant.restoranAdi ||
        "Bilinmeyen restoran",
      restoranId: user.uid,
      createdAt: new Date(),
    });

    alert("Sipariş kaydedildi!");

    setMusteri("");
    setAdres("");
  };

  const cikisYap = async () => {
    const auth = getAuth(app);

    await signOut(auth);

    router.push("/restaurant-login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">
          Yükleniyor...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-full max-w-sm flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl">
            🍔 Restoran Paneli
          </h1>

          <p className="text-zinc-400 mt-1">
            {restaurant?.restoranAdi ||
              "Restoran"}
          </p>
        </div>

        <button
          onClick={cikisYap}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Çıkış
        </button>
      </div>

      <input
        type="text"
        placeholder="Müşteri adı"
        value={musteri}
        onChange={(e) =>
          setMusteri(e.target.value)
        }
        className="w-80 max-w-full p-3 rounded bg-white text-black placeholder:text-gray-500"
      />

      <input
        type="text"
        placeholder="Adres"
        value={adres}
        onChange={(e) =>
          setAdres(e.target.value)
        }
        className="w-80 max-w-full p-3 rounded bg-white text-black placeholder:text-gray-500"
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