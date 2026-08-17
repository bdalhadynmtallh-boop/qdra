import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ListChecks, Percent, Clock, Timer, LayoutGrid, Hourglass, Activity } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { sectionsMeta, TOTAL_SECTIONS } from "../data/sectionsMeta";
import StatCard from "../components/StatCard";
import { getDailyStats } from "../auth/api";

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0 دقيقة";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return `${Math.round(ms / 1000)} ثانية`;
}

interface DayStat {
  date: string;
  label: string;
  correct: number;
  wrong: number;
}

// يبني مسار SVG سلس (منحنى) من النقاط
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export default function StatsPage() {
  const { state, isSectionCompleted } = useAppData();
  const [daily, setDaily] = useState<DayStat[]>([]);
  const { totalAnswered, totalCorrect, totalWrong, totalTimeMs } = state.totals;

  // ⬇️ جديد: يعيد جلب البيانات كل 10 ثواني + كل ما تتغير الأرقام
  useEffect(() => {
    let mounted = true;

    async function fetchDaily() {
      try {
        const res = await getDailyStats();
        if (mounted && res?.success) {
          setDaily((res.dailyStats || []).slice().reverse());
        }
      } catch {
        // تجاهل الأخطاء
      }
    }

    fetchDaily();

    // تحديث تلقائي كل 10 ثواني عشان الرسم يتحدث فوراً
    const interval = setInterval(fetchDaily, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [totalCorrect, totalWrong]); // ⬅️ يعيد الجلب عند تغيير الأرقام

  const completedCount = sectionsMeta.filter((s) => isSectionCompleted(s.id)).length;
  const remainingCount = TOTAL_SECTIONS - completedCount;

  // ⬇️ إصلاح النسب: من مجموع المحاولات الحقيقية
  const totalAttempts = totalCorrect + totalWrong;
  const correctPercent = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const wrongPercent = totalAttempts > 0 ? Math.round((totalWrong / totalAttempts) * 100) : 0;
  const avgTimePerQuestion = totalAnswered > 0 ? Math.round(totalTimeMs / totalAnswered) : 0;

  // ⬇️ حسابات الرسم البياني
  const W = 700;
  const H = 260;
  const padX = 40;
  const padY = 30;
  const maxVal = Math.max(1, ...daily.map((d) => Math.max(d.correct, d.wrong)));
  const stepX = daily.length > 1 ? (W - padX * 2) / (daily.length - 1) : 0;

  const toPoint = (i: number, v: number) => ({
    x: padX + i * stepX,
    y: H - padY - (v / maxVal) * (H - padY * 2),
  });

  const correctPts = daily.map((d, i) => toPoint(i, d.correct));
  const wrongPts = daily.map((d, i) => toPoint(i, d.wrong));

  const correctPath = buildSmoothPath(correctPts);
  const wrongPath = buildSmoothPath(wrongPts);

  // مساحة تحت الخط (gradient fill)
  const correctArea =
    correctPath + ` L ${correctPts[correctPts.length - 1]?.x ?? padX} ${H - padY} L ${padX} ${H - padY} Z`;
  const wrongArea =
    wrongPath + ` L ${wrongPts[wrongPts.length - 1]?.x ?? padX} ${H - padY} L ${padX} ${H - padY} Z`;

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

      {/* =========================================================
          رسم بياني خطي متحرك (Line Chart) — SVG بدون مكتبات
      ========================================================= */}
      <div className="glass-card rounded-3xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink-50">
            <Activity size={20} className="text-gold-400" />
            نشاط آخر 7 أيام
          </h2>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> صحيحة
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> خاطئة
            </span>
          </div>
        </div>

        {daily.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full min-w-[500px]">
              <defs>
                <linearGradient id="gradCorrect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradWrong" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* خطوط الشبكة الأفقية */}
              {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                const y = H - padY - f * (H - padY * 2);
                return (
                  <g key={i}>
                    <line x1={padX} x2={W - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    <text x={padX - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#71717a">
                      {Math.round(maxVal * f)}
                    </text>
                  </g>
                );
              })}

              {/* المساحات تحت الخطوط */}
              <path d={correctArea} fill="url(#gradCorrect)" />
              <path d={wrongArea} fill="url(#gradWrong)" />

              {/* الخطوط المتحركة */}
              <path
                d={wrongPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 2px 6px rgba(239,68,68,0.3))" }}
              />
              <path
                d={correctPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 2px 6px rgba(16,185,129,0.3))" }}
              />

              {/* النقاط + القيم + تسميات الأيام */}
              {daily.map((d, i) => {
                const cp = correctPts[i];
                const wp = wrongPts[i];
                return (
                  <g key={d.date}>
                    {/* نقطة الصحيحة */}
                    <circle cx={cp.x} cy={cp.y} r="4" fill="#0a0a0a" stroke="#10b981" strokeWidth="2.5" />
                    <text x={cp.x} y={cp.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#34d399">
                      {d.correct}
                    </text>
                    {/* نقطة الخاطئة */}
                    <circle cx={wp.x} cy={wp.y} r="4" fill="#0a0a0a" stroke="#ef4444" strokeWidth="2.5" />
                    <text x={wp.x} y={wp.y + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#f87171">
                      {d.wrong}
                    </text>
                    {/* اسم اليوم */}
                    <text x={cp.x} y={H - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a1a1aa">
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-ink-400">
            جارٍ تحميل النشاط...
          </div>
        )}
      </div>
    </div>
  );
}