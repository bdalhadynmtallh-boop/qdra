import { FastifyInstance } from "fastify";
import {
  getSectionsForStudents,
  getSectionForStudent,
  getSectionQuestions,        // ← جديد: جلب الأسئلة (محمي)
  checkAnswer,                // ← جديد: تصحيح الإجابة (محمي)
  getAllSectionsForAdmin,
  getSectionForAdmin,
  createSection,
  updateSection,
  deleteSection,
  toggleSection,
  reorderSections,
  importQuestionsJson,
  syncSectionsFromFiles,
} from "../controllers/sections.controller.js";

export async function sectionRoutes(app: FastifyInstance) {
  // ========================================
  // 🔓 PUBLIC — بيانات وصفية فقط (بدون أسئلة!)
  // ========================================
  app.get("/sections", getSectionsForStudents);
  app.get("/sections/:id", getSectionForStudent);

  // ========================================
  // 🔐 للطلاب المسجلين فقط — الأسئلة الكاملة
  // ========================================
  app.get(
    "/sections/:id/questions",
    { preHandler: app.authenticate },
    getSectionQuestions
  );

  // ========================================
  // 🔐 للطلاب المسجلين فقط — تصحيح الإجابة في السيرفر
  // ========================================
  app.post(
    "/sections/:id/check",
    { preHandler: app.authenticate },
    checkAnswer
  );

  // ========================================
  // 🔐 للأدمن (محمي)
  // ========================================
  app.get(
    "/admin/sections",
    { preHandler: app.authenticateAdmin },
    getAllSectionsForAdmin
  );

  app.get(
    "/admin/sections/:id",
    { preHandler: app.authenticateAdmin },
    getSectionForAdmin
  );

  app.post(
    "/admin/sections",
    { preHandler: app.authenticateAdmin },
    createSection
  );

  app.put(
    "/admin/sections/:id",
    { preHandler: app.authenticateAdmin },
    updateSection
  );

  app.delete(
    "/admin/sections/:id",
    { preHandler: app.authenticateAdmin },
    deleteSection
  );

  app.post(
    "/admin/sections/:id/toggle",
    { preHandler: app.authenticateAdmin },
    toggleSection
  );

  app.post(
    "/admin/sections/reorder",
    { preHandler: app.authenticateAdmin },
    reorderSections
  );

  app.post(
    "/admin/sections/:id/import-questions",
    { preHandler: app.authenticateAdmin },
    importQuestionsJson
  );

  // 🔄 مزامنة الأقسام من ملفات JSON إلى قاعدة البيانات
  app.post(
    "/admin/sections/sync-from-files",
    { preHandler: app.authenticateAdmin },
    syncSectionsFromFiles
  );
}