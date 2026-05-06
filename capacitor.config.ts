import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.buket.kurye",
  appName: "Kurye Sistemi",
  webDir: "public",

  server: {
    url: "https://kurye-sistemi-one.vercel.app/kurye-app",
    cleartext: true,
  },
};

export default config;