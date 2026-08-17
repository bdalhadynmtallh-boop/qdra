export interface Question {
  id: number;
  question: string;
  /** نص إضافي لقطعة قراءة تظهر أعلى السؤال (اختياري) */
  passage?: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  questionImage?: string;
  explanationImage?: string;
}

export interface SectionMeta {
  id: number;
  name: string;
  category: string;
  fileId: string;
}

export interface SectionProgress {
  answeredIds: number[];
  correctIds: number[];
  completed: boolean;
  lastScore?: {
    correct: number;
    total: number;
    timeMs: number;
  };
  completedAt?: string;
  updatedAt?: string;
}

export interface MistakeFavoriteItem {
  sectionId: number;
  questionId: number;
}

export interface StudyTotals {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  totalTimeMs: number;
}

export interface LastVisited {
  sectionId: number;
  sectionName: string;
  at: string;
}

export interface StreakData {
  count: number;
  lastActiveDate: string; // بصيغة YYYY-MM-DD
}

export interface AppState {
  progress: Record<number, SectionProgress>;
  mistakes: MistakeFavoriteItem[];
  favorites: MistakeFavoriteItem[];
  totals: StudyTotals;
  lastVisited?: LastVisited;
  streakData?: StreakData;
}