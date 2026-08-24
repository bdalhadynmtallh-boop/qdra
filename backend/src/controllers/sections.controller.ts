import { FastifyReply, FastifyRequest } from "fastify";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  passage?: string;
}

// ========================================
// 🔧 دالة مساعدة: تحديث ملف JSON بعد كل تعديل
// ========================================
function saveSectionToFile(section: any) {
  try {
    const possiblePaths = [
      path.resolve(__dirname, "../../../qdra/src/data/sections"),
      path.resolve(__dirname, "../../qdra/src/data/sections"),
      path.resolve(__dirname, "../../../../qdra/src/data/sections"),
      path.resolve(process.cwd(), "../qdra/src/data/sections"),
    ];

    let SECTIONS_DIR = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        SECTIONS_DIR = p;
        break;
      }
    }

    if (!SECTIONS_DIR) {
      const newPath = path.resolve(__dirname, "../../../qdra/src/data/sections");
      fs.mkdirSync(newPath, { recursive: true });
      SECTIONS_DIR = newPath;
      console.log(`📁 تم إنشاء مجلد الأقسام: ${newPath}`);
    }

    const fileId = section.fileId || section.id.toString().padStart(3, "0");
    const filePath = path.join(SECTIONS_DIR, `section${fileId}.json`);

    const questions = Array.isArray(section.questions) ? section.questions : [];

    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), "utf-8");
    console.log(`✅ تم تحديث الملف: ${filePath}`);
  } catch (err) {
    console.error("❌ فشل تحديث ملف JSON:", err);
  }
}

function deleteSectionFile(fileId: string) {
  try {
    const possiblePaths = [
      path.resolve(__dirname, "../../../qdra/src/data/sections"),
      path.resolve(__dirname, "../../qdra/src/data/sections"),
      path.resolve(__dirname, "../../../../qdra/src/data/sections"),
      path.resolve(process.cwd(), "../qdra/src/data/sections"),
    ];

    let SECTIONS_DIR = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        SECTIONS_DIR = p;
        break;
      }
    }

    if (!SECTIONS_DIR) return;

    const filePath = path.join(SECTIONS_DIR, `section${fileId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  تم حذف الملف: ${filePath}`);
    }
  } catch (err) {
    console.error("❌ فشل حذف ملف JSON:", err);
  }
}

// ========================================
// 🔓 للطلاب (قراءة فقط)
// ========================================

export async function getSectionsForStudents(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sections = await request.server.prisma.section.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      fileId: true,
      name: true,
      category: true,
      type: true,
      description: true,
      order: true,
      questions: true,
    },
  });

  const sectionsWithCount = sections.map((s: any) => ({
    ...s,
    questionCount: Array.isArray(s.questions) ? s.questions.length : 0,
  }));

  return reply.send({
    success: true,
    sections: sectionsWithCount,
  });
}

export async function getSectionForStudent(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);
  if (isNaN(id)) {
    return reply.status(400).send({
      success: false,
      message: "معرّف القسم غير صحيح",
    });
  }

  const section = await request.server.prisma.section.findUnique({
    where: { id, isActive: true },
  });

  if (!section) {
    return reply.status(404).send({
      success: false,
      message: "القسم غير موجود",
    });
  }

  return reply.send({
    success: true,
    section: {
      ...section,
      questionCount: Array.isArray(section.questions)
        ? section.questions.length
        : 0,
    },
  });
}

// ========================================
// 🔐 للأدمن (محمي)
// ========================================

export async function getAllSectionsForAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sections = await request.server.prisma.section.findMany({
    orderBy: { order: "asc" },
  });

  const sectionsWithCount = sections.map((s: any) => ({
    ...s,
    questionCount: Array.isArray(s.questions) ? s.questions.length : 0,
  }));

  return reply.send({
    success: true,
    sections: sectionsWithCount,
  });
}

export async function getSectionForAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);
  if (isNaN(id)) {
    return reply.status(400).send({
      success: false,
      message: "معرّف القسم غير صحيح",
    });
  }

  const section = await request.server.prisma.section.findUnique({
    where: { id },
  });

  if (!section) {
    return reply.status(404).send({
      success: false,
      message: "القسم غير موجود",
    });
  }

  return reply.send({
    success: true,
    section: {
      ...section,
      questionCount: Array.isArray(section.questions)
        ? section.questions.length
        : 0,
    },
  });
}

export async function createSection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as {
    name: string;
    category?: string;
    type?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    questions?: Question[];
  };
  const { name, category, type, description, isActive, questions, order } = body;

  if (!name || !name.trim()) {
    return reply.status(400).send({
      success: false,
      message: "اسم القسم مطلوب",
    });
  }

  const lastSection = await request.server.prisma.section.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const newId = (lastSection?.id ?? 0) + 1;
  const newFileId = newId.toString().padStart(3, "0");

  const lastOrdered = await request.server.prisma.section.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const newOrder = order ?? (lastOrdered?.order ?? 0) + 1;

  const section = await request.server.prisma.section.create({
    data: {
      id: newId,
      fileId: newFileId,
      name: name.trim(),
      category: category?.trim() || "",
      type: type?.trim() || "",
      description: description?.trim() || "",
      questions: (questions || []) as any,
      isActive: isActive ?? true,
      order: newOrder,
    },
  });

  saveSectionToFile(section);

  return reply.status(201).send({
    success: true,
    message: "تم إنشاء القسم بنجاح",
    section: {
      ...section,
      questionCount: Array.isArray(section.questions)
        ? section.questions.length
        : 0,
    },
  });
}

export async function updateSection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);
  if (isNaN(id)) {
    return reply.status(400).send({
      success: false,
      message: "معرّف القسم غير صحيح",
    });
  }

  const body = request.body as {
    name?: string;
    category?: string;
    type?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    questions?: Question[];
  };
  const { name, category, type, description, isActive, questions, order } = body;

  const existing = await request.server.prisma.section.findUnique({
    where: { id },
  });

  if (!existing) {
    return reply.status(404).send({
      success: false,
      message: "القسم غير موجود",
    });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (category !== undefined) updateData.category = category.trim();
  if (type !== undefined) updateData.type = type.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (isActive !== undefined) updateData.isActive = isActive;
  if (order !== undefined) updateData.order = order;
  if (questions !== undefined) updateData.questions = questions as any;

  const section = await request.server.prisma.section.update({
    where: { id },
    data: updateData,
  });

  saveSectionToFile(section);

  return reply.send({
    success: true,
    message: "تم تحديث القسم بنجاح ✅",
    section: {
      ...section,
      questionCount: Array.isArray(section.questions)
        ? section.questions.length
        : 0,
    },
  });
}

export async function deleteSection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);
  if (isNaN(id)) {
    return reply.status(400).send({
      success: false,
      message: "معرّف القسم غير صحيح",
    });
  }

  const existing = await request.server.prisma.section.findUnique({
    where: { id },
  });

  if (!existing) {
    return reply.status(404).send({
      success: false,
      message: "القسم غير موجود",
    });
  }

  deleteSectionFile(existing.fileId);

  await request.server.prisma.section.delete({ where: { id } });

  return reply.send({
    success: true,
    message: "تم حذف القسم بنجاح",
  });
}

export async function toggleSection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);
  if (isNaN(id)) {
    return reply.status(400).send({
      success: false,
      message: "معرّف القسم غير صحيح",
    });
  }

  const existing = await request.server.prisma.section.findUnique({
    where: { id },
  });

  if (!existing) {
    return reply.status(404).send({
      success: false,
      message: "القسم غير موجود",
    });
  }

  const section = await request.server.prisma.section.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  return reply.send({
    success: true,
    message: section.isActive ? "تم تفعيل القسم" : "تم تعطيل القسم",
    section: {
      ...section,
      questionCount: Array.isArray(section.questions)
        ? section.questions.length
        : 0,
    },
  });
}

export async function reorderSections(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as { order: { id: number; order: number }[] };
  const { order } = body;

  if (!Array.isArray(order) || order.length === 0) {
    return reply.status(400).send({
      success: false,
      message: "قائمة الترتيب غير صالحة",
    });
  }

  await request.server.prisma.$transaction(
    order.map((item) =>
      request.server.prisma.section.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  return reply.send({
    success: true,
    message: "تم تحديث الترتيب بنجاح",
  });
}

export async function importQuestionsJson(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((request.params as any).id);
  if (isNaN(id)) {
    return reply.status(400).send({
      success: false,
      message: "معرّف القسم غير صحيح",
    });
  }

  const body = request.body as {
    questions: Question[];
    mode: "append" | "replace";
  };
  const { questions, mode } = body;

  if (!Array.isArray(questions)) {
    return reply.status(400).send({
      success: false,
      message: "صيغة الأسئلة غير صحيحة",
    });
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (
      !q.question ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctIndex !== "number" ||
      q.correctIndex < 0 ||
      q.correctIndex > 3
    ) {
      return reply.status(400).send({
        success: false,
        message: `السؤال رقم ${i + 1} غير صالح`,
      });
    }
  }

  const existing = await request.server.prisma.section.findUnique({
    where: { id },
  });

  if (!existing) {
    return reply.status(404).send({
      success: false,
      message: "القسم غير موجود",
    });
  }

  const currentQuestions = (existing.questions as Question[]) || [];
  let finalQuestions: Question[];

  if (mode === "replace") {
    finalQuestions = questions.map((q, idx) => ({
      ...q,
      id: idx + 1,
    }));
  } else {
    const lastId =
      currentQuestions.length > 0
        ? Math.max(...currentQuestions.map((q) => q.id || 0))
        : 0;
    finalQuestions = [
      ...currentQuestions,
      ...questions.map((q, idx) => ({
        ...q,
        id: lastId + idx + 1,
      })),
    ];
  }

  const section = await request.server.prisma.section.update({
    where: { id },
    data: { questions: finalQuestions as any },
  });

  saveSectionToFile(section);

  return reply.send({
    success: true,
    message:
      mode === "replace"
        ? `تم استبدال الأسئلة (${finalQuestions.length} سؤال)`
        : `تمت إضافة ${questions.length} سؤال (المجموع: ${finalQuestions.length})`,
    section: {
      ...section,
      questionCount: finalQuestions.length,
    },
  });
}

// ========================================
// 🔄 مزامنة الأقسام من ملفات JSON إلى قاعدة البيانات
// ========================================
export async function syncSectionsFromFiles(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const possiblePaths = [
      path.resolve(__dirname, "../../../qdra/src/data/sections"),
      path.resolve(__dirname, "../../qdra/src/data/sections"),
      path.resolve(__dirname, "../../../../qdra/src/data/sections"),
      path.resolve(process.cwd(), "../qdra/src/data/sections"),
    ];

    let SECTIONS_DIR = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        SECTIONS_DIR = p;
        break;
      }
    }

    if (!SECTIONS_DIR) {
      return reply.status(404).send({
        success: false,
        message: "مجلد الأقسام غير موجود",
      });
    }

    const files = fs
      .readdirSync(SECTIONS_DIR)
      .filter((f) => f.startsWith("section") && f.endsWith(".json"));

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const file of files) {
      const match = file.match(/section(\d+)\.json/);
      if (!match) continue;

      const id = Number(match[1]);
      const fileId = id.toString().padStart(3, "0");

      let questions: any[] = [];
      try {
        const raw = fs.readFileSync(path.join(SECTIONS_DIR, file), "utf-8");
        const parsed = JSON.parse(raw);
        questions = Array.isArray(parsed) ? parsed : [];
      } catch {
        questions = [];
      }

      const existing = await request.server.prisma.section.findUnique({
        where: { id },
      });

      if (existing) {
        await request.server.prisma.section.update({
          where: { id },
          data: {
            fileId,
            questions: questions as any,
          },
        });
        updated++;
      } else {
        await request.server.prisma.section.create({
          data: {
            id,
            fileId,
            name: `القسم ${id}`,
            category: "",
            type: "",
            description: "",
            questions: questions as any,
            isActive: true,
            order: id,
          },
        });
        created++;
      }

      synced++;
    }

    return reply.send({
      success: true,
      message: `تمت المزامنة: ${synced} قسم (${created} جديد، ${updated} محدث) ✅`,
    });
  } catch (err) {
    console.error("❌ فشل المزامنة:", err);
    return reply.status(500).send({
      success: false,
      message: "فشلت المزامنة من الملفات",
    });
  }
}