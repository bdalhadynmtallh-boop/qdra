import { FastifyInstance } from "fastify";
import crypto from "node:crypto";

import {
  register,
  loginDirect,
  login,        // 👈 إضافة دالة إرسال الـ OTP
  verifyLogin,  // 👈 إضافة دالة التحقق من الـ OTP
  logout,
} from "../controllers/auth.controller.js";

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

export async function authRoutes(app: FastifyInstance) {
  // تسجيل حساب جديد للمستخدمين
  app.post("/register", register);

  // 1. تسجيل الدخول بالرمز (OTP) - للوحة التحكم والبريد الإلكتروني فقط
  app.post("/login", login);

  // 2. التحقق من رمز الـ OTP وإنشاء كوكيز الجلسة
  app.post("/verify-login", verifyLogin);

  // 3. تسجيل الدخول المباشر بالبريد وكلمة المرور لتطبيق قدرة
  app.post("/login-direct", loginDirect);

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
  app.post(
    "/logout",
    {
      preHandler: app.authenticate,
    },
    logout
  );

  // =========================================================================
  // 4. تجديد الاشتراك باستخدام كود التفعيل (جديد)
  // =========================================================================
  // هذا المسار يعمل حتى لو اشتراك المستخدم منتهي (لأنه ما يستخدم authenticate)
  app.post("/renew", async (request, reply) => {
    const { code } = request.body as { code?: string };

    if (!code || typeof code !== "string") {
      return reply.status(400).send({
        success: false,
        message: "يجب إدخال رمز التفعيل",
      });
    }

    // 1. استخراج المستخدم من التوكن (بدون فحص الاشتراك)
    const user = await getUserFromToken(app, request);
    if (!user) {
      return reply.status(401).send({
        success: false,
        message: "الجلسة منتهية، الرجاء تسجيل الدخول مرة أخرى",
      });
    }

    // 2. البحث عن كود التفعيل في قاعدة البيانات
    const activationCode = await app.prisma.activationCode.findUnique({
      where: { code: code.trim() },
    });

    if (!activationCode) {
      return reply.status(404).send({
        success: false,
        message: "رمز التفعيل غير صحيح",
      });
    }

    // 3. التحقق من أن الكود ما استُخدم من قبل
    if (activationCode.used) {
      return reply.status(400).send({
        success: false,
        message: "هذا الرمز مستخدم بالفعل",
      });
    }

    // 4. التحقق من أن الكود ما منتهي الصلاحية (إذا كان فيه expiresAt)
    if (activationCode.expiresAt && activationCode.expiresAt <= new Date()) {
      return reply.status(400).send({
        success: false,
        message: "هذا الرمز منتهي الصلاحية",
      });
    }

    // 5. حساب تاريخ انتهاء الاشتراك الجديد
    //    إذا كان عندك اشتراك حالي لسا ما انتهى، نضيف المدة عليه
    //    إذا انتهى، نحسب من اليوم
    const now = new Date();
    const baseDate =
      user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
        ? user.subscriptionExpiresAt
        : now;

    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + activationCode.durationDays);

    // 6. تحديث المستخدم + تفعيل الكود في معاملة واحدة (Transaction)
    await app.prisma.$transaction([
      // تحديث تاريخ انتهاء اشتراك المستخدم
      app.prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionExpiresAt: newExpiresAt,
          isActive: true,
        },
      }),

      // تحديث الكود كـ "مستخدم" وربطه بالمستخدم
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
  });
}