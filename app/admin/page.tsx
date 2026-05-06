"use client";

import { useEffect, useState } from "react";
import { db, app } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
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
  createdAt?: any;
};

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  restoranAdi?: string;
  restoranAdres?: string;
  restoranTelefon?: string;
  telefon?: string;
  plaka?: string;
};

type Tab =
  | "pending"
  | "approved"
  | "orders"
  | "completed"
  | "cancelled"
  | "restaurantStats"
  | "courierStats";

type DateFilter = "custom" | "all";

const ADMIN_EMAIL = "inisiye666@gmail.com";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [dateFilter, setDateFilter] = useState<DateFilter>("custom");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({});

  useEffect(() => {
    const auth = getAuth(app);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/admin-login");
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        alert("Bu hesap admin değil.");
        router.push("/");
        return;
      }

      setLoading(false);
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const unsubOrders = onSnapshot(collection(db, "siparisler"), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[]);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as User[]);
    });

    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, [loading]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const getOrderDate = (order: Order) => {
    if (!order.createdAt) return null;
    if (order.createdAt?.toDate) return order.createdAt.toDate();
    return new Date(order.createdAt);
  };

  const isOrderInDateFilter = (order: Order) => {
    if (dateFilter === "all") return true;

    const orderDate = getOrderDate(order);
    if (!orderDate || isNaN(orderDate.getTime())) return false;
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return orderDate >= start && orderDate <= end;
  };

  const filteredOrders = orders.filter(isOrderInDateFilter);

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved");
  const approvedCouriers = users.filter(
    (u) => u.role === "courier" && u.status === "approved"
  );

  const aktifSiparisler = orders.filter(
    (o) => o.durum !== "Teslim Edildi" && o.durum !== "İptal"
  );

  const tamamlananSiparisler = orders.filter((o) => o.durum === "Teslim Edildi");
  const iptalSiparisler = orders.filter((o) => o.durum === "İptal");

  const restoranIstatistikleri = users
    .filter((u) => u.role === "restaurant" && u.status === "approved")
    .map((restaurant) => {
      const restoranAdi =
        restaurant.restoranAdi || restaurant.email || "Bilinmeyen restoran";

      const restoranSiparisleri = filteredOrders.filter(
        (order) => order.restoranAdi === restoranAdi
      );

      return {
        id: restaurant.id,
        restoranAdi,
        restoranAdres: restaurant.restoranAdres,
        restoranTelefon: restaurant.restoranTelefon,
        siparisAdedi: restoranSiparisleri.length,
        teslimEdilen: restoranSiparisleri.filter(
          (o) => o.durum === "Teslim Edildi"
        ).length,
        iptalEdilen: restoranSiparisleri.filter((o) => o.durum === "İptal").length,
      };
    });

  const bilinmeyenRestoranSiparisleri = filteredOrders.filter(
    (order) => !order.restoranAdi
  ).length;

  const kuryeIstatistikleri = approvedCouriers.map((courier) => {
    const kuryeAdi = courier.name || courier.email;

    const kuryeSiparisleri = filteredOrders.filter(
      (order) => order.kuryeId === courier.id || order.kurye === kuryeAdi
    );

    return {
      id: courier.id,
      kuryeAdi,
      telefon: courier.telefon,
      plaka: courier.plaka,
      teslimatAdedi: kuryeSiparisleri.filter(
        (o) => o.durum === "Teslim Edildi"
      ).length,
      aktifTeslimatAdedi: kuryeSiparisleri.filter(
        (o) => o.durum !== "Teslim Edildi" && o.durum !== "İptal"
      ).length,
      iptalAdedi: kuryeSiparisleri.filter((o) => o.durum === "İptal").length,
    };
  });

  const onayla = async (id: string) => {
    await updateDoc(doc(db, "users", id), { status: "approved" });
  };

  const kullaniciSil = async (id: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğine emin misin?")) return;
    await deleteDoc(doc(db, "users", id));
  };

  const durumuGuncelle = async (id: string, durum: string) => {
    await updateDoc(doc(db, "siparisler", id), { durum });
  };

  const siparisiSil = async (id: string) => {
    if (!confirm("Bu siparişi kalıcı silmek istediğine emin misin?")) return;
    await deleteDoc(doc(db, "siparisler", id));
  };

  const kuryeAta = async (orderId: string) => {
    const selectedCourierId = selectedCouriers[orderId];

    if (!selectedCourierId) {
      alert("Lütfen kurye seç.");
      return;
    }

    const courier = approvedCouriers.find((c) => c.id === selectedCourierId);

    if (!courier) {
      alert("Kurye bulunamadı.");
      return;
    }

    const kuryeAdi = courier.name || courier.email || "Kurye";

    await updateDoc(doc(db, "siparisler", orderId), {
      kurye: kuryeAdi,
      kuryeId: courier.id,
      durum: "Yolda",
    });
  };

  const cikisYap = async () => {
    const auth = getAuth(app);
    await signOut(auth);
    router.push("/admin-login");
  };

  const TabButton = ({ value, label }: { value: Tab; label: string }) => (
    <button
      onClick={() => setTab(value)}
      className={`px-4 py-2 rounded ${
        tab === value ? "bg-purple-600" : "bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );

  const userCard = (user: User, approved = false) => (
    <div key={user.id} className="border border-zinc-700 rounded-xl p-4 bg-zinc-900">
      {user.role === "restaurant" && (
        <>
          <p><b>Restoran:</b> {user.restoranAdi}</p>
          <p><b>Adres:</b> {user.restoranAdres}</p>
          <p><b>Telefon:</b> {user.restoranTelefon}</p>
        </>
      )}

      {user.role === "courier" && (
        <>
          <p><b>Kurye:</b> {user.name}</p>
          <p><b>Telefon:</b> {user.telefon}</p>
          <p><b>Plaka:</b> {user.plaka}</p>
        </>
      )}

      {user.role === "admin" && (
        <>
          <p><b>Admin:</b> {user.name}</p>
          <p><b>Email:</b> {user.email}</p>
        </>
      )}

      <p><b>Email:</b> {user.email}</p>
      <p><b>Rol:</b> {user.role}</p>
      <p><b>Durum:</b> {user.status}</p>

      <div className="flex gap-2 mt-3">
        {!approved && (
          <button
            onClick={() => onayla(user.id)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Onayla
          </button>
        )}

        {(user.role === "courier" || !approved) && (
          <button
            onClick={() => kullaniciSil(user.id)}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            {approved ? "Kuryeyi Sil" : "Sil / Reddet"}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Yükleniyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl">👑 Admin Paneli</h1>

        <button
          onClick={cikisYap}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Çıkış
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <TabButton value="pending" label={`Onay Bekleyenler (${pendingUsers.length})`} />
        <TabButton value="approved" label={`Onaylananlar (${approvedUsers.length})`} />
        <TabButton value="orders" label={`Aktif Siparişler (${aktifSiparisler.length})`} />
        <TabButton value="completed" label={`Teslim Edilenler (${tamamlananSiparisler.length})`} />
        <TabButton value="cancelled" label={`İptal Olanlar (${iptalSiparisler.length})`} />
        <TabButton value="restaurantStats" label="Restoran İstatistikleri" />
        <TabButton value="courierStats" label="Kurye İstatistikleri" />
      </div>

      {(tab === "restaurantStats" || tab === "courierStats") && (
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilter("custom");
              }}
              className="bg-white text-black px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateFilter("custom");
              }}
              className="bg-white text-black px-3 py-2 rounded"
            />
          </div>

          <button
            onClick={() => setDateFilter("all")}
            className={`px-4 py-2 rounded ${
              dateFilter === "all" ? "bg-green-600" : "bg-zinc-800"
            }`}
          >
            Tüm Zamanlar
          </button>
        </div>
      )}

      {tab === "pending" && (
        <section>
          <h2 className="text-2xl mb-4">👥 Onay Bekleyen İşlemler</h2>
          {pendingUsers.length === 0 && (
            <p className="text-zinc-400">Onay bekleyen kullanıcı yok.</p>
          )}
          <div className="space-y-4">{pendingUsers.map((u) => userCard(u, false))}</div>
        </section>
      )}

      {tab === "approved" && (
        <section>
          <h2 className="text-2xl mb-4">✅ Onaylananlar</h2>
          {approvedUsers.length === 0 && (
            <p className="text-zinc-400">Onaylanan kullanıcı yok.</p>
          )}
          <div className="space-y-4">{approvedUsers.map((u) => userCard(u, true))}</div>
        </section>
      )}

      {tab === "orders" && (
        <section>
          <h2 className="text-2xl mb-4">📦 Aktif Siparişler</h2>
          {aktifSiparisler.length === 0 && (
            <p className="text-zinc-400">Aktif sipariş yok.</p>
          )}

          <div className="space-y-4">
            {aktifSiparisler.map((order) => (
              <div key={order.id} className="border border-zinc-700 rounded-xl p-4 bg-zinc-900">
                <p><b>Restoran:</b> {order.restoranAdi || "Bilinmeyen restoran"}</p>
                <p><b>Müşteri:</b> {order.musteri}</p>
                <p><b>Adres:</b> {order.adres}</p>
                <p><b>Durum:</b> {order.durum}</p>
                <p><b>Kurye:</b> {order.kurye || "Atanmadı"}</p>

                <div className="flex flex-wrap gap-2 mt-4 items-center">
                  <select
                    value={selectedCouriers[order.id] || ""}
                    onChange={(e) =>
                      setSelectedCouriers((prev) => ({
                        ...prev,
                        [order.id]: e.target.value,
                      }))
                    }
                    className="bg-white text-black px-3 py-2 rounded"
                  >
                    <option value="">Kurye seç</option>
                    {approvedCouriers.map((courier) => (
                      <option key={courier.id} value={courier.id}>
                        {courier.name || courier.email}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => kuryeAta(order.id)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                  >
                    Kurye Ata / Değiştir
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => durumuGuncelle(order.id, "Hazırlanıyor")}
                    className="bg-yellow-500 px-4 py-2 rounded"
                  >
                    Hazırlanıyor
                  </button>

                  <button
                    onClick={() => durumuGuncelle(order.id, "Yolda")}
                    className="bg-blue-500 px-4 py-2 rounded"
                  >
                    Yolda
                  </button>

                  <button
                    onClick={() => durumuGuncelle(order.id, "Teslim Edildi")}
                    className="bg-green-500 px-4 py-2 rounded"
                  >
                    Teslim Edildi
                  </button>

                  <button
                    onClick={() => durumuGuncelle(order.id, "İptal")}
                    className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded"
                  >
                    İptal Et
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "completed" && (
        <section>
          <h2 className="text-2xl mb-4">✅ Teslim Edilen Siparişler</h2>
          {tamamlananSiparisler.length === 0 && (
            <p className="text-zinc-400">Teslim edilen sipariş yok.</p>
          )}

          <div className="space-y-4">
            {tamamlananSiparisler.map((order) => (
              <div key={order.id} className="border border-zinc-700 rounded-xl p-4 bg-zinc-900">
                <p><b>Restoran:</b> {order.restoranAdi || "Bilinmeyen restoran"}</p>
                <p><b>Müşteri:</b> {order.musteri}</p>
                <p><b>Adres:</b> {order.adres}</p>
                <p><b>Durum:</b> {order.durum}</p>
                <p><b>Kurye:</b> {order.kurye || "Atanmadı"}</p>
                <p className="text-zinc-400 mt-3">Teslim edilen siparişler silinemez.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "cancelled" && (
        <section>
          <h2 className="text-2xl mb-4">❌ İptal Olan Siparişler</h2>
          {iptalSiparisler.length === 0 && (
            <p className="text-zinc-400">İptal olan sipariş yok.</p>
          )}

          <div className="space-y-4">
            {iptalSiparisler.map((order) => (
              <div key={order.id} className="border border-zinc-700 rounded-xl p-4 bg-zinc-900">
                <p><b>Restoran:</b> {order.restoranAdi || "Bilinmeyen restoran"}</p>
                <p><b>Müşteri:</b> {order.musteri}</p>
                <p><b>Adres:</b> {order.adres}</p>
                <p><b>Durum:</b> {order.durum}</p>
                <p><b>Kurye:</b> {order.kurye || "Atanmadı"}</p>

                <button
                  onClick={() => siparisiSil(order.id)}
                  className="bg-red-600 px-4 py-2 rounded mt-3"
                >
                  Kalıcı Sil
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "restaurantStats" && (
        <section>
          <h2 className="text-2xl mb-4">🍔 Restoran İstatistikleri</h2>

          {restoranIstatistikleri.length === 0 && (
            <p className="text-zinc-400">Onaylı restoran yok.</p>
          )}

          <div className="space-y-4">
            {restoranIstatistikleri.map((r) => (
              <div key={r.id} className="border border-zinc-700 rounded-xl p-4 bg-zinc-900">
                <p><b>Restoran:</b> {r.restoranAdi}</p>
                <p><b>Adres:</b> {r.restoranAdres || "Belirtilmedi"}</p>
                <p><b>Telefon:</b> {r.restoranTelefon || "Belirtilmedi"}</p>
                <p><b>Toplam Sipariş:</b> {r.siparisAdedi}</p>
                <p><b>Teslim Edilen:</b> {r.teslimEdilen}</p>
                <p><b>İptal:</b> {r.iptalEdilen}</p>
              </div>
            ))}

            {bilinmeyenRestoranSiparisleri > 0 && (
              <div className="border border-yellow-700 rounded-xl p-4 bg-yellow-950">
                <p><b>Bilinmeyen restoran siparişleri:</b> {bilinmeyenRestoranSiparisleri}</p>
                <p className="text-sm text-zinc-300">
                  Eski siparişlerde restoran adı kaydedilmediği için burada görünüyor.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "courierStats" && (
        <section>
          <h2 className="text-2xl mb-4">🛵 Kurye İstatistikleri</h2>

          {kuryeIstatistikleri.length === 0 && (
            <p className="text-zinc-400">Onaylı kurye yok.</p>
          )}

          <div className="space-y-4">
            {kuryeIstatistikleri.map((k) => (
              <div key={k.id} className="border border-zinc-700 rounded-xl p-4 bg-zinc-900">
                <p><b>Kurye:</b> {k.kuryeAdi}</p>
                <p><b>Telefon:</b> {k.telefon || "Belirtilmedi"}</p>
                <p><b>Plaka:</b> {k.plaka || "Belirtilmedi"}</p>
                <p><b>Aktif Sipariş:</b> {k.aktifTeslimatAdedi}</p>
                <p><b>Teslim Edilen:</b> {k.teslimatAdedi}</p>
                <p><b>İptal:</b> {k.iptalAdedi}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}