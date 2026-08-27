import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import {
  ArrowRight,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  Percent,
  Clock,
  LayoutGrid,
  BarChart3,
  TrendingUp,
  AlertCircle,
  ScrollText,
  Loader2,
} from "lucide-react";
import { getSectionMetaById } from "../data/sectionsMeta";
import { loadSectionQuestions } from "../data/loadSections";
import { useAppData } from "../context/AppDataContext";
import QuestionView from "../components/QuestionView";
import EmptyState from "../components/EmptyState";
import QuizTimer, { DEFAULT_QUIZ_DURATION_SECONDS } from "../components/QuizTimer";
import { cn } from "../utils/cn";

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} ثانية`;
  return `${minutes} دقيقة ${seconds} ثانية`;
}

interface UserAnswer {
  question: any;
  selectedAnswer: number;
  correct: boolean;
  timeMs: number;
}

interface TopicStat {
  name: string;
  correct: number;
  total: number;
  percent: number;
}

export default function SectionQuizPage() {
  const { id } = useParams();
  const sectionId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const customTimeLimitInMinutes = location.state?.timeLimit;

  const quizDurationSeconds = useMemo(() => {
    if (customTimeLimitInMinutes === null) return null;
    if (typeof customTimeLimitInMinutes === "number") return customTimeLimitInMinutes * 60;
    return DEFAULT_QUIZ_DURATION_SECONDS;
  }, [customTimeLimitInMinutes]);

  const {
    toggleFavorite,
    isFavorite,
    recordAnswer,
    completeSection,
    resetSection,
    getSectionProgress,
    setLastVisited,
  } = useAppData();

  const meta = getSectionMetaById(sectionId);
  
  // ========================================
  // ✅ كل الـ States في الأعلى
  // ========================================
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [runStats, setRunStats] = useState({ correct: 0, wrong: 0, timeMs: 0 });
  const [sectionStartedAt, setSectionStartedAt] = useState(() => Date.now());
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  // ========================================
  // ✅ كل الـ Effects (قبل الـ returns المبكرة)
  // ========================================
  useEffect(() => {
    let isMounted = true;
    setLoadingQuestions(true);
    loadSectionQuestions(sectionId)
      .then((qs) => {
        if (isMounted) {
          setQuestions(qs);
          setLoadingQuestions(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQuestions([]);
          setLoadingQuestions(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [sectionId]);

  useEffect(() => {
    if (loadingQuestions || questions.length === 0) return;
    const progress = getSectionProgress(sectionId);
    const resumeIndex =
      !progress.completed && questions.length > 0
        ? Math.min(progress.answeredIds.length, questions.length - 1)
        : 0;
    setCurrentIndex(resumeIndex);
    setFinished(false);
    setRunStats({ correct: 0, wrong: 0, timeMs: 0 });
    setUserAnswers([]);
    setSectionStartedAt(Date.now());
    if (meta) setLastVisited(sectionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, questions.length, loadingQuestions]);

  const currentQuestion = questions[currentIndex];

  const handleAnswered = (selectedAnswer: number, correctAnswer: number, correct: boolean, timeMs: number) => {
    recordAnswer(sectionId, currentQuestion.id, selectedAnswer, correctAnswer, correct, timeMs);

    setUserAnswers((prev) => {
      const others = prev.filter((a) => a.question.id !== currentQuestion.id);
      return [
        ...others,
        {
          question: currentQuestion,
          selectedAnswer,
          correct,
          timeMs,
        },
      ];
    });

    setRunStats((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      timeMs: prev.timeMs + timeMs,
    }));
  };

  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  // ✅ هذا هو الـ useMemo الذي كان يسبب الخطأ
  const answeredIndices = useMemo(() => {
    const progress = getSectionProgress(sectionId);
    const ids = new Set<string | number>();

    if (!progress.completed) {
      progress.answeredIds.forEach((qid: string | number) => ids.add(qid));
    }

    userAnswers.forEach((a) => ids.add(a.question.id));

    return Array.from(ids)
      .map((qid) => questions.findIndex((q) => q.id === qid))
      .filter((i) => i !== -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, questions, userAnswers]);

  const finishQuiz = () => {
    const totalTime = Date.now() - sectionStartedAt;
    const correct = userAnswers.filter((a) => a.correct).length;
    const wrong = userAnswers.filter((a) => !a.correct).length;

    completeSection(sectionId, correct, questions.length, totalTime);
    setRunStats({ correct, wrong, timeMs: totalTime });
    setFinished(true);
  };

  const goNext = () => {
    if (currentIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleRestart = () => {
    resetSection(sectionId);
    setCurrentIndex(0);
    setFinished(false);
    setRunStats({ correct: 0, wrong: 0, timeMs: 0 });
    setUserAnswers([]);
    setSectionStartedAt(Date.now());
    setTimerResetKey((k) => k + 1);
  };

  // ========================================
  // ✅ الآن الـ Returns المبكرة (بعد كل الـ Hooks)
  // ========================================

  if (!meta) {
    return (
      <EmptyState
        title="القسم غير موجود"
        description="تعذر العثور على هذا القسم."
        action={
          <Link to="/sections" className="btn-gold press mt-2 rounded-xl px-5 py-2 text-sm">
            العودة للأقسام
          </Link>
        }
      />
    );
  }

  if (loadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin text-gold-400" />
        <p className="text-sm font-bold text-ink-300">جاري تحميل أسئلة القسم...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        title={`${meta.name} — لا توجد أسئلة`}
        description="تأكد من تسجيل الدخول للوصول إلى الأسئلة، أو أنه لم تتم إضافة أسئلة لهذا القسم بعد."
        action={
          <Link to="/sections" className="btn-gold press mt-2 flex items-center gap-2 rounded-xl px-5 py-2 text-sm">
            <LayoutGrid size={16} />
            العودة للأقسام
          </Link>
        }
      />
    );
  }

  if (finished) {
    const total = questions.length;
    const percent = total > 0 ? Math.round((runStats.correct / total) * 100) : 0;

    const topicMap: Record<string, { correct: number; total: number }> = {};

    userAnswers.forEach((ans) => {
      const categoryName = ans.question.category || meta.name || "عام";
      if (!topicMap[categoryName]) {
        topicMap[categoryName] = { correct: 0, total: 0 };
      }
      topicMap[categoryName].total += 1;
      if (ans.correct) {
        topicMap[categoryName].correct += 1;
      }
    });

    const topicStats: TopicStat[] = Object.keys(topicMap).map((catName) => {
      const correct = topicMap[catName].correct;
      const catTotal = topicMap[catName].total;
      return {
        name: catName,
        correct,
        total: catTotal,
        percent: Math.round((correct / catTotal) * 100),
      };
    });

    const masteredTopics = topicStats.filter((t) => t.percent >= 60);
    const needsImprovementTopics = topicStats.filter((t) => t.percent < 60);

    const sortedReview = [...userAnswers].sort(
      (a, b) => (a.question.id ?? 0) - (b.question.id ?? 0)
    );

    return (
      <div className="animate-pop-in mx-auto flex max-w-xl flex-col items-center gap-6 py-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-700 text-ink-950 shadow-2xl shadow-gold-900/40">
          <Trophy size={34} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-50">أحسنت! أكملت {meta.name}</h1>
          <p className="mt-2 text-sm text-ink-300">إليك ملخص أدائك بالتفصيل في هذا القسم</p>
        </div>

        <div className="glass-card grid w-full grid-cols-2 gap-4 rounded-3xl p-6 md:grid-cols-4">
          <div className="flex flex-col items-center gap-1">
            <Percent className="text-gold-400" size={20} />
            <span className="text-xl font-extrabold text-ink-50">{percent}%</span>
            <span className="text-xs text-ink-400">النسبة المئوية</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <span className="text-xl font-extrabold text-ink-50">{runStats.correct}</span>
            <span className="text-xs text-ink-400">إجابات صحيحة</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <XCircle className="text-red-400" size={20} />
            <span className="text-xl font-extrabold text-ink-50">{runStats.wrong}</span>
            <span className="text-xs text-ink-400">إجابات خاطئة</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="text-gold-400" size={20} />
            <span className="text-xl font-extrabold text-ink-50">{formatDuration(runStats.timeMs)}</span>
            <span className="text-xs text-ink-400">الوقت المستغرق</span>
          </div>
        </div>

        {topicStats.length > 0 && (
          <div className="glass-card flex w-full flex-col gap-5 rounded-3xl p-6 text-right">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold text-gold-300">
              <BarChart3 size={18} />
              <span>تحليل الأداء حسب الموضوع:</span>
            </div>

            {needsImprovementTopics.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <AlertCircle size={15} />
                  <span>مواضيع أخفقت فيها وتحتاج إلى مراجعة (أقل من 60%):</span>
                </div>
                <div className="grid gap-2.5">
                  {needsImprovementTopics.map((topic, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-ink-50">{topic.name}</span>
                        <span className="text-red-400">
                          {topic.correct} من {topic.total} ({topic.percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all duration-500"
                          style={{ width: `${topic.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {masteredTopics.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <TrendingUp size={15} />
                  <span>مواضيع أتقنتها بنجاح (60% فأعلى):</span>
                </div>
                <div className="grid gap-2.5">
                  {masteredTopics.map((topic, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-ink-50">{topic.name}</span>
                        <span className="text-emerald-400">
                          {topic.correct} من {topic.total} ({topic.percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${topic.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sortedReview.length > 0 && (
          <div className="glass-card flex w-full flex-col gap-4 rounded-3xl p-6 text-right">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold text-gold-300">
              <ScrollText size={18} />
              <span>مراجعة الأسئلة والإجابات:</span>
            </div>

            <div className="flex flex-col gap-4">
              {sortedReview.map((ans, i) => (
                <div
                  key={`${ans.question.id}-${i}`}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border p-4",
                    ans.correct
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-ink-400">
                      السؤال {i + 1}
                      {ans.question.category ? ` • ${ans.question.category}` : ""}
                    </span>
                    {ans.correct ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <CheckCircle2 size={14} />
                        إجابة صحيحة
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                        <XCircle size={14} />
                        إجابة خاطئة
                      </span>
                    )}
                  </div>

                  {ans.question.passage && (
                    <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-xs leading-6 text-ink-300">
                      {ans.question.passage}
                    </div>
                  )}

                  <p className="text-sm font-bold leading-7 text-ink-50">{ans.question.question}</p>

                  <div className="flex flex-col gap-2">
                    {ans.question.options.map((opt: string, idx: number) => {
                      const isCorrectOpt = idx === ans.question.correctIndex;
                      const isUserPick = idx === ans.selectedAnswer;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold",
                            isCorrectOpt
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                              : isUserPick
                                ? "border-red-500/50 bg-red-500/10 text-red-300"
                                : "border-white/5 bg-white/[0.02] text-ink-300"
                          )}
                        >
                          <span>
                            {["أ", "ب", "ج", "د"][idx] ?? idx + 1}. {opt}
                          </span>

                          {isCorrectOpt && (
                            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold">
                              <CheckCircle2 size={14} />
                              الصحيحة
                            </span>
                          )}
                          {isUserPick && !isCorrectOpt && (
                            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold">
                              <XCircle size={14} />
                              اختيارك
                            </span>
                          )}
                          {isUserPick && isCorrectOpt && (
                            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold">
                              اختيارك
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {ans.question.explanation && (
                    <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-3 text-xs leading-6 text-ink-200">
                      <span className="font-bold text-gold-300">الشرح: </span>
                      {ans.question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={handleRestart} className="btn-gold press flex items-center gap-2 rounded-2xl px-6 py-3 text-sm">
            <RotateCcw size={16} />
            إعادة القسم
          </button>
          <button
            onClick={() => navigate("/sections")}
            className="press flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-ink-100 hover:bg-white/10"
          >
            <LayoutGrid size={16} />
            العودة للأقسام
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/sections")}
          className="press flex items-center gap-1.5 text-sm font-bold text-ink-300 hover:text-gold-300"
        >
          <ArrowRight size={16} />
          الأقسام
        </button>
        <h2 className="truncate text-sm font-bold text-ink-200">{meta.name}</h2>
      </div>

      {quizDurationSeconds !== null && (
        <QuizTimer
          key={`${sectionId}-${timerResetKey}-${quizDurationSeconds}`}
          durationInSeconds={quizDurationSeconds}
          onExpire={finishQuiz}
        />
      )}

      <QuestionView
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        category={currentQuestion.category || meta.name}
        isFavorite={isFavorite(sectionId, currentQuestion.id)}
        onToggleFavorite={() => toggleFavorite(sectionId, currentQuestion.id)}
        onAnswered={handleAnswered}
        onNext={goNext}
        answeredIndices={answeredIndices}
        onJumpToQuestion={jumpToQuestion}
      />
    </div>
  );
}