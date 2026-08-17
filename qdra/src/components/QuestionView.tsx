import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Star, ArrowLeft } from "lucide-react";
import type { Question } from "../types";
import { cn } from "../utils/cn";

interface QuestionViewProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  category?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAnswered: (
    selectedAnswer: number,
    correctAnswer: number,
    correct: boolean,
    timeMs: number
  ) => void;
  onNext: () => void;
  hideResultImmediately?: boolean;
  autoAdvanceOnCorrect?: boolean;
}

export default function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  category,
  isFavorite,
  onToggleFavorite,
  onAnswered,
  onNext,
  hideResultImmediately = true,
  autoAdvanceOnCorrect = false,
}: QuestionViewProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    setSelected(null);
    setStartedAt(Date.now());
  }, [question?.id]); // ⬅️ نستخدم question.id بدل question عشان نتجنب re-render غير ضروري

  const answered = selected !== null;
  const correctIndex = question?.correctIndex ?? -1; // ⬅️ حماية لو الحقل مفقود
  const isCorrect = answered && selected === correctIndex;

  const handleSelect = (index: number) => {
    if (answered && !hideResultImmediately) return;

    setSelected(index);
    const correct = index === correctIndex;
    const timeMs = Date.now() - startedAt;

    // ⬇️ تشخيص: اطبع القيم في الكونسول عشان نتأكد
    console.log("🎯 Selected:", {
      selectedIndex: index,
      correctIndex,
      isCorrect: correct,
      questionId: question?.id,
    });

    onAnswered(index, correctIndex, correct, timeMs);

    if (!hideResultImmediately && correct && autoAdvanceOnCorrect) {
      setTimeout(() => {
        onNext();
      }, 1500);
    }
  };

  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);
  const displayCategory = category || (question as Record<string, any>).category;

  return (
    <div className="animate-fade-in-up mx-auto w-full max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-l from-gold-300 to-gold-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-xs font-bold text-ink-300">
          {questionNumber} / {totalQuestions}
        </span>
      </div>

      <div className="glass-card rounded-3xl p-5 md:p-7">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300">
              السؤال {questionNumber}
            </span>
            {displayCategory && (
              <span className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300">
                {displayCategory}
              </span>
            )}
          </div>

          <button
            onClick={onToggleFavorite}
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gold-300 hover:bg-white/10"
            aria-label="إضافة للمفضلة"
          >
            <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {question.passage && (
          <div className="mb-4 rounded-2xl border border-white/5 bg-black/30 p-4 text-sm leading-8 text-ink-200">
            {question.passage}
          </div>
        )}

        <p className="mb-5 text-lg font-bold leading-9 text-ink-50 md:text-xl">
          {question.question || (question as any).text || (question as any).title}
        </p>

        {question.questionImage && (
          <img
            src={question.questionImage}
            alt="صورة السؤال"
            className="mb-5 w-full rounded-2xl border border-white/5 object-cover"
          />
        )}

        <div className="flex flex-col gap-3">
          {question.options.map((option, index) => {
            const isSelected = selected === index;
            const isRight = index === correctIndex;

            let stateClasses =
              "border-white/10 bg-white/[0.03] hover:border-gold-500/40 hover:bg-white/[0.06]";

            if (hideResultImmediately) {
              if (isSelected) {
                stateClasses =
                  "border-gold-500/60 bg-gold-500/20 text-gold-300 font-bold";
              }
            } else {
              if (answered) {
                if (isRight) {
                  stateClasses = "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
                } else if (isSelected && !isRight) {
                  stateClasses = "border-red-500/60 bg-red-500/10 text-red-300";
                } else {
                  stateClasses = "border-white/5 bg-white/[0.02] opacity-50";
                }
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={answered && !hideResultImmediately}
                className={cn(
                  "press flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-right text-sm font-semibold transition-all md:text-base",
                  stateClasses
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-bold">
                    {["أ", "ب", "ج", "د"][index] ?? index + 1}
                  </span>
                  {option}
                </span>

                {!hideResultImmediately && answered && isRight && (
                  <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
                )}
                {!hideResultImmediately && answered && isSelected && !isRight && (
                  <XCircle size={20} className="shrink-0 text-red-400" />
                )}
              </button>
            );
          })}
        </div>

        {!hideResultImmediately && answered && (
          <div className="animate-fade-in-up mt-5">
            {isCorrect ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300">
                  <CheckCircle2 size={18} />
                  <span className="font-bold">إجابة صحيحة</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
                  <XCircle size={18} />
                  <span className="font-bold">إجابة خاطئة</span>
                </div>

                {question.explanation && (
                  <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4">
                    <p className="mb-2 text-xs font-bold text-gold-300">الشرح</p>
                    <p className="text-sm leading-7 text-ink-200">
                      {question.explanation}
                    </p>
                    {question.explanationImage && (
                      <img
                        src={question.explanationImage}
                        alt="صورة الشرح"
                        className="mt-3 w-full rounded-xl border border-white/5"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={onNext}
            disabled={selected === null}
            className="btn-gold press flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold disabled:opacity-50"
          >
            <span>
              {questionNumber === totalQuestions ? "إنهاء الاختبار" : "السؤال التالي"}
            </span>
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}