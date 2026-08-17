import { useMemo, useState } from "react";
import { Search, Trash2, ChevronDown } from "lucide-react";
import type { MistakeFavoriteItem, Question } from "../types";
import { getSectionMetaById } from "../data/sectionsMeta";
import { getSectionQuestions } from "../data/loadSections";
import { useAppData } from "../context/AppDataContext";
import QuestionView from "./QuestionView";
import EmptyState from "./EmptyState";
import { cn } from "../utils/cn";

interface ReviewListProps {
  items: MistakeFavoriteItem[];
  emptyTitle: string;
  emptyDescription: string;
  onRemove: (sectionId: number, questionId: number) => void;
  removeLabel: string;
}

interface ResolvedItem extends MistakeFavoriteItem {
  question: Question;
  sectionName: string;
}

export default function ReviewList({ items, emptyTitle, emptyDescription, onRemove, removeLabel }: ReviewListProps) {
  const { isFavorite, toggleFavorite, recordAnswer } = useAppData();
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const resolved: ResolvedItem[] = useMemo(() => {
    return items
      .map((item) => {
        const meta = getSectionMetaById(item.sectionId);
        const question = getSectionQuestions(item.sectionId).find((q) => q.id === item.questionId);
        if (!meta || !question) return null;
        return { ...item, question, sectionName: meta.name };
      })
      .filter((x): x is ResolvedItem => x !== null);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return resolved;
    return resolved.filter((r) => r.question.question.includes(q) || r.sectionName.includes(q));
  }, [resolved, search]);

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث داخل الأسئلة..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-3 text-sm text-ink-50 outline-none placeholder:text-ink-500 focus:border-gold-500/50"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج مطابقة" description="جرّب كلمة بحث مختلفة." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const key = `${item.sectionId}-${item.questionId}`;
            const isOpen = expandedKey === key;
            return (
              <div key={key} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-gold-400">{item.sectionName}</span>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink-100">{item.question.question}</p>
                  </div>
                  <button
                    onClick={() => onRemove(item.sectionId, item.questionId)}
                    className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-ink-300 hover:bg-red-500/10 hover:text-red-400"
                    title={removeLabel}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <button
                  onClick={() => setExpandedKey(isOpen ? null : key)}
                  className="press mt-3 flex items-center gap-1.5 text-xs font-bold text-gold-300"
                >
                  <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                  {isOpen ? "إخفاء السؤال" : "إعادة حل السؤال"}
                </button>

                {isOpen && (
                  <div className="mt-4">
                    <QuestionView
                      key={key}
                      question={item.question}
                      questionNumber={1}
                      totalQuestions={1}
                      isFavorite={isFavorite(item.sectionId, item.questionId)}
                      onToggleFavorite={() => toggleFavorite(item.sectionId, item.questionId)}
                      onAnswered={(correct, timeMs) => recordAnswer(item.sectionId, item.questionId, correct, timeMs)}
                      onNext={() => setExpandedKey(null)}
                      autoAdvanceOnCorrect={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
