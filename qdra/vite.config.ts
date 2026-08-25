import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      // â¬‡ï¸ڈ ط¬ط¯ظٹط¯: طھظپط¹ظٹظ„ ط§ظ„ظ€ PWA ظپظٹ ظˆط¶ط¹ ط§ظ„طھط·ظˆظٹط± ط¹ط´ط§ظ† طھط¬ط±ط¨طھظ‡ ط¹ظ„ظ‰ ط§ظ„ط¬ظˆط§ظ„
      devOptions: {
        enabled: true,
      },

      includeAssets: ["logo-dark.png", "logo-192.png", "logo-512.png"],
      manifest: {
        name: "ظ‚ظڈط¯ط±ط© | ط§ط®طھط¨ط§ط± ط§ظ„ظ‚ط¯ط±ط§طھ ط§ظ„ظ„ظپط¸ظٹ",
        short_name: "ظ‚ظڈط¯ط±ط©",
        description:
          "ظ…ظ†طµط© ظ‚ظڈط¯ط±ط© ظ„ط§ط®طھط¨ط§ط± ظˆطھط¯ط±ظٹط¨ ط§ظ„ظ‚ط³ظ… ط§ظ„ظ„ظپط¸ظٹ ظ…ظ† ط§ط®طھط¨ط§ط± ط§ظ„ظ‚ط¯ط±ط§طھ ط§ظ„ط¹ط§ظ…ط©طŒ ط¨طھطµظ…ظٹظ… ظپط§ط®ط± ظˆط³ط±ط¹ط© ط¹ط§ظ„ظٹط© ظˆط­ظپط¸ طھظ„ظ‚ط§ط¦ظٹ ظ„طھظ‚ط¯ظ…ظƒ.",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "logo-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "logo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // â¬‡ï¸ڈ ط§ظ„طھط¹ط¯ظٹظ„ ط§ظ„ظˆط­ظٹط¯: ط±ظپط¹ ط§ظ„ط­ط¯ ظ…ظ† 2 ظ…ظٹط¬ط§ ط¥ظ„ظ‰ 5 ظ…ظٹط¬ط§
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

  server: {
    host: true,
    allowedHosts: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
