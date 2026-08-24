import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// ✅ تحميل متغيرات البيئة
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL غير موجود في ملف .env");
  process.exit(1);
}

// ✅ استخدام driver adapter (مثل server.ts)
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔍 نجرب مسارات مختلفة حتى نلقى الصحيح
const possiblePaths = [
  path.resolve(__dirname, "../../../qdra/src/data/sections"),
  path.resolve(__dirname, "../../qdra/src/data/sections"),
  path.resolve(__dirname, "../../../../qdra/src/data/sections"),
  path.resolve(process.cwd(), "../qdra/src/data/sections"),
];

async function main() {
  console.log("🚀 بدء ترحيل الأقسام...\n");
  console.log(`📍 Script location: ${__dirname}`);
  console.log(`📍 Working dir: ${process.cwd()}\n`);

  // 🔍 البحث عن المجلد الصحيح
  let SECTIONS_DIR = "";
  for (const p of possiblePaths) {
    console.log(`🔎 أفحص: ${p}`);
    if (fs.existsSync(p)) {
      SECTIONS_DIR = p;
      console.log(`✅ لقيت المجلد!\n`);
      break;
    } else {
      console.log(`   ❌ غير موجود\n`);
    }
  }

  if (!SECTIONS_DIR) {
    console.error("\n❌❌❌ ما لقيت مجلد الأسئلة في أي من المسارات المتوقعة!");
    console.error("📂 جرّب تعدل المسار يدوياً في السطر المناسب من الـ script.");
    await prisma.$disconnect();
    process.exit(1);
  }

  // 🔍 عرض محتويات المجلد
  const files = fs.readdirSync(SECTIONS_DIR);
  const jsonFiles = files.filter((f) => f.startsWith("section") && f.endsWith(".json"));
  console.log(`📁 عدد ملفات section*.json في المجلد: ${jsonFiles.length}`);
  console.log(`📋 أول 10 ملفات: ${jsonFiles.slice(0, 10).join(", ")}\n`);

  interface Question {
    id: number;
    category: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    passage?: string;
  }

  function pad3(n: number) {
    return n.toString().padStart(3, "0");
  }

  const TOTAL_SECTIONS = 200;
  let withQuestions = 0;
  let emptySections = 0;
  let failed = 0;

  for (let i = 1; i <= TOTAL_SECTIONS; i++) {
    const fileId = pad3(i);
    const sectionName = `القسم ${i}`;
    const jsonPath = path.join(SECTIONS_DIR, `section${fileId}.json`);

    let questions: Question[] = [];

    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const parsed = JSON.parse(raw);
        questions = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn(`⚠️  خطأ في قراءة ${jsonPath}:`, err);
        questions = [];
      }
    } else {
      emptySections++;
    }

    try {
      await prisma.section.upsert({
        where: { id: i },
        update: {
          fileId,
          name: sectionName,
          questions: questions as any,
        },
        create: {
          id: i,
          fileId,
          name: sectionName,
          category: "",
          type: "",
          description: "",
          questions: questions as any,
          isActive: true,
          order: i,
        },
      });

      if (questions.length > 0) {
        withQuestions++;
        process.stdout.write(`✅ القسم ${fileId}: ${questions.length} سؤال\n`);
      } else {
        process.stdout.write(`⬜ القسم ${fileId}: فارغ\n`);
      }
    } catch (err) {
      console.error(`❌ فشل القسم ${fileId}:`, err);
      failed++;
    }
  }

  console.log("\n========================================");
  console.log("📊 ملخص الترحيل:");
  console.log(`   📚 أقسام فيها أسئلة: ${withQuestions}`);
  console.log(`   ⬜ أقسام فارغة: ${emptySections}`);
  console.log(`   ❌ أقسام فشلت: ${failed}`);
  console.log("========================================\n");

  await prisma.$disconnect();
  console.log("✨ اكتمل الترحيل!");
}

main().catch((err) => {
  console.error("❌ خطأ فادح:", err);
  process.exit(1);
});