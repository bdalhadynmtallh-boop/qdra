import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "qdra-student-secret-change-me";

export async function authenticateStudent(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({
        success: false,
        message: "يجب تسجيل الدخول للوصول إلى هذا المحتوى",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role?: string;
    };

    // يمكن إضافة تحقق إضافي من الاشتراك هنا
    (request as any).student = decoded;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      message: "جلسة منتهية أو غير صالحة، يرجى تسجيل الدخول مرة أخرى",
    });
  }
}