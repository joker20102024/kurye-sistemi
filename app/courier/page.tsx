"use client";

import { useEffect, useRef, useState } from "react";
import { db, app } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  musteri: string;
  adres: string;
  durum: string;
  kurye?: string;
  kuryeId?: string;
  restoranAdi?: string;
};

export default function CourierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentCourierId, setCurrentCourierId] = useState<string | null>(null);

  const router = useRouter();

  const firstLoad = useRef(true);
  const lastCount = useRef(0);

  const enableSound = async () => {
    const audio = new Audio("/notification.mp3");

    try {
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      setSoundEnabled(true);
      alert("Bildirim sesi aktif edildi 🔊");
    } catch (error) {
      alert("Ses açılamadı.");
    }
  };

  useEffect(() => {
    const auth = getAuth(app);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/courier-login");
        return;
      }

      setCurrentCourierId(user.uid);
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!currentCourierId) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const unsubscribe = onSnapshot(collection(db, "siparisler"), (snapshot) => {
      const allOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      const aktifOrders = allOrders.filter((o) => {
        const aktif = o.durum !== "Teslim Edildi" && o.durum !== "İptal";

        const bosSiparis = !o.kuryeId;
        const kendiSiparisi = o.kuryeId === currentCourierId;

        return aktif && (bosSiparis || kendiSiparisi);
      });

      if (!firstLoad.current && aktifOrders.length > lastCount.current) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Yeni sipariş var 🚀", {
            body: "Kurye paneline yeni sipariş düştü.",
          });
        }

        if (soundEnabled) {
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        }
      }

      firstLoad.current = false;
      lastCount.current = aktifOrders.length;

      setOrders(aktifOrders);
    });

    return () => unsubscribe();
  }, [currentCourierId, soundEnabled]);

  const siparisiAl = async (id: string) => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      alert("Giriş yapman gerekiyor.");
      router.push("/courier-login");
      return;
    }

    const orderRef = doc(db, "siparisler", id);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      alert("Sipariş bulunamadı.");
      return;
    }

    const orderData = orderSnap.data() as Order;

    if (orderData.kuryeId && orderData.kuryeId !== user.uid) {
      alert("Bu sipariş başka bir kurye tarafından alınmış.");
      return;
    }

    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
      alert("Kurye kaydı bulunamadı.");
      return;
    }

    const userData = userSnap.data();

    const kuryeAdi =
      userData.name || user.displayName || user.email || "Kurye";

    await updateDoc(orderRef, {
      kurye: kuryeAdi,
      kuryeId: user.uid,
      durum: "Yolda",
    });
  };

  const teslimEt = async (id: string) => {
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      alert("Giriş yapman gerekiyor.");
      router.push("/courier-login");
      return;
    }

    const orderRef = doc(db, "siparisler", id);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      alert("Sipariş bulunamadı.");
      return;
    }

    const orderData = orderSnap.data() as Order;

    if (orderData.kuryeId !== user.uid) {
      alert("Bu sipariş sana ait değil. Teslim edemezsin.");
      return;
    }

    await updateDoc(orderRef, {
      durum: "Teslim Edildi",
    });
  };

  const cikisYap = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.push("/courier-login");
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-5">
      <div className="sticky top-0 z-10 bg-black pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">🛵 Kurye</h1>
            <p className="text-sm text-zinc-400">Mobil teslimat paneli</p>
          </div>

          <button
            onClick={cikisYap}
            className="bg-red-600 px-4 py-2 rounded-lg text-sm"
          >
            Çıkış
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
          <p className="text-sm text-zinc-400">Aktif sipariş</p>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>

        {!soundEnabled && (
          <button
            onClick={enableSound}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold"
          >
            🔊 Bildirim Sesini Aç
          </button>
        )}
      </div>

      {orders.length === 0 && (
        <div className="mt-10 text-center text-zinc-400">
          Aktif sipariş yok.
        </div>
      )}

      <div className="space-y-4 mt-4 pb-24">
        {orders.map((order) => {
          const benimSiparisim = order.kuryeId === currentCourierId;

          return (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-zinc-400">Restoran</p>
                  <h2 className="text-xl font-bold">
                    {order.restoranAdi || "Bilinmeyen restoran"}
                  </h2>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    order.durum === "Yolda" ? "bg-blue-600" : "bg-yellow-600"
                  }`}
                >
                  {order.durum}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-zinc-400">Müşteri: </span>
                  <b>{order.musteri}</b>
                </p>

                <p>
                  <span className="text-zinc-400">Adres: </span>
                  <b>{order.adres}</b>
                </p>

                <p>
                  <span className="text-zinc-400">Kurye: </span>
                  <b>{order.kurye || "Atanmadı"}</b>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-4">
                {!order.kuryeId && (
                  <button
                    onClick={() => siparisiAl(order.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
                  >
                    Siparişi Al
                  </button>
                )}

                {benimSiparisim && order.durum !== "Teslim Edildi" && (
                  <button
                    onClick={() => teslimEt(order.id)}
                    className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold"
                  >
                    Teslim Ettim
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}