
import "dotenv/config";
import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL غير موجود في ملف .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  let code = "";

  // إنشاء كود عشوائي والتأكد أنه غير موجود مسبقًا
  while (true) {
    code = `RHAL-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const existing = await prisma.activationCode.findUnique({
      where: {
        code,
      },
    });

    if (!existing) {
      break;
    }
  }

  const activationCode = await prisma.activationCode.create({
    data: {
      code,
    },
  });

  console.log("");
  console.log("================================");
  console.log("✅ تم إنشاء رمز تفعيل جديد");
  console.log("================================");
  console.log(`الكود: ${activationCode.code}`);
  console.log("================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ حدث خطأ:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
