import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { sectionsMeta } from "../data/sectionsMeta";
import { getSectionQuestionCount, loadSectionsMetadata } from "../data/loadSections"; // ✅ إضافة loadSectionsMetadata
import { useAppData } from "../context/AppDataContext";
import SectionCard from "../components/SectionCard";
import EmptyState from "../components/EmptyState";
import { TimeSelectionModal } from "../components/TimeSelectionModal";
import { cn } from "../utils/cn";

type SortMode = "number" | "percent";
type FilterMode = "all" | "completed" | "incomplete";

const PAGE_SIZE = 24;

export default function SectionsPage() {
  const navigate = useNavigate();
  const { getSectionPercent, isSectionCompleted } = useAppData();
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("number");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [page, setPage] = useState(1);

  // ✅ جديد: نسخة metadata لإعادة الرسم عند وصول البيانات من السيرفر
  const [metadataVersion, setMetadataVersion] = useState(0);

  // ✅ جديد: جلب metadata من السيرفر عند فتح الصفحة
  useEffect(() => {
    let isMounted = true;
    loadSectionsMetadata().then(() => {
      if (isMounted) setMetadataVersion((v) => v + 1);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // حالة التحكم بالقسم المحدد لفتح نافذة تخصيص الوقت
  const [selectedSection, setSelectedSection] = useState<{ id: number; name: string } | null>(null);

  const rows = useMemo(() => {
    return sectionsMeta.map((meta) => ({
      meta,
      questionsCount: getSectionQuestionCount(meta.id),
      percent: getSectionPercent(meta.id),
      completed: isSectionCompleted(meta.id),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSectionPercent, isSectionCompleted, metadataVersion]); // ✅ إضافة metadataVersion

  const filtered = useMemo(() => {
    let list = rows;

    const q = search.trim();
    if (q) {
      list = list.filter((row) => row.meta.name.includes(q) || row.meta.id.toString() === q || row.meta.category.includes(q));
    }

    if (filterMode === "completed") list = list.filter((row) => row.completed);
    if (filterMode === "incomplete") list = list.filter((row) => !row.completed);

    const sorted = [...list].sort((a, b) => {
      if (sortMode === "percent") return b.percent - a.percent;
      return a.meta.id - b.meta.id;
    });

    return sorted;
  }, [rows, search, filterMode, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  // دالة البدء مع إرسال الوقت في حالة التنقل (state) لمنع المشاكل مع HashRouter
  const handleStartQuiz = (timeLimit: number | null) => {
    if (!selectedSection) return;

    navigate(`/sections/${selectedSection.id}`, {
      state: { timeLimit },
    });

    setSelectedSection(null);
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-50 md:text-3xl">الأقسام</h1>
        <p className="mt-1 text-sm text-ink-300">اختر قسمًا لبدء التدرب على أسئلته</p>
      </div>

      <div className="glass-card flex flex-col gap-4 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="ابحث برقم القسم أو الاسم..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-3 text-sm text-ink-50 outline-none placeholder:text-ink-500 focus:border-gold-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs font-bold">
            {[
              { key: "all", label: "الكل" },
              { key: "completed", label: "المكتملة" },
              { key: "incomplete", label: "غير المكتملة" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setFilterMode(opt.key as FilterMode);
                  resetPage();
                }}
                className={cn(
                  "press rounded-lg px-3 py-1.5 transition-colors",
                  filterMode === opt.key ? "bg-gold-500 text-ink-950" : "text-ink-300 hover:text-ink-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as SortMode);
              resetPage();
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-ink-100 outline-none focus:border-gold-500/50"
          >
            <option value="number">ترتيب حسب الرقم</option>
            <option value="percent">ترتيب حسب نسبة الإنجاز</option>
          </select>
        </div>
      </div>

      {pageItems.length === 0 ? (
        <EmptyState title="لا توجد نتائج" description="جرّب تعديل كلمات البحث أو الفلتر المستخدم." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pageItems.map((row) => (
            <SectionCard
              key={row.meta.id}
              meta={row.meta}
              questionsCount={row.questionsCount}
              percent={row.percent}
              completed={row.completed}
              onClick={() => setSelectedSection({ id: row.meta.id, name: row.meta.name })}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="press rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-ink-200 disabled:opacity-30"
          >
            السابق
          </button>
          <span className="text-xs font-bold text-ink-300">
            صفحة {currentPage} من {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="press rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-ink-200 disabled:opacity-30"
          >
            التالي
          </button>
        </div>
      )}

      {/* نافذة تخصيص الوقت */}
      <TimeSelectionModal
        isOpen={!!selectedSection}
        sectionTitle={selectedSection?.name || ""}
        onClose={() => setSelectedSection(null)}
        onStart={handleStartQuiz}
      />
    </div>
  );
}