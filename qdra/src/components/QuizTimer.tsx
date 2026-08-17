import { useTimer } from "../hooks/useTimer";

export const DEFAULT_QUIZ_DURATION_SECONDS = 15 * 60; // 900 ثانية = 15 دقيقة

interface QuizTimerProps {
  /** مدة المؤقت بالثواني، افتراضيًا 900 ثانية (15 دقيقة) */
  durationInSeconds?: number;
  /** يُستدعى مرة واحدة فقط عند انتهاء الوقت */
  onExpire: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function QuizTimer({
  durationInSeconds = DEFAULT_QUIZ_DURATION_SECONDS,
  onExpire,
}: QuizTimerProps) {
  const secondsLeft = useTimer(durationInSeconds, onExpire);

  const isDanger = secondsLeft < 60; // أقل من دقيقة
  const isWarning = !isDanger && secondsLeft <= 180; // من 3 دقائق إلى دقيقة

  const stateStyles = isDanger
    ? "border-red-500/40 bg-red-500/10 text-red-300 animate-pulse"
    : isWarning
      ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`الوقت المتبقي: ${formatTime(secondsLeft)}`}
      className={`glass-card flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-lg backdrop-blur-md transition-colors duration-500 dark:shadow-black/30 ${stateStyles}`}
    >
      <span className="text-base leading-none sm:text-lg" aria-hidden="true">
        ⏱️
      </span>
      <span className="font-mono text-base font-extrabold tabular-nums tracking-widest sm:text-lg">
        {formatTime(secondsLeft)}
      </span>
    </div>
  );
}