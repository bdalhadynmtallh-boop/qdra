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
  checkAndUpdateStreak: () => void;
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

  // 1. القراءة من التخزين المحلي فوراً عند بدء التشغيل لمنع تصفير الشاشة (Loading)
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== "undefined") {
      const key = `${LOCAL_STORAGE_KEY}_${user?.id || "guest"}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return createEmptyState();
  });

  // 2. حفظ التغييرات محلياً باستمرار (كنسخة احتياطية وللسرعة)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = `${LOCAL_STORAGE_KEY}_${user?.id || "guest"}`;
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [state, user?.id]);

  // 3. جلب بيانات السيرفر واعتمادها كمصدر وحيد للحقيقة (الحل السحري لمشكلتك!)
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      if (!user) return;

      try {
        const data = await getUserUserData();
        if (isMounted && data?.success) {
          setState((prev) => {
            // نأخذ البيانات من السيرفر بالكامل، ونحتفظ فقط بـ lastVisited و streakData من المتصفح
            return {
              progress: data.progress || {},
              mistakes: data.mistakes || [],
              favorites: data.favorites || [],
              totals: data.stats
                ? {
                    totalAnswered: data.stats.totalQuestions || 0,
                    totalCorrect: data.stats.correctAnswers || 0,
                    totalWrong: data.stats.wrongAnswers || 0,
                    totalTimeMs: (data.stats.totalStudyTimeSeconds || 0) * 1000,
                  }
                : prev.totals,
              // هذي بيانات محلية ما تنرسل للسيرفر، فنخليها كما هي
              lastVisited: prev.lastVisited,
              streakData: prev.streakData,
            };
          });
        }
      } catch (err) {
        console.warn("⚠️ لم يتم الوصول للسيرفر، يتم استخدام التخزين المحلي:", err);
      }
    }

    syncWithBackend();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const checkAndUpdateStreak = () => {
    setState((prev) => {
      const today = new Date().toISOString().split("T")[0];
      const lastActive = prev.streakData?.lastActiveDate;
      let currentStreak = prev.streakData?.count ?? 0;

      if (!lastActive) {
        currentStreak = 1;
      } else if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const nowDate = new Date(today);
        const diffInDays = Math.floor((nowDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        if (diffInDays === 1) {
          currentStreak += 1;
        } else if (diffInDays > 1) {
          currentStreak = 1;
        }
      }

      return {
        ...prev,
        streakData: {
          count: currentStreak,
          lastActiveDate: today,
        },
      };
    });
  };

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

  // تم إضافة selectedAnswer و correctAnswer عشان الباك إند يحفظهم بدقة
  const recordAnswer = (sectionId: number, questionId: number, selectedAnswer: number, correctAnswer: number, correct: boolean, timeMs: number) => {
    checkAndUpdateStreak();

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

    // إرسال البيانات الحقيقية للسيرفر
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
      checkAndUpdateStreak,
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