import fp from "fastify-plugin";
import crypto from "node:crypto";

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export default fp(async (app) => {
  app.decorate("authenticateAdmin", async (request: any, reply: any) => {
    // ✅ 1) نجرب الكوكي أولاً (للاستخدام المحلي)
    let token = request.cookies?.rhal_session;

    // ✅ 2) إذا ما فيه كوكي، نقرأ من هيدر Authorization (للوحات على دومينات خارجية)
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return reply.status(401).send({
        success: false,
        message: "غير مصرح",
      });
    }

    const tokenHash = hashToken(token);

    const session = await app.prisma.session.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return reply.status(401).send({
        success: false,
        message: "الجلسة غير صالحة",
      });
    }

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

    // ✅ 3) ندعم أكثر من بريد أدمن (مفصولة بفاصلة)
    const adminEmails = (process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length === 0) {
      request.log.error("ADMIN_EMAIL is not configured");

      return reply.status(500).send({
        success: false,
        message: "لم يتم إعداد حساب الأدمن",
      });
    }

    if (!adminEmails.includes(session.user.email.toLowerCase())) {
      return reply.status(403).send({
        success: false,
        message: "ليس لديك صلاحية الوصول إلى لوحة التحكم",
      });
    }

    request.admin = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  });
});