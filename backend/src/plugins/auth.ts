import fp from "fastify-plugin";
import crypto from "node:crypto";

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export default fp(async (app) => {
  // ================================
  // User
  // ================================

  app.decorateRequest("user");

  // ================================
  // Authentication
  // ================================

  app.decorate(
    "authenticate",
    async (request: any, reply: any) => {
      // 1. البحث عن التوكن أولاً في الكوكيز، وإذا لم يوجد، البحث في الـ Authorization Header
      let token = request.cookies?.rhal_session;

      if (!token && request.headers.authorization) {
        const parts = request.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          token = parts[1];
        }
      }

      console.log(
        "🔐 session token received:",
        Boolean(token),
        token ? "(من الكوكي أو الـ Header)" : "(غير موجود)"
      );

      if (!token) {
        return reply.status(401).send({
          success: false,
          message: "غير مسجل الدخول",
        });
      }

      const tokenHash = hashToken(token);

      // ================================
      // البحث عن الجلسة
      // ================================

      const session = await app.prisma.session.findUnique({
        where: {
          tokenHash,
        },
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

      // ================================
      // الجلسة غير موجودة
      // ================================

      if (!session) {
        return reply.status(401).send({
          success: false,
          message: "الجلسة غير صالحة",
        });
      }

      // ================================
      // انتهاء الجلسة
      // ================================

      if (session.expiresAt <= new Date()) {
        await app.prisma.session.delete({
          where: {
            id: session.id,
          },
        });

        return reply.status(401).send({
          success: false,
          message: "انتهت الجلسة",
        });
      }

      // ================================
      // التحقق من الاشتراك
      // ================================

      if (
        session.user.subscriptionExpiresAt &&
        session.user.subscriptionExpiresAt <= new Date()
      ) {
        return reply.status(403).send({
          success: false,
          message: "انتهى الاشتراك",
        });
      }

      // ================================
      // حفظ المستخدم داخل الطلب
      // ================================

      request.user = session.user;
    }
  );
});