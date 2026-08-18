import { useEffect, useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  LogIn,
  GraduationCap,
  Target,
  Trophy,
  ChevronDown,
  ChevronUp,
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
} from "lucide-react";

interface LandingPageProps {
  onStartNow: () => void;
}

export default function LandingPage({
  onStartNow,
}: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("landing-theme");

      if (saved === "dark") return true;
      if (saved === "light") return false;

      return document.documentElement.classList.contains("dark");
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("landing-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("landing-theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((current) =>
      current === index ? null : index
    );
  };

  const theme = {
    page: isDark
      ? "bg-[#050505] text-white"
      : "bg-[#fafafa] text-[#171717]",

    header: isDark
      ? "border-white/[0.08] bg-[#050505]/85"
      : "border-black/[0.08] bg-white/90",

    muted: isDark
      ? "text-white/60"
      : "text-black/60",

    softMuted: isDark
      ? "text-white/40"
      : "text-black/40",

    card: isDark
      ? "border-white/[0.08] bg-white/[0.035]"
      : "border-black/[0.08] bg-white",

    cardHover: isDark
      ? "hover:border-[#d6a62a]/40 hover:bg-white/[0.055]"
      : "hover:border-[#c99b20]/40 hover:bg-black/[0.025]",

    section: isDark
      ? "border-white/[0.08] bg-[#080808]"
      : "border-black/[0.08] bg-white",

    sectionSoft: isDark
      ? "bg-[#0d0d0d]"
      : "bg-[#f6f6f6]",

    border: isDark
      ? "border-white/[0.08]"
      : "border-black/[0.08]",

    goldText: isDark
      ? "text-[#f2b52b]"
      : "text-[#b98610]",

    goldBorder: isDark
      ? "border-[#d99f1f]/35"
      : "border-[#c99b20]/40",

    goldBg: isDark
      ? "bg-[#d99f1f]/10"
      : "bg-[#c99b20]/10",
  };

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

  const showcase = [
    {
      icon: ListChecks,
      label: "الأقسام",
      title: "أقسام منظمة تختار منها بسهولة",
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
      title: "ابنِ أساسك قبل التدريب",
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
      title: "حل الأسئلة بواجهة مركّزة",
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
      title: "تابع أداءك بالأرقام",
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
      title: "افهم سبب كل خطأ",
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
      title: "شوف إنجازك فور ما تخلص",
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
      title: "ارجع لأخطائك وأعد حلها",
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

  const faqs = [
    {
      q: "كيف أبدأ المذاكرة؟",
      a: "اضغط على «ابدأ الآن»، ثم أنشئ حسابك أو سجل الدخول إذا كان لديك حساب، وبعدها يمكنك الانتقال إلى التأسيس والتدريب.",
    },
    {
      q: "هل أستطيع تغيير الوضع بين النهاري والليلي؟",
      a: "نعم. اضغط على زر الشمس أو القمر الموجود أعلى الصفحة، وسيتم حفظ اختيارك تلقائيًا.",
    },
    {
      q: "كيف أشتري رمز التفعيل؟",
      a: "من خلال متجر قُدْرَة في منصة سلة. اضغط على «شراء رمز التفعيل» وسيتم نقلك إلى المتجر.",
    },
    {
      q: "كم قسم يوجد في المنصة؟",
      a: "يوجد حاليًا 200 قسمًا في المنصة، والعدد قابل للزيادة مستقبلًا مع إضافة أقسام وتدريبات جديدة.",
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
      a: "إذا كنت جديدًا على القسم اللفظي، ابدأ من التأسيس، ثم انتقل إلى التدريب، وبعدها استخدم المحاكي لقياس مستواك.",
    },
  ];

  return (
    <div
      dir="rtl"
      className={`min-h-screen overflow-x-clip font-sans transition-colors duration-500 ${theme.page}`}
    >
      {/* =========================================================
          HEADER — ثابت فوق دائماً
      ========================================================= */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${theme.header}`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group"
          >
            <img
              src={isDark ? "/logo-dark.png" : "/logo-light.png"}
              alt="قُدْرَة"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-11"
            />
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
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
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
            >
              <LogIn size={16} />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO — العنوان سطرين بالجوال
      ========================================================= */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:pb-36 lg:pt-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`absolute left-1/2 top-[-120px] h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[140px] ${
              isDark
                ? "bg-[#d99f1f]/[0.08]"
                : "bg-[#d99f1f]/[0.10]"
            }`}
          />

          <div
            className={`absolute right-[-180px] top-[35%] h-[350px] w-[350px] rounded-full blur-[130px] ${
              isDark
                ? "bg-[#d99f1f]/[0.035]"
                : "bg-[#d99f1f]/[0.05]"
            }`}
          />

          <div
            className={`absolute left-[-180px] top-[55%] h-[300px] w-[300px] rounded-full blur-[120px] ${
              isDark
                ? "bg-blue-500/[0.025]"
                : "bg-blue-500/[0.035]"
            }`}
          />
        </div>

        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">

          {/* اللوقو بدون أي إطار */}
          <div className="mb-8">
            <img
              src={
                isDark
                  ? "/logo-dark.png"
                  : "/logo-light.png"
              }
              alt="منصة قُدْرَة"
              className={`h-28 w-auto object-contain transition-transform duration-500 hover:scale-105 sm:h-36 lg:h-44 ${
                isDark
                  ? "drop-shadow-[0_20px_50px_rgba(217,159,31,0.15)]"
                  : "drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
              }`}
            />
          </div>

          {/* الشارة */}
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
          >
            <Sparkles size={14} />
            <span>منصة قُدْرَة للقسم اللفظي</span>
          </div>

          {/* ✨ العنوان: سطرين بالجوال (نص أصغر شوي) */}
          <h1 className="mx-auto max-w-4xl text-[1.7rem] font-black leading-[1.3] tracking-tight sm:text-6xl sm:leading-[1.2] lg:text-7xl">
            ارفع مستواك في القدرات
            <span
              className={`mt-1 block sm:mt-2 ${theme.goldText}`}
            >
              اللفظي
            </span>
          </h1>

          {/* الوصف */}
          <p
            className={`mx-auto mt-7 max-w-2xl text-sm leading-8 sm:text-base lg:text-lg ${theme.muted}`}
          >
            منصة تعليمية وتدريبية تساعدك على فهم مهارات القسم
            اللفظي، والتدرب عليها، ومراجعة أخطائك، وقياس تقدمك
            من خلال تجربة منظمة وسهلة.
          </p>

          {/* الأزرار */}
          <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onStartNow}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#d4a126] px-9 py-4 text-sm font-black text-white shadow-xl shadow-[#d4a126]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#e0ad2d] active:scale-[0.98] sm:w-auto"
            >
              <span>ابدأ الآن</span>

              <ArrowLeft
                size={18}
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />
            </button>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-bold transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] sm:w-auto ${theme.border} ${theme.card}`}
            >
              <BookOpen size={18} />
              <span>تعرف على المنصة</span>
            </button>
          </div>

          {/* نقاط سريعة */}
          <div
            className={`mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] ${theme.softMuted}`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2
                size={13}
                className={theme.goldText}
              />
              تأسيس مرتب
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2
                size={13}
                className={theme.goldText}
              />
              تدريب متنوع
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2
                size={13}
                className={theme.goldText}
              />
              محاكاة واقعية
            </span>
          </div>

          {/* مؤشر النزول */}
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("features")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
            className={`mt-14 flex flex-col items-center gap-2 transition-all hover:translate-y-1 ${theme.softMuted}`}
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
              200
            </div>

            <div
              className={`mt-1 text-xs ${theme.softMuted}`}
            >
              قسم تدريبي
            </div>
          </div>

          <div>
            <div className="text-2xl font-black">
              تحليل
            </div>

            <div
              className={`mt-1 text-xs ${theme.softMuted}`}
            >
              متابعة الأخطاء والتقدم
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          LEARNING PATH
      ========================================================= */}
      <section
        id="features"
        className={`border-b px-4 py-24 ${theme.section}`}
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
              مستواك في تجربة أقرب للاختبار الحقيقي.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: GraduationCap,
                title: "التأسيس",
                text: "تعلم أهم المهارات اللفظية وافهم طريقة التعامل مع أنواع الأسئلة.",
                iconClass: theme.goldText,
                iconBg: theme.goldBg,
              },
              {
                number: "02",
                icon: Zap,
                title: "التدريب",
                text: "طبّق ما تعلمته على مجموعة متنوعة من الأسئلة حتى تثبت المهارة.",
                iconClass: "text-emerald-500",
                iconBg: "bg-emerald-500/10",
              },
              {
                number: "03",
                icon: Target,
                title: "المحاكي",
                text: "اختبر نفسك مع الوقت وراجع نتيجتك وأخطاءك بعد الانتهاء.",
                iconClass: "text-blue-500",
                iconBg: "bg-blue-500/10",
              },
            ].map((item) => {
              const Icon = item.icon;

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
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
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
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          PLATFORM SHOWCASE — تناوب مثالي + 3 نقاط لكل صورة
      ========================================================= */}
      <section
        id="platform"
        className={`relative overflow-hidden px-4 py-24 ${theme.section}`}
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

          {/* الصورة الرئيسية (المحاكي) */}
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
                اختر عدد الأسئلة والمدة الزمنية اللي تناسبك،
                وابدأ اختبارًا تحت ضغط وقت حقيقي، مع مراجعة
                كاملة لنتائجك بعد الانتهاء.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  "تخصيص عدد الأسئلة والمدة الزمنية",
                  "مؤشر تقدم أثناء الحل",
                  "مراجعة النتائج بعد الانتهاء",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-2.5"
                  >
                    <CheckCircle2
                      size={18}
                      className={theme.goldText}
                    />

                    <span className="text-sm font-bold">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* باقي الصور — تناوب: يسار/يمين/يسار... */}
          <div className="mt-20 space-y-20">
            {showcase.map((item, index) => {
              const Icon = item.icon;
              const imageFirst = index % 2 === 1;

              return (
                <div
                  key={item.label}
                  className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
                >
                  <div className={imageFirst ? "" : "lg:order-2"}>
                    <img
                      src={item.image}
                      alt={item.alt}
                      className={`w-full rounded-2xl object-cover shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
                        isDark
                          ? "shadow-black/40"
                          : "shadow-black/15"
                      }`}
                    />
                  </div>

                  <div className={imageFirst ? "" : "lg:order-1"}>
                    <div
                      className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
                    >
                      <Icon size={13} />
                      <span>{item.label}</span>
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
                      {item.points.map((text) => (
                        <div
                          key={text}
                          className="flex items-center gap-2.5"
                        >
                          <CheckCircle2
                            size={18}
                            className={theme.goldText}
                          />

                          <span className="text-sm font-bold">
                            {text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
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
                      className={theme.goldText}
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
          HOW TO START
      ========================================================= */}
      <section
        className={`px-4 py-24 ${theme.section}`}
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
                iconClass: theme.goldText,
                iconBg: theme.goldBg,
              },
              {
                number: "02",
                icon: KeyRound,
                title: "فعّل حسابك",
                text: "إذا كان الاشتراك يتطلب رمز تفعيل، اشترِ الرمز من متجر قُدْرَة في سلة ثم أدخله في المكان المخصص.",
                iconClass: "text-blue-500",
                iconBg: "bg-blue-500/10",
              },
              {
                number: "03",
                icon: BookOpen,
                title: "ابدأ المذاكرة",
                text: "ابدأ بالتأسيس، ثم انتقل إلى التدريب والمحاكي وتابع أخطاءك وإحصائياتك.",
                iconClass: "text-emerald-500",
                iconBg: "bg-emerald-500/10",
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
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
                ].map((item, index) => (
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
                ))}
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
                ].map((item, index) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ACTIVATION / SALLA
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
                سلة. بعد إتمام عملية الشراء تحصل على رمز التفعيل
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
                      2. سينقلك إلى متجر قُدْرَة في سلة.
                      <br />
                      3. اختر المنتج وأكمل عملية الدفع.
                      <br />
                      4. استخدم رمز التفعيل داخل المنصة.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://salla.sa/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl bg-[#d4a126] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#d4a126]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#e0ad2d] active:scale-[0.98]"
              >
                <ShoppingCart size={19} />
                <span>شراء رمز التفعيل من سلة</span>
                <ArrowLeft size={18} />
              </a>

              <p
                className={`mt-3 text-[11px] ${theme.softMuted}`}
              >
                سيتم توجيهك إلى متجر قُدْرَة في سلة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section
        className={`px-4 py-24 ${theme.sectionSoft}`}
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
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={faq.q}
                  className={`overflow-hidden rounded-2xl border ${theme.card} ${theme.border}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-right"
                  >
                    <span className="text-sm font-black">
                      {faq.q}
                    </span>

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme.goldBg} ${theme.goldText}`}
                    >
                      {isOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
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
            })}
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
            ابدأ رحلتك في القدرات اللفظية، وتعلم، وتدرب، وتابع
            تقدمك خطوة بخطوة.
          </p>

          <button
            type="button"
            onClick={onStartNow}
            className="group mt-9 inline-flex items-center gap-3 rounded-2xl bg-[#d4a126] px-9 py-4 text-sm font-black text-white shadow-2xl shadow-[#d4a126]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#e0ad2d] active:scale-[0.98]"
          >
            <UserPlus size={19} />

            <span>إنشاء حساب جديد</span>

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

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
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