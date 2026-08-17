import { CheckCircle2, XCircle, ListChecks, Percent, Clock, Timer, LayoutGrid, Hourglass } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { sectionsMeta, TOTAL_SECTIONS } from "../data/sectionsMeta";
import StatCard from "../components/StatCard";

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0 دقيقة";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return `${Math.round(ms / 1000)} ثانية`;
}

export default function StatsPage() {
  const { state, isSectionCompleted } = useAppData();

  const completedCount = sectionsMeta.filter((s) => isSectionCompleted(s.id)).length;
  const remainingCount = TOTAL_SECTIONS - completedCount;
  const { totalAnswered, totalCorrect, totalWrong, totalTimeMs } = state.totals;

  const correctPercent = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const wrongPercent = totalAnswered > 0 ? Math.round((totalWrong / totalAnswered) * 100) : 0;
  const avgTimePerQuestion = totalAnswered > 0 ? Math.round(totalTimeMs / totalAnswered) : 0;

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-50 md:text-3xl">الإحصائيات</h1>
        <p className="mt-1 text-sm text-ink-300">تتبّع أداءك ومستوى تقدمك في دراسة القسم اللفظي</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon={<LayoutGrid size={20} />} label="أقسام مكتملة" value={completedCount} />
        <StatCard icon={<Hourglass size={20} />} label="أقسام متبقية" value={remainingCount} />
        <StatCard icon={<ListChecks size={20} />} label="إجمالي الأسئلة المحلولة" value={totalAnswered} />
        <StatCard icon={<CheckCircle2 size={20} />} label="إجابات صحيحة" value={totalCorrect} />
        <StatCard icon={<XCircle size={20} />} label="إجابات خاطئة" value={totalWrong} />
        <StatCard icon={<Percent size={20} />} label="نسبة الصحة" value={`${correctPercent}%`} />
        <StatCard icon={<Percent size={20} />} label="نسبة الخطأ" value={`${wrongPercent}%`} />
        <StatCard icon={<Timer size={20} />} label="متوسط الوقت لكل سؤال" value={`${Math.round(avgTimePerQuestion / 1000)} ثانية`} />
        <StatCard icon={<Clock size={20} />} label="إجمالي وقت الدراسة" value={formatDuration(totalTimeMs)} />
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h2 className="mb-4 text-lg font-extrabold text-ink-50">توزيع الإجابات</h2>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${correctPercent}%` }} />
          <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${wrongPercent}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-5 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> صحيحة {correctPercent}%
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> خاطئة {wrongPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
