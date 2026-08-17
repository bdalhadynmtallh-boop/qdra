import { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      success: true,
      status: "ok",
      service: "RHAL Backend",
    };
  });

  app.get("/health/db", async () => {
    try {
      await app.prisma.user.count();

      return {
        success: true,
        database: "connected",
      };
    } catch (error) {
      app.log.error(error);

      return {
        success: false,
        database: "disconnected",
      };
    }
  });
}