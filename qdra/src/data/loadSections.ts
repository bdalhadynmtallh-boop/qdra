import type { Question } from "../types";

// ========================================
// 🌐 إعدادات API
// ========================================
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ========================================
// 💾 الكاش
// ========================================
const questionsCache = new Map<number, Question[]>();
const countsCache = new Map<number, number>();
const loadingPromises = new Map<number, Promise<Question[]>>();

let metadataPromise: Promise<void> | null = null;

// ========================================
// 📊 جلب أعداد الأسئلة (metadata عامة — آمنة)
// ========================================
export function loadSectionsMetadata(): Promise<void> {
  if (metadataPromise) return metadataPromise;

  metadataPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sections`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.sections)) {
        for (const s of data.sections) {
          countsCache.set(s.id, s.questionCount || 0);
        }
      }
    } catch (err) {
      console.error("❌ فشل جلب بيانات الأقسام:", err);
    }
  })();

  return metadataPromise;
}

// بدء الجلب تلقائيًا عند تحميل الوحدة
loadSectionsMetadata();

// ========================================
// 🔐 جلب الأسئلة من API المحمي
// ========================================
async function fetchQuestionsFromAPI(sectionId: number): Promise<Question[]> {
  try {
    const token = localStorage.getItem("rhal_session") || "";

    const res = await fetch(`${API_BASE}/api/sections/${sectionId}/questions`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("⚠️ يجب تسجيل الدخول للوصول إلى الأسئلة");
        return [];
      }
      if (res.status === 403) {
        console.warn("⚠️ الاشتراك منتهي — لا يمكن الوصول إلى الأسئلة");
        return [];
      }
      throw new Error(`فشل جلب الأسئلة: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data.questions) ? data.questions : [];
  } catch (err) {
    console.error("❌ فشل جلب الأسئلة من السيرفر:", err);
    return [];
  }
}

// ========================================
// 🔓 sync: الأسئلة من الكاش
// ========================================
export function getSectionQuestions(sectionId: number): Question[] {
  return questionsCache.get(sectionId) ?? [];
}

// ========================================
// 🚀 async: جلب الأسئلة (مع منع التكرار)
// ========================================
export async function loadSectionQuestions(sectionId: number): Promise<Question[]> {
  if (questionsCache.has(sectionId)) {
    return questionsCache.get(sectionId)!;
  }

  if (loadingPromises.has(sectionId)) {
    return loadingPromises.get(sectionId)!;
  }

  const promise = fetchQuestionsFromAPI(sectionId).then((questions) => {
    questionsCache.set(sectionId, questions);
    countsCache.set(sectionId, questions.length);
    loadingPromises.delete(sectionId);
    return questions;
  });

  loadingPromises.set(sectionId, promise);
  return promise;
}

// ========================================
// ⏳ تحميل مسبق
// ========================================
export async function prefetchSectionQuestions(sectionId: number): Promise<void> {
  if (!questionsCache.has(sectionId)) {
    await loadSectionQuestions(sectionId);
  }
}

// ========================================
// 🔢 العدد: من الكاش أو من الـ metadata
// ========================================
export function getSectionQuestionCount(sectionId: number): number {
  return (
    questionsCache.get(sectionId)?.length ??
    countsCache.get(sectionId) ??
    0
  );
}

export function hasSectionData(sectionId: number): boolean {
  return getSectionQuestionCount(sectionId) > 0;
}

// ========================================
// 🧹 مسح الكاش (عند تسجيل الخروج)
// ========================================
export function clearQuestionsCache(): void {
  questionsCache.clear();
  countsCache.clear();
  loadingPromises.clear();
  metadataPromise = null;
}