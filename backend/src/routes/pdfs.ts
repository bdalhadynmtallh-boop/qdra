import { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// 📁 تحديد مجلد الـ PDFs الخاص (خارج public)
// ========================================
const possiblePaths = [
  path.resolve(__dirname, "../../private-pdfs"),
  path.resolve(__dirname, "../../../private-pdfs"),
  path.resolve(process.cwd(), "private-pdfs"),
];

let PDFS_DIR = possiblePaths[0];
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    PDFS_DIR = p;
    break;
  }
}

const ALLOWED_TYPES = ["solved", "unsolved"];

export async function pdfRoutes(app: FastifyInstance) {
  // ========================================
  // 📄 قائمة الملفات المتاحة (محمي)
  // ========================================
  app.get(
    "/pdfs/list",
    { preHandler: app.authenticate },
    async (request, reply) => {
      try {
        const result: Record<string, string[]> = {};
        for (const type of ALLOWED_TYPES) {
          const dir = path.join(PDFS_DIR, type);
          result[type] = fs.existsSync(dir)
            ? fs
                .readdirSync(dir)
                .filter((f) => f.toLowerCase().endsWith(".pdf"))
            : [];
        }
        return reply.send({ success: true, files: result });
      } catch {
        return reply.send({
          success: true,
          files: { solved: [], unsolved: [] },
        });
      }
    }
  );

  // ========================================
  // 🔐 بث ملف PDF (محمي بتسجيل الدخول)
  // ========================================
  app.get(
    "/pdfs/:type/:file",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { type, file } = request.params as {
        type: string;
        file: string;
      };

      // منع الوصول لمجلدات أخرى
      if (!ALLOWED_TYPES.includes(type)) {
        return reply.status(400).send({
          success: false,
          message: "نوع غير صالح",
        });
      }

      // منع حقن المسارات
      const safeName = path.basename(file);
      if (!safeName.toLowerCase().endsWith(".pdf")) {
        return reply.status(400).send({
          success: false,
          message: "ملف غير صالح",
        });
      }

      const filePath = path.join(PDFS_DIR, type, safeName);

      if (!fs.existsSync(filePath)) {
        return reply.status(404).send({
          success: false,
          message: "الملف غير موجود",
        });
      }

      reply.type("application/pdf");
      reply.header(
        "Content-Disposition",
        `inline; filename="${safeName}"`
      );

      return reply.send(fs.createReadStream(filePath));
    }
  );
}