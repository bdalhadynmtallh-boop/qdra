import crypto from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client.js";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 يوم

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createSession(
  prisma: PrismaClient,
  userId: string
) {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS
  );

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}