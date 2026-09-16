import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mamibaby.app",
  appName: "Mami Baby",
  webDir: "dist/public",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    url: "https://mamibaby-thxcfe8k.manus.space",
    cleartext: false,
  },
};

export default config;
