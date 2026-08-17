import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(email, password, name);
      navigate("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء الحساب"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-700 text-2xl font-black text-ink-950">
            ق
          </div>

          <h1 className="text-2xl font-extrabold">
            إنشاء حساب
          </h1>

          <p className="mt-2 text-sm text-ink-400">
            أنشئ حسابك وابدأ التدريب
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              الاسم
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              autoComplete="name"
              placeholder="اسمك"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-gold-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              البريد الإلكتروني
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              placeholder="example@email.com"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-gold-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              كلمة المرور
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="8 أحرف على الأقل"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-gold-500"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-300 to-gold-600 px-4 py-3 font-bold text-ink-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={18} />

            {loading
              ? "جارٍ إنشاء الحساب..."
              : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          لديك حساب بالفعل؟{" "}
          <Link
            to="/login"
            className="font-bold text-gold-300 hover:text-gold-200"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}