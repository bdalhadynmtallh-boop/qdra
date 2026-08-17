import type { AppState } from "../types";

const BASE_STORAGE_KEY = "qudrah_verbal_state_v1";

export const emptyState: AppState = {
  progress: {},
  mistakes: [],
  favorites: [],
  totals: {
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalTimeMs: 0,
  },
  lastVisited: undefined,
};

// توليد المفتاح بناءً على رقم المستخدم
function getStorageKey(userId?: string): string {
  return userId ? `${BASE_STORAGE_KEY}_${userId}` : BASE_STORAGE_KEY;
}

export function loadState(userId?: string): AppState {
  if (typeof window === "undefined" || !userId) return emptyState;
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw);
    return {
      ...emptyState,
      ...parsed,
      totals: { ...emptyState.totals, ...(parsed.totals ?? {}) },
    };
  } catch {
    return emptyState;
  }
}

export function saveState(state: AppState, userId?: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // تجاهل أخطاء التخزين (مثل امتلاء المساحة)
  }
}