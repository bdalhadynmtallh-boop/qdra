import { useState, useMemo, useEffect, useRef } from "react";
import { FileText, CheckCircle, Search, FolderOpen, AlertCircle, Loader2, X, Download } from "lucide-react";
import { getStoredToken } from "../auth/api";

// ========================================
// 🌐 منطق API URL الموحد (نفس api.ts)
// ========================================
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("vercel.app")) return "https://qdra-1.onrender.com";
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:3000`;
    }
  }
  return "http://localhost:3000";
};

const API_BASE = getApiUrl();

// ========================================
// 🔐 fetch موحد مع التوكن
// ========================================
async function authFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

export default function FilesPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "solved" | "unsolved">("all");
  const [openingFile, setOpeningFile] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🖥️ عارض PDF داخل الصفحة (بدل فتح نافذة — لا يمنعه المتصفح أبداً)
  const [pdfViewer, setPdfViewer] = useState<{
    url: string;
    title: string;
    downloadUrl: string;
  } | null>(null);

  const blobUrlRef = useRef<string | null>(null);

  const closeViewer = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPdfViewer(null);
  };

  // تنظيف عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/sections`);
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
          questionCount: s.questionCount || 0,
          solvedApiUrl: `/api/pdfs/solved/section${fileId}.pdf`,
          unsolvedApiUrl: `/api/pdfs/unsolved/section${fileId}.pdf`,
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

  const openPdf = async (apiPath: string, sectionName: string) => {
    const fileKey = `${apiPath}`;
    setOpeningFile(fileKey);
    setErrorMessage(null);

    try {
      // ✅ يستخدم authFetch اللي يرسل التوكن تلقائياً
      const res = await authFetch(`${API_BASE}${apiPath}`, {
        method: "GET",
      });

      if (res.status === 401) {
        setErrorMessage("يجب تسجيل الدخول للوصول إلى ملفات PDF");
        setOpeningFile(null);
        return;
      }

      if (res.status === 403) {
        setErrorMessage("انتهى اشتراكك — جدّد الاشتراك للوصول إلى الملفات");
        setOpeningFile(null);
        return;
      }

      if (res.status === 404) {
        setErrorMessage(`ملف "${sectionName}" غير متوفر حالياً`);
        setOpeningFile(null);
        return;
      }

      if (!res.ok) {
        setErrorMessage(`تعذر تحميل الملف (خطأ ${res.status})`);
        setOpeningFile(null);
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = blobUrl;

      // 🖥️ اعرض PDF داخل نفس الصفحة (بلا فتح نافذة — لا مانع نوافذ منبثقة أبداً)
      setPdfViewer({
        url: blobUrl,
        title: sectionName,
        downloadUrl: blobUrl,
      });

      setOpeningFile(null);
    } catch (err) {
      console.error("فشل فتح الملف:", err);
      setErrorMessage("تعذر الاتصال بالسيرفر، حاول مرة أخرى");
      setOpeningFile(null);
    }
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

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle size={20} className="shrink-0 text-red-400" />
          <p className="flex-1 text-sm font-semibold text-red-300">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-red-300 hover:text-red-200"
          >
            إغلاق
          </button>
        </div>
      )}

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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-ink-400" />
          <div className="font-bold text-ink-50">لا توجد أقسام مطابقة</div>
          <div className="mt-1 text-sm text-ink-400">جرّب كلمة بحث مختلفة</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((file) => {
            const isSolvedOpening = openingFile === file.solvedApiUrl;
            const isUnsolvedOpening = openingFile === file.unsolvedApiUrl;

            return (
              <div
                key={file.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-gold-500/40 hover:shadow-lg"
              >
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

                <div className="flex flex-col gap-2 p-4">
                  {(filter === "all" || filter === "solved") && (
                    <button
                      onClick={() => openPdf(file.solvedApiUrl, `${file.name} (محلول)`)}
                      disabled={isSolvedOpening}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-500 transition hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {isSolvedOpening ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          جاري الفتح...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          نسخة محلولة
                        </>
                      )}
                    </button>
                  )}

                  {(filter === "all" || filter === "unsolved") && (
                    <button
                      onClick={() => openPdf(file.unsolvedApiUrl, `${file.name} (غير محلول)`)}
                      disabled={isUnsolvedOpening}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gold-500/10 px-4 py-2.5 text-xs font-bold text-gold-400 transition hover:bg-gold-500/20 disabled:opacity-50"
                    >
                      {isUnsolvedOpening ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          جاري الفتح...
                        </>
                      ) : (
                        <>
                          <FileText size={16} />
                          نسخة للمراجعة
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4 text-center text-xs text-ink-400">
        💡 اضغط على أي نسخة لعرضها هنا مباشرة داخل الصفحة، وزر التحميل بالأسفل لحفظها على جهازك.
      </div>

      {/* 🖥️ عارض PDF داخل الصفحة */}
      {pdfViewer && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
          style={{ padding: "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) 0 env(safe-area-inset-left, 0px)" }}
          onClick={closeViewer}
        >
          {/* الشريط العلوي */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            onClick={(e) => e.stopPropagation()}
            style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex min-w-0 items-center gap-2 text-ink-100">
              <FileText size={18} className="shrink-0 text-gold-400" />
              <span className="truncate text-sm font-bold">{pdfViewer.title}</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={pdfViewer.downloadUrl}
                download={`${pdfViewer.title}.pdf`}
                onClick={(e) => e.stopPropagation()}
                className="press flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
              >
                <Download size={14} />
                تحميل
              </a>

              <button
                onClick={closeViewer}
                className="press flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-200 hover:bg-white/15"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* PDF */}
          <div className="min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={pdfViewer.url}
              title={pdfViewer.title}
              className="h-full w-full"
              style={{ border: 0 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}