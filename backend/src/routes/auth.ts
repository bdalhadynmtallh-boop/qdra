import { FastifyInstance } from "fastify";
import crypto from "node:crypto";

import {
  register,
  loginDirect,
  login,        // 👈 دالة إرسال الـ OTP
  verifyLogin,  // 👈 دالة التحقق من الـ OTP
  logout,
} from "../controllers/auth.controller.js";

import { isLocked, recordFail, clearFails } from "../utils/loginGuard.js"; // ✅ جديد

// دالة مساعدة لتشفير التوكن (نفس المستخدمة في authPlugin)
function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

// دالة مساعدة لاستخراج المستخدم من التوكن (بدون فحص الاشتراك)
async function getUserFromToken(app: FastifyInstance, request: any) {
  let token = request.cookies?.rhal_session;

  if (!token && request.headers.authorization) {
    const parts = request.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await app.prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionExpiresAt: true,
        },
      },
    },
  });

  // نتحقق أن الجلسة صالحة (غير منتهية)، لكن ما نتحقق من الاشتراك
  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}

// ========================================
// 🛡️ دالة حماية من هجمات التخمين (Brute-force)
// ========================================
function withLoginGuard(
  handler: (req: any, rep: any) => Promise<any>,
  extractEmail: (req: any) => string
) {
  return async (request: any, reply: any) => {
    const emailKey = `email:${extractEmail(request).toLowerCase()}`;
    const ipKey = `ip:${request.ip || "unknown"}`;

    // 1️⃣ فحص الحظر قبل المحاولة
    const mins = isLocked(emailKey) ?? isLocked(ipKey);
    if (mins !== null) {
      return reply.status(429).send({
        success: false,
        message: `محاولات فاشلة كثيرة — انتظر ${mins} دقيقة وجرّب مجدداً`,
      });
    }

    // 2️⃣ استدعاء الـ handler الأصلي
    const result = await handler(request, reply);

    // 3️⃣ فحص الاستجابة — إذا فشل (401) سجّل المحاولة الفاشلة
    if (reply.statusCode === 401) {
      recordFail(emailKey, ipKey);
    }
    // 4️⃣ إذا نجح (200 + success) امسح العداد
    else if (reply.statusCode === 200 && result?.success === true) {
      clearFails(emailKey, ipKey);
    }

    return result;
  };
}

export async function authRoutes(app: FastifyInstance) {
  // تسجيل حساب جديد للمستخدمين — محمي من الإساءة:
  // حتى مع وجود كود تفعيل صالح، لا يُسمح بتسجيل عدد كبير من الحسابات
  // من نفس العنوان في وقت قصير.
  app.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "10 minutes",
          keyGenerator: (request) => request.ip || "unknown",
        },
      },
    },
    register
  );

  // ========================================
  // 1. تسجيل الدخول بالرمز (OTP) - مع حماية brute-force
  // ========================================
  app.post(
    "/login",
    withLoginGuard(login, (req) => (req.body as any)?.email || "")
  );

  // ========================================
  // 2. التحقق من رمز الـ OTP - مع حماية brute-force
  // ========================================
  app.post(
    "/verify-login",
    withLoginGuard(verifyLogin, (req) => (req.body as any)?.email || "")
  );

  // ========================================
  // 3. تسجيل الدخول المباشر - مع حماية brute-force
  // ========================================
  app.post(
    "/login-direct",
    withLoginGuard(loginDirect, (req) => (req.body as any)?.email || "")
  );

  // جلب بيانات المستخدم الحالي عند وجود جلسة فعالة
  app.get(
    "/me",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          message: "غير مسجل الدخول",
        });
      }

      return reply.send({
        success: true,
        user: request.user,
      });
    }
  );

  // تسجيل الخروج ومسح جلسة المستخدم
  // لا نستخدم authenticate هنا لأنه يمنع (403) عند انتهاء الاشتراك —
  // فيعلق المستخدم المنتهي اشتراكه ولا يستطيع تسجيل الخروج.
  // logout فقط يحذف الجلسة المقابلة للكوكي المرسل، فهو آمن.
  app.post("/logout", logout);

  // =========================================================================
  // 4. تجديد الاشتراك باستخدام كود التفعيل (محمي من التخمين كمان)
  // =========================================================================
  app.post(
    "/renew",
    withLoginGuard(
      async (request, reply) => {
        const { code } = request.body as { code?: string };

        if (!code || typeof code !== "string") {
          return reply.status(400).send({
            success: false,
            message: "يجب إدخال رمز التفعيل",
          });
        }

        const user = await getUserFromToken(app, request);
        if (!user) {
          return reply.status(401).send({
            success: false,
            message: "الجلسة منتهية، الرجاء تسجيل الدخول مرة أخرى",
          });
        }

        const activationCode = await app.prisma.activationCode.findUnique({
          where: { code: code.trim() },
        });

        if (!activationCode) {
          return reply.status(404).send({
            success: false,
            message: "رمز التفعيل غير صحيح",
          });
        }

        if (activationCode.used) {
          return reply.status(400).send({
            success: false,
            message: "هذا الرمز مستخدم بالفعل",
          });
        }

        if (activationCode.expiresAt && activationCode.expiresAt <= new Date()) {
          return reply.status(400).send({
            success: false,
            message: "هذا الرمز منتهي الصلاحية",
          });
        }

        const now = new Date();
        const baseDate =
          user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
            ? user.subscriptionExpiresAt
            : now;

        const newExpiresAt = new Date(baseDate);
        newExpiresAt.setDate(newExpiresAt.getDate() + activationCode.durationDays);

        await app.prisma.$transaction([
          app.prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionExpiresAt: newExpiresAt,
              isActive: true,
            },
          }),
          app.prisma.activationCode.update({
            where: { id: activationCode.id },
            data: {
              used: true,
              userId: user.id,
              activatedAt: new Date(),
            },
          }),
        ]);

        return reply.send({
          success: true,
          message: `تم تجديد اشتراكك بنجاح لمدة ${activationCode.durationDays} يوم`,
          subscriptionExpiresAt: newExpiresAt.toISOString(),
        });
      },
      (req) => (req.body as any)?.email || "" // renew ما فيه email، بس نستخدم IP
    )
  );
}