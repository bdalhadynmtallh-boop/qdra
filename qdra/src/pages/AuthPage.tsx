import {
  FormEvent,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  Mail,
  Lock,
  User,
  KeyRound,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const {
    user,
    loading,
    login,
    register,
  } = useAuth();

  const navigate =
    useNavigate();

  const [
    mode,
    setMode,
  ] =
    useState<
      "login" | "register"
    >("login");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    isDarkMode,
    setIsDarkMode,
  ] =
    useState(true);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    activationCode,
    setActivationCode,
  ] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d4a126]/20 border-t-[#d4a126]" />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | إذا كان مسجل دخول
  |--------------------------------------------------------------------------
  */

  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | تغيير الوضع
  |--------------------------------------------------------------------------
  */

  const switchMode = (
    newMode:
      | "login"
      | "register"
  ) => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      setError("");
      setSuccess("");
      setSubmitting(true);

      try {
        /*
        |--------------------------------------------------------------------------
        | LOGIN
        |--------------------------------------------------------------------------
        */

        if (
          mode === "login"
        ) {
          if (
            !email.trim() ||
            !password
          ) {
            setError(
              "البريد الإلكتروني وكلمة المرور مطلوبان"
            );

            return;
          }

          await login(
            email.trim(),
            password
          );

          /*
          | إذا نجح login
          | ينتقل للصفحة الرئيسية
          */

          navigate(
            "/",
            {
              replace: true,
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | REGISTER
        |--------------------------------------------------------------------------
        */

        if (!name.trim()) {
          setError(
            "اكتب اسمك"
          );

          return;
        }

        if (!email.trim()) {
          setError(
            "اكتب البريد الإلكتروني"
          );

          return;
        }

        if (
          password.length <
          8
        ) {
          setError(
            "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
          );

          return;
        }

        if (
          !activationCode.trim()
        ) {
          setError(
            "أدخل رمز التفعيل"
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | إنشاء الحساب
        |--------------------------------------------------------------------------
        */

        await register(
          email.trim(),
          password,
          name.trim(),
          activationCode.trim()
        );

        /*
        |--------------------------------------------------------------------------
        | التسجيل نجح
        |
        | المستخدم صار مسجل دخول مباشرة
        |--------------------------------------------------------------------------
        */

        setSuccess(
          "تم إنشاء الحساب وتفعيل الاشتراك بنجاح"
        );

        setPassword("");
        setActivationCode("");

        navigate(
          "/",
          {
            replace: true,
          }
        );
      } catch (
        error
      ) {
        /*
        |--------------------------------------------------------------------------
        | عرض خطأ السيرفر
        |--------------------------------------------------------------------------
        */

        setError(
          error instanceof Error
            ? error.message
            : "حدث خطأ، حاول مرة أخرى"
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  return (
    <div
      className={`relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 font-sans transition-colors duration-300 ${
        isDarkMode
          ? "!bg-[#09090b] !text-white"
          : "!bg-[#f4f4f5] !text-zinc-900"
      }`}
    >
      {/* خلفية */}
      <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-[#d4a126]/10 blur-[130px]" />

      {/* زر الوضع */}
      <div className="absolute left-6 top-6 z-30">
        <button
          type="button"
          onClick={() =>
            setIsDarkMode(
              !isDarkMode
            )
          }
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
            isDarkMode
              ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
              : "border-black/10 bg-black/5 text-zinc-800 hover:bg-black/10"
          }`}
        >
          {isDarkMode ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>
      </div>

      {/* الكرت */}
      <div
        className={`relative z-10 my-auto w-full max-w-md rounded-3xl border p-6 shadow-2xl backdrop-blur-xl transition-colors duration-300 md:p-8 ${
          isDarkMode
            ? "border-white/10 !bg-[#121215]"
            : "border-black/10 !bg-white"
        }`}
      >
        {/* اللوقو */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-auto items-center justify-center">
            <img
              src={
                isDarkMode
                  ? "/logo-dark.png"
                  : "/logo-light.png"
              }
              alt="قُدرة"
              className="h-full max-h-20 w-auto object-contain"
            />
          </div>

          <h1
            className={`text-2xl font-black tracking-tight ${
              isDarkMode
                ? "!text-white"
                : "!text-zinc-900"
            }`}
          >
            قُدْرَة{" "}
            <span className="!text-[#d4a126]">
              · اللفظي
            </span>
          </h1>

          <p
            className={`mt-1.5 text-xs ${
              isDarkMode
                ? "!text-white/50"
                : "!text-zinc-500"
            }`}
          >
            {mode ===
            "login"
              ? "سجّل دخولك للوصول إلى حسابك"
              : "أنشئ حسابك الجديد وابدأ التدريب"}
          </p>
        </div>

        {/* أزرار التبديل */}
        <div
          className={`mb-6 grid grid-cols-2 rounded-xl border p-1 ${
            isDarkMode
              ? "border-white/10 !bg-white/5"
              : "border-black/10 !bg-zinc-100"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              switchMode(
                "login"
              )
            }
            className={`rounded-lg py-2.5 text-xs font-black transition-all ${
              mode ===
              "login"
                ? "!bg-[#d4a126] !text-black shadow-md"
                : isDarkMode
                ? "!text-white/60 hover:!text-white"
                : "!text-zinc-600 hover:!text-black"
            }`}
          >
            تسجيل الدخول
          </button>

          <button
            type="button"
            onClick={() =>
              switchMode(
                "register"
              )
            }
            className={`rounded-lg py-2.5 text-xs font-black transition-all ${
              mode ===
              "register"
                ? "!bg-[#d4a126] !text-black shadow-md"
                : isDarkMode
                ? "!text-white/60 hover:!text-white"
                : "!text-zinc-600 hover:!text-black"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        {/* النموذج */}
        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >
          {/* الاسم */}
          {mode ===
            "register" && (
            <div>
              <label
                className={`mb-1.5 block text-xs font-bold ${
                  isDarkMode
                    ? "!text-white/70"
                    : "!text-zinc-700"
                }`}
              >
                الاسم
              </label>

              <div className="relative">
                <User
                  size={18}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                    isDarkMode
                      ? "!text-white/40"
                      : "!text-zinc-400"
                  }`}
                />

                <input
                  type="text"
                  value={name}
                  onChange={(
                    e
                  ) =>
                    setName(
                      e.target
                        .value
                    )
                  }
                  placeholder="اسمك الكامل"
                  className={`w-full rounded-xl border py-3 pl-4 pr-11 text-sm outline-none transition-all focus:border-[#d4a126] ${
                    isDarkMode
                      ? "border-white/10 !bg-[#1c1c21] !text-white placeholder:!text-white/30"
                      : "border-black/10 !bg-zinc-50 !text-zinc-900 placeholder:!text-zinc-400"
                  }`}
                />
              </div>
            </div>
          )}

          {/* البريد */}
          <div>
            <label
              className={`mb-1.5 block text-xs font-bold ${
                isDarkMode
                  ? "!text-white/70"
                  : "!text-zinc-700"
              }`}
            >
              البريد الإلكتروني
            </label>

            <div className="relative">
              <Mail
                size={18}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                  isDarkMode
                    ? "!text-white/40"
                    : "!text-zinc-400"
                }`}
              />

              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(
                  e
                ) =>
                  setEmail(
                    e.target
                      .value
                  )
                }
                placeholder="name@example.com"
                required
                className={`w-full rounded-xl border py-3 pl-4 pr-11 text-left text-sm outline-none transition-all focus:border-[#d4a126] ${
                  isDarkMode
                    ? "border-white/10 !bg-[#1c1c21] !text-white placeholder:!text-white/30"
                    : "border-black/10 !bg-zinc-50 !text-zinc-900 placeholder:!text-zinc-400"
                }`}
              />
            </div>
          </div>

          {/* كلمة المرور */}
          <div>
            <label
              className={`mb-1.5 block text-xs font-bold ${
                isDarkMode
                  ? "!text-white/70"
                  : "!text-zinc-700"
              }`}
            >
              كلمة المرور
            </label>

            <div className="relative">
              <Lock
                size={18}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                  isDarkMode
                    ? "!text-white/40"
                    : "!text-zinc-400"
                }`}
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                dir="ltr"
                value={
                  password
                }
                onChange={(
                  e
                ) =>
                  setPassword(
                    e.target
                      .value
                  )
                }
                placeholder="••••••••"
                required
                className={`w-full rounded-xl border py-3 pl-11 pr-11 text-left text-sm outline-none transition-all focus:border-[#d4a126] ${
                  isDarkMode
                    ? "border-white/10 !bg-[#1c1c21] !text-white placeholder:!text-white/30"
                    : "border-black/10 !bg-zinc-50 !text-zinc-900 placeholder:!text-zinc-400"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDarkMode
                    ? "!text-white/40 hover:!text-white"
                    : "!text-zinc-400 hover:!text-black"
                }`}
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye
                    size={18}
                  />
                )}
              </button>
            </div>
          </div>

          {/* رمز التفعيل — التسجيل فقط */}
          {mode ===
            "register" && (
            <div>
              <label className="mb-1.5 block text-xs font-bold !text-[#d4a126]">
                رمز التفعيل
              </label>

              <div className="relative">
                <KeyRound
                  size={18}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 !text-[#d4a126]"
                />

                <input
                  type="text"
                  dir="ltr"
                  value={
                    activationCode
                  }
                  onChange={(
                    e
                  ) =>
                    setActivationCode(
                      e.target
                        .value
                    )
                  }
                  placeholder="أدخل رمز التفعيل"
                  required
                  className={`w-full rounded-xl border border-[#d4a126]/30 !bg-[#d4a126]/10 py-3 pl-4 pr-11 text-center text-sm font-mono tracking-[0.2em] outline-none transition-all focus:border-[#d4a126] ${
                    isDarkMode
                      ? "!text-white"
                      : "!text-zinc-900"
                  }`}
                />
              </div>
            </div>
          )}

          {/* الخطأ */}
          {error && (
            <div className="rounded-xl border border-red-500/20 !bg-red-500/10 px-4 py-3 text-center text-xs font-bold !text-red-400">
              {error}
            </div>
          )}

          {/* النجاح */}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 !bg-emerald-500/10 px-4 py-3 text-center text-xs font-bold !text-emerald-400">
              {success}
            </div>
          )}

          {/* الزر */}
          <button
            type="submit"
            disabled={
              submitting
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl !bg-[#d4a126] py-3.5 text-sm font-black !text-black shadow-lg shadow-[#d4a126]/20 transition-all hover:!bg-[#e2ad2b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode ===
            "login" ? (
              <>
                <LogIn
                  size={18}
                />

                <span>
                  {submitting
                    ? "جارٍ تسجيل الدخول..."
                    : "تسجيل الدخول"}
                </span>
              </>
            ) : (
              <>
                <UserPlus
                  size={18}
                />

                <span>
                  {submitting
                    ? "جارٍ إنشاء الحساب..."
                    : "إنشاء الحساب"}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}