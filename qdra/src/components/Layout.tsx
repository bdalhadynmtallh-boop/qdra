import { type ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  LayoutGrid,
  XCircle,
  Star,
  BarChart3,
  Sun,
  Moon,
  LogIn,
  LogOut,
  UserCircle,
  Sparkles,
  MoreHorizontal,
  X,
  Flame,
  Calendar,
  FolderOpen, // ← جديد
} from "lucide-react";

import { cn } from "../utils/cn";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import Logo from "./LogoImage";
import AiChatWidget from "./AiChatWidget";

const DESKTOP_NAV_ITEMS = [
  { to: "/", label: "الرئيسية", icon: Home, end: true },
  { to: "/basics", label: "الأساسيات", icon: BookOpen, end: false },
  { to: "/sections", label: "الأقسام", icon: LayoutGrid, end: false },
  { to: "/files", label: "الملفات", icon: FolderOpen, end: false }, // ← جديد
  { to: "/simulator", label: "المحاكي", icon: Sparkles, end: false },
  { to: "/mistakes", label: "أخطائي", icon: XCircle, end: false },
  { to: "/favorites", label: "المفضلة", icon: Star, end: false },
  { to: "/stats", label: "الإحصائيات", icon: BarChart3, end: false },
];

const MOBILE_MAIN_ITEMS = [
  { to: "/", label: "الرئيسية", icon: Home, end: true },
  { to: "/basics", label: "الأساسيات", icon: BookOpen, end: false },
  { to: "/sections", label: "الأقسام", icon: LayoutGrid, end: false },
  { to: "/simulator", label: "المحاكي", icon: Sparkles, end: false },
];

const MOBILE_MORE_ITEMS = [
  { to: "/files", label: "الملفات", icon: FolderOpen, end: false }, // ← جديد
  { to: "/stats", label: "الإحصائيات", icon: BarChart3, end: false },
  { to: "/mistakes", label: "أخطائي", icon: XCircle, end: false },
  { to: "/favorites", label: "المفضلة", icon: Star, end: false },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const { state } = useAppData();
  const navigate = useNavigate();

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // جلب الستريك الفعلي والديناميكي
  const streakCount = state.streakData?.count ?? 1;

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString("ar-SA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handleLogout = async () => {
    setIsMoreOpen(false);
    await logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen bg-ink-950 text-ink-50 transition-colors duration-300">
      {/* خلفية الإضاءة */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(60% 45% at 15% 0%, rgba(200,155,46,0.16), transparent 60%), radial-gradient(50% 40% at 100% 20%, rgba(200,155,46,0.08), transparent 60%), var(--page-bg)",
        }}
      />

      {/* القائمة الجانبية - سطح المكتب */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-l border-white/10 bg-ink-950/80 p-5 backdrop-blur-xl transition-colors duration-300 md:flex">
        <div className="mb-8 flex items-center justify-start pr-2">
          <NavLink to="/" className="flex items-center gap-3">
            <Logo className="h-12 w-auto" />
          </NavLink>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {DESKTOP_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-gold-500/15 text-gold-300 border border-gold-500/20 shadow-sm"
                    : "text-ink-300 hover:bg-white/5 hover:text-ink-50"
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4">
          {!loading && (
            <div>
              {user ? (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <div className="flex items-center gap-2 overflow-hidden pr-1">
                    <UserCircle size={20} className="shrink-0 text-gold-300" />
                    <span className="truncate text-xs font-semibold text-ink-200">
                      {user.name || user.email}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="تسجيل الخروج"
                    className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/auth"
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all",
                      isActive
                        ? "bg-gold-500/20 text-gold-300 border border-gold-500/30"
                        : "bg-gold-500/10 text-gold-300 hover:bg-gold-500/20"
                    )
                  }
                >
                  <LogIn size={18} />
                  تسجيل الدخول
                </NavLink>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="press flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gold-300 hover:bg-white/10"
          >
            <span className="text-xs text-ink-200">الوضع</span>
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </div>
          </button>

          {/* 🧾 روابط السياسات للمسجلين */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[11px] font-semibold text-ink-400">
            <a href="#/privacy" className="transition hover:text-gold-300">الخصوصية</a>
            <span className="opacity-40">•</span>
            <a href="#/terms" className="transition hover:text-gold-300">الشروط</a>
            <span className="opacity-40">•</span>
            <a href="#/refund" className="transition hover:text-gold-300">الاسترجاع</a>
          </div>
        </div>
      </aside>

      {/* المحتوى الرئيسي الهيدر والستريك */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur-xl transition-colors duration-300 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <NavLink to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-auto" />
              <span className="text-lg font-black tracking-wide text-gold-300">
                قدرة
              </span>
            </NavLink>
          </div>

          <div className="hidden md:block text-xs font-semibold text-ink-400">
            أهلاً بك في منصة قدرة
          </div>

          <div className="flex items-center gap-2.5 mr-auto">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-ink-200">
              <Calendar size={14} className="text-gold-400" />
              <span>{getTodayFormatted()}</span>
            </div>

            {/* الستريك الديناميكي */}
            <div 
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold text-amber-400 shadow-sm"
              title="سلسلة أيام التتابع"
            >
              <Flame size={16} className="animate-pulse text-amber-400 fill-amber-400/20" />
              <span>{streakCount} يوم</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="تبديل الوضع"
              className="press flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gold-300 transition-all hover:bg-white/10 md:hidden"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 transition-colors duration-300 md:px-8 md:pb-12">
          {children}
        </main>
      </div>

      {/* القائمة المنبثقة والشريط السفلي للجوال */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm md:hidden animate-fade-in">
          <div className="flex-1" onClick={() => setIsMoreOpen(false)} />
          <div className="animate-pop-in rounded-t-3xl border-t border-white/10 bg-ink-900 p-6 text-ink-50 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-gold-300">خيارات إضافية</h3>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="rounded-full bg-white/5 p-1 text-ink-300 hover:text-ink-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {MOBILE_MORE_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl p-3.5 text-sm font-bold transition-all",
                      isActive
                        ? "bg-gold-500/20 text-gold-300 border border-gold-500/30"
                        : "bg-white/5 text-ink-200 hover:bg-white/10"
                    )
                  }
                >
                  <Icon size={20} className="text-gold-400" />
                  {label}
                </NavLink>
              ))}

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-2xl bg-red-500/10 p-3.5 text-sm font-bold text-red-300 border border-red-500/20 transition-all hover:bg-red-500/20"
                >
                  <LogOut size={20} />
                  تسجيل الخروج
                </button>
              ) : (
                <NavLink
                  to="/auth"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-gold-500/10 p-3.5 text-sm font-bold text-gold-300 border border-gold-500/20"
                >
                  <LogIn size={20} />
                  تسجيل الدخول
                </NavLink>
              )}

              {/* 🧾 روابط السياسات للجوال */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[11px] font-semibold text-ink-400">
                <a href="#/privacy" onClick={() => setIsMoreOpen(false)} className="transition hover:text-gold-300">الخصوصية</a>
                <span className="opacity-40">•</span>
                <a href="#/terms" onClick={() => setIsMoreOpen(false)} className="transition hover:text-gold-300">الشروط</a>
                <span className="opacity-40">•</span>
                <a href="#/refund" onClick={() => setIsMoreOpen(false)} className="transition hover:text-gold-300">الاسترجاع</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink-950/90 backdrop-blur-xl transition-colors duration-300 md:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-between px-1 py-1.5">
          {MOBILE_MAIN_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "press flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors",
                  isActive ? "text-gold-300" : "text-ink-400"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              "press flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors",
              isMoreOpen ? "text-gold-300" : "text-ink-400"
            )}
          >
            <MoreHorizontal size={18} />
            المزيد
          </button>
        </div>
      </nav>

      {/* 🎓 المعلم الذكي — شات عائم */}
      <AiChatWidget />
    </div>
  );
}