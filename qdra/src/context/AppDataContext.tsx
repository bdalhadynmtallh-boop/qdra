import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppState, SectionProgress } from "../types";
import { getSectionMetaById } from "../data/sectionsMeta";
import { getSectionQuestionCount } from "../data/loadSections";
import { useAuth } from "./AuthContext";
import {
  getUserUserData,
  recordQuestionAttempt,
  completeSectionApi,
  toggleFavoriteApi,
} from "../auth/api";

interface AppDataContextValue {
  state: AppState;
  getSectionProgress: (sectionId: number) => SectionProgress;
  getSectionPercent: (sectionId: number) => number;
  isSectionCompleted: (sectionId: number) => boolean;
  recordAnswer: (sectionId: number, questionId: number, selectedAnswer: number, correctAnswer: number, correct: boolean, timeMs: number) => void;
  completeSection: (sectionId: number, correct: number, total: number, timeMs: number) => void;
  resetSection: (sectionId: number) => void;
  toggleFavorite: (sectionId: number, questionId: number) => void;
  isFavorite: (sectionId: number, questionId: number) => boolean;
  removeMistake: (sectionId: number, questionId: number) => void;
  removeFavorite: (sectionId: number, questionId: number) => void;
  setLastVisited: (sectionId: number) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const LOCAL_STORAGE_KEY = "qudrat_app_state_v2";

const createEmptyState = (): AppState => ({
  progress: {},
  mistakes: [],
  favorites: [],
  lastVisited: undefined,
  totals: {
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalTimeMs: 0,
  },
  streakData: {
    count: 0,
    lastActiveDate: "",
  },
});

function sameItem(a: { sectionId: number; questionId: number }, b: { sectionId: number; questionId: number }) {
  return a.sectionId === b.sectionId && a.questionId === b.questionId;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [state, setState] = useState<AppState>(createEmptyState());

  // ✅ استعادة فورية من النسخة الاحتياطية (يمنع طيران البيانات مع التحديث)
  useEffect(() => {
    if (!user?.id) return;
    try {
      const key = `${LOCAL_STORAGE_KEY}_${user.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const backup = JSON.parse(raw) as AppState;
        setState({
          progress: backup.progress || {},
          mistakes: backup.mistakes || [],
          favorites: backup.favorites || [],
          lastVisited: backup.lastVisited,
          totals: backup.totals || createEmptyState().totals,
          streakData: backup.streakData || createEmptyState().streakData,
        });
      }
    } catch {
      // تجاهل أي خطأ بالكاش
    }
  }, [user?.id]);

  // حفظ في localStorage كنسخة احتياطية
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const key = `${LOCAL_STORAGE_KEY}_${user.id}`;
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [state, user?.id]);

  // المزامنة مع السيرفر (تحديث البيانات في الخلفية)
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      if (!user) return;

      try {
        const data = await getUserUserData();
        if (isMounted && data?.success) {
          const serverData = data as any;
          setState((prev) => {
            // ⬇️ دمج ذكي: السيرفر + المحلي (نأخذ الأعلى)
            const serverTotals = serverData.stats
              ? {
                  totalAnswered: (serverData.stats.correctAnswers || 0) + (serverData.stats.wrongAnswers || 0),
                  totalCorrect: serverData.stats.correctAnswers || 0,
                  totalWrong: serverData.stats.wrongAnswers || 0,
                  totalTimeMs: (serverData.stats.totalStudyTimeSeconds || 0) * 1000,
                }
              : null;

            return {
              progress: { ...prev.progress, ...(serverData.progress || {}) },
              mistakes: serverData.mistakes?.length ? serverData.mistakes : prev.mistakes,
              favorites: serverData.favorites?.length ? serverData.favorites : prev.favorites,
              totals: serverTotals && serverTotals.totalAnswered >= prev.totals.totalAnswered
                ? serverTotals
                : prev.totals,
              lastVisited: prev.lastVisited,
              streakData: serverData.streakData || prev.streakData,
            };
          });
        }
      } catch (err) {
        console.warn("⚠️ لم يتم الوصول للسيرفر:", err);
      }
    }

    syncWithBackend();
    const interval = setInterval(syncWithBackend, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  const getSectionProgress = (sectionId: number): SectionProgress => {
    return (
      state.progress[sectionId] ?? {
        answeredIds: [],
        correctIds: [],
        completed: false,
      }
    );
  };

  const getSectionPercent = (sectionId: number): number => {
    const total = getSectionQuestionCount(sectionId);
    if (total === 0) return 0;
    const progress = getSectionProgress(sectionId);
    return Math.round((progress.answeredIds.length / total) * 100);
  };

  const isSectionCompleted = (sectionId: number): boolean => {
    return !!state.progress[sectionId]?.completed;
  };

  const recordAnswer = (sectionId: number, questionId: number, selectedAnswer: number, correctAnswer: number, correct: boolean, timeMs: number) => {
    setState((prev) => {
      const current = prev.progress[sectionId] ?? { answeredIds: [], correctIds: [], completed: false };
      const answeredIds = current.answeredIds.includes(questionId)
        ? current.answeredIds
        : [...current.answeredIds, questionId];
      const correctIds = correct
        ? current.correctIds.includes(questionId)
          ? current.correctIds
          : [...current.correctIds, questionId]
        : current.correctIds.filter((id) => id !== questionId);

      const nextProgress: SectionProgress = {
        ...current,
        answeredIds,
        correctIds,
        updatedAt: new Date().toISOString(),
      };

      let mistakes = prev.mistakes;
      if (correct) {
        mistakes = mistakes.filter((m) => !(m.sectionId === sectionId && m.questionId === questionId));
      } else {
        const item = { sectionId, questionId };
        mistakes = mistakes.some((m) => sameItem(m, item)) ? mistakes : [...mistakes, item];
      }

      return {
        ...prev,
        progress: { ...prev.progress, [sectionId]: nextProgress },
        mistakes,
        totals: {
          totalAnswered: prev.totals.totalAnswered + 1,
          totalCorrect: prev.totals.totalCorrect + (correct ? 1 : 0),
          totalWrong: prev.totals.totalWrong + (correct ? 0 : 1),
          totalTimeMs: prev.totals.totalTimeMs + Math.max(0, timeMs),
        },
      };
    });

    recordQuestionAttempt({
      sectionId,
      questionId,
      selectedAnswer,
      correctAnswer,
      isCorrect: correct,
      timeMs,
    }).catch((err) => console.error("فشل الحفظ بـ Backend:", err));
  };

  const completeSection = (sectionId: number, correct: number, total: number, timeMs: number) => {
    setState((prev) => {
      const current = prev.progress[sectionId] ?? { answeredIds: [], correctIds: [], completed: false };
      const meta = getSectionMetaById(sectionId);
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [sectionId]: {
            ...current,
            completed: true,
            completedAt: new Date().toISOString(),
            lastScore: { correct, total, timeMs },
          },
        },
        lastVisited: meta
          ? { sectionId, sectionName: meta.name, at: new Date().toISOString() }
          : prev.lastVisited,
      };
    });

    completeSectionApi({
      sectionId,
      correctAnswers: correct,
      totalQuestions: total,
      timeMs,
    }).catch((err) => console.error("فشل إكمال القسم بـ Backend:", err));
  };

  const resetSection = (sectionId: number) => {
    setState((prev) => {
      const { [sectionId]: _removed, ...rest } = prev.progress;
      return { ...prev, progress: rest };
    });
  };

  const toggleFavorite = (sectionId: number, questionId: number) => {
    setState((prev) => {
      const item = { sectionId, questionId };
      const exists = prev.favorites.some((f) => sameItem(f, item));
      return {
        ...prev,
        favorites: exists ? prev.favorites.filter((f) => !sameItem(f, item)) : [...prev.favorites, item],
      };
    });

    toggleFavoriteApi({ sectionId, questionId }).catch(() => {});
  };

  const isFavorite = (sectionId: number, questionId: number): boolean => {
    return state.favorites.some((f) => f.sectionId === sectionId && f.questionId === questionId);
  };

  const removeMistake = (sectionId: number, questionId: number) => {
    setState((prev) => ({
      ...prev,
      mistakes: prev.mistakes.filter((m) => !(m.sectionId === sectionId && m.questionId === questionId)),
    }));
  };

  const removeFavorite = (sectionId: number, questionId: number) => {
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.filter((f) => !(f.sectionId === sectionId && f.questionId === questionId)),
    }));
    toggleFavoriteApi({ sectionId, questionId }).catch(() => {});
  };

  const setLastVisited = (sectionId: number) => {
    const meta = getSectionMetaById(sectionId);
    if (!meta) return;
    setState((prev) => ({
      ...prev,
      lastVisited: { sectionId, sectionName: meta.name, at: new Date().toISOString() },
    }));
  };

  const value = useMemo<AppDataContextValue>(
    () => ({
      state,
      getSectionProgress,
      getSectionPercent,
      isSectionCompleted,
      recordAnswer,
      completeSection,
      resetSection,
      toggleFavorite,
      isFavorite,
      removeMistake,
      removeFavorite,
      setLastVisited,
    }),
    [state]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}