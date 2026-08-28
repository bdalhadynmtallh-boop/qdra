import { createContext, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
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

  // ✅ الحالة البدائية: اقرأ من localStorage فوراً لو عندنا user.id
  const [state, setState] = useState<AppState>(() => {
    try {
      if (typeof window !== "undefined" && user?.id) {
        const key = `${LOCAL_STORAGE_KEY}_${user.id}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const backup = JSON.parse(raw) as AppState;
          return {
            progress: backup.progress || {},
            mistakes: backup.mistakes || [],
            favorites: backup.favorites || [],
            lastVisited: backup.lastVisited,
            totals: backup.totals || createEmptyState().totals,
            streakData: backup.streakData || createEmptyState().streakData,
          };
        }
      }
    } catch {
      // تجاهل
    }
    return createEmptyState();
  });

  // ✅ عشان نتأكد ما نكرّر تحميل من السيرفر
  const hasSyncedRef = useRef(false);

  // ✅ استعادة فورية إذا user.id تغير (مثلاً عند تسجيل الدخول)
  useEffect(() => {
    if (!user?.id) return;
    try {
      const key = `${LOCAL_STORAGE_KEY}_${user.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const backup = JSON.parse(raw) as AppState;
        setState((prev) => {
          // لا نكتب فوق البيانات الحالية إلا إذا كانت فاضية
          if (Object.keys(prev.progress).length > 0) return prev;
          return {
            progress: backup.progress || {},
            mistakes: backup.mistakes || [],
            favorites: backup.favorites || [],
            lastVisited: backup.lastVisited,
            totals: backup.totals || createEmptyState().totals,
            streakData: backup.streakData || createEmptyState().streakData,
          };
        });
      }
    } catch {
      // تجاهل
    }
  }, [user?.id]);

  // ✅ حفظ تلقائي في localStorage عند كل تغيير
  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const key = `${LOCAL_STORAGE_KEY}_${user.id}`;
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.warn("فشل حفظ الحالة:", e);
      }
    }
  }, [state, user?.id]);

  // ✅ sync مع السيرفر (في الخلفية — ما يمسح البيانات المحلية أبداً)
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      if (!user) return;

      try {
        const data = await getUserUserData();
        if (!isMounted || !data?.success) return;

        const serverData = data as any;
        setState((prev) => {
          const serverProgress = serverData.progress || {};
          const serverMistakes = Array.isArray(serverData.mistakes) ? serverData.mistakes : [];
          const serverFavorites = Array.isArray(serverData.favorites) ? serverData.favorites : [];

          // ✅ دمج ذكي: نجمع progress المحلي مع السيرفر
          const mergedProgress = { ...prev.progress };
          for (const [key, value] of Object.entries(serverProgress)) {
            const sectionId = Number(key);
            if (value && !mergedProgress[sectionId]) {
              mergedProgress[sectionId] = value as SectionProgress;
            }
          }

          // ✅ دمج الأخطاء (union)
          const mergedMistakes = [...prev.mistakes];
          for (const m of serverMistakes) {
            if (!mergedMistakes.some((x) => sameItem(x, m))) {
              mergedMistakes.push(m);
            }
          }

          // ✅ دمج المفضلة (union)
          const mergedFavorites = [...prev.favorites];
          for (const f of serverFavorites) {
            if (!mergedFavorites.some((x) => sameItem(x, f))) {
              mergedFavorites.push(f);
            }
          }

          // ✅ الإحصائيات: نأخذ الأعلى بين المحلي والسيرفر
          const serverTotals = serverData.stats
            ? {
                totalAnswered: (serverData.stats.correctAnswers || 0) + (serverData.stats.wrongAnswers || 0),
                totalCorrect: serverData.stats.correctAnswers || 0,
                totalWrong: serverData.stats.wrongAnswers || 0,
                totalTimeMs: (serverData.stats.totalStudyTimeSeconds || 0) * 1000,
              }
            : null;

          const finalTotals =
            serverTotals && serverTotals.totalAnswered > prev.totals.totalAnswered
              ? serverTotals
              : prev.totals;

          return {
            progress: mergedProgress,
            mistakes: mergedMistakes,
            favorites: mergedFavorites,
            totals: finalTotals,
            lastVisited: prev.lastVisited,
            streakData: serverData.streakData || prev.streakData,
          };
        });

        hasSyncedRef.current = true;
      } catch (err) {
        console.warn("⚠️ فشل المزامنة مع السيرفر — البيانات المحلية محفوظة:", err);
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

  const recordAnswer = (
    sectionId: number,
    questionId: number,
    selectedAnswer: number,
    correctAnswer: number,
    correct: boolean,
    timeMs: number
  ) => {
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