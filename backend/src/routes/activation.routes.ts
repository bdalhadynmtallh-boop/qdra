
import { FastifyInstance } from "fastify";
import crypto from "node:crypto";

function generateCode(): string {
  const part = () =>
    crypto.randomBytes(3).toString("hex").toUpperCase();

  return `RHAL-${part()}-${part()}`;
}

export async function activationRoutes(app: FastifyInstance) {
  // إنشاء أكواد تفعيل
  app.post(
    "/codes",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      const body = request.body as {
        count?: number;
        durationDays?: number;
      };

      const count = body.count ?? 1;
      const durationDays = body.durationDays ?? 30;

      if (!Number.isInteger(count) || count < 1 || count > 1000) {
        return reply.status(400).send({
          success: false,
          message: "عدد الأكواد يجب أن يكون بين 1 و1000",
        });
      }

      if (
        !Number.isInteger(durationDays) ||
        durationDays < 1 ||
        durationDays > 3650
      ) {
        return reply.status(400).send({
          success: false,
          message: "مدة الاشتراك غير صحيحة",
        });
      }

      const codes: string[] = [];

      for (let i = 0; i < count; i++) {
        let code = generateCode();

        while (
          await app.prisma.activationCode.findUnique({
            where: { code },
          })
        ) {
          code = generateCode();
        }

        codes.push(code);
      }

      await app.prisma.activationCode.createMany({
        data: codes.map((code) => ({
          code,
          durationDays,
        })),
      });

      return reply.send({
        success: true,
        count: codes.length,
        durationDays,
        codes,
      });
    }
  );

  // عرض الأكواد
  app.get(
    "/codes",
    {
      preHandler: app.authenticate,
    },
    async (_request, reply) => {
      const codes = await app.prisma.activationCode.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        codes,
      });
    }
  );
}