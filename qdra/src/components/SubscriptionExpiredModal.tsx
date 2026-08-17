import { useState } from "react";
import { Lock, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils/cn";

export default function SubscriptionExpiredModal() {
  const { renew } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault();
    
    if (!code.trim()) {
      setError("الرجاء إدخال رمز التفعيل");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await renew(code.trim());
      
      if (result.success) {
        setSuccess(result.message);
        // الموقع راح يحدث تلقائياً لأن AuthContext يغير subscriptionExpired
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء التجديد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="animate-pop-in w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-ink-950 to-ink-900 p-6 shadow-2xl shadow-gold-900/20 md:p-8">
        
        {/* الأيقونة */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Lock size={32} />
          </div>
        </div>

        {/* العنوان */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-extrabold text-ink-50 md:text-2xl">
            انتهى اشتراكك
          </h2>
          <p className="mt-2 text-xs text-ink-300 md:text-sm">
            حسابك وبياناتك محفوظة بأمان. أدخل رمز التفعيل الجديد للاستمرار.
          </p>
        </div>

        {/* نموذج الإدخال */}
        <form onSubmit={handleRenew} className="space-y-4">
          
          {/* حقل الرمز */}
          <div>
            <label className="mb-2 block text-xs font-bold text-ink-200">
              رمز التفعيل
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="أدخل الرمز هنا..."
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink-50 outline-none placeholder:text-ink-500 focus:border-gold-500/50 disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
              <XCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* رسالة النجاح */}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* زر التجديد */}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className={cn(
              "btn-gold press flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
              (loading || !code.trim()) && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                جاري التجديد...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                تجديد الاشتراك
              </>
            )}
          </button>
        </form>

        {/* ملاحظة أسفل */}
        <p className="mt-5 text-center text-[10px] text-ink-500">
          إذا لم يكن لديك رمز تفعيل، تواصل مع الدعم الفني للحصول على اشتراك جديد.
        </p>
      </div>
    </div>
  );
}