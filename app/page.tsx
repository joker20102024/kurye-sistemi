import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-4xl font-bold">Courier System</h1>
      <p className="text-zinc-400">Restoran, kurye ve admin paneli</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <Link href="/restoran-kayit" className="p-6 bg-zinc-900 rounded-xl border border-zinc-700 hover:bg-zinc-800">
          <h2 className="text-xl mb-2">🍔 Restoran Kayıt</h2>
          <p className="text-zinc-400">Yeni restoran başvurusu</p>
        </Link>

        <Link href="/restaurant-login" className="p-6 bg-zinc-900 rounded-xl border border-zinc-700 hover:bg-zinc-800">
          <h2 className="text-xl mb-2">🍽️ Restoran Giriş</h2>
          <p className="text-zinc-400">Sipariş oluşturma paneli</p>
        </Link>

        <Link href="/courier-register" className="p-6 bg-zinc-900 rounded-xl border border-zinc-700 hover:bg-zinc-800">
          <h2 className="text-xl mb-2">🛵 Kurye Kayıt</h2>
          <p className="text-zinc-400">Yeni kurye başvurusu</p>
        </Link>

        <Link href="/courier-login" className="p-6 bg-zinc-900 rounded-xl border border-zinc-700 hover:bg-zinc-800">
          <h2 className="text-xl mb-2">🚴 Kurye Giriş</h2>
          <p className="text-zinc-400">Teslimat paneli</p>
        </Link>

        <Link href="/admin-login" className="p-6 bg-zinc-900 rounded-xl border border-zinc-700 hover:bg-zinc-800">
          <h2 className="text-xl mb-2">👑 Admin Giriş</h2>
          <p className="text-zinc-400">Yönetim paneli</p>
        </Link>
      </div>
    </main>
  );
}