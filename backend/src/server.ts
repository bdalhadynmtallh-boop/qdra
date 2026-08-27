import "dotenv/config";
import Fastify from "fastify";
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
import { progressRoutes } from "./routes/progress.js";
import { simulatorRoutes } from "./routes/simulator.js";
import { pdfRoutes } from "./routes/pdfs.js";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    // ✅ إخفاء الحقول الحساسة من الـ logs
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
  // ✅ مهم لـ Render (proxy)
  trustProxy: true,
});

// ========================================
// 🛡️ CORS - مقيد بدومينات موثوقة فقط
// ========================================

const ALLOWED_ORIGINS = [
  // الإنتاج
  "https://qdra.vercel.app",
  "https://qudrat.app", // إذا عندك دومين مخصص
  // التطوير المحلي
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173", // vite preview
];

await app.register(cors, {
  origin: (origin, cb) => {
    // السماح للطلبات بدون origin (تطبيقات الجوال / Postman / server-to-server)
    if (!origin) {
      cb(null, true);
      return;
    }

    // في بيئة التطوير، نسمح بكل شي
    if (process.env.NODE_ENV !== "production") {
      cb(null, true);
      return;
    }

    // في الإنتاج، نسمح فقط بالدومينات المعروفة
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
  // ✅ Cache نتيجة preflight لمدة ساعة
  maxAge: 3600,
});

// ========================================
// 🛡️ Security Plugins
// ========================================

await app.register(cookie, {
  parseOptions: {
    sameSite: "lax",
    path: "/",
  },
});

await app.register(helmet, {
  // ✅ السماح بتحميل الموارد من مصادر خارجية (fonts, CDN)
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://qdra.vercel.app", "https://qdra-1.onrender.com"],
      frameAncestors: ["'none'"], // منع clickjacking
      upgradeInsecureRequests: [],
    },
  },
  // ✅ إخفاء معلومات السيرفر
  hidePoweredBy: true,
  // ✅ منع IE من فتح الموقع في سياق مختلف
  ieNoOpen: true,
  // ✅ منع MIME sniffing
  noSniff: true,
  // ✅ حماية من clickjacking
  frameguard: { action: "deny" },
  // ✅ HSTS - إجبار HTTPS
  hsts: {
    maxAge: 31536000, // سنة
    includeSubDomains: true,
    preload: true,
  },
  // ✅ XSS Filter
  xssFilter: true,
  // ✅ Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // ✅ DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  // ✅ Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
});

// ========================================
// 🛡️ Rate Limiting عام
// ========================================

await app.register(rateLimit, {
  max: 100, // ✅ قلّلنا من 200 إلى 100
  timeWindow: "1 minute",
  // ✅ اعتبار IP + User-Agent كمفتاح (أدق)
  keyGenerator: (request) => {
    const ip = request.ip || "unknown";
    const ua = request.headers["user-agent"] || "unknown";
    return `${ip}:${ua.slice(0, 30)}`;
  },
  // ✅ السماح بمزيد من الطلبات للصحة
  allowList: ["/api/health", "/api"],
  // ✅ رسالة حظر واضحة
  errorResponseBuilder: (request, context) => {
    return {
      success: false,
      message: `تم تجاوز الحد المسموح — انتظر ${Math.ceil(context.ttl / 1000)} ثانية`,
    };
  },
});

// ========================================
// ⚙️ Database & Plugins
// ========================================

await app.register(prismaPlugin);
await app.register(authPlugin);
await app.register(adminPlugin);

// ========================================
// 🛡️ Rate Limit خاص بالمسارات الحساسة
// ========================================

const loginRateLimit = {
  max: 5,
  timeWindow: "15 minutes",
  errorResponseBuilder: () => ({
    success: false,
    message: "محاولات كثيرة — انتظر 15 دقيقة",
  }),
};

const renewRateLimit = {
  max: 3,
  timeWindow: "1 hour",
  errorResponseBuilder: () => ({
    success: false,
    message: "محاولات تجديد كثيرة — انتظر ساعة",
  }),
};

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

await app.register(sectionRoutes, {
  prefix: "/api",
});

// ✅ حماية خاصة لتسجيل الدخول
await app.register(authRoutes, {
  prefix: "/api/auth",
});

await app.register(adminRoutes, {
  prefix: "/api/admin",
  // ✅ Admin يحتاج rate limit أشد
  config: {
    rateLimit: sensitiveRateLimit,
  },
});

await app.register(progressRoutes, {
  prefix: "/api/progress",
});

await app.register(simulatorRoutes, {
  prefix: "/api/simulator",
});

await app.register(pdfRoutes, {
  prefix: "/api",
});

await app.register(healthRoutes, {
  prefix: "/api",
});

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
// 🛡️ Global Error Handler (يمنع تسريب المعلومات)
// ========================================

app.setErrorHandler((error, request, reply) => {
  // ✅ تسجيل الخطأ داخلياً (للمطورين)
  request.log.error(error);

  // ✅ منع تسريب تفاصيل الخطأ للمستخدم
  const statusCode = error.statusCode || 500;

  // أخطاء معروفة - أرسل الرسالة كما هي
  if (statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send({
      success: false,
      message: error.message || "خطأ في الطلب",
    });
  }

  // أخطاء السيرفر - رسالة عامة فقط
  return reply.status(500).send({
    success: false,
    message: "حدث خطأ غير متوقع، حاول مرة أخرى",
  });
});

// ========================================
// 🛡️ 404 Handler (يمنع تسريب المسارات)
// ========================================

app.setNotFoundHandler((request, reply) => {
  request.log.warn(`🔍 404: ${request.method} ${request.url} from ${request.ip}`);
  return reply.status(404).send({
    success: false,
    message: "المسار غير موجود",
  });
});

// ========================================
// 🚀 Start Server
// ========================================

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

    await app.listen({ port, host });

    console.log(`🚀 RHAL Backend running on http://${host}:${port}`);
    console.log(`🛡️  Security: CORS restricted, Helmet enabled, Rate limiting active`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

// ========================================
// 🛡️ Graceful Shutdown
// ========================================

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received — shutting down gracefully...`);
  try {
    await app.close();
    console.log("✅ Server closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

start();