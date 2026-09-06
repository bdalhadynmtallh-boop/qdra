import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  UserPlus,
  LogIn,
  GraduationCap,
  Target,
  Trophy,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Zap,
  CheckCircle2,
  BarChart3,
  Brain,
  Moon,
  Sun,
  ShoppingCart,
  KeyRound,
  BookOpen,
  Sparkles,
  Smartphone,
  XCircle,
  ListChecks,
  Award,
  SearchCheck,
  Menu,
  X,
  Clock3,
  BadgePercent,
  Star,
  ShieldCheck,
  Bot,
  Send,
  MessageCircle,
  Route,
  SlidersHorizontal,
  Home,
  Images,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

interface LandingPageProps {
  onStartNow: () => void;
}

/* =========================================================
   إعدادات سريعة — عدّل من هنا فقط
========================================================= */

// رابط متجر قُدْرَة في زاهر
const STORE_URL = "https://qdra.zaher.io/";

// لقطة حقيقية للمعلم الذكي (اختياري)
// مثال: "/ai-teacher.png"
// اتركها فارغة لعرض محاكاة المحادثة المرسومة بالكود
const AI_TEACHER_IMAGE = "";

// روابط الهيدر
const NAV_LINKS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "features", label: "المميزات", icon: Sparkles },
  { id: "ai-teacher", label: "المعلم الذكي", icon: Bot },
  { id: "platform", label: "جولة المنصة", icon: Images },
  { id: "pricing", label: "الدورات", icon: BadgePercent },
  { id: "how-to-start", label: "خطوات التسجيل", icon: UserPlus },
  { id: "faq", label: "الأسئلة الشائعة", icon: CircleHelp },
];

// باقات الاشتراك
const PLANS = [
  {
    id: "30",
    days: 30,
    name: "اشتراك قدرة 30 يوم",
    tag: "مناسب للمراجعة السريعة",
    price: 49,
    oldPrice: 89,
    popular: false,
  },
  {
    id: "90",
    days: 90,
    name: "اشتراك قدرة 90 يوم",
    tag: "الأنسب لتأسيس كامل وتدريب مركّز",
    price: 99,
    oldPrice: 209,
    popular: true,
  },
  {
    id: "180",
    days: 180,
    name: "اشتراك قدرة 180 يوم",
    tag: "أفضل قيمة — تجهيز طويل المدى",
    price: 159,
    oldPrice: 299,
    popular: false,
  },
];

// كل الباقات تشمل نفس المزايا
const PLAN_FEATURES = [
  "المعلم الذكي — شرح فوري لأي سؤال",
  "التأسيس كاملًا (28 درسًا)",
  "300 قسم تدريبي",
  "المحاكي بدون حدود",
  "مراجعة الأخطاء والمفضلة",
  "الإحصائيات ومتابعة التقدم",
];

/* =========================================================
   الثيم
========================================================= */

function buildTheme(isDark: boolean) {
  return {
    page: isDark
      ? "bg-[#050505] text-white"
      : "bg-[#fafafa] text-[#171717]",

    header: isDark
      ? "border-white/[0.08] bg-[#050505]/85"
      : "border-black/[0.08] bg-white/90",

    drawer: isDark
      ? "border-white/[0.08] bg-[#0a0a0a]"
      : "border-black/[0.08] bg-white",

    navLink: isDark
      ? "text-white/65 hover:bg-white/[0.06] hover:text-white"
      : "text-black/60 hover:bg-black/[0.05] hover:text-black",

    muted: isDark ? "text-white/60" : "text-black/60",

    softMuted: isDark ? "text-white/40" : "text-black/40",

    card: isDark
      ? "border-white/[0.08] bg-white/[0.035]"
      : "border-black/[0.08] bg-white",

    cardHover: isDark
      ? "hover:border-[#d6a62a]/40 hover:bg-white/[0.055]"
      : "hover:border-[#c99b20]/40 hover:bg-black/[0.025]",

    section: isDark
      ? "border-white/[0.08] bg-[#080808]"
      : "border-black/[0.08] bg-white",

    sectionSoft: isDark ? "bg-[#0d0d0d]" : "bg-[#f6f6f6]",

    border: isDark ? "border-white/[0.08]" : "border-black/[0.08]",

    goldText: isDark ? "text-[#f2b52b]" : "text-[#b98610]",

    goldBorder: isDark
      ? "border-[#d99f1f]/35"
      : "border-[#c99b20]/40",

    goldBg: isDark ? "bg-[#d99f1f]/10" : "bg-[#c99b20]/10",
  };
}

type Theme = ReturnType<typeof buildTheme>;

/* =========================================================
   أنيميشن مشترك
========================================================= */

function GlobalStyles() {
  return (
    <style>{`
      @keyframes qd-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes qd-float {
        0%, 100% {
          transform: translate3d(0, 0, 0);
        }
        50% {
          transform: translate3d(0, -10px, 0);
        }
      }

      @keyframes qd-float-soft {
        0%, 100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(0, -6px, 0) scale(1.015);
        }
      }

      @keyframes qd-twinkle {
        0%, 100% {
          opacity: .15;
          transform: scale(.75);
        }
        50% {
          opacity: .95;
          transform: scale(1.5);
        }
      }

      @keyframes qd-bounce {
        0%, 80%, 100% {
          transform: translateY(0);
          opacity: .35;
        }
        40% {
          transform: translateY(-4px);
          opacity: 1;
        }
      }

      @keyframes qd-slide-down {
        from {
          opacity: 0;
          transform: translateY(-12px) scale(.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes qd-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes qd-pulse-gold {
        0%, 100% {
          box-shadow:
            0 0 0 0 rgba(212,161,38,.00),
            0 0 35px rgba(212,161,38,.08);
        }
        50% {
          box-shadow:
            0 0 0 10px rgba(212,161,38,.03),
            0 0 55px rgba(212,161,38,.18);
        }
      }

      .qd-spin {
        animation: qd-spin 20s linear infinite;
        will-change: transform;
      }

      .qd-spin-reverse {
        animation: qd-spin 20s linear infinite reverse;
        will-change: transform;
      }

      .qd-float {
        animation: qd-float 6s ease-in-out infinite;
        will-change: transform;
      }

      .qd-float-soft {
        animation: qd-float-soft 5s ease-in-out infinite;
        will-change: transform;
      }

      .qd-twinkle {
        animation: qd-twinkle 3s ease-in-out infinite;
      }

      .qd-bounce {
        animation: qd-bounce 1.2s ease-in-out infinite;
      }

      .qd-slide-down {
        animation: qd-slide-down .22s ease-out both;
      }

      .qd-fade {
        animation: qd-fade .2s ease-out both;
      }

      .qd-pulse-gold {
        animation: qd-pulse-gold 3.5s ease-in-out infinite;
      }

      .qd-glass {
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .qd-grid {
        background-image:
          linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
        background-size: 42px 42px;
      }

      @media (prefers-reduced-motion: reduce) {
        .qd-spin,
        .qd-spin-reverse,
        .qd-float,
        .qd-float-soft,
        .qd-twinkle,
        .qd-bounce,
        .qd-slide-down,
        .qd-fade,
        .qd-pulse-gold {
          animation: none !important;
        }
      }
    `}</style>
  );
}

/* =========================================================
   رمز الريال السعودي
========================================================= */

function RiyalSymbol({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1124.14 1256.39"
      role="img"
      aria-label="ريال سعودي"
      className={`inline-block w-auto fill-current ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
    </svg>
  );
}

/* =========================================================
   الرسم المداري في الهيرو
========================================================= */

interface OrbitCard {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconClass: string;
  iconBg: string;
  pos: string;
  delay: string;
  reverse?: boolean;
}

function Orbit({
  inset,
  duration,
  delay,
  reverse = false,
  upright = true,
  children,
}: {
  inset: number;
  duration: string;
  delay: string;
  reverse?: boolean;
  upright?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute ${reverse ? "qd-spin-reverse" : "qd-spin"}`}
      style={{
        inset: `${inset}%`,
        animationDuration: duration,
        animationDelay: delay,
      }}
    >
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
        <div
          className={
            upright ? (reverse ? "qd-spin" : "qd-spin-reverse") : ""
          }
          style={{
            animationDuration: duration,
            animationDelay: delay,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function OrbitHero({
  isDark,
  theme,
}: {
  isDark: boolean;
  theme: Theme;
}) {
  const cards: OrbitCard[] = [
    {
      icon: Bot,
      title: "المعلم الذكي",
      subtitle: "يشرح لك خطوة بخطوة",
      iconClass: theme.goldText,
      iconBg: theme.goldBg,
      pos: "right-[3%] top-[6%]",
      delay: "0s",
    },
    {
      icon: Zap,
      title: "تدريب مكثف",
      subtitle: "300 قسم تدريبي",
      iconClass: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      pos: "left-[3%] top-[6%]",
      delay: "-1.5s",
      reverse: true,
    },
    {
      icon: Target,
      title: "محاكي واقعي",
      subtitle: "بنفس ضغط الوقت",
      iconClass: "text-blue-500",
      iconBg: "bg-blue-500/10",
      pos: "left-[3%] bottom-[6%]",
      delay: "-3s",
      reverse: true,
    },
    {
      icon: Brain,
      title: "الفهم العميق",
      subtitle: "أساس النجاح",
      iconClass: "text-purple-500",
      iconBg: "bg-purple-500/10",
      pos: "right-[3%] bottom-[6%]",
      delay: "-4.5s",
    },
  ];

  const glyphs = [
    {
      char: "٣",
      pos: "right-[24%] top-[30%]",
      size: "text-5xl sm:text-6xl",
      rotate: "-rotate-6",
    },
    {
      char: "٢",
      pos: "right-[31%] top-[35%]",
      size: "text-4xl sm:text-5xl",
      rotate: "rotate-3",
    },
    {
      char: "٧",
      pos: "right-[7%] top-[46%]",
      size: "text-6xl sm:text-7xl",
      rotate: "rotate-6",
    },
    {
      char: "٥",
      pos: "left-[32%] bottom-[8%]",
      size: "text-5xl sm:text-6xl",
      rotate: "-rotate-3",
    },
    {
      char: "١",
      pos: "left-[20%] top-[26%]",
      size: "text-5xl sm:text-6xl",
      rotate: "rotate-6",
    },
    {
      char: "٤",
      pos: "left-[6%] top-[44%]",
      size: "text-4xl sm:text-5xl",
      rotate: "-rotate-6",
    },
    {
      char: "٨",
      pos: "right-[38%] bottom-[6%]",
      size: "text-4xl sm:text-5xl",
      rotate: "rotate-3",
    },
  ];

  const sparks = [
    {
      pos: "left-[12%] top-[24%]",
      delay: "0s",
      gold: false,
    },
    {
      pos: "right-[15%] top-[19%]",
      delay: "1s",
      gold: true,
    },
    {
      pos: "left-[42%] top-[12%]",
      delay: "2s",
      gold: false,
    },
    {
      pos: "right-[31%] bottom-[18%]",
      delay: ".5s",
      gold: false,
    },
    {
      pos: "left-[26%] bottom-[30%]",
      delay: "1.5s",
      gold: true,
    },
    {
      pos: "right-[9%] top-[62%]",
      delay: "2.5s",
      gold: false,
    },
    {
      pos: "left-[58%] top-[8%]",
      delay: "1.2s",
      gold: false,
    },
  ];

  const chipBase = `qd-glass flex items-center justify-center rounded-xl border ${
    isDark
      ? "border-white/10 bg-[#0c0c0c]/85 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      : "border-black/10 bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
  }`;

  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-[560px] select-none overflow-hidden rounded-[2.75rem] border sm:aspect-[4/3] ${
        isDark
          ? "border-white/[0.08] bg-gradient-to-br from-[#090909] via-[#10100e] to-[#171511] shadow-[0_35px_100px_rgba(0,0,0,0.55)]"
          : "border-black/[0.07] bg-gradient-to-br from-white via-[#fbfaf6] to-[#f2eee3] shadow-[0_35px_100px_rgba(0,0,0,0.10)]"
      }`}
      aria-hidden="true"
    >
      {/* شبكة خلفية */}
      {isDark && (
        <div className="pointer-events-none absolute inset-0 opacity-50 qd-grid" />
      )}

      {/* التوهج المركزي */}
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] ${
          isDark
            ? "bg-[#d99f1f]/[0.10]"
            : "bg-[#d99f1f]/[0.13]"
        }`}
      />

      {/* توهج إضافي */}
      <div
        className={`pointer-events-none absolute -right-[15%] -top-[15%] h-[45%] w-[45%] rounded-full blur-[90px] ${
          isDark
            ? "bg-blue-500/[0.035]"
            : "bg-blue-500/[0.02]"
        }`}
      />

      {/* أرقام باهتة */}
      {glyphs.map((g) => (
        <span
          key={g.char + g.pos}
          className={`pointer-events-none absolute font-black leading-none ${g.pos} ${g.size} ${g.rotate} ${
            isDark
              ? "text-white/[0.05]"
              : "text-black/[0.045]"
          }`}
        >
          {g.char}
        </span>
      ))}

      {/* نقاط متلألئة */}
      {sparks.map((s) => (
        <span
          key={s.pos}
          className={`qd-twinkle absolute h-1.5 w-1.5 rounded-full ${s.pos} ${
            s.gold
              ? "bg-[#d4a126]"
              : isDark
                ? "bg-white/60"
                : "bg-black/25"
          }`}
          style={{ animationDelay: s.delay }}
        />
      ))}

      {/* المسرح الأوسط */}
      <div className="absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 sm:w-[69%]">
        {/* الحلقات */}
        {[6, 18, 30].map((inset) => (
          <div
            key={inset}
            className={`absolute rounded-full border ${
              isDark
                ? "border-white/[0.07]"
                : "border-black/[0.07]"
            }`}
            style={{ inset: `${inset}%` }}
          />
        ))}

        <div className="absolute inset-[12%] rounded-full border border-dashed border-[#d4a126]/25" />
        <div className="absolute inset-[24%] rounded-full border border-dashed border-[#d4a126]/15" />

        {/* نقاط ذهبية تدور */}
        <Orbit
          inset={6}
          duration="26s"
          delay="-3s"
          upright={false}
        >
          <span className="block h-2.5 w-2.5 rounded-full bg-[#d4a126] shadow-[0_0_14px_rgba(212,161,38,0.9)]" />
        </Orbit>

        <Orbit
          inset={18}
          duration="20s"
          delay="-14s"
          upright={false}
          reverse
        >
          <span className="block h-2 w-2 rounded-full bg-[#d4a126] shadow-[0_0_12px_rgba(212,161,38,0.9)]" />
        </Orbit>

        <Orbit
          inset={30}
          duration="14s"
          delay="-5s"
          upright={false}
        >
          <span className="block h-2 w-2 rounded-full bg-[#d4a126]/80 shadow-[0_0_10px_rgba(212,161,38,0.8)]" />
        </Orbit>

        <Orbit
          inset={12}
          duration="32s"
          delay="-20s"
          upright={false}
        >
          <span
            className={`block h-1.5 w-1.5 rounded-full ${
              isDark
                ? "bg-white/50"
                : "bg-black/30"
            }`}
          />
        </Orbit>

        {/* =====================================================
            الأيقونات الأربعة — مطابقة للكروت الخارجية
        ====================================================== */}

        {/* 1 — المعلم الذكي */}
        <Orbit
          inset={6}
          duration="26s"
          delay="-16s"
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-[#d4a126] sm:h-12 sm:w-12 ${chipBase}`}
          >
            <Bot size={20} />
          </div>
        </Orbit>

        {/* 2 — التدريب المكثف */}
        <Orbit
          inset={18}
          duration="20s"
          delay="-4s"
          reverse
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-emerald-500 sm:h-11 sm:w-11 ${chipBase}`}
          >
            <Zap size={19} />
          </div>
        </Orbit>

        {/* 3 — المحاكي الواقعي */}
        <Orbit
          inset={30}
          duration="14s"
          delay="-11s"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-blue-500 sm:h-10 sm:w-10 ${chipBase}`}
          >
            <Target size={18} />
          </div>
        </Orbit>

        {/* 4 — الفهم العميق */}
        <Orbit
          inset={12}
          duration="32s"
          delay="-20s"
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-purple-500 sm:h-11 sm:w-11 ${chipBase}`}
          >
            <Brain size={19} />
          </div>
        </Orbit>

        {/* =====================================================
            الدائرة المركزية
        ====================================================== */}

        <div
          className={`qd-pulse-gold absolute inset-[32%] rounded-full border ${
            isDark
              ? "border-white/10 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.10),transparent_38%),linear-gradient(145deg,#1b1a17,#090909)] shadow-[inset_0_0_45px_rgba(0,0,0,0.7),0_0_90px_rgba(212,161,38,0.10)]"
              : "border-black/10 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.95),transparent_40%),linear-gradient(145deg,#ffffff,#efede6)] shadow-[0_28px_70px_rgba(0,0,0,0.12),0_0_90px_rgba(212,161,38,0.12)]"
          }`}
        >
          {/* القوس الذهبي */}
          <svg
            viewBox="0 0 100 100"
            className="qd-spin absolute inset-0 h-full w-full"
            style={{ animationDuration: "9s" }}
          >
            <circle
              cx="50"
              cy="50"
              r="48.5"
              fill="none"
              stroke="#d4a126"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="70 235"
              opacity="0.9"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-black leading-none tracking-tight sm:text-4xl lg:text-5xl">
              ١٠٠٪
            </div>

            <div
              className={`mt-2 text-[10px] font-bold sm:text-xs ${theme.softMuted}`}
            >
              للقسم اللفظي
            </div>
          </div>
        </div>
      </div>

      {/* الكروت العائمة */}
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`qd-float-soft absolute flex items-center gap-3 rounded-2xl border px-3 py-2.5 backdrop-blur-xl sm:px-3.5 ${card.pos} ${
              card.reverse
                ? "flex-row-reverse"
                : ""
            } ${
              isDark
                ? "border-white/10 bg-[#0c0c0c]/80 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                : "border-black/10 bg-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.10)]"
            }`}
            style={{
              animationDelay: card.delay,
            }}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconClass}`}
            >
              <Icon size={18} />
            </div>

            <div className="text-right">
              <div className="text-[13px] font-black leading-tight">
                {card.title}
              </div>

              <div
                className={`mt-0.5 text-[11px] leading-tight ${theme.softMuted}`}
              >
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   محاكاة محادثة المعلم الذكي
========================================================= */

function AiTeacherMock({
  isDark,
  theme,
}: {
  isDark: boolean;
  theme: Theme;
}) {
  const steps = [
    "حدد العلاقة في الجذر: (مقص : قص) ← أداة ووظيفتها.",
    "طبّق نفس العلاقة على كل خيار من الخيارات.",
    "(سكين : قطع) = أداة ووظيفتها ✓ وباقي الخيارات ما تحقق نفس العلاقة.",
  ];

  const botBubble = isDark
    ? "border-white/10 bg-white/[0.05]"
    : "border-black/[0.08] bg-[#f6f6f6]";

  const floating = `absolute z-10 hidden items-center gap-2 rounded-2xl border px-3 py-2 text-[11px] font-black backdrop-blur-md sm:flex ${
    isDark
      ? "border-white/10 bg-[#0c0c0c]/85 shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
      : "border-black/10 bg-white/95 shadow-[0_14px_40px_rgba(0,0,0,0.12)]"
  }`;

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] ${
          isDark
            ? "bg-[#d99f1f]/[0.12]"
            : "bg-[#d99f1f]/[0.18]"
        }`}
      />

      <div
        className={`${floating} qd-float-soft -right-3 top-[7.5rem] lg:-right-8`}
        style={{ animationDelay: "-1s" }}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${theme.goldBg} ${theme.goldText}`}
        >
          <Route size={14} />
        </span>

        <span>يشرح خطوة بخطوة</span>
      </div>

      <div
        className={`${floating} qd-float-soft -left-3 bottom-[6.5rem] lg:-left-8`}
        style={{ animationDelay: "-3.5s" }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
          <SlidersHorizontal size={14} />
        </span>

        <span>يكيّف الشرح حسب مستواك</span>
      </div>

      <div
        className={`relative overflow-hidden rounded-[2rem] border ${theme.card} ${
          isDark
            ? "shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            : "shadow-[0_30px_80px_rgba(0,0,0,0.12)]"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-5 py-4 ${theme.border}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d4a126] text-white shadow-lg shadow-[#d4a126]/30">
              <Bot size={22} />

              <span
                className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 bg-emerald-500 ${
                  isDark
                    ? "border-[#0b0b0b]"
                    : "border-white"
                }`}
              />
            </div>

            <div>
              <div className="text-sm font-black">
                المعلم الذكي
              </div>

              <div className="text-[11px] font-bold text-emerald-500">
                متصل الآن
              </div>
            </div>
          </div>

          <div
            className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
          >
            تناظر لفظي
          </div>
        </div>

        <div className="space-y-4 px-4 py-5 sm:px-5">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#d4a126] px-4 py-3 text-[13px] font-bold leading-6 text-white shadow-lg shadow-[#d4a126]/20">
              ليش الجواب (سكين : قطع)؟ ما فهمت العلاقة 🤔
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${theme.goldBg} ${theme.goldText}`}
            >
              <Bot size={14} />
            </div>

            <div
              className={`max-w-[88%] rounded-2xl rounded-br-md border px-4 py-3 text-[13px] leading-6 ${botBubble}`}
            >
              <p className="font-black">
                تمام، خلنا نحلها خطوة بخطوة:
              </p>

              <ol className="mt-2.5 space-y-2">
                {steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-2"
                  >
                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${theme.goldBg} ${theme.goldText}`}
                    >
                      {i + 1}
                    </span>

                    <span className={theme.muted}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-3 font-bold">
                تبي أعطيك سؤالًا مشابهًا تتدرب عليه؟
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
                >
                  نعم، هات سؤال
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold ${theme.border} ${theme.muted}`}
                >
                  اشرح لي أبسط
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${theme.goldBg} ${theme.goldText}`}
            >
              <Bot size={14} />
            </div>

            <div
              className={`flex items-center gap-1.5 rounded-2xl rounded-br-md border px-4 py-3 ${botBubble}`}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="qd-bounce block h-1.5 w-1.5 rounded-full bg-[#d4a126]"
                  style={{
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className={`border-t px-4 py-3 ${theme.border}`}
        >
          <div
            className={`flex items-center gap-2 rounded-2xl border py-2 pl-2 pr-4 ${theme.border} ${
              isDark
                ? "bg-white/[0.03]"
                : "bg-[#fafafa]"
            }`}
          >
            <span
              className={`flex-1 text-xs ${theme.softMuted}`}
            >
              اكتب سؤالك هنا...
            </span>

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a126] text-white shadow-md shadow-[#d4a126]/30">
              <Send
                size={15}
                className="-scale-x-100"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   الصفحة
========================================================= */

export default function LandingPage({
  onStartNow,
}: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<string>("home");

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved =
        localStorage.getItem("landing-theme");

      if (saved === "dark") return true;
      if (saved === "light") return false;

      return document.documentElement.classList.contains(
        "dark"
      );
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem(
        "landing-theme",
        "dark"
      );
    } else {
      root.classList.remove("dark");
      localStorage.setItem(
        "landing-theme",
        "light"
      );
    }
  }, [isDark]);

  /* =========================================================
     تحديد القسم النشط
  ========================================================= */

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.id);

    const onScroll = () => {
      let current = ids[0];

      for (const id of ids) {
        const el =
          document.getElementById(id);

        if (!el) continue;

        if (
          el.getBoundingClientRect().top -
            140 <=
          0
        ) {
          current = id;
        }
      }

      const atBottom =
        window.innerHeight +
          window.scrollY >=
        document.documentElement
          .scrollHeight -
          4;

      if (atBottom) {
        current = ids[ids.length - 1];
      }

      setActiveSection(current);
    };

    onScroll();

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );

    return () =>
      window.removeEventListener(
        "scroll",
        onScroll
      );
  }, []);

  /* =========================================================
     قائمة الجوال
  ========================================================= */

  useEffect(() => {
    if (!menuOpen) return;

    const prevOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const onKey = (
      e: KeyboardEvent
    ) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      onKey
    );

    window.addEventListener(
      "resize",
      onResize
    );

    return () => {
      document.body.style.overflow =
        prevOverflow;

      window.removeEventListener(
        "keydown",
        onKey
      );

      window.removeEventListener(
        "resize",
        onResize
      );
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((current) =>
      current === index
        ? null
        : index
    );
  };

  const scrollToSection = (
    id: string
  ) => {
    setMenuOpen(false);

    window.requestAnimationFrame(
      () => {
        if (id === "home") {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          return;
        }

        document
          .getElementById(id)
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }
    );
  };

  const theme = buildTheme(isDark);

  /* =========================================================
     مميزات المعلم الذكي
  ========================================================= */

  const aiFeatures = [
    {
      icon: MessageCircle,
      title: "يفهم سؤالك",
      desc: "اسأله بلغتك الطبيعية عن أي سؤال أو كلمة أو فقرة، وهو يفهم وش تقصد بالضبط ويرد عليك مباشرة.",
      iconClass: "text-blue-500",
      iconBg: "bg-blue-500/10",
    },
    {
      icon: Route,
      title: "يشرح لك خطوة بخطوة",
      desc: "ما يعطيك الجواب وبس، يقسّم لك طريقة التفكير إلى خطوات واضحة حتى تقدر تطبقها على أي سؤال مشابه.",
      iconClass: theme.goldText,
      iconBg: theme.goldBg,
    },
    {
      icon: SlidersHorizontal,
      title: "يكيّف الشرح حسب مستواك",
      desc: "مبتدئ؟ يبسّط لك الشرح ويعطيك أمثلة. متقدم؟ يدخل معك في التفاصيل ويركّز على الفروقات الدقيقة.",
      iconClass: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      icon: Clock3,
      title: "معك في أي وقت",
      desc: "اسأل متى ما احتجت، في الليل أو النهار، وتلقى الرد فورًا بدون انتظار.",
      iconClass: "text-purple-500",
      iconBg: "bg-purple-500/10",
    },
  ];

  /* =========================================================
     المميزات الرئيسية
  ========================================================= */

  const features = [
    {
      icon: GraduationCap,
      title: "التأسيس",
      description:
        "تعلم أهم مهارات القسم اللفظي بطريقة مرتبة، مع التركيز على الأشياء المهمة التي تحتاجها فعلاً في الاختبار.",
      iconClass: theme.goldText,
      iconBg: theme.goldBg,
    },
    {
      icon: Zap,
      title: "التدريب",
      description:
        "انتقل من الشرح إلى التطبيق مباشرة، وتدرب على أنواع الأسئلة المختلفة حتى تثبت المهارة.",
      iconClass: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      icon: Target,
      title: "المحاكي",
      description:
        "اختبر نفسك في تجربة أقرب للاختبار الفعلي مع الوقت ومراجعة إجاباتك بعد الانتهاء.",
      iconClass: "text-blue-500",
      iconBg: "bg-blue-500/10",
    },
    {
      icon: Brain,
      title: "مراجعة الأخطاء",
      description:
        "احتفظ بالأسئلة التي أخطأت فيها وارجع لها لاحقًا حتى تقلل تكرار الأخطاء.",
      iconClass: "text-red-500",
      iconBg: "bg-red-500/10",
    },
    {
      icon: Trophy,
      title: "المفضلة",
      description:
        "احفظ الأسئلة المهمة التي تريد الرجوع إليها في أي وقت أثناء المذاكرة.",
      iconClass: "text-purple-500",
      iconBg: "bg-purple-500/10",
    },
    {
      icon: BarChart3,
      title: "الإحصائيات",
      description:
        "تابع إنجازك وتقدمك وتعرف على نقاط القوة والجوانب التي تحتاج إلى مزيد من التدريب.",
      iconClass: "text-cyan-500",
      iconBg: "bg-cyan-500/10",
    },
  ];

  /* =========================================================
     صور المنصة
  ========================================================= */

  const showcase = [
    {
      icon: ListChecks,
      label: "الأقسام",
      title:
        "أقسام منظمة تختار منها بسهولة",
      desc: "كل قسم مرقّم مع نسبة إنجاز فورية، وفرز وبحث سريع.",
      points: [
        "ترتيب واضح لكل الأقسام",
        "نسبة إنجاز فورية لكل قسم",
        "بحث وفرز سريع",
      ],
      image: "/pc-sections.png",
      alt: "واجهة الأقسام في منصة قدرة تعرض قائمة الأقسام مع نسبة الإنجاز",
    },
    {
      icon: GraduationCap,
      label: "الأساسيات",
      title:
        "ابنِ أساسك قبل التدريب",
      desc: "دروس مبسطة تشرح كل مهارة لفظية بأهداف واضحة.",
      points: [
        "دروس مرتبة حسب المهارة",
        "أهداف واضحة لكل درس",
        "أمثلة وتطبيقات داخل الدرس",
      ],
      image: "/ps-gre.png",
      alt: "صفحة الأساسيات في منصة قدرة تعرض شرح دروس المهارات اللفظية",
    },
    {
      icon: Zap,
      label: "التدريب",
      title:
        "حل الأسئلة بواجهة مركّزة",
      desc: "عداد وقت، ترقيم واضح، ومؤشر تقدم أثناء الحل.",
      points: [
        "عداد وقت أثناء الحل",
        "ترقيم واضح للأسئلة",
        "مؤشر تقدم يوضح مكانك",
      ],
      image: "/ps-s1.png",
      alt: "واجهة حل الأسئلة أثناء التدريب في منصة قدرة",
    },
    {
      icon: BarChart3,
      label: "الإحصائيات",
      title:
        "تابع أداءك بالأرقام",
      desc: "نسبة الصحة، وقت الدراسة، ونشاطك خلال آخر 7 أيام.",
      points: [
        "نسبة الصحة العامة",
        "وقت الدراسة الكلي",
        "نشاطك في آخر 7 أيام",
      ],
      image: "/pc-stats.png",
      alt: "صفحة الإحصائيات في منصة قدرة تعرض نسبة الصحة ونشاط آخر 7 أيام",
    },
    {
      icon: SearchCheck,
      label: "التحليل",
      title:
        "افهم سبب كل خطأ",
      desc: "توضيح للإجابة التي اخترتها مقابل الإجابة الصحيحة.",
      points: [
        "إجابتك مقابل الإجابة الصحيحة",
        "تظليل واضح للصحيح والخاطئ",
        "مراجعة فورية بعد الحل",
      ],
      image: "/ps-ok.png",
      alt: "تحليل سؤال أخطأ فيه المستخدم في منصة قدرة يوضح الإجابة الصحيحة",
    },
    {
      icon: Award,
      label: "التقدم والإنجاز",
      title:
        "شوف إنجازك فور ما تخلص",
      desc: "ملخص فوري: الوقت، إجاباتك الصحيحة والخاطئة، ونسبة أدائك.",
      points: [
        "ملخص فوري بعد الانتهاء",
        "الوقت والإجابات الصحيحة والخاطئة",
        "نسبة أدائك في القسم",
      ],
      image: "/ps-sletr.png",
      alt: "شاشة إكمال القسم في منصة قدرة تعرض ملخص الإنجاز بعد الانتهاء",
    },
    {
      icon: XCircle,
      label: "الأخطاء",
      title:
        "ارجع لأخطائك وأعد حلها",
      desc: "كل خطأ يُحفظ تلقائيًا، تقدر تراجعه أو تحذفه.",
      points: [
        "حفظ تلقائي لكل خطأ",
        "إعادة حل السؤال",
        "حذف أو تجاهل الخطأ",
      ],
      image: "/ps-san.png",
      alt: "صفحة أخطائي في منصة قدرة تعرض قائمة الأسئلة التي أخطأ فيها المستخدم",
    },
  ];

  /* =========================================================
     الأسئلة الشائعة
  ========================================================= */

  const faqs = [
    {
      q: "كيف أبدأ المذاكرة؟",
      a: "اضغط على «ابدأ الآن»، ثم أنشئ حسابك أو سجل الدخول إذا كان لديك حساب، وبعدها يمكنك الانتقال إلى التأسيس والتدريب.",
    },
    {
      q: "وش هو المعلم الذكي؟",
      a: "مساعد ذكي داخل المنصة يفهم سؤالك ويشرح لك الحل خطوة بخطوة، ويكيّف طريقة الشرح حسب مستواك، حتى تفهم طريقة التفكير مو بس الجواب النهائي.",
    },
    {
      q: "هل المعلم الذكي متاح في كل الباقات؟",
      a: "نعم. المعلم الذكي متاح في جميع الباقات (30 و90 و180 يومًا) بدون أي فرق.",
    },
    {
      q: "كم سعر الاشتراك؟",
      a: "يوجد ثلاث باقات: 30 يومًا بـ 49 ريالًا، و90 يومًا بـ 99 ريالًا، و180 يومًا بـ 159 ريالًا. جميع الباقات تفتح لك المنصة كاملة، والفرق بينها في المدة فقط.",
    },
    {
      q: "هل أستطيع تغيير الوضع بين النهاري والليلي؟",
      a: "نعم. اضغط على زر الشمس أو القمر الموجود أعلى الصفحة، وسيتم حفظ اختيارك تلقائيًا.",
    },
    {
      q: "كيف أشتري رمز التفعيل؟",
      a: "من خلال متجر قُدْرَة في منصة زاهر. اختر الباقة المناسبة من قسم الأسعار أو اضغط على «شراء رمز التفعيل» وسيتم نقلك إلى المتجر.",
    },
    {
      q: "كم قسم يوجد في المنصة؟",
      a: "يوجد حاليًا 300 قسمًا في المنصة، والعدد قابل للزيادة مستقبلًا مع إضافة أقسام وتدريبات جديدة.",
    },
    {
      q: "كم درسًا يوجد في التأسيس؟",
      a: "يحتوي التأسيس حاليًا على 28 درسًا مرتبة لتغطية أهم مهارات القدرات اللفظية، مع إمكانية إضافة دروس جديدة مستقبلًا.",
    },
    {
      q: "هل أحتاج إلى إنشاء حساب؟",
      a: "نعم، لإنشاء حسابك ومتابعة تقدمك وأخطائك ومفضلاتك واستخدام مزايا المنصة.",
    },
    {
      q: "ماذا أبدأ به داخل المنصة؟",
      a: "إذا كنت جديدًا على القسم اللفظي، ابدأ من التأسيس، ثم انتقل إلى التدريب، وبعدها استخدم المحاكي لقياس مستواك. وإذا وقفت عند أي سؤال، اسأل المعلم الذكي.",
    },
  ];

  return (
    <div
      dir="rtl"
      className={`min-h-screen overflow-x-clip font-sans transition-colors duration-500 ${theme.page}`}
    >
      <GlobalStyles />

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${theme.header}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
          <button
            type="button"
            onClick={() =>
              scrollToSection("home")
            }
            className="group shrink-0"
            aria-label="الرئيسية"
          >
            <img
              src={
                isDark
                  ? "/logo-dark.png"
                  : "/logo-light.png"
              }
              alt="قُدْرَة"
              className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-10 lg:h-11"
            />
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                activeSection === link.id;

              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() =>
                    scrollToSection(link.id)
                  }
                  className={`whitespace-nowrap rounded-xl px-2.5 py-2 text-[12px] font-bold transition-all duration-200 xl:px-3.5 xl:text-[13px] ${
                    isActive
                      ? `${theme.goldBg} ${theme.goldText}`
                      : theme.navLink
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark
                  ? "تفعيل الوضع النهاري"
                  : "تفعيل الوضع الليلي"
              }
              title={
                isDark
                  ? "الوضع النهاري"
                  : "الوضع الليلي"
              }
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${theme.card} ${theme.goldBorder} ${theme.goldText}`}
            >
              {isDark ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            <button
              type="button"
              onClick={onStartNow}
              aria-label="تسجيل الدخول"
              title="تسجيل الدخول"
              className={`flex h-10 w-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-xs font-black transition-all duration-200 hover:-translate-y-0.5 active:scale-95 sm:w-auto sm:px-4 ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
            >
              <LogIn size={17} />

              <span className="hidden sm:inline">
                تسجيل الدخول
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setMenuOpen((v) => !v)
              }
              aria-label={
                menuOpen
                  ? "إغلاق القائمة"
                  : "فتح القائمة"
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 lg:hidden ${theme.card} ${theme.border}`}
            >
              {menuOpen ? (
                <X size={18} />
              ) : (
                <Menu size={18} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          قائمة الجوال
      ========================================================= */}

      {menuOpen && (
        <>
          <div
            className="qd-fade fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() =>
              setMenuOpen(false)
            }
            aria-hidden="true"
          />

          <div
            id="mobile-menu"
            className={`qd-slide-down fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b shadow-2xl lg:hidden ${theme.drawer}`}
          >
            <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    activeSection ===
                    link.id;

                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() =>
                        scrollToSection(
                          link.id
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                        isActive
                          ? `${theme.goldBg} ${theme.goldText}`
                          : theme.navLink
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-[#d4a126] text-white"
                            : `${theme.goldBg} ${theme.goldText}`
                        }`}
                      >
                        <Icon size={17} />
                      </span>

                      <span className="flex-1 text-right">
                        {link.label}
                      </span>

                      <ChevronLeft
                        size={16}
                        className="opacity-40"
                      />
                    </button>
                  );
                })}
              </div>

              <div
                className={`my-3 border-t ${theme.border}`}
              />

              <div className="grid grid-cols-2 gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onStartNow();
                  }}
                  className={`flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-black transition-all active:scale-[0.98] ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
                >
                  <LogIn size={17} />

                  <span>
                    تسجيل الدخول
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onStartNow();
                  }}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#d4a126] text-sm font-black text-white shadow-lg shadow-[#d4a126]/20 transition-all active:scale-[0.98]"
                >
                  <span>ابدأ الآن</span>

                  <ArrowLeft size={17} />
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* =========================================================
          HERO
      ========================================================= */}

      <section
        id="home"
        className="relative overflow-hidden px-4 pb-20 pt-14 scroll-mt-20 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24"
      >
        {isDark && (
          <div className="pointer-events-none absolute inset-0 opacity-40 qd-grid" />
        )}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute right-[12%] top-[-120px] h-[520px] w-[520px] rounded-full blur-[150px] ${
              isDark
                ? "bg-[#d99f1f]/[0.10]"
                : "bg-[#d99f1f]/[0.08]"
            }`}
          />

          <div
            className={`absolute left-[-160px] top-[35%] h-[420px] w-[420px] rounded-full blur-[150px] ${
              isDark
                ? "bg-[#d99f1f]/[0.055]"
                : "bg-[#d99f1f]/[0.06]"
            }`}
          />

          <div
            className={`absolute right-[35%] bottom-[-120px] h-[360px] w-[360px] rounded-full blur-[140px] ${
              isDark
                ? "bg-blue-500/[0.025]"
                : "bg-blue-500/[0.03]"
            }`}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-right">
            <div className="mb-7">
              <img
                src={
                  isDark
                    ? "/logo-dark.png"
                    : "/logo-light.png"
                }
                alt="منصة قُدْرَة"
                className={`h-24 w-auto object-contain transition-transform duration-500 hover:scale-105 sm:h-28 lg:h-32 ${
                  isDark
                    ? "drop-shadow-[0_20px_50px_rgba(217,159,31,0.15)]"
                    : "drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                }`}
              />
            </div>

            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
            >
              <Sparkles size={14} />

              <span>
                منصة قُدْرَة للقسم اللفظي
              </span>
            </div>

            <h1 className="max-w-4xl text-[1.7rem] font-black leading-[1.3] tracking-tight sm:text-5xl sm:leading-[1.2] lg:text-6xl">
              ارفع مستواك في القدرات

              <span
                className={`mt-1 block sm:mt-2 ${theme.goldText}`}
              >
                اللفظي
              </span>
            </h1>

            <p
              className={`mt-7 max-w-2xl text-sm leading-8 sm:text-base lg:text-lg ${theme.muted}`}
            >
              منصة تعليمية وتدريبية تساعدك على فهم مهارات القسم
              اللفظي، والتدرب عليها، ومراجعة أخطائك، وقياس تقدمك
              — ومعك معلم ذكي يشرح لك أي سؤال خطوة بخطوة.
            </p>

            <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={onStartNow}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[#d4a126] to-[#b98512] px-9 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(212,161,38,0.22)] transition-all duration-300 hover:-translate-y-1 hover:from-[#e0ad2d] hover:to-[#c59018] active:scale-[0.98] sm:w-auto"
              >
                <span>ابدأ الآن</span>

                <ArrowLeft
                  size={18}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "pricing"
                  )
                }
                className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-bold transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] ${theme.border} ${theme.card}`}
              >
                <BadgePercent
                  size={18}
                  className={
                    theme.goldText
                  }
                />

                <span>
                  شوف الأسعار
                </span>
              </button>
            </div>

            <div
              className={`mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] lg:justify-start ${theme.softMuted}`}
            >
              <span className="flex items-center gap-1.5">
                <Bot
                  size={13}
                  className={
                    theme.goldText
                  }
                />
                معلم ذكي
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  size={13}
                  className={
                    theme.goldText
                  }
                />
                تأسيس مرتب
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  size={13}
                  className={
                    theme.goldText
                  }
                />
                تدريب متنوع
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  size={13}
                  className={
                    theme.goldText
                  }
                />
                محاكاة واقعية
              </span>
            </div>
          </div>

          <div className="relative w-full">
            <OrbitHero
              isDark={isDark}
              theme={theme}
            />
          </div>
        </div>

        <div className="relative mt-14 flex justify-center">
          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "features"
              )
            }
            className={`flex flex-col items-center gap-2 transition-all hover:translate-y-1 ${theme.softMuted}`}
            aria-label="النزول إلى المميزات"
          >
            <span className="text-[10px] font-bold">
              اكتشف المنصة
            </span>

            <ChevronDown size={17} />
          </button>
        </div>
      </section>

      {/* =========================================================
          STATS
      ========================================================= */}

      <section
        className={`border-y px-4 py-9 transition-colors ${theme.section}`}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-7 text-center md:grid-cols-4">
          <div>
            <div
              className={`text-2xl font-black ${theme.goldText}`}
            >
              100%
            </div>

            <div
              className={`mt-1 text-xs ${theme.softMuted}`}
            >
              للقسم اللفظي
            </div>
          </div>

          <div>
            <div className="text-2xl font-black">
              28
            </div>

            <div
              className={`mt-1 text-xs ${theme.softMuted}`}
            >
              درس تأسيس
            </div>
          </div>

          <div>
            <div
              className={`text-2xl font-black ${theme.goldText}`}
            >
              300
            </div>

            <div
              className={`mt-1 text-xs ${theme.softMuted}`}
            >
              قسم تدريبي
            </div>
          </div>

          <div>
            <div className="text-2xl font-black">
              24/7
            </div>

            <div
              className={`mt-1 text-xs ${theme.softMuted}`}
            >
              معلم ذكي يشرح لك أي سؤال
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          LEARNING PATH
      ========================================================= */}

      <section
        id="features"
        className={`border-b px-4 py-24 scroll-mt-20 ${theme.section}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div
              className={`mx-auto mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
            >
              <Sparkles size={15} />
              طريقة التعلم
            </div>

            <h2 className="text-3xl font-black sm:text-5xl">
              من التأسيس إلى المحاكي
            </h2>

            <p
              className={`mx-auto mt-4 max-w-2xl text-sm leading-7 ${theme.muted}`}
            >
              رحلة واضحة تبدأ بفهم المهارة، ثم تطبيقها، ثم اختبار
              مستواك في تجربة أقرب للاختبار الحقيقي — والمعلم الذكي
              معك في كل خطوة.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: GraduationCap,
                title: "التأسيس",
                text: "تعلم أهم المهارات اللفظية وافهم طريقة التعامل مع أنواع الأسئلة.",
                iconClass:
                  theme.goldText,
                iconBg: theme.goldBg,
              },
              {
                number: "02",
                icon: Zap,
                title: "التدريب",
                text: "طبّق ما تعلمته على مجموعة متنوعة من الأسئلة حتى تثبت المهارة.",
                iconClass:
                  "text-emerald-500",
                iconBg:
                  "bg-emerald-500/10",
              },
              {
                number: "03",
                icon: Target,
                title: "المحاكي",
                text: "اختبر نفسك مع الوقت وراجع نتيجتك وأخطاءك بعد الانتهاء.",
                iconClass:
                  "text-blue-500",
                iconBg:
                  "bg-blue-500/10",
              },
            ].map((item) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={item.number}
                  className={`group relative overflow-hidden rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-1 ${theme.card} ${theme.cardHover}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg} ${item.iconClass}`}
                    >
                      <Icon size={25} />
                    </div>

                    <span
                      className={`text-4xl font-black opacity-10 ${item.iconClass}`}
                    >
                      {item.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-xl font-black">
                    {item.title}
                  </h3>

                  <p
                    className={`mt-3 text-sm leading-7 ${theme.muted}`}
                  >
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================= */}

      <section
        className={`border-b px-4 py-24 ${theme.sectionSoft}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div
              className={`mb-3 text-xs font-black ${theme.goldText}`}
            >
              مميزات قُدْرَة
            </div>

            <h2 className="text-3xl font-black sm:text-5xl">
              كل ما تحتاجه في مكان واحد
            </h2>

            <p
              className={`mx-auto mt-4 max-w-2xl text-sm leading-7 ${theme.muted}`}
            >
              صممنا المنصة لتكون واضحة وسريعة، من أول التأسيس حتى
              التدريب والمحاكاة ومراجعة الأخطاء.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "ai-teacher"
                )
              }
              className={`group relative overflow-hidden rounded-[2rem] border p-7 text-right transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-3 ${theme.goldBorder} ${
                isDark
                  ? "bg-[#d99f1f]/[0.06] shadow-[0_0_80px_rgba(212,161,38,0.10)]"
                  : "bg-[#fffaf0] shadow-[0_20px_60px_rgba(212,161,38,0.16)]"
              }`}
            >
              <div
                className={`pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full blur-[80px] ${
                  isDark
                    ? "bg-[#d99f1f]/15"
                    : "bg-[#d99f1f]/20"
                }`}
              />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#d4a126] text-white shadow-xl shadow-[#d4a126]/30">
                  <Bot size={30} />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black sm:text-2xl">
                      المعلم الذكي
                    </h3>

                    <span className="inline-flex items-center gap-1 rounded-full bg-[#d4a126] px-2.5 py-1 text-[10px] font-black text-white">
                      <Star
                        size={11}
                        fill="currentColor"
                      />

                      الميزة الأهم
                    </span>
                  </div>

                  <p
                    className={`mt-2 text-sm leading-7 ${theme.muted}`}
                  >
                    وقفت عند سؤال؟ اسأله وهو يفهم سؤالك ويشرح لك الحل
                    خطوة بخطوة، ويكيّف طريقة الشرح حسب مستواك — مثل
                    معلم خاص معك على مدار الساعة.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      "يفهم سؤالك",
                      "يشرح خطوة بخطوة",
                      "يكيّف الشرح حسب مستواك",
                      "متاح 24/7",
                    ].map((chip) => (
                      <span
                        key={chip}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
                      >
                        <CheckCircle2 size={12} />
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-2 self-start text-sm font-black lg:self-center ${theme.goldText}`}
                >
                  <span>
                    شوف كيف يشتغل
                  </span>

                  <ArrowLeft
                    size={17}
                    className="transition-transform duration-300 group-hover:-translate-x-1"
                  />
                </span>
              </div>
            </button>

            {features.map(
              (feature) => {
                const Icon =
                  feature.icon;

                return (
                  <div
                    key={
                      feature.title
                    }
                    className={`group rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-1 ${theme.card} ${theme.cardHover}`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconBg} ${feature.iconClass}`}
                    >
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-6 text-lg font-black">
                      {feature.title}
                    </h3>

                    <p
                      className={`mt-3 text-sm leading-7 ${theme.muted}`}
                    >
                      {
                        feature.description
                      }
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          AI TEACHER
      ========================================================= */}

      <section
        id="ai-teacher"
        className={`relative overflow-hidden border-b px-4 py-24 scroll-mt-20 ${theme.section}`}
      >
        <div
          className={`pointer-events-none absolute left-[-120px] top-1/2 h-[460px] w-[460px] -translate-y-1/2 rounded-full blur-[150px] ${
            isDark
              ? "bg-[#d99f1f]/[0.08]"
              : "bg-[#d99f1f]/[0.12]"
          }`}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div
              className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
            >
              <Bot size={15} />
              الميزة الأهم في قُدْرَة
            </div>

            <h2 className="text-3xl font-black leading-tight sm:text-5xl">
              معلم ذكي معك

              <span
                className={`block ${theme.goldText}`}
              >
                في كل سؤال
              </span>
            </h2>

            <p
              className={`mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base ${theme.muted}`}
            >
              ما تحتاج تنتظر أحد يشرح لك. المعلم الذكي يفهم سؤالك،
              ويشرح لك الحل خطوة بخطوة، ويكيّف الشرح حسب مستواك —
              حتى تفهم طريقة التفكير مو بس الجواب.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              {aiFeatures.map((f) => {
                const Icon =
                  f.icon;

                return (
                  <div
                    key={f.title}
                    className={`flex items-start gap-4 rounded-[1.5rem] border p-5 transition-all duration-300 hover:-translate-y-0.5 ${theme.card} ${theme.cardHover}`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${f.iconBg} ${f.iconClass}`}
                    >
                      <Icon size={22} />
                    </div>

                    <div>
                      <h3 className="text-base font-black">
                        {f.title}
                      </h3>

                      <p
                        className={`mt-1.5 text-sm leading-7 ${theme.muted}`}
                      >
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onStartNow}
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[#d4a126] to-[#b98512] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#d4a126]/20 transition-all duration-300 hover:-translate-y-1 hover:from-[#e0ad2d] hover:to-[#c59018] active:scale-[0.98]"
                >
                  <Bot size={18} />

                  <span>
                    جرّب المعلم الذكي
                  </span>

                  <ArrowLeft
                    size={17}
                    className="transition-transform duration-300 group-hover:-translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "pricing"
                    )
                  }
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-bold transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] ${theme.border} ${theme.card}`}
                >
                  <CheckCircle2
                    size={17}
                    className={
                      theme.goldText
                    }
                  />

                  <span>
                    متاح في كل الباقات
                  </span>
                </button>
              </div>
            </div>

            <div className="relative">
              {AI_TEACHER_IMAGE ? (
                <img
                  src={
                    AI_TEACHER_IMAGE
                  }
                  alt="المعلم الذكي في منصة قدرة يشرح حل سؤال خطوة بخطوة"
                  className={`w-full rounded-2xl object-cover shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                    isDark
                      ? "shadow-black/40"
                      : "shadow-black/15"
                  }`}
                />
              ) : (
                <AiTeacherMock
                  isDark={isDark}
                  theme={theme}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PLATFORM SHOWCASE
      ========================================================= */}

      <section
        id="platform"
        className={`relative overflow-hidden px-4 py-24 scroll-mt-20 ${theme.section}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div
              className={`mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
            >
              <Sparkles size={15} />
              جولة داخل المنصة
            </div>

            <h2 className="text-3xl font-black sm:text-5xl">
              شكل المنصة من الداخل
            </h2>

            <p
              className={`mx-auto mt-4 max-w-2xl text-sm leading-7 ${theme.muted}`}
            >
              لقطات حقيقية من كل مكان يهمك: من الأساسيات إلى
              المحاكي، ومن الإحصائيات إلى مراجعة أخطائك.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div>
              <img
                src="/pc-mock.png"
                alt="صفحة المحاكي في منصة قدرة"
                className={`w-full rounded-2xl object-cover shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                  isDark
                    ? "shadow-black/40"
                    : "shadow-black/15"
                }`}
              />
            </div>

            <div>
              <div
                className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
              >
                <Target size={13} />
                <span>المحاكي</span>
              </div>

              <h3 className="text-2xl font-black leading-relaxed sm:text-3xl lg:text-4xl">
                تجربة تحاكي الاختبار الفعلي
              </h3>

              <p
                className={`mt-4 max-w-md text-sm leading-8 sm:text-base ${theme.muted}`}
              >
                اختر عدد الأسئلة والمدة الزمنية اللي تناسبك، وابدأ
                اختبارًا تحت ضغط وقت حقيقي، مع مراجعة كاملة لنتائجك
                بعد الانتهاء.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "تخصيص عدد الأسئلة واختيار الاقسام والمدة الزمنية",
                  "مؤشر تقدم أثناء الحل",
                  "مراجعة النتائج بعد الانتهاء",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-2.5"
                  >
                    <CheckCircle2
                      size={18}
                      className={
                        theme.goldText
                      }
                    />

                    <span className="text-sm font-bold">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-20 space-y-20">
            {showcase.map(
              (item, index) => {
                const Icon =
                  item.icon;

                const imageFirst =
                  index % 2 === 1;

                return (
                  <div
                    key={
                      item.label
                    }
                    className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
                  >
                    <div
                      className={
                        imageFirst
                          ? ""
                          : "lg:order-2"
                      }
                    >
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.alt
                        }
                        className={`w-full rounded-2xl object-cover shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                          isDark
                            ? "shadow-black/40"
                            : "shadow-black/15"
                        }`}
                      />
                    </div>

                    <div
                      className={
                        imageFirst
                          ? ""
                          : "lg:order-1"
                      }
                    >
                      <div
                        className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
                      >
                        <Icon size={13} />
                        <span>
                          {item.label}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black leading-relaxed sm:text-3xl">
                        {item.title}
                      </h3>

                      <p
                        className={`mt-4 max-w-md text-sm leading-8 sm:text-base ${theme.muted}`}
                      >
                        {item.desc}
                      </p>

                      <div className="mt-6 space-y-3">
                        {item.points.map(
                          (text) => (
                            <div
                              key={
                                text
                              }
                              className="flex items-center gap-2.5"
                            >
                              <CheckCircle2
                                size={
                                  18
                                }
                                className={
                                  theme.goldText
                                }
                              />

                              <span className="text-sm font-bold">
                                {text}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          MOBILE
      ========================================================= */}

      <section
        className={`border-y px-4 py-24 ${theme.sectionSoft}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div
                className={`mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
              >
                <Smartphone size={16} />
                متوافق مع الجوال
              </div>

              <h2 className="text-3xl font-black leading-tight sm:text-5xl">
                تجربتك معك

                <span
                  className={`block ${theme.goldText}`}
                >
                  أينما كنت
                </span>
              </h2>

              <p
                className={`mt-4 max-w-xl text-sm leading-8 sm:text-base ${theme.muted}`}
              >
                الموقع Responsive بالكامل ويعمل بسلاسة على الجوال
                والتابلت وأي حجم شاشة، بدون ما تحتاج تحميل أي تطبيق.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  "واجهة محسنة للجوال",
                  "حل الأسئلة بسهولة",
                  "متابعة تقدمك من أي جهاز",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2
                      size={17}
                      className={
                        theme.goldText
                      }
                    />

                    <span className="text-sm font-bold">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-center gap-5 sm:gap-8">
              <div
                className={`w-[42%] max-w-[230px] overflow-hidden rounded-[2.5rem] border-2 shadow-2xl transition-transform duration-500 hover:-translate-y-2 ${
                  isDark
                    ? "border-white/20 shadow-black/40"
                    : "border-black/10 shadow-black/20"
                }`}
              >
                <img
                  src="/mobile-basics.jpeg"
                  alt="واجهة الأساسيات على الجوال"
                  className="w-full object-cover"
                />
              </div>

              <div
                className={`mb-10 w-[42%] max-w-[230px] overflow-hidden rounded-[2.5rem] border-2 shadow-2xl transition-transform duration-500 hover:-translate-y-2 ${
                  isDark
                    ? "border-white/20 shadow-black/40"
                    : "border-black/10 shadow-black/20"
                }`}
              >
                <img
                  src="/mobile-quiz.png"
                  alt="حل أسئلة المحاكي على الجوال"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}

      <section
        id="pricing"
        className={`relative overflow-hidden px-4 py-24 scroll-mt-20 ${theme.section}`}
      >
        <div
          className={`pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[140px] ${
            isDark
              ? "bg-[#d99f1f]/[0.07]"
              : "bg-[#d99f1f]/[0.10]"
          }`}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div
              className={`mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
            >
              <BadgePercent size={15} />
              الدورات والاشتراكات
            </div>

            <h2 className="text-3xl font-black sm:text-5xl">
              أسعار الاشتراك
            </h2>

            <p
              className={`mx-auto mt-4 max-w-2xl text-sm leading-7 ${theme.muted}`}
            >
              اختر المدة التي تناسب خطتك. كل الباقات تفتح لك المنصة
              كاملة مع المعلم الذكي بدون أي فرق في المحتوى، الفرق في
              المدة فقط.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5 lg:gap-6">
            {PLANS.map((plan) => {
              const discount =
                Math.round(
                  (1 -
                    plan.price /
                      plan.oldPrice) *
                    100
                );

              const perDay = (
                plan.price / plan.days
              ).toFixed(2);

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular
                      ? `${theme.goldBorder} md:-translate-y-3 md:hover:-translate-y-4 ${
                          isDark
                            ? "bg-[#d99f1f]/[0.06] shadow-[0_0_90px_rgba(212,161,38,0.14)]"
                            : "bg-[#fffaf0] shadow-[0_24px_70px_rgba(212,161,38,0.20)]"
                        }`
                      : `${theme.card} ${theme.cardHover}`
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 right-1/2 flex translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#d4a126] px-4 py-1.5 text-[11px] font-black text-white shadow-lg shadow-[#d4a126]/30">
                      <Star
                        size={12}
                        fill="currentColor"
                      />

                      <span>
                        الأكثر طلبًا
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
                    >
                      <Clock3 size={12} />

                      <span>
                        {plan.days} يومًا
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-500">
                      <BadgePercent size={12} />

                      <span>
                        وفّر {discount}%
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-6 text-lg font-black">
                    {plan.name}
                  </h3>

                  <p
                    className={`mt-1 text-xs ${theme.softMuted}`}
                  >
                    {plan.tag}
                  </p>

                  <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-4xl font-black leading-none tracking-tight">
                        {plan.price.toFixed(
                          2
                        )}
                      </span>

                      <RiyalSymbol
                        className={`h-6 ${theme.goldText}`}
                      />
                    </div>

                    <div
                      className={`mb-0.5 flex items-center gap-1 text-sm font-bold line-through ${theme.softMuted}`}
                    >
                      <span>
                        {plan.oldPrice.toFixed(
                          2
                        )}
                      </span>

                      <RiyalSymbol className="h-3" />
                    </div>
                  </div>

                  <p
                    className={`mt-2 text-[11px] ${theme.softMuted}`}
                  >
                    يعادل تقريبًا{" "}
                    {perDay} ريال في اليوم
                  </p>

                  <div
                    className={`my-6 border-t ${theme.border}`}
                  />

                  <ul className="flex-1 space-y-3">
                    {PLAN_FEATURES.map(
                      (f, i) => (
                        <li
                          key={f}
                          className="flex items-center gap-2.5 text-sm font-bold"
                        >
                          {i === 0 ? (
                            <Bot
                              size={17}
                              className={`shrink-0 ${theme.goldText}`}
                            />
                          ) : (
                            <CheckCircle2
                              size={17}
                              className={`shrink-0 ${theme.goldText}`}
                            />
                          )}

                          <span>
                            {f}
                          </span>
                        </li>
                      )
                    )}
                  </ul>

                  <a
                    href={
                      STORE_URL
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] ${
                      plan.popular
                        ? "bg-gradient-to-br from-[#d4a126] to-[#b98512] text-white shadow-[0_16px_35px_rgba(212,161,38,0.25)] hover:from-[#e0ad2d] hover:to-[#c59018]"
                        : `border ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`
                    }`}
                  >
                    <ShoppingCart
                      size={17}
                    />

                    <span>
                      اشترك الآن
                    </span>
                  </a>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-bold ${theme.muted}`}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck
                size={16}
                className={
                  theme.goldText
                }
              />

              دفع آمن عبر متجر قُدْرَة في زاهر
            </span>

            <span className="flex items-center gap-2">
              <KeyRound
                size={16}
                className={
                  theme.goldText
                }
              />

              تحصل على رمز التفعيل بعد إتمام الشراء
            </span>

            <span className="flex items-center gap-2">
              <Smartphone
                size={16}
                className={
                  theme.goldText
                }
              />

              يعمل على الجوال والكمبيوتر
            </span>
          </div>

          <p
            className={`mt-4 text-center text-[11px] ${theme.softMuted}`}
          >
            الأسعار بالريال السعودي. راجع{" "}
            <a
              href="#/refund"
              className={`underline ${theme.goldText}`}
            >
              سياسة الاسترجاع
            </a>{" "}
            قبل الشراء.
          </p>
        </div>
      </section>

      {/* =========================================================
          HOW TO START
      ========================================================= */}

      <section
        id="how-to-start"
        className={`border-t px-4 py-24 scroll-mt-20 ${theme.section}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div
              className={`mb-3 text-xs font-black ${theme.goldText}`}
            >
              البداية سهلة
            </div>

            <h2 className="text-3xl font-black sm:text-5xl">
              كيف تبدأ؟
            </h2>

            <p
              className={`mt-4 text-sm ${theme.muted}`}
            >
              ثلاث خطوات بسيطة وتبدأ المذاكرة.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: UserPlus,
                title: "أنشئ حسابك",
                text: "اضغط على ابدأ الآن، ثم اختر إنشاء حساب وأدخل بياناتك.",
                iconClass:
                  theme.goldText,
                iconBg: theme.goldBg,
              },
              {
                number: "02",
                icon: KeyRound,
                title: "فعّل حسابك",
                text: "اختر الباقة المناسبة واشترِ رمز التفعيل من متجر قُدْرَة في زاهر، ثم أدخله في المكان المخصص.",
                iconClass:
                  "text-blue-500",
                iconBg:
                  "bg-blue-500/10",
              },
              {
                number: "03",
                icon: BookOpen,
                title: "ابدأ المذاكرة",
                text: "ابدأ بالتأسيس، ثم انتقل إلى التدريب والمحاكي، واسأل المعلم الذكي عن أي سؤال يوقفك.",
                iconClass:
                  "text-emerald-500",
                iconBg:
                  "bg-emerald-500/10",
              },
            ].map((step) => {
              const Icon =
                step.icon;

              return (
                <div
                  key={
                    step.number
                  }
                  className={`relative rounded-[2rem] border p-7 transition-all duration-300 hover:-translate-y-1 ${theme.card} ${theme.cardHover}`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.iconBg} ${step.iconClass}`}
                    >
                      <Icon size={25} />
                    </div>

                    <span
                      className={`text-4xl font-black opacity-10 ${step.iconClass}`}
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-black">
                    {step.title}
                  </h3>

                  <p
                    className={`mt-3 text-sm leading-7 ${theme.muted}`}
                  >
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          LOGIN / REGISTER
      ========================================================= */}

      <section
        className={`border-y px-4 py-24 ${theme.sectionSoft}`}
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div
              className={`mb-3 text-xs font-black ${theme.goldText}`}
            >
              حسابك في قُدْرَة
            </div>

            <h2 className="text-3xl font-black sm:text-5xl">
              الدخول للمنصة بسيط
            </h2>

            <p
              className={`mt-4 text-sm ${theme.muted}`}
            >
              سواء كنت مستخدمًا جديدًا أو لديك حساب مسبقًا.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div
              className={`rounded-[2rem] border p-7 sm:p-8 ${theme.card}`}
            >
              <div className="mb-7 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
                >
                  <UserPlus size={23} />
                </div>

                <div>
                  <h3 className="font-black">
                    مستخدم جديد
                  </h3>

                  <p
                    className={`mt-1 text-xs ${theme.softMuted}`}
                  >
                    لأول مرة تستخدم المنصة؟
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "اضغط على «ابدأ الآن» أو «إنشاء حساب».",
                  "أدخل بيانات إنشاء الحساب المطلوبة.",
                  "أكمل عملية التسجيل.",
                  "بعد الدخول يمكنك البدء في استخدام المنصة.",
                ].map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${theme.goldBg} ${theme.goldText}`}
                      >
                        {index + 1}
                      </div>

                      <p
                        className={`text-sm leading-6 ${theme.muted}`}
                      >
                        {item}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              className={`rounded-[2rem] border p-7 sm:p-8 ${theme.card}`}
            >
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                  <LogIn size={23} />
                </div>

                <div>
                  <h3 className="font-black">
                    لديك حساب؟
                  </h3>

                  <p
                    className={`mt-1 text-xs ${theme.softMuted}`}
                  >
                    يمكنك الدخول مباشرة
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "اضغط على «تسجيل الدخول».",
                  "أدخل بيانات حسابك.",
                  "اضغط على زر تسجيل الدخول.",
                  "سيتم نقلك مباشرة إلى المنصة.",
                ].map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-black text-blue-500">
                        {index + 1}
                      </div>

                      <p
                        className={`text-sm leading-6 ${theme.muted}`}
                      >
                        {item}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ACTIVATION / ZAHER
      ========================================================= */}

      <section
        className={`px-4 py-24 ${theme.section}`}
      >
        <div className="mx-auto max-w-4xl">
          <div
            className={`relative overflow-hidden rounded-[2rem] border p-8 text-center sm:p-12 ${theme.card} ${theme.goldBorder}`}
          >
            <div
              className={`pointer-events-none absolute left-1/2 top-0 h-60 w-60 -translate-x-1/2 rounded-full blur-[100px] ${
                isDark
                  ? "bg-[#d99f1f]/10"
                  : "bg-[#d99f1f]/10"
              }`}
            />

            <div className="relative">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
              >
                <ShoppingCart size={28} />
              </div>

              <h2 className="mt-6 text-3xl font-black sm:text-5xl">
                شراء رمز التفعيل
              </h2>

              <p
                className={`mx-auto mt-4 max-w-2xl text-sm leading-8 ${theme.muted}`}
              >
                يمكنك شراء رمز التفعيل من متجر قُدْرَة عبر منصة
                زاهر. بعد إتمام عملية الشراء تحصل على رمز التفعيل
                الخاص بك، ثم تستخدمه داخل المنصة.
              </p>

              <div
                className={`mx-auto mt-7 max-w-xl rounded-2xl border p-5 text-right ${theme.border}`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className={`mt-0.5 shrink-0 ${theme.goldText}`}
                  />

                  <div>
                    <h3 className="text-sm font-black">
                      طريقة الشراء
                    </h3>

                    <p
                      className={`mt-2 text-xs leading-7 ${theme.muted}`}
                    >
                      1. اضغط على زر «شراء رمز التفعيل».
                      <br />
                      2. سينقلك إلى متجر قُدْرَة في زاهر.
                      <br />
                      3. اختر الباقة (30 أو 90 أو 180
                      يومًا) وأكمل عملية الدفع.
                      <br />
                      4. استخدم رمز التفعيل داخل المنصة.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href={
                  STORE_URL
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[#d4a126] to-[#b98512] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#d4a126]/20 transition-all duration-300 hover:-translate-y-1 hover:from-[#e0ad2d] hover:to-[#c59018] active:scale-[0.98]"
              >
                <ShoppingCart
                  size={19}
                />

                <span>
                  شراء رمز التفعيل من زاهر
                </span>

                <ArrowLeft size={18} />
              </a>

              <p
                className={`mt-3 text-[11px] ${theme.softMuted}`}
              >
                سيتم توجيهك إلى متجر قُدْرَة في زاهر
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}

      <section
        id="faq"
        className={`px-4 py-24 scroll-mt-20 ${theme.sectionSoft}`}
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <div
              className={`mb-3 text-xs font-black ${theme.goldText}`}
            >
              الأسئلة الشائعة
            </div>

            <h2 className="text-3xl font-black sm:text-5xl">
              الأسئلة الشائعة
            </h2>

            <p
              className={`mt-4 text-sm ${theme.muted}`}
            >
              أهم الأسئلة التي قد تحتاج إلى معرفة إجابتها.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map(
              (faq, index) => {
                const isOpen =
                  openFaq ===
                  index;

                return (
                  <div
                    key={faq.q}
                    className={`overflow-hidden rounded-2xl border ${theme.card} ${theme.border}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleFaq(
                          index
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 p-5 text-right"
                    >
                      <span className="text-sm font-black">
                        {faq.q}
                      </span>

                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme.goldBg} ${theme.goldText}`}
                      >
                        {isOpen ? (
                          <ChevronUp
                            size={
                              16
                            }
                          />
                        ) : (
                          <ChevronDown
                            size={
                              16
                            }
                          />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div
                        className={`border-t px-5 pb-5 pt-4 text-sm leading-8 ${theme.border} ${theme.muted}`}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}

      <section className="relative overflow-hidden px-4 py-28">
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] ${
            isDark
              ? "bg-[#d99f1f]/[0.08]"
              : "bg-[#d99f1f]/[0.10]"
          }`}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
          >
            <Trophy size={27} />
          </div>

          <h2 className="mt-7 text-4xl font-black sm:text-6xl">
            مستعد تبدأ؟
          </h2>

          <p
            className={`mx-auto mt-5 max-w-xl text-sm leading-8 sm:text-base ${theme.muted}`}
          >
            ابدأ رحلتك في القدرات اللفظية، وتعلم، وتدرب، وتابع تقدمك
            خطوة بخطوة — ومعك معلم ذكي يشرح لك أي سؤال.
          </p>

          <button
            type="button"
            onClick={onStartNow}
            className="group mt-9 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#d4a126] to-[#b98512] px-9 py-4 text-sm font-black text-white shadow-2xl shadow-[#d4a126]/20 transition-all duration-300 hover:-translate-y-1 hover:from-[#e0ad2d] hover:to-[#c59018] active:scale-[0.98]"
          >
            <UserPlus size={19} />

            <span>
              إنشاء حساب جديد
            </span>

            <ArrowLeft
              size={18}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
          </button>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer
        className={`border-t px-4 py-8 ${theme.border}`}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img
            src={
              isDark
                ? "/logo-dark.png"
                : "/logo-light.png"
            }
            alt="قُدْرَة"
            className="h-11 w-auto object-contain"
          />

          <p
            className={`text-xs ${theme.softMuted}`}
          >
            © 2026 منصة قُدْرَة — للقسم اللفظي
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold">
            <a
              href="#/privacy"
              className={`transition hover:opacity-70 ${theme.softMuted}`}
            >
              سياسة الخصوصية
            </a>

            <span
              className={`${theme.softMuted} opacity-40`}
            >
              •
            </span>

            <a
              href="#/terms"
              className={`transition hover:opacity-70 ${theme.softMuted}`}
            >
              الأحكام والشروط
            </a>

            <span
              className={`${theme.softMuted} opacity-40`}
            >
              •
            </span>

            <a
              href="#/refund"
              className={`transition hover:opacity-70 ${theme.softMuted}`}
            >
              سياسة الاسترجاع
            </a>
          </div>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "home"
              )
            }
            className={`text-xs font-bold ${theme.goldText}`}
          >
            العودة للأعلى ↑
          </button>
        </div>
      </footer>
    </div>
  );
}