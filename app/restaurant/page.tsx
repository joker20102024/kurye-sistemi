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
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

type RestaurantData = {
  restoranAdi?: string;
  restoranAdres?: string;
  restoranTelefon?: string;
  role?: string;
  status?: string;
};

type SonPaket = {
  musteri?: string;
  adres?: string;
  durum?: string;
  restoranAdi?: string;
};

export default function RestaurantPage() {
  const router = useRouter();

  const [musteri, setMusteri] = useState("");
  const [adres, setAdres] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [sonPaket, setSonPaket] = useState<SonPaket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setLoading(false);
          router.replace("/restaurant-login");
          return;
        }

        const userSnap = await getDoc(doc(db, "users", currentUser.uid));

        if (!userSnap.exists()) {
          await signOut(auth);
          setLoading(false);
          router.replace("/restaurant-login");
          return;
        }

        const data = userSnap.data() as RestaurantData;

        const role = String(data.role || "").trim().toLowerCase();
        const status = String(data.status || "").trim().toLowerCase();

        if (role !== "restaurant") {
          await signOut(auth);
          setLoading(false);
          router.replace("/");
          return;
        }

        if (status !== "approved") {
          await signOut(auth);
          setLoading(false);
          router.replace("/restaurant-login");
          return;
        }

        setUser(currentUser);
        setRestaurant(data);

        const sonPaketQuery = query(
          collection(db, "siparisler"),
          where("restoranId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const sonPaketSnap = await getDocs(sonPaketQuery);

        if (!sonPaketSnap.empty) {
          setSonPaket(sonPaketSnap.docs[0].data() as SonPaket);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
        router.replace("/restaurant-login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const siparisOlustur = async () => {
    if (!musteri.trim() || !adres.trim()) {
      alert("Boş bırakma!");
      return;
    }

    if (!user || !restaurant) {
      alert("Restoran bilgisi yüklenmedi. Sayfayı yenileyip tekrar dene.");
      return;
    }

    const yeniSiparis = {
      musteri: musteri.trim(),
      adres: adres.trim(),
      kurye: "",
      kuryeId: "",
      durum: "Hazırlanıyor",
      restoranAdi: restaurant.restoranAdi || "Bilinmeyen restoran",
      restoranId: user.uid,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "siparisler"), yeniSiparis);

    setSonPaket({
      musteri: yeniSiparis.musteri,
      adres: yeniSiparis.adres,
      durum: yeniSiparis.durum,
      restoranAdi: yeniSiparis.restoranAdi,
    });

    alert("Sipariş kaydedildi!");

    setMusteri("");
    setAdres("");
  };

  const cikisYap = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.replace("/restaurant-login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-full max-w-sm flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl">🍔 Restoran Paneli</h1>
          <p className="text-zinc-400 mt-1">
            {restaurant?.restoranAdi || "Restoran"}
          </p>
        </div>

        <button
          onClick={cikisYap}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Çıkış
        </button>
      </div>

      {sonPaket && (
        <div className="w-80 max-w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-sm mb-2">
          <p className="text-yellow-400 font-semibold mb-2">
            📦 Son Yüklenen Paket
          </p>

          <p>
            <span className="text-zinc-400">Müşteri:</span>{" "}
            {sonPaket.musteri}
          </p>

          <p>
            <span className="text-zinc-400">Adres:</span>{" "}
            {sonPaket.adres}
          </p>

          <p>
            <span className="text-zinc-400">Durum:</span>{" "}
            {sonPaket.durum}
          </p>
        </div>
      )}

      <input
        type="text"
        placeholder="Müşteri adı"
        value={musteri}
        onChange={(e) => setMusteri(e.target.value)}
        className="w-80 max-w-full p-3 rounded bg-white text-black placeholder:text-gray-500"
      />

      <input
        type="text"
        placeholder="Adres"
        value={adres}
        onChange={(e) => setAdres(e.target.value)}
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