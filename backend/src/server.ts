import "dotenv/config";
import Fastify from "fastify";
import type { FastifyError } from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";

// Plugins
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import adminPlugin from "./plugins/admin.js";

// Routes
import { sectionRoutes } from "./routes/sections.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";
import { adminRoutes } from "./routes/admin.js";
import { aiAdminRoutes } from "./routes/aiAdmin.js";
import { progressRoutes } from "./routes/progress.js";
import { simulatorRoutes } from "./routes/simulator.js";
import { pdfRoutes } from "./routes/pdfs.js";
import { aiRoutes } from "./routes/ai.js";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.password",
        "req.body.code",
      ],
      censor: "***REDACTED***",
    },
  },
  trustProxy: true,
});

// ========================================
// 🛡️ CORS
// ========================================

const ALLOWED_ORIGINS = [
  "https://qdra.vercel.app",
  "https://qudrat.app",
  "https://admin-lx6f.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
];

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    // قبول أي منفذ localhost أثناء التطوير (localhost:5173, 5174, 4173...)
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      cb(null, true);
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      cb(null, true);
      return;
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from: ${origin}`);
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 3600,
});

// ========================================
// 🛡️ Security Plugins
// ========================================

await app.register(cookie, {
  parseOptions: { sameSite: "lax", path: "/" },
});

await app.register(helmet, {
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://qdra.vercel.app", "https://qdra-1.onrender.com", "https://admin-lx6f.vercel.app"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hidePoweredBy: true,
  ieNoOpen: true,
  noSniff: true,
  frameguard: { action: "deny" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  dnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
});

// ========================================
// 🛡️ Rate Limiting
// ========================================

await app.register(rateLimit, {
  // 200 بدل 100: المحاكي يجلب أسئلة من عدة أقسام دفعة واحدة،
  // والحد السابق (100) كان يُضرب فتعطّل كل الـ API (حتى حفظ التقدم والمفضلة).
  max: 200,
  timeWindow: "1 minute",
  keyGenerator: (request) => {
    const ip = request.ip || "unknown";
    const ua = (request.headers["user-agent"] as string) || "unknown";
    return `${ip}:${ua.slice(0, 30)}`;
  },
  allowList: ["/api/health", "/api"],
  errorResponseBuilder: (_request, context) => ({
    success: false,
    message: `تم تجاوز الحد المسموح — انتظر ${Math.ceil(context.ttl / 1000)} ثانية`,
  }),
});

// ========================================
// ⚙️ Database & Plugins
// ========================================

await app.register(prismaPlugin);
await app.register(authPlugin);
await app.register(adminPlugin);

const sensitiveRateLimit = {
  max: 30,
  timeWindow: "1 minute",
  errorResponseBuilder: () => ({
    success: false,
    message: "تم تجاوز الحد المسموح",
  }),
};

// ========================================
// 📡 Routes
// ========================================

await app.register(sectionRoutes, { prefix: "/api" });
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(adminRoutes, {
  prefix: "/api/admin",
  config: { rateLimit: sensitiveRateLimit },
});
await app.register(aiAdminRoutes, {
  prefix: "/api/admin",
  config: { rateLimit: sensitiveRateLimit },
});
await app.register(progressRoutes, { prefix: "/api/progress" });
await app.register(simulatorRoutes, { prefix: "/api/simulator" });
await app.register(pdfRoutes, { prefix: "/api" });
await app.register(aiRoutes, { prefix: "/api" });
await app.register(healthRoutes, { prefix: "/api" });

// ========================================
// 🌐 Root Routes
// ========================================

app.get("/", async () => ({
  success: true,
  message: "RHAL Backend is running",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
}));

app.get("/api", async () => ({
  success: true,
  message: "RHAL API is running",
}));

// ========================================
// 🛡️ Global Error Handler (✅ مُصحح: FastifyError)
// ========================================

app.setErrorHandler((error: FastifyError, request, reply) => {
  request.log.error(error);

  const statusCode = error.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send({
      success: false,
      message: error.message || "خطأ في الطلب",
    });
  }

  return reply.status(500).send({
    success: false,
    message: "حدث خطأ غير متوقع، حاول مرة أخرى",
  });
});

// ========================================
// 🛡️ 404 Handler
// ========================================

app.setNotFoundHandler((request, reply) => {
  request.log.warn(`🔍 404: ${request.method} ${request.url} from ${request.ip}`);
  return reply.status(404).send({
    success: false,
    message: "المسار غير موجود",
  });
});

// ========================================
// 🚀 Start Server (✅ مُصحح: unknown + Error)
// ========================================

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

    await app.listen({ port, host });

    console.log(`🚀 RHAL Backend running on http://${host}:${port}`);
    console.log(`🛡️  Security: CORS restricted, Helmet enabled, Rate limiting active`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    app.log.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

// ========================================
// 🛡️ Graceful Shutdown (✅ مُصحح: unknown + Error)
// ========================================

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received — shutting down gracefully...`);
  try {
    await app.close();
    console.log("✅ Server closed");
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Error during shutdown: ${message}`);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

start();