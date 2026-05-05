"use client";

import { createContext, useContext, useState } from "react";

type Order = {
  id: number;
  musteri: string;
  adres: string;
  durum: "Hazırlanıyor" | "Yolda" | "Teslim Edildi";
  kurye: string;
};

type OrderContextType = {
  orders: Order[];
  addOrder: (musteri: string, adres: string) => void;
  assignCourier: (id: number, kurye: string) => void;
  updateStatus: (id: number, durum: Order["durum"]) => void;
};

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  function addOrder(musteri: string, adres: string) {
    const newOrder: Order = {
      id: Date.now(),
      musteri,
      adres,
      durum: "Hazırlanıyor",
      kurye: "",
    };

    setOrders((prev) => [...prev, newOrder]);
  }

  function assignCourier(id: number, kurye: string) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, kurye } : order
      )
    );
  }

  function updateStatus(id: number, durum: Order["durum"]) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, durum } : order
      )
    );
  }

  return (
    <OrderContext.Provider
      value={{ orders, addOrder, assignCourier, updateStatus }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error("useOrders OrderProvider içinde kullanılmalı");
  }

  return context;
}