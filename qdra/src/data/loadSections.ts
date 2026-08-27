import type { Question } from "../types";
import { getStoredToken } from "../auth/api";

// ========================================
// 🌐 إعدادات API (نفس المنطق من api.ts)
// ========================================
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("vercel.app")) return "https://qdra-1.onrender.com";
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:3000`;
    }
  }
  return "http://localhost:3000";
};

const API_BASE = getApiUrl();

// ========================================
// 💾 الكاش
// ========================================
const questionsCache = new Map<number, Question[]>();
const countsCache = new Map<number, number>();
const loadingPromises = new Map<number, Promise<Question[]>>();

let metadataPromise: Promise<void> | null = null;

// ========================================
// 📊 جلب أعداد الأسئلة (metadata عامة)
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

loadSectionsMetadata();

// ========================================
// 🔐 جلب الأسئلة من API المحمي
// ========================================
async function fetchQuestionsFromAPI(sectionId: number): Promise<Question[]> {
  try {
    // ✅ استخدام التوكن الصحيح من api.ts
    const token = getStoredToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/sections/${sectionId}/questions`, {
      credentials: "include",
      headers,
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