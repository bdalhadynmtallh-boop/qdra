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
  Monitor,
  Smartphone,
} from "lucide-react";

interface LandingPageProps {
  onStartNow: () => void;
}

export default function LandingPage({ onStartNow }: LandingPageProps) {
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
    setOpenFaq(openFaq === index ? null : index);
  };

  const theme = {
    page: isDark
      ? "bg-[#070707] text-white"
      : "bg-[#ffffff] text-[#171717]",

    header: isDark
      ? "border-white/10 bg-[#070707]/95"
      : "border-black/10 bg-white/95",

    muted: isDark ? "text-white/65" : "text-black/60",

    softMuted: isDark ? "text-white/50" : "text-black/50",

    card: isDark
      ? "border-white/10 bg-white/[0.035]"
      : "border-black/10 bg-black/[0.025]",

    cardHover: isDark
      ? "hover:border-[#d6a62a]/40 hover:bg-white/[0.055]"
      : "hover:border-[#c99b20]/40 hover:bg-black/[0.035]",

    section: isDark
      ? "border-white/10 bg-[#0a0a0a]"
      : "border-black/10 bg-[#fafafa]",

    sectionSoft: isDark ? "bg-[#0d0d0d]" : "bg-[#f7f7f7]",

    border: isDark ? "border-white/10" : "border-black/10",

    goldText: isDark ? "text-[#f2b52b]" : "text-[#b98610]",

    goldBorder: isDark
      ? "border-[#d99f1f]/40"
      : "border-[#c99b20]/40",

    goldBg: isDark
      ? "bg-[#d99f1f]/10"
      : "bg-[#c99b20]/10",
  };

  return (
    <div
      dir="rtl"
      className={`min-h-screen font-sans transition-colors duration-300 ${theme.page}`}
    >
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${theme.header}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* اللوقو */}
          <button
            type="button"
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="flex items-center"
          >
            <img
              src={isDark ? "/logo-dark.png" : "/logo-light.png"}
              alt="قُدْرَة"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </button>

          {/* أزرار الهيدر */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* زر تغيير الوضع */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"
              }
              title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${theme.card} ${theme.goldBorder} ${theme.goldText}`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* تسجيل الدخول */}
            <button
              type="button"
              onClick={onStartNow}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition-all active:scale-95 ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
            >
              <LogIn size={16} />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:pb-28 sm:pt-20 lg:pt-24">
        {/* إضاءة خلفية */}
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${
            isDark ? "bg-[#d99f1f]/[0.06]" : "bg-[#d99f1f]/[0.09]"
          }`}
        />

        <div className="relative mx-auto max-w-6xl text-center">
          {/* اللوقو الكبير */}
          <div className="mb-7 flex justify-center">
            <img
              src={isDark ? "/logo-dark.png" : "/logo-light.png"}
              alt="منصة قُدْرَة"
              className="h-36 w-auto object-contain sm:h-44 lg:h-52"
            />
          </div>

          {/* الشارة */}
          <div
            className={`mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${theme.goldBorder} ${theme.goldBg} ${theme.goldText}`}
          >
            <Sparkles size={15} />
            <span>منصة قُدْرَة للقسم اللفظي</span>
          </div>

          {/* العنوان */}
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.25] tracking-tight sm:text-5xl lg:text-7xl">
            ارفع مستواك في القدرات
            <span className={`block ${theme.goldText}`}>
              اللفظي
            </span>
          </h1>

          <p
            className={`mx-auto mt-7 max-w-2xl text-sm leading-8 sm:text-base lg:text-lg ${theme.muted}`}
          >
            منصة تعليمية وتدريبية تساعدك على فهم مهارات القسم اللفظي،
            والتدرب عليها، ومراجعة أخطائك، وقياس تقدمك من خلال تجربة
            منظمة وسهلة.
          </p>

          {/* أزرار الإجراءات */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStartNow}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#d4a126] px-9 py-4 text-sm font-black text-white shadow-xl shadow-[#d4a126]/20 transition-all hover:bg-[#e0ad2d] active:scale-95 sm:w-auto"
            >
              <span>ابدأ الآن</span>
              <ArrowLeft size={19} />
            </button>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-sm font-bold transition-all active:scale-95 sm:w-auto ${theme.border} ${theme.card}`}
            >
              <BookOpen size={18} />
              <span>تعرف على المنصة</span>
            </button>
          </div>

          {/* =========================================================
              عرض الشاشة الرئيسية
              التعديل هنا فقط في الجوال
          ========================================================= */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            {/* صورة الحساب للكمبيوتر */}
            <div className="overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300">
              <div
                className={`flex items-center justify-between border-b px-4 py-3 ${theme.card}`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>

                <div
                  className={`flex items-center gap-1 text-xs font-mono ${theme.softMuted}`}
                >
                  <Monitor size={14} />
                  <span>الواجهة الرئيسية</span>
                </div>
              </div>

              <img
                src="/pc-home.png"
                alt="الواجهة الرئيسية لمنصة قدرة على الكمبيوتر"
                className="w-full object-cover"
              />
            </div>

            {/* =====================================================
                صورة الجوال - تم تعديلها فقط
            ===================================================== */}
            <div className="absolute -bottom-12 -right-10 z-10 hidden w-[170px] overflow-hidden rounded-[2.2rem] border-[5px] border-[#171717] bg-[#171717] shadow-[0_25px_60px_rgba(0,0,0,0.35)] sm:block md:-right-14 md:w-[190px] lg:-right-16 lg:w-[210px]">
              {/* سماعة الجوال */}
              <div className="absolute left-1/2 top-2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />

              <img
                src="/mobile-home.png"
                alt="واجهة منصة قدرة على الجوال"
                className="block w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          إحصائيات
      ========================================================= */}
      <section
        className={`border-y px-4 py-9 transition-colors ${theme.section}`}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-7 text-center md:grid-cols-4">
          <div>
            <div className={`text-2xl font-black ${theme.goldText}`}>
              100%
            </div>
            <div className={`mt-1 text-xs ${theme.softMuted}`}>
              للقسم اللفظي
            </div>
          </div>

          <div>
            <div className="text-2xl font-black">تأسيس</div>
            <div className={`mt-1 text-xs ${theme.softMuted}`}>
              شرح المهارات الأساسية
            </div>
          </div>

          <div>
            <div className={`text-2xl font-black ${theme.goldText}`}>
              تدريب
            </div>
            <div className={`mt-1 text-xs ${theme.softMuted}`}>
              أسئلة وتطبيقات
            </div>
          </div>

          <div>
            <div className="text-2xl font-black">تحليل</div>
            <div className={`mt-1 text-xs ${theme.softMuted}`}>
              متابعة الأخطاء والتقدم
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          المميزات
      ========================================================= */}
      <section
        id="features"
        className={`border-b px-4 py-20 transition-colors ${theme.section}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div
              className={`mx-auto mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
            >
              <Sparkles size={15} />
              مميزات قُدْرَة
            </div>

            <h2 className="text-2xl font-black sm:text-4xl">
              كل ما تحتاجه في مكان واحد
            </h2>

            <p
              className={`mx-auto mt-3 max-w-2xl text-sm leading-7 ${theme.muted}`}
            >
              صممنا المنصة لتكون واضحة وسريعة، من أول التأسيس حتى التدريب
              والمحاكاة ومراجعة الأخطاء.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* تأسيس */}
            <div
              className={`rounded-3xl border p-6 transition-all ${theme.card} ${theme.cardHover}`}
            >
              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
              >
                <GraduationCap size={24} />
              </div>

              <h3 className="text-lg font-black">التأسيس</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                تعلم أهم مهارات القسم اللفظي بطريقة مرتبة، مع التركيز
                على الأشياء المهمة التي تحتاجها فعلاً في الاختبار.
              </p>
            </div>

            {/* التدريب */}
            <div
              className={`rounded-3xl border p-6 transition-all ${theme.card} ${theme.cardHover}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Zap size={24} />
              </div>

              <h3 className="text-lg font-black">التدريب</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                انتقل من الشرح إلى التطبيق مباشرة، وتدرب على أنواع
                الأسئلة المختلفة حتى تثبت المهارة.
              </p>
            </div>

            {/* المحاكي */}
            <div
              className={`rounded-3xl border p-6 transition-all ${theme.card} ${theme.cardHover}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                <Target size={24} />
              </div>

              <h3 className="text-lg font-black">المحاكي</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                اختبر نفسك في تجربة أقرب للاختبار الفعلي مع الوقت
                ومراجعة إجاباتك بعد الانتهاء.
              </p>
            </div>

            {/* الأخطاء */}
            <div
              className={`rounded-3xl border p-6 transition-all ${theme.card} ${theme.cardHover}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <Brain size={24} />
              </div>

              <h3 className="text-lg font-black">مراجعة الأخطاء</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                احتفظ بالأسئلة التي أخطأت فيها وارجع لها لاحقًا حتى
                تقلل تكرار الأخطاء.
              </p>
            </div>

            {/* المفضلة */}
            <div
              className={`rounded-3xl border p-6 transition-all ${theme.card} ${theme.cardHover}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
                <Trophy size={24} />
              </div>

              <h3 className="text-lg font-black">المفضلة</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                احفظ الأسئلة المهمة التي تريد الرجوع إليها في أي وقت
                أثناء المذاكرة.
              </p>
            </div>

            {/* الإحصائيات */}
            <div
              className={`rounded-3xl border p-6 transition-all ${theme.card} ${theme.cardHover}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                <BarChart3 size={24} />
              </div>

              <h3 className="text-lg font-black">الإحصائيات</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                تابع إنجازك وتقدمك وتعرف على نقاط القوة والجوانب التي
                تحتاج إلى مزيد من التدريب.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          معاينة المحاكي والأقسام
      ========================================================= */}
      <section className={`px-4 py-20 ${theme.sectionSoft}`}>
        <div className="mx-auto max-w-6xl space-y-20">
          {/* قسم المحاكي */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <div
                className={`mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
              >
                <Target size={15} />
                محاكي الاختبارات
              </div>

              <h2 className="text-2xl font-black leading-relaxed sm:text-4xl">
                تجربة واقعية تحاكي الاختبار الفعلي
              </h2>

              <p className={`mt-4 text-sm leading-8 ${theme.muted}`}>
                تدرب تحت ضغط الوقت مع نظام اختبارات مصمم ليطابق قدرات قياس
                بدقة، مما يساعدك على كسر حاجز الخوف وبناء السرعة في الحل.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    size={18}
                    className={theme.goldText}
                  />
                  <span className="text-sm font-bold">
                    احتساب دقيق للوقت والأسئلة
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2
                    size={18}
                    className={theme.goldText}
                  />
                  <span className="text-sm font-bold">
                    عرض نتائج شامل للتصحيح
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border shadow-xl">
              <img
                src="/pc-mock.png"
                alt="المحاكي"
                className="w-full object-cover"
              />

              <div className="absolute bottom-4 left-4 sm:hidden">
                <img
                  src="/mobile-quiz.png"
                  alt="اختبار الجوال"
                  className="w-24 rounded-xl border-2 border-black shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* قسم التأسيس والأقسام */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:grid-flow-dense">
            <div className="lg:col-start-2">
              <div
                className={`mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
              >
                <BookOpen size={15} />
                الأقسام والدروس
              </div>

              <h2 className="text-2xl font-black leading-relaxed sm:text-4xl">
                تقسيم شجري منظم لكل المهارات
              </h2>

              <p className={`mt-4 text-sm leading-8 ${theme.muted}`}>
                تصفح أكثر من 150 قسمًا و28 درسًا تأسيسيًا مفصلة حسب نوع
                السؤال (التناظر اللفظي، إكمال الجمل، الخطأ السياقي،
                واستيعاب المقروء).
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border shadow-xl lg:col-start-1">
              <img
                src="/pc-sections.png"
                alt="الأقسام"
                className="w-full object-cover"
              />
            </div>
          </div>

          {/* قسم الإحصائيات والأداء */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <div
                className={`mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
              >
                <BarChart3 size={15} />
                متابعة الأداء
              </div>

              <h2 className="text-2xl font-black leading-relaxed sm:text-4xl">
                تقارير وإحصائيات دقيقة لتقدمك
              </h2>

              <p className={`mt-4 text-sm leading-8 ${theme.muted}`}>
                حلل أداءك اليومي وشاهد نسبة إنجازك في كل قسم لتتعرف على
                نقاط القوة ونقاط الضعف التي تحتاج إلى زيادة التدريب عليها.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border shadow-xl">
              <img
                src="/pc-stats.png"
                alt="الإحصائيات"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          تطبيق الجوال
      ========================================================= */}
      <section className={`border-b px-4 py-20 ${theme.section}`}>
        <div className="mx-auto max-w-5xl text-center">
          <div
            className={`mx-auto mb-3 inline-flex items-center gap-2 text-xs font-black ${theme.goldText}`}
          >
            <Smartphone size={16} />
            متوافق مع كل الأجهزة
          </div>

          <h2 className="text-2xl font-black sm:text-4xl">
            تصفح سلس وسريع عبر الهاتف المحمول
          </h2>

          <p
            className={`mx-auto mt-3 max-w-xl text-sm leading-7 ${theme.muted}`}
          >
            تم تصميم تجربة المستخدم لتعمل بكفاءة عالية وسلاسة فائقة على
            جميع الهواتف والأجهزة اللوحية.
          </p>

          <div className="mt-12 flex items-center justify-center gap-6 sm:gap-10">
            <div className="w-1/2 max-w-[240px] overflow-hidden rounded-[2.5rem] border-4 border-black/80 shadow-2xl">
              <img
                src="/mobile-basics.png"
                alt="تأسيس الجوال"
                className="w-full object-cover"
              />
            </div>

            <div className="w-1/2 max-w-[240px] overflow-hidden rounded-[2.5rem] border-4 border-black/80 shadow-2xl">
              <img
                src="/mobile-quiz.png"
                alt="اختبارات الجوال"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          كيف تبدأ
      ========================================================= */}
      <section className={`px-4 py-20 ${theme.sectionSoft}`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-black sm:text-4xl">
              كيف تبدأ؟
            </h2>

            <p className={`mt-3 text-sm ${theme.muted}`}>
              ثلاث خطوات بسيطة وتبدأ المذاكرة
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* الخطوة 1 */}
            <div
              className={`relative rounded-3xl border p-7 text-center ${theme.card}`}
            >
              <div
                className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
              >
                <UserPlus size={25} />
              </div>

              <div
                className={`mb-2 text-xs font-black ${theme.goldText}`}
              >
                الخطوة 01
              </div>

              <h3 className="text-lg font-black">أنشئ حسابك</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                اضغط على ابدأ الآن، ثم اختر إنشاء حساب وأدخل بياناتك.
              </p>
            </div>

            {/* الخطوة 2 */}
            <div
              className={`relative rounded-3xl border p-7 text-center ${theme.card}`}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                <KeyRound size={25} />
              </div>

              <div className="mb-2 text-xs font-black text-blue-500">
                الخطوة 02
              </div>

              <h3 className="text-lg font-black">فعّل حسابك</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                إذا كان الاشتراك يتطلب رمز تفعيل، اشترِ الرمز من متجر
                قُدْرَة في سلة ثم أدخله في المكان المخصص.
              </p>
            </div>

            {/* الخطوة 3 */}
            <div
              className={`relative rounded-3xl border p-7 text-center ${theme.card}`}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <BookOpen size={25} />
              </div>

              <div className="mb-2 text-xs font-black text-emerald-500">
                الخطوة 03
              </div>

              <h3 className="text-lg font-black">ابدأ المذاكرة</h3>

              <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                ابدأ بالتأسيس، ثم انتقل إلى التدريب والمحاكي وتابع
                أخطاءك وإحصائياتك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          تسجيل الدخول / إنشاء الحساب
      ========================================================= */}
      <section className={`border-y px-4 py-20 ${theme.section}`}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black sm:text-4xl">
              طريقة إنشاء الحساب وتسجيل الدخول
            </h2>

            <p className={`mt-3 text-sm ${theme.muted}`}>
              كل شيء واضح من أول دخولك للمنصة
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* مستخدم جديد */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 ${theme.card}`}
            >
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
                >
                  <UserPlus size={23} />
                </div>

                <div>
                  <h3 className="font-black">مستخدم جديد</h3>

                  <p className={`text-xs ${theme.softMuted}`}>
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

            {/* لديه حساب */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 ${theme.card}`}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                  <LogIn size={23} />
                </div>

                <div>
                  <h3 className="font-black">لديك حساب؟</h3>

                  <p className={`text-xs ${theme.softMuted}`}>
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
          شراء رمز التفعيل
      ========================================================= */}
      <section className={`px-4 py-20 ${theme.sectionSoft}`}>
        <div className="mx-auto max-w-4xl">
          <div
            className={`overflow-hidden rounded-[2rem] border p-7 sm:p-10 ${theme.card}`}
          >
            <div className="text-center">
              <div
                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
              >
                <ShoppingCart size={28} />
              </div>

              <h2 className="text-2xl font-black sm:text-4xl">
                شراء رمز التفعيل
              </h2>

              <p
                className={`mx-auto mt-4 max-w-2xl text-sm leading-8 ${theme.muted}`}
              >
                يمكنك شراء رمز التفعيل من متجر قُدْرَة عبر منصة سلة.
                بعد إتمام عملية الشراء تحصل على رمز التفعيل الخاص بك،
                ثم تستخدمه داخل المنصة.
              </p>

              <div
                className={`mx-auto mt-7 max-w-xl rounded-2xl border p-5 text-right ${theme.card} ${theme.goldBorder}`}
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
                      className={`mt-2 text-xs leading-6 ${theme.muted}`}
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
                className="mt-7 inline-flex items-center justify-center gap-3 rounded-2xl bg-[#d4a126] px-8 py-4 text-sm font-black text-white shadow-lg shadow-[#d4a126]/20 transition-all hover:bg-[#e0ad2d] active:scale-95"
              >
                <ShoppingCart size={19} />
                <span>شراء رمز التفعيل من سلة</span>
                <ArrowLeft size={18} />
              </a>

              <p className={`mt-3 text-[11px] ${theme.softMuted}`}>
                سيتم توجيهك إلى متجر قُدْرَة في سلة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          الأسئلة الشائعة
      ========================================================= */}
      <section className={`px-4 py-20 ${theme.section}`}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black sm:text-4xl">
              الأسئلة الشائعة
            </h2>

            <p className={`mt-3 text-sm ${theme.muted}`}>
              أهم الأسئلة التي قد تحتاج إلى معرفة إجابتها
            </p>
          </div>

          <div className="space-y-3">
            {[
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
                a: "يوجد حاليًا 150 قسمًا في المنصة، والعدد قابل للزيادة مستقبلًا مع إضافة أقسام وتدريبات جديدة.",
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
            ].map((faq, index) => (
              <div
                key={index}
                className={`overflow-hidden rounded-2xl border ${theme.card}`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-right"
                >
                  <span className="text-sm font-black">
                    {faq.q}
                  </span>

                  {openFaq === index ? (
                    <ChevronUp
                      size={18}
                      className={`shrink-0 ${theme.goldText}`}
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                      className={`shrink-0 ${theme.softMuted}`}
                    />
                  )}
                </button>

                {openFaq === index && (
                  <div
                    className={`border-t px-5 pb-5 pt-4 text-sm leading-7 ${theme.border} ${theme.muted}`}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA النهائي
      ========================================================= */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div
            className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${theme.goldBg} ${theme.goldText}`}
          >
            <Trophy size={25} />
          </div>

          <h2 className="text-3xl font-black sm:text-5xl">
            مستعد تبدأ؟
          </h2>

          <p
            className={`mx-auto mt-4 max-w-xl text-sm leading-7 ${theme.muted}`}
          >
            ابدأ رحلتك في القدرات اللفظية، وتعلم، وتدرب، وتابع تقدمك
            خطوة بخطوة.
          </p>

          <button
            type="button"
            onClick={onStartNow}
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#d4a126] px-9 py-4 text-sm font-black text-white shadow-xl shadow-[#d4a126]/20 transition-all hover:bg-[#e0ad2d] active:scale-95"
          >
            <UserPlus size={19} />
            <span>إنشاء حساب جديد</span>
            <ArrowLeft size={18} />
          </button>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className={`border-t px-4 py-8 ${theme.border}`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <img
            src={isDark ? "/logo-dark.png" : "/logo-light.png"}
            alt="قُدْرَة"
            className="h-11 w-auto object-contain"
          />

          <p className={`text-xs ${theme.softMuted}`}>
            © 2026 منصة قُدْرَة — للقسم اللفظي
          </p>
        </div>
      </footer>
    </div>
  );
}