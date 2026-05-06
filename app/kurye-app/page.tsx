"use client";

import { useRouter } from "next/navigation";

export default function KuryeAppPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">
        🛵 Kurye Sistemi
      </h1>

      <p className="text-zinc-400 text-center">
        Kurye giriş veya kayıt işlemini seç
      </p>

      <button
        onClick={() => router.push("/courier-login")}
        className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded w-72"
      >
        Kurye Girişi
      </button>

      <button
        onClick={() => router.push("/courier-register")}
        className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded w-72"
      >
        Kurye Kayıt
      </button>
    </main>
  );
}