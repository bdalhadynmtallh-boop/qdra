import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  LayoutGrid,
  TrendingUp,
  History,
  ArrowLeft,
  Clock3,
} from "lucide-react";

import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { sectionsMeta, TOTAL_SECTIONS } from "../data/sectionsMeta";
import StatCard from "../components/StatCard";
import LogoImage from "../components/LogoImage";

function getSubscriptionInfo(
  subscriptionExpiresAt: string | null
) {
  if (!subscriptionExpiresAt) {
    return {
      days: 0,
      text: "لا يوجد اشتراك",
      expired: true,
    };
  }

  const now = new Date();
  const expiresAt = new Date(subscriptionExpiresAt);

  const difference =
    expiresAt.getTime() - now.getTime();

  if (difference <= 0) {
    return {
      days: 0,
      text: "منتهي",
      expired: true,
    };
  }

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (days === 1) {
    return {
      days,
      text: "متبقي يوم واحد",
      expired: false,
    };
  }

  if (days === 2) {
    return {
      days,
      text: "متبقي يومان",
      expired: false,
    };
  }

  return {
    days,
    text: `متبقي ${days} يومًا`,
    expired: false,
  };
}

export default function HomePage() {
  const {
    state,
    isSectionCompleted,
  } = useAppData();

  const { user } = useAuth();

  const completedCount = sectionsMeta.filter(
    (s) => isSectionCompleted(s.id)
  ).length;

  const completionPercent =
    TOTAL_SECTIONS > 0
      ? Math.round(
          (completedCount / TOTAL_SECTIONS) * 100
        )
      : 0;

  const lastVisited = state.lastVisited;

  const subscription =
    getSubscriptionInfo(
      user?.subscriptionExpiresAt ?? null
    );

  return (
    <div className="animate-fade-in-up mx-auto flex max-w-4xl flex-col items-center gap-10 py-6 text-center">

      {/* الشعار والمقدمة */}
      <div className="flex flex-col items-center gap-5">

        <div className="flex justify-center">
          <LogoImage className="h-32 md:h-44" />
        </div>

        <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
          منصة{" "}
          <span className="gold-text">
            قُدرة
          </span>
          <br />
          للقسم اللفظي
        </h1>

        <p className="max-w-xl text-sm leading-8 text-ink-300 md:text-base">
          استعد لاختبار القدرات العامة عبر{" "}
          {TOTAL_SECTIONS} قسمًا مصنفًا يغطي
          التناظر اللفظي، إكمال الجمل، الخطأ
          السياقي، المفردة الشاذة، واستيعاب
          المقروء — مع حفظ تلقائي لتقدمك أولًا
          بأول.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">

          {lastVisited ? (
            <Link
              to={`/sections/${lastVisited.sectionId}`}
              className="btn-gold press flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm"
            >
              متابعة الدراسة
              <ArrowLeft size={17} />
            </Link>
          ) : (
            <Link
              to="/sections"
              className="btn-gold press flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm"
            >
              ابدأ الدراسة
              <ArrowLeft size={17} />
            </Link>
          )}

          <Link
            to="/sections"
            className="press flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-bold text-ink-100 hover:bg-white/10"
          >
            <LayoutGrid size={17} />
            تصفح الأقسام
          </Link>

        </div>
      </div>

      {/* معلومات الاشتراك */}
      <div className="w-full">

        <div
          className={`glass-card flex flex-col items-center justify-between gap-4 rounded-3xl p-6 md:flex-row md:text-right ${
            subscription.expired
              ? "border border-red-500/20"
              : "border border-gold-500/20"
          }`}
        >

          <div className="flex items-center gap-4">

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                subscription.expired
                  ? "bg-red-500/10 text-red-400"
                  : "bg-gold-500/10 text-gold-300"
              }`}
            >
              <Clock3 size={22} />
            </div>

            <div className="text-right">

              <p className="text-xs font-bold text-ink-300">
                اشتراكك الحالي
              </p>

              <p
                className={`mt-1 text-lg font-black ${
                  subscription.expired
                    ? "text-red-400"
                    : "text-gold-300"
                }`}
              >
                {subscription.text}
              </p>

            </div>
          </div>

          {user?.subscriptionExpiresAt && (
            <div className="text-center md:text-left">

              <p className="text-xs text-ink-400">
                تاريخ انتهاء الاشتراك
              </p>

              <p className="mt-1 text-sm font-bold text-ink-100">
                {new Date(
                  user.subscriptionExpiresAt
                ).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

            </div>
          )}

        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">

        <StatCard
          icon={<LayoutGrid size={20} />}
          label="إجمالي الأقسام"
          value={TOTAL_SECTIONS}
        />

        <StatCard
          icon={<BookOpenCheck size={20} />}
          label="أقسام مكتملة"
          value={completedCount}
        />

        <StatCard
          icon={<TrendingUp size={20} />}
          label="نسبة الإنجاز"
          value={`${completionPercent}%`}
        />

        <StatCard
          icon={<History size={20} />}
          label="آخر قسم تمت دراسته"
          value={
            lastVisited
              ? `#${lastVisited.sectionId}`
              : "—"
          }
          hint={lastVisited?.sectionName}
        />

      </div>

      {/* التقدم */}
      <div className="glass-card w-full rounded-3xl p-6 text-right">

        <h2 className="mb-4 text-lg font-extrabold text-ink-50">
          نظرة عامة على تقدمك
        </h2>

        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">

          <div
            className="h-full rounded-full bg-gradient-to-l from-gold-300 to-gold-600 transition-all duration-700"
            style={{
              width: `${completionPercent}%`,
            }}
          />

        </div>

        <p className="mt-3 text-sm text-ink-300">

          أكملت{" "}

          <span className="font-bold text-gold-300">
            {completedCount}
          </span>

          {" "}من أصل{" "}

          <span className="font-bold text-gold-300">
            {TOTAL_SECTIONS}
          </span>

          {" "}قسمًا ({completionPercent}%)

        </p>

      </div>

    </div>
  );
}