import { useState, useMemo, useRef } from "react";
import {
  Play,
  Sparkles,
  Clock,
  HelpCircle,
  RotateCcw,
  Trophy,
  CheckCircle2,
  XCircle,
  Percent,
  ArrowRight,
  Settings2,
  BarChart3,
} from "lucide-react";

import { sectionsMeta } from "../data/sectionsMeta";
import { getSectionQuestions } from "../data/loadSections";
import QuestionView from "../components/QuestionView";
import QuizTimer from "../components/QuizTimer";
import { useAppData } from "../context/AppDataContext";
import { submitSimulatorAttempt } from "../auth/api";
import { cn } from "../utils/cn";

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} ثانية`;
  }

  return `${minutes} دقيقة ${seconds} ثانية`;
}

interface CategoryStat {
  categoryName: string;
  correct: number;
  total: number;
}

interface UserAnswer {
  question: any;
  correct: boolean;
  timeMs: number;
  selectedAnswer: number;
  correctAnswer: number;
}

export default function SimulatorPage() {
  const {
    toggleFavorite,
    isFavorite,
    recordAnswer,
  } = useAppData();

  // =========================================================
  // إعدادات المحاكي
  // =========================================================

  const [questionCount, setQuestionCount] = useState<number>(20);
  const [customQuestions, setCustomQuestions] = useState<string>("");
  const [isCustomQuestions, setIsCustomQuestions] = useState(false);

  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(15);
  const [customTime, setCustomTime] = useState<string>("");
  const [isCustomTime, setIsCustomTime] = useState(false);

  // =========================================================
  // حالة الاختبار
  // =========================================================

  const [isStarted, setIsStarted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const [runStats, setRunStats] = useState({
    correct: 0,
    wrong: 0,
    timeMs: 0,
  });

  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [startedAt, setStartedAt] = useState<number>(0);

  const [userAnswers, setUserAnswers] = useState<(UserAnswer | null)[]>([]);

  // =========================================================
  // Refs
  // =========================================================

  const userAnswersRef = useRef<(UserAnswer | null)[]>([]);
  const finishHandledRef = useRef(false);

  // =========================================================
  // جلب جميع الأسئلة
  // =========================================================

  const allQuestions = useMemo(() => {
    const list: any[] = [];

    sectionsMeta.forEach((meta) => {
      const qList = getSectionQuestions(meta.id);

      if (Array.isArray(qList)) {
        qList.forEach((q) => {
          if (q && (q.text || q.question || q.title)) {
            list.push({
              ...q,
              sectionId: meta.id,
              sectionTitle: meta.title,
            });
          }
        });
      }
    });

    return list;
  }, []);

  // =========================================================
  // بدء محاكي جديد
  // =========================================================

  const startSimulator = () => {
    if (allQuestions.length === 0) {
      return;
    }

    let finalCount = questionCount;

    if (isCustomQuestions) {
      const parsed = parseInt(customQuestions, 10);

      finalCount =
        !isNaN(parsed) && parsed > 0
          ? parsed
          : 10;
    }

    const shuffled = [...allQuestions].sort(
      () => 0.5 - Math.random()
    );

    const limit = Math.min(
      finalCount,
      shuffled.length
    );

    const selected = shuffled.slice(0, limit);

    const emptyAnswers = new Array(selected.length).fill(null);

    setQuizQuestions(selected);
    setUserAnswers(emptyAnswers);
    userAnswersRef.current = emptyAnswers;

    setCurrentIndex(0);
    setFinished(false);

    setRunStats({
      correct: 0,
      wrong: 0,
      timeMs: 0,
    });

    setCategoryStats([]);

    setStartedAt(Date.now());

    finishHandledRef.current = false;

    setIsStarted(true);
  };

  // =========================================================
  // المدة الفعلية
  // =========================================================

  const effectiveTimeLimit = useMemo(() => {
    if (!isCustomTime) {
      return timeLimitMinutes;
    }

    const parsed = parseInt(customTime, 10);

    return !isNaN(parsed) && parsed > 0
      ? parsed
      : null;
  }, [
    isCustomTime,
    customTime,
    timeLimitMinutes,
  ]);

  const currentQuestion =
    quizQuestions[currentIndex];

  // =========================================================
  // تسجيل إجابة السؤال الحالي
  // =========================================================

  const handleAnswered = (
    selectedAnswer: number,
    correctAnswer: number,
    correct: boolean,
    timeMs: number
  ) => {
    if (!currentQuestion) {
      return;
    }

    const answer: UserAnswer = {
      question: currentQuestion,
      correct,
      timeMs,
      selectedAnswer,
      correctAnswer,
    };

    const updated = [
      ...userAnswersRef.current,
    ];

    updated[currentIndex] = answer;

    userAnswersRef.current = updated;

    setUserAnswers(updated);
  };

  // =========================================================
  // الانتقال لأي سؤال مباشرة (جديد)
  // =========================================================

  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < quizQuestions.length) {
      setCurrentIndex(index);
    }
  };

  // =========================================================
  // حساب الأسئلة المحلولة في الجلسة الحالية (جديد)
  // =========================================================

  const answeredIndices = useMemo(() => {
    return userAnswers
      .map((ans, i) => (ans !== null ? i : -1))
      .filter((i) => i !== -1);
  }, [userAnswers]);

  // =========================================================
  // إنهاء الاختبار
  // =========================================================

  const finishQuiz = () => {
    if (finishHandledRef.current) {
      return;
    }

    finishHandledRef.current = true;

    const totalTime =
      Date.now() - startedAt;

    let correctCount = 0;
    let wrongCount = 0;

    const catMap: Record<
      string,
      {
        correct: number;
        total: number;
      }
    > = {};

    const answers = userAnswersRef.current;

    answers.forEach((item) => {
      if (!item) {
        return;
      }

      const categoryName =
        item.question.category ||
        item.question.sectionTitle ||
        "عام";

      if (!catMap[categoryName]) {
        catMap[categoryName] = {
          correct: 0,
          total: 0,
        };
      }

      catMap[categoryName].total += 1;

      if (item.correct) {
        correctCount += 1;
        catMap[categoryName].correct += 1;
      } else {
        wrongCount += 1;
      }

      recordAnswer(
        item.question.sectionId,
        item.question.id,
        item.selectedAnswer,
        item.correctAnswer,
        item.correct,
        item.timeMs
      );
    });

    const catStatsArray: CategoryStat[] =
      Object.keys(catMap).map((cat) => ({
        categoryName: cat,
        correct: catMap[cat].correct,
        total: catMap[cat].total,
      }));

    setRunStats({
      correct: correctCount,
      wrong: wrongCount,
      timeMs: totalTime,
    });

    setCategoryStats(catStatsArray);

    setFinished(true);

    submitSimulatorAttempt({
      totalQuestions: quizQuestions.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      score:
        quizQuestions.length > 0
          ? Math.round(
              (correctCount /
                quizQuestions.length) *
                100
            )
          : 0,
      startedAt: new Date(
        startedAt
      ).toISOString(),
      completedAt: new Date().toISOString(),
    }).catch((err) => {
      console.error(
        "فشل حفظ نتيجة المحاكي:",
        err
      );
    });
  };

  // =========================================================
  // الانتقال للسؤال التالي
  // =========================================================

  const goNext = () => {
    if (
      currentIndex + 1 >=
      quizQuestions.length
    ) {
      finishQuiz();
    } else {
      setCurrentIndex(
        (i) => i + 1
      );
    }
  };

  // =========================================================
  // شاشة الإعدادات
  // =========================================================

  if (!isStarted) {
    return (
      <div className="animate-fade-in-up mx-auto flex max-w-xl flex-col gap-6 py-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/20 bg-gold-500/10 text-gold-400">
            <Sparkles size={28} />
          </div>

          <h1 className="text-2xl font-extrabold text-ink-50 md:text-3xl">
            محاكي الاختبار الشامل
          </h1>

          <p className="mt-2 text-sm text-ink-300">
            اختبار محاكاة يسحب أسئلة بشكل عشوائي من كافة الأقسام لتقييم مستواك الفعلي.
          </p>
        </div>

        <div className="glass-card flex flex-col gap-6 rounded-3xl p-6">
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-bold text-ink-100">
              <span className="flex items-center gap-2">
                <HelpCircle
                  size={18}
                  className="text-gold-400"
                />
                عدد الأسئلة
              </span>

              <span className="text-xs font-normal text-ink-400">
                (المتوفر: {allQuestions.length})
              </span>
            </label>

            <div className="grid grid-cols-5 gap-2">
              {[10, 20, 30, 50].map(
                (count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setQuestionCount(
                        count
                      );
                      setIsCustomQuestions(
                        false
                      );
                    }}
                    className={cn(
                      "press rounded-xl border py-2.5 text-xs font-bold transition-colors",
                      !isCustomQuestions &&
                        questionCount ===
                          count
                        ? "border-gold-500/50 bg-gold-500/20 text-gold-300"
                        : "border-white/10 bg-white/5 text-ink-300 hover:text-ink-50"
                    )}
                  >
                    {count}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setIsCustomQuestions(
                    true
                  )
                }
                className={cn(
                  "press flex items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition-colors",
                  isCustomQuestions
                    ? "border-gold-500/50 bg-gold-500/20 text-gold-300"
                    : "border-white/10 bg-white/5 text-ink-300 hover:text-ink-50"
                )}
              >
                <Settings2 size={13} />
                تخصيص
              </button>
            </div>

            {isCustomQuestions && (
              <div className="mt-3 animate-pop-in">
                <input
                  type="number"
                  min="1"
                  max={allQuestions.length}
                  value={
                    customQuestions
                  }
                  onChange={(e) =>
                    setCustomQuestions(
                      e.target.value
                    )
                  }
                  placeholder="أدخل عدد الأسئلة (مثال: 15)"
                  className="w-full rounded-xl border border-gold-500/30 bg-ink-900/80 px-4 py-2.5 text-sm text-ink-50 outline-none focus:border-gold-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-100">
              <Clock
                size={18}
                className="text-gold-400"
              />
              المدة الزمنية
            </label>

            <div className="grid grid-cols-5 gap-2">
              {[
                {
                  label: "5 د",
                  value: 5,
                },
                {
                  label: "15 د",
                  value: 15,
                },
                {
                  label: "30 د",
                  value: 30,
                },
                {
                  label: "بدون",
                  value: null,
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setTimeLimitMinutes(
                      opt.value
                    );
                    setIsCustomTime(
                      false
                    );
                  }}
                  className={cn(
                    "press rounded-xl border py-2.5 text-xs font-bold transition-colors",
                    !isCustomTime &&
                      timeLimitMinutes ===
                        opt.value
                      ? "border-gold-500/50 bg-gold-500/20 text-gold-300"
                      : "border-white/10 bg-white/5 text-ink-300 hover:text-ink-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setIsCustomTime(
                    true
                  )
                }
                className={cn(
                  "press flex items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition-colors",
                  isCustomTime
                    ? "border-gold-500/50 bg-gold-500/20 text-gold-300"
                    : "border-white/10 bg-white/5 text-ink-300 hover:text-ink-50"
                )}
              >
                <Settings2 size={13} />
                تخصيص
              </button>
            </div>

            {isCustomTime && (
              <div className="mt-3 animate-pop-in">
                <input
                  type="number"
                  min="1"
                  value={customTime}
                  onChange={(e) =>
                    setCustomTime(
                      e.target.value
                    )
                  }
                  placeholder="أدخل الوقت بالدقائق (مثال: 10)"
                  className="w-full rounded-xl border border-gold-500/30 bg-ink-900/80 px-4 py-2.5 text-sm text-ink-50 outline-none focus:border-gold-400"
                />
              </div>
            )}
          </div>

          <button
            onClick={
              startSimulator
            }
            disabled={
              allQuestions.length === 0
            }
            className="btn-gold press mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold disabled:opacity-50"
          >
            <Play size={20} />

            {allQuestions.length === 0
              ? "لا توجد أسئلة متوفرة"
              : "بدء الاختبار المحاكي"}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // شاشة النتيجة
  // =========================================================

  if (finished) {
    const total =
      quizQuestions.length;

    const percent =
      total > 0
        ? Math.round(
            (runStats.correct /
              total) *
              100
          )
        : 0;

    return (
      <div className="animate-pop-in mx-auto flex max-w-xl flex-col items-center gap-6 py-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-700 text-ink-950 shadow-2xl shadow-gold-900/40">
          <Trophy size={34} />
        </span>

        <div>
          <h1 className="text-2xl font-extrabold text-ink-50">
            أنجزت أداءً رائعاً!
          </h1>

          <p className="mt-2 text-sm text-ink-300">
            ملخص أدائك في المحاكي الشامل
          </p>
        </div>

        <div className="glass-card grid w-full grid-cols-2 gap-4 rounded-3xl p-6 md:grid-cols-4">
          <div className="flex flex-col items-center gap-1">
            <Percent
              className="text-gold-400"
              size={20}
            />

            <span className="text-xl font-extrabold text-ink-50">
              {percent}%
            </span>

            <span className="text-xs text-ink-400">
              النسبة المئوية
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <CheckCircle2
              className="text-emerald-400"
              size={20}
            />

            <span className="text-xl font-extrabold text-ink-50">
              {runStats.correct}
            </span>

            <span className="text-xs text-ink-400">
              إجابات صحيحة
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <XCircle
              className="text-red-400"
              size={20}
            />

            <span className="text-xl font-extrabold text-ink-50">
              {runStats.wrong}
            </span>

            <span className="text-xs text-ink-400">
              إجابات خاطئة
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Clock
              className="text-gold-400"
              size={20}
            />

            <span className="text-xl font-extrabold text-ink-50">
              {formatDuration(
                runStats.timeMs
              )}
            </span>

            <span className="text-xs text-ink-400">
              الوقت المستغرق
            </span>
          </div>
        </div>

        {categoryStats.length > 0 && (
          <div className="glass-card flex w-full flex-col gap-3 rounded-3xl p-6 text-right">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gold-300">
              <BarChart3 size={18} />
              <span>
                الأداء حسب الموضوع:
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {categoryStats.map(
                (cat, idx) => {
                  const catPercent =
                    Math.round(
                      (cat.correct /
                        cat.total) *
                        100
                    );

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-1.5 rounded-2xl border border-white/5 bg-white/5 p-3.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-ink-50">
                          {
                            cat.categoryName
                          }
                        </span>

                        <span className="text-gold-400">
                          {cat.correct} من{" "}
                          {cat.total} (
                          {catPercent}%)
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-gold-300 to-gold-500 transition-all duration-500"
                          style={{
                            width: `${catPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={
              startSimulator
            }
            className="btn-gold press flex items-center gap-2 rounded-2xl px-6 py-3 text-sm"
          >
            <RotateCcw size={16} />
            محاكي جديد
          </button>

          <button
            onClick={() =>
              setIsStarted(false)
            }
            className="press flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-ink-100 hover:bg-white/10"
          >
            تغيير الإعدادات
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // داخل الاختبار — مع شبكة التنقل والمؤقت داخل البطاقة
  // =========================================================

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            finishQuiz();
          }}
          className="press flex items-center gap-1.5 text-sm font-bold text-ink-300 hover:text-gold-300"
        >
          <ArrowRight size={16} />
          إنهاء الاختبار
        </button>

        <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-400">
          المحاكي الشامل
        </span>
      </div>

      {currentQuestion ? (
        <QuestionView
          key={`${currentQuestion.sectionId}-${currentQuestion.id}-${currentIndex}`}
          question={currentQuestion}
          questionNumber={
            currentIndex + 1
          }
          totalQuestions={
            quizQuestions.length
          }
          isFavorite={isFavorite(
            currentQuestion.sectionId,
            currentQuestion.id
          )}
          onToggleFavorite={() =>
            toggleFavorite(
              currentQuestion.sectionId,
              currentQuestion.id
            )
          }
          onAnswered={
            handleAnswered
          }
          onNext={goNext}
          answeredIndices={answeredIndices}
          onJumpToQuestion={jumpToQuestion}
          headerSlot={
            effectiveTimeLimit !== null ? (
              <QuizTimer
                key={`simulator-${startedAt}`}
                durationInSeconds={
                  effectiveTimeLimit * 60
                }
                onExpire={
                  finishQuiz
                }
              />
            ) : undefined
          }
        />
      ) : (
        <div className="py-10 text-center text-ink-300">
          جاري تحميل السؤال...
        </div>
      )}
    </div>
  );
}