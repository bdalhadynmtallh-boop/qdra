import { CheckCircle2, FileQuestion } from "lucide-react";
import type { SectionMeta } from "../types";
import ProgressRing from "./ProgressRing";
import { cn } from "../utils/cn";

interface SectionCardProps {
  meta: SectionMeta;
  questionsCount: number;
  percent: number;
  completed: boolean;
  onClick?: () => void;
}

export default function SectionCard({
  meta,
  questionsCount,
  percent,
  completed,
  onClick,
}: SectionCardProps) {
  const hasData = questionsCount > 0;

  return (
    <div
      onClick={hasData ? onClick : undefined}
      className={cn(
        "glass-card group relative flex h-full cursor-pointer flex-col justify-between gap-4 rounded-2xl p-4 transition-all duration-200 select-none",
        hasData
          ? "press hover:-translate-y-0.5 hover:border-gold-500/40"
          : "cursor-not-allowed opacity-50"
      )}
    >
      {completed && (
        <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/40">
          <CheckCircle2 size={16} />
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold text-gold-400">القسم {meta.id}</span>
          <h3 className="mt-1 text-sm font-bold leading-6 text-ink-50">{meta.name}</h3>
        </div>
        <ProgressRing percent={percent} size={44} strokeWidth={4} />
      </div>
      <div className="flex items-center justify-between text-xs text-ink-400">
        <span className="flex items-center gap-1">
          <FileQuestion size={14} />
          {hasData ? `${questionsCount} سؤال` : "قريبًا"}
        </span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 font-semibold text-ink-300">
          {meta.category}
        </span>
      </div>
    </div>
  );
}