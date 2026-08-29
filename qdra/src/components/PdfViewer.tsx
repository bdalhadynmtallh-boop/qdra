import { useEffect, useRef, useState } from "react";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";

/* =========================================================
   عارض PDF يعمل على كل الأجهزة (اندرويد / ايفون / ويندوز)
   ⚡ يستخدم pdf.js إصدار حديث (6.2) يدعم العربية بشكل ممتاز
   — ملفات المكتبة محفوظة داخل المشروع (public/pdfjs)
   — لا يحتاج تثبيت أي مكتبة (npm install) إطلاقاً
   — لا يعتمد على CDN خارجي (لا يمنعه CSP/الحماية)
========================================================= */

// ملفات pdf.js الحديثة محفوظة داخل المشروع في public/pdfjs
const PDFJS_MODULE = "/pdfjs/pdf.min.mjs";
const PDFJS_WORKER = "/pdfjs/pdf.worker.min.mjs";

// تحميل مكتبة pdf.js من نفس الموقع (مرة واحدة فقط)
let pdfjsPromise: Promise<any> | null = null;
function loadPdfjs(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).__qdraPdfjs) {
    return Promise.resolve((window as any).__qdraPdfjs);
  }
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // استيراد ديناميكي من ملف محلي (يعمل في المتصفح مباشرة)
      const mod = await import(/* @vite-ignore */ PDFJS_MODULE);
      mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      (window as any).__qdraPdfjs = mod;
      return mod;
    })();
  }
  return pdfjsPromise;
}

interface PdfViewerProps {
  /** الرابط blob: أو data: أو مسار للـ PDF */
  url: string;
  title?: string;
}

export default function PdfViewer({ url, title = "" }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docRef = useRef<any>(null);
  const pdfjsRef = useRef<any>(null);
  const renderingRef = useRef(false);
  const pendingRef = useRef<number | null>(null);

  // تحميل المستند عند تغيّر الرابط
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPageNum(1);
    setNumPages(0);

    const run = async () => {
      try {
        const pdfjs = await loadPdfjs();
        pdfjsRef.current = pdfjs;
        if (cancelled) return;
        const doc = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (e) {
        console.error("فشل تحميل PDF:", e);
        if (!cancelled) {
          setError("تعذر عرض الملف على هذا الجهاز. تأكد من اتصال الإنترنت ثم أعد المحاولة.");
          setLoading(false);
        }
      }
    };
    run();

    return () => {
      cancelled = true;
      if (docRef.current) {
        try {
          docRef.current.destroy();
        } catch {}
        docRef.current = null;
      }
    };
  }, [url]);

  // رسم الصفحة الحالية
  const renderPage = (pageNumber: number) => {
    const doc = docRef.current;
    const pdfjs = pdfjsRef.current;
    const canvas = canvasRef.current;
    if (!doc || !pdfjs || !canvas) return;

    if (renderingRef.current) {
      pendingRef.current = pageNumber;
      return;
    }
    renderingRef.current = true;

    doc.getPage(pageNumber).then((page: any) => {
      const container = containerRef.current;
      const maxWidth = container ? container.clientWidth : 800;
      const viewport = page.getViewport({ scale: 1.4 });
      const scale = Math.min(1.4, maxWidth / viewport.width);
      const scaledViewport = page.getViewport({ scale });

      const context = canvas.getContext("2d");
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(scaledViewport.width * outputScale);
      canvas.height = Math.floor(scaledViewport.height * outputScale);
      canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
      canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

      if (context) {
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        page
          .render({ canvasContext: context, viewport: scaledViewport })
          .promise.then(() => {
            renderingRef.current = false;
            if (pendingRef.current !== null) {
              const next = pendingRef.current;
              pendingRef.current = null;
              renderPage(next);
            }
          })
          .catch((e: any) => {
            console.error("فشل رسم الصفحة:", e);
            renderingRef.current = false;
            pendingRef.current = null;
          });
      }
    });
  };

  // عند تغيّر الصفحة أو اكتمال التحميل
  useEffect(() => {
    if (!loading && docRef.current) {
      renderPage(pageNum);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, loading]);

  const goPrev = () => setPageNum((p) => Math.max(1, p - 1));
  const goNext = () => setPageNum((p) => Math.min(numPages, p + 1));

  return (
    <div className="flex h-full w-full flex-col">
      {/* شريط الصفحات */}
      <div className="flex items-center justify-center gap-3 border-b border-white/10 py-2 text-xs font-bold text-ink-200">
        <button
          type="button"
          onClick={goPrev}
          disabled={pageNum <= 1}
          className="press flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 disabled:opacity-30"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight size={16} />
        </button>
        <span>
          {loading ? "جارٍ التحميل..." : `صفحة ${pageNum} من ${numPages}`}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={pageNum >= numPages}
          className="press flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 disabled:opacity-30"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* منطقة الرسم */}
      <div ref={containerRef} className="relative flex-1 overflow-auto bg-[#3a3a3a]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gold-400" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-3 p-4">
          <canvas ref={canvasRef} className="rounded-lg bg-white shadow-2xl" title={title} />
        </div>
      </div>
    </div>
  );
}
