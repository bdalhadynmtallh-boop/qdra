
import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: any;

    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;

    authenticateAdmin: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string | null;
    };

    admin?: {
      id: string;
      email: string;
      name: string | null;
    };
  }
}

