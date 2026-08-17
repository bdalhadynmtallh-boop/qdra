import type { Question } from "../types";

// يتم تحميل جميع ملفات الأسئلة الموجودة فعليًا داخل مجلد sections تلقائيًا.
// أي قسم لا يملك ملفًا بعد سيُعتبر فارغًا (0 سؤال) إلى أن تتم إضافته يدويًا
// باتباع نفس تسمية الملفات: sectionXXX.json (مثال: section001.json).
const modules = import.meta.glob("./sections/section*.json", { eager: true }) as Record<
  string,
  { default: Question[] }
>;

const questionsBySection: Record<number, Question[]> = {};

for (const path in modules) {
  const match = path.match(/section(\d+)\.json$/);
  if (!match) continue;
  const id = parseInt(match[1], 10);
  const content = modules[path].default;
  questionsBySection[id] = Array.isArray(content) ? content : [];
}

export function getSectionQuestions(sectionId: number): Question[] {
  return questionsBySection[sectionId] ?? [];
}

export function getSectionQuestionCount(sectionId: number): number {
  return questionsBySection[sectionId]?.length ?? 0;
}

export function hasSectionData(sectionId: number): boolean {
  return getSectionQuestionCount(sectionId) > 0;
}
