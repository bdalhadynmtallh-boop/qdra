import { useState, useMemo, useEffect } from "react";
import { FileText, CheckCircle, Search, FolderOpen } from "lucide-react";

// ⚙️ نفس رابط الباك اند اللي تستخدمه لوحة التحكم
const API_BASE = "http://localhost:3000";

export default function FilesPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "solved" | "unsolved">("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sections`);
        const json = await res.json();
        if (json.success && Array.isArray(json.sections)) {
          setSections(json.sections);
        }
      } catch (e) {
        console.error("فشل تحميل الأقسام:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filesData = useMemo(() => {
    return (sections || [])
      .slice()
      .sort((a: any, b: any) => (a.order || a.id) - (b.order || b.id))
      .map((s: any) => {
        const fileId = String(s.fileId || String(s.id).padStart(3, "0"));
        return {
          id: s.id,
          fileId,
          name: s.name || `القسم ${s.id}`,
          category: s.category,
          questionCount: Array.isArray(s.questions) ? s.questions.length : 0,
          solvedUrl: `/pdfs/solved/section${fileId}.pdf`,
          unsolvedUrl: `/pdfs/unsolved/section${fileId}.pdf`,
        };
      });
  }, [sections]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filesData.filter(
      (f) =>
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.fileId.includes(q) ||
        String(f.id) === q
    );
  }, [filesData, search]);

  const openPdf = (url: string, sectionName: string) => {
    fetch(url, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          window.open(url, "_blank");
        } else {
          alert(`عذراً، ملف "${sectionName}" غير متوفر حالياً.`);
        }
      })
      .catch(() => {
        alert("تعذر الوصول للملف، حاول مرة أخرى.");
      });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500/20 border-t-gold-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* HEADER */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10 text-gold-400">
          <FolderOpen size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-ink-50">ملفات الأقسام</h1>
          <p className="text-sm text-ink-400">
            تحميل نسخ PDF للأقسام — محلول وغير محلول ({filesData.length} قسم)
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-ink-400">إجمالي الملفات</div>
          <div className="mt-1 text-2xl font-black text-ink-50">{filesData.length * 2}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-ink-400">ملفات محلولة</div>
          <div className="mt-1 text-2xl font-black text-emerald-500">{filesData.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-semibold text-ink-400">ملفات للمراجعة</div>
          <div className="mt-1 text-2xl font-black text-gold-400">{filesData.length}</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم القسم أو رقمه..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 pl-3 text-sm text-ink-50 outline-none transition focus:border-gold-500 placeholder:text-ink-400"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              filter === "all"
                ? "bg-gold-500 text-black/80"
                : "border border-white/10 text-ink-300 hover:bg-white/5"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter("solved")}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              filter === "solved"
                ? "bg-emerald-500 text-black/80"
                : "border border-white/10 text-ink-300 hover:bg-white/5"
            }`}
          >
            محلول
          </button>
          <button
            onClick={() => setFilter("unsolved")}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              filter === "unsolved"
                ? "bg-gold-500 text-black/80"
                : "border border-white/10 text-ink-300 hover:bg-white/5"
            }`}
          >
            غير محلول
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-ink-400">{filtered.length} قسم</div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-ink-400" />
          <div className="font-bold text-ink-50">لا توجد أقسام مطابقة</div>
          <div className="mt-1 text-sm text-ink-400">جرّب كلمة بحث مختلفة</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((file) => (
            <div
              key={file.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-gold-500/40 hover:shadow-lg"
            >
              {/* CARD HEADER */}
              <div className="flex items-center gap-3 border-b border-white/10 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-sm font-black text-gold-400">
                  {file.fileId}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-ink-50">{file.name}</h3>
                  {file.category && (
                    <p className="truncate text-xs text-ink-400">{file.category}</p>
                  )}
                </div>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold text-ink-300">
                  {file.questionCount} سؤال
                </span>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-2 p-4">
                {(filter === "all" || filter === "solved") && (
                  <button
                    onClick={() => openPdf(file.solvedUrl, `${file.name} (محلول)`)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-500 transition hover:bg-emerald-500/20"
                  >
                    <CheckCircle size={16} />
                    نسخة محلولة
                  </button>
                )}

                {(filter === "all" || filter === "unsolved") && (
                  <button
                    onClick={() => openPdf(file.unsolvedUrl, `${file.name} (غير محلول)`)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gold-500/10 px-4 py-2.5 text-xs font-bold text-gold-400 transition hover:bg-gold-500/20"
                  >
                    <FileText size={16} />
                    نسخة للمراجعة
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NOTE */}
      <div className="mt-8 rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4 text-center text-xs text-ink-400">
        💡 اضغط على أي نسخة لفتحها في تبويب جديد، ثم استخدم زر الحفظ في المتصفح لتحميلها على جهازك.
      </div>
    </div>
  );
}