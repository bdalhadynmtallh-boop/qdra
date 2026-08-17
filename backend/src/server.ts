import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";

import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { adminRoutes } from "./routes/admin.js";
import { progressRoutes } from "./routes/progress.js";
import { simulatorRoutes } from "./routes/simulator.js";

import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import adminPlugin from "./plugins/admin.js";

const app = Fastify({
  logger: true,
});

// ================================
// CORS - دعم الجوال واللابتوب والـ Headers
// ================================

await app.register(cors, {
  origin: true, // يتيح الاتصال من أي دومين/IP محلي للجوال
  credentials: true, // يتيح إرسال واستقبال الكوكيز
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// ================================
// Security Plugins
// ================================

await app.register(cookie, {
  parseOptions: {
    sameSite: "lax",
    path: "/",
  },
});

await app.register(helmet, {
  crossOriginResourcePolicy: false, // لمنع تعارض الحماية مع الجوال
});

await app.register(rateLimit, {
  max: 200,
  timeWindow: "1 minute",
});

// ================================
// Database & Plugins
// ================================

await app.register(prismaPlugin);
await app.register(authPlugin);
await app.register(adminPlugin);

// ================================
// Routes
// ================================

await app.register(authRoutes, {
  prefix: "/api/auth",
});

await app.register(adminRoutes, {
  prefix: "/api/admin",
});

await app.register(progressRoutes, {
  prefix: "/api/progress",
});

await app.register(simulatorRoutes, {
  prefix: "/api/simulator",
});

await app.register(healthRoutes, {
  prefix: "/api",
});

// ================================
// Root Routes
// ================================

app.get("/", async () => {
  return {
    success: true,
    message: "RHAL Backend is running",
  };
});

app.get("/api", async () => {
  return {
    success: true,
    message: "RHAL API is running",
  };
});

// ================================
// Start Server
// ================================

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
    });

    console.log("🚀 RHAL Backend running on http://localhost:3000");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();