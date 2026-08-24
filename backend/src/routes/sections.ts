import { FastifyInstance } from "fastify";
import {
  getSectionsForStudents,
  getSectionForStudent,
  getAllSectionsForAdmin,
  getSectionForAdmin,
  createSection,
  updateSection,
  deleteSection,
  toggleSection,
  reorderSections,
  importQuestionsJson,
  syncSectionsFromFiles,  // ← جديد
} from "../controllers/sections.controller.js";

export async function sectionRoutes(app: FastifyInstance) {
  // ========================================
  // 🔓 للطلاب (قراءة فقط)
  // ========================================
  app.get("/sections", getSectionsForStudents);
  app.get("/sections/:id", getSectionForStudent);

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

  // 🔄 جديد: مزامنة الأقسام من ملفات JSON إلى قاعدة البيانات
  app.post(
    "/admin/sections/sync-from-files",
    { preHandler: app.authenticateAdmin },
    syncSectionsFromFiles
  );
}