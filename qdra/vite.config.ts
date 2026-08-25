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

      // ⬇️ جديد: تفعيل الـ PWA في وضع التطوير عشان تجربته على الجوال
      devOptions: {
        enabled: true,
      },

      includeAssets: ["logo-dark.png", "logo-192.png", "logo-512.png"],
      manifest: {
        name: "قُدرة | اختبار القدرات اللفظي",
        short_name: "قُدرة",
        description:
          "منصة قُدرة لاختبار وتدريب القسم اللفظي من اختبار القدرات العامة، بتصميم فاخر وسرعة عالية وحفظ تلقائي لتقدمك.",
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
        // ⬇️ التعديل الوحيد: رفع الحد من 2 ميجا إلى 5 ميجا
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