import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kurye Sistem",
  description: "Kurye teslimat uygulaması",
  manifest: "/manifest.json",
  themeColor: "#000000",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        {/* PWA ekstra meta */}
        <meta name="application-name" content="Kurye Sistem" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Kurye Sistem" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Apple icon */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>

      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  );
}