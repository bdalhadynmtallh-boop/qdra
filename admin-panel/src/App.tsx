import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import SectionsList from "./SectionsManager";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

/* =========================================================
   TYPES
========================================================= */

interface UserType {
  id: string;
  email: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  subscriptionExpiresAt?: string;
  lastLoginAt?: string | null;
}

interface CodeType {
  id: string;
  code: string;
  durationDays: number;
  used: boolean;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface StatsType {
  users: number;
  activeUsers: number;
  todayUsers: number;
  weekUsers: number;
  activationCodes: number;
  usedCodes: number;
  unusedCodes: number;
  activeSessions: number;
  admins: number;
  suspendedUsers: number;
}

type Page = "dashboard" | "users" | "codes" | "sections";

/* =========================================================
   DESIGN SYSTEM
========================================================= */

const COLORS = {
  bgApp: "#0a0d12",

  bgHeader: "#0e131b",

  bgPanel: "#11161f",
  bgPanelAlt: "#151b25",

  bgField: "#0d1219",
  bgFieldHover: "#101721",

  border: "#2b3544",
  borderStrong: "#435066",

  textPrimary: "#f4f7fb",
  textSecondary: "#d2d9e5",
  textMuted: "#9da9bb",
  textPlaceholder: "#69778c",

  gold: "#e8b93f",
  goldLight: "#f2c957",

  success: "#45d49a",
  successSoft: "rgba(69,212,154,.10)",

  danger: "#ff747c",
  dangerSoft: "rgba(255,116,124,.09)",
  dangerBorder: "#553239",

  blue: "#70a5ff",
  orange: "#f5a742",
  purple: "#8b8df8",
};

const FONT =
  "'IBM Plex Sans Arabic', 'Tajawal', 'Segoe UI', Arial, sans-serif";

/* =========================================================
   GLOBAL STYLES
========================================================= */

const GlobalAppStyles = () => (
  <style>{`

    html {
      background: ${COLORS.bgApp};
    }

    body {
      margin: 0;
      background: ${COLORS.bgApp};
    }

    #root {
      min-height: 100vh;
    }

    .qd-app {
      font-family: ${FONT};
      color: ${COLORS.textPrimary};
      font-size: 16px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    .qd-app *,
    .qd-app *::before,
    .qd-app *::after {
      box-sizing: border-box;
    }

    /* =========================
       FIELDS
    ========================= */

    .qd-field {
      min-height: 50px;

      background: ${COLORS.bgField};
      color: ${COLORS.textPrimary};

      border: 1px solid ${COLORS.border};

      outline: none;

      font-family: inherit;
      font-size: 15px;
      font-weight: 500;

      transition:
        border-color .16s ease,
        box-shadow .16s ease,
        background-color .16s ease;
    }

    .qd-field::placeholder {
      color: ${COLORS.textPlaceholder};
      opacity: 1;
      font-weight: 400;
    }

    .qd-field:hover:not(:focus) {
      border-color: ${COLORS.borderStrong} !important;
      background: ${COLORS.bgFieldHover} !important;
    }

    .qd-field:focus {
      border-color: ${COLORS.gold} !important;

      box-shadow:
        0 0 0 3px rgba(232,185,63,.11);

      background: #111822 !important;
    }

    select.qd-field {
      cursor: pointer;
    }

    /* =========================
       BUTTONS
    ========================= */

    .qd-btn {
      min-height: 42px;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;

      border-radius: 10px;

      font-family: inherit;
      font-size: 14px;
      font-weight: 700;

      cursor: pointer;

      transition:
        background .15s ease,
        border-color .15s ease,
        color .15s ease,
        transform .08s ease,
        box-shadow .15s ease,
        filter .15s ease;
    }

    .qd-btn:active {
      transform: translateY(1px);
    }

    .qd-btn:disabled {
      opacity: .55;
      cursor: not-allowed;
    }

    .qd-btn-gold {
      background: ${COLORS.gold};
      color: #151208;
      border: 0;
    }

    .qd-btn-gold:hover:not(:disabled) {
      background: ${COLORS.goldLight};
      box-shadow: 0 7px 22px rgba(232,185,63,.13);
    }

    .qd-btn-ghost {
      border: 1px solid ${COLORS.border};
      background: ${COLORS.bgPanelAlt};
      color: ${COLORS.textSecondary};
    }

    .qd-btn-ghost:hover:not(:disabled) {
      border-color: ${COLORS.borderStrong} !important;
      color: ${COLORS.textPrimary} !important;
      background: #1b2330 !important;
    }

    .qd-btn-danger {
      border: 1px solid ${COLORS.dangerBorder};
      background: ${COLORS.dangerSoft};
      color: ${COLORS.danger};
    }

    .qd-btn-danger:hover:not(:disabled) {
      background: rgba(255,116,124,.15) !important;
      border-color: #77404a !important;
    }

    /* =========================
       SIDEBAR
    ========================= */

    .qd-sidebar-btn {
      transition:
        background .15s ease,
        color .15s ease,
        border-color .15s ease;
    }

    .qd-sidebar-btn:hover {
      background: rgba(255,255,255,.04) !important;
      color: ${COLORS.textPrimary} !important;
    }

    .qd-sidebar-btn.active:hover {
      background: rgba(232,185,63,.14) !important;
      color: ${COLORS.gold} !important;
    }

    /* =========================
       CARDS
    ========================= */

    .qd-card {
      transition:
        border-color .18s ease,
        transform .18s ease,
        box-shadow .18s ease;
    }

    .qd-card:hover {
      border-color: #384456 !important;
    }

    .qd-stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0,0,0,.14);
    }

    .qd-quick-action {
      transition:
        border-color .15s ease,
        background .15s ease,
        transform .15s ease;
    }

    .qd-quick-action:hover {
      border-color: ${COLORS.borderStrong} !important;
      background: #1a212c !important;
      transform: translateY(-1px);
    }

    /* =========================
       TABLE
    ========================= */

    .qd-row {
      transition: background .15s ease;
    }

    .qd-row:hover {
      background: rgba(255,255,255,.025);
    }

    /* =========================
       SCROLLBAR
    ========================= */

    .qd-scroll {
      scrollbar-width: thin;
      scrollbar-color: #39465a transparent;
    }

    .qd-scroll::-webkit-scrollbar {
      width: 9px;
      height: 9px;
    }

    .qd-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .qd-scroll::-webkit-scrollbar-thumb {
      background: #364255;
      border-radius: 20px;
    }

    .qd-scroll::-webkit-scrollbar-thumb:hover {
      background: #4a586e;
    }

    /* =========================
       RESPONSIVE
    ========================= */

    .qd-mobile-menu {
      display: none;
    }

    @media (max-width: 900px) {

      .qd-sidebar {
        position: fixed !important;

        top: 72px;
        right: 0;
        bottom: 0;

        z-index: 100;

        width: 260px !important;

        transform: translateX(110%);

        transition: transform .22s ease;

        box-shadow: -20px 0 50px rgba(0,0,0,.35);
      }

      .qd-sidebar.open {
        transform: translateX(0);
      }

      .qd-mobile-menu {
        display: inline-flex;
      }

      .qd-main {
        padding: 22px 18px !important;
      }

      .qd-header-email {
        display: none;
      }

      .qd-sidebar-overlay {
        display: block !important;
      }

    }

    @media (max-width: 620px) {

      .qd-header {
        padding: 0 14px !important;
      }

      .qd-brand-subtitle {
        display: none;
      }

      .qd-main {
        padding: 18px 12px !important;
      }

      .qd-page-header {
        align-items: flex-start !important;
      }

      .qd-page-title {
        font-size: 24px !important;
      }

      .qd-form-row {
        flex-direction: column;
      }

      .qd-form-row > * {
        width: 100% !important;
      }

      .qd-code-toolbar {
        flex-direction: column;
        align-items: stretch !important;
      }

      .qd-code-toolbar input {
        width: 100% !important;
      }

      .qd-login-card {
        padding: 26px 20px !important;
      }

    }

  `}</style>
);

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date?: string) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name?: string, email?: string) {
  const value =
    name?.trim() ||
    email?.trim() ||
    "؟";

  return value
    .charAt(0)
    .toUpperCase();
}

/* =========================================================
   APP
========================================================= */

export default function App() {

  /* -------------------------
     AUTH
  ------------------------- */

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false);

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [step, setStep] =
    useState<"email" | "otp">(
      "email"
    );

  const [
    authLoading,
    setAuthLoading,
  ] = useState(false);

  const [
    authError,
    setAuthError,
  ] = useState("");

  const [
    currentUser,
    setCurrentUser,
  ] = useState<UserType | null>(
    null
  );

  /* -------------------------
     DATA
  ------------------------- */

  const [stats, setStats] =
    useState<StatsType>({
      users: 0,
      activeUsers: 0,
      todayUsers: 0,
      weekUsers: 0,

      activationCodes: 0,
      usedCodes: 0,
      unusedCodes: 0,

      activeSessions: 0,

      admins: 0,
      suspendedUsers: 0,
    });

  const [users, setUsers] =
    useState<UserType[]>([]);

  const [codes, setCodes] =
    useState<CodeType[]>([]);

  const [
    loadingData,
    setLoadingData,
  ] = useState(false);

  const [
    activePage,
    setActivePage,
  ] = useState<Page>(
    "dashboard"
  );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  /* -------------------------
     FILTER
  ------------------------- */

  const [
    userSearch,
    setUserSearch,
  ] = useState("");

  const [
    userStatusFilter,
    setUserStatusFilter,
  ] = useState("all");

  const [
    codeSearch,
    setCodeSearch,
  ] = useState("");

  /* -------------------------
     CODES
  ------------------------- */

  const [
    durationDays,
    setDurationDays,
  ] = useState<
    number | "custom"
  >(30);

  const [
    customDays,
    setCustomDays,
  ] = useState("30");

  const [
    quantity,
    setQuantity,
  ] = useState("1");

  const [
    creatingCode,
    setCreatingCode,
  ] = useState(false);

  /* -------------------------
     UI
  ------------------------- */

  const [toast, setToast] =
    useState<{
      message: string;
      type:
        | "success"
        | "error";
    } | null>(null);

  const toastTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const showToast = (
    message: string,
    type:
      | "success"
      | "error" = "success"
  ) => {

    setToast({
      message,
      type,
    });

    if (toastTimerRef.current) {
      clearTimeout(
        toastTimerRef.current
      );
    }

    toastTimerRef.current =
      setTimeout(() => {
        setToast(null);
      }, 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(
          toastTimerRef.current
        );
      }
    };
  }, []);

  const [
    confirmDialog,
    setConfirmDialog,
  ] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  /* =========================================================
     AUTH FUNCTIONS
  ========================================================= */

  const handleLogin =
    async (
      event: React.FormEvent
    ) => {

      event.preventDefault();

      setAuthLoading(true);
      setAuthError("");

      try {

        const response =
          await api.post(
            "/api/auth/login",
            {
              email:
                email.trim(),
            }
          );

        if (
          response.data.success
        ) {
          setStep("otp");
        } else {
          setAuthError(
            response.data.message ||
              "تعذر إرسال رمز التحقق"
          );
        }

      } catch (error: any) {

        setAuthError(
          error.response?.data
            ?.message ||
            "خطأ في إرسال رمز التحقق."
        );

      } finally {

        setAuthLoading(false);

      }
    };

  const handleVerifyOtp =
    async (
      event: React.FormEvent
    ) => {

      event.preventDefault();

      setAuthLoading(true);
      setAuthError("");

      try {

        const response =
          await api.post(
            "/api/auth/verify-login",
            {
              email:
                email.trim(),

              code:
                otp.trim(),
            }
          );

        if (
          response.data.success
        ) {

          setCurrentUser(
            response.data.user
          );

          setIsAuthenticated(
            true
          );

          setStep("email");
          setOtp("");

        } else {

          setAuthError(
            response.data.message ||
              "رمز التحقق غير صحيح."
          );

        }

      } catch (error: any) {

        setAuthError(
          error.response?.data
            ?.message ||
            "رمز التحقق غير صحيح."
        );

      } finally {

        setAuthLoading(false);

      }
    };

  const backToEmail = () => {
    setStep("email");
    setOtp("");
    setAuthError("");
  };

  /* =========================================================
     FETCH ADMIN DATA
  ========================================================= */

  const fetchAllAdminData =
    async () => {

      setLoadingData(true);

      try {

        const [
          statsResponse,
          usersResponse,
          codesResponse,
        ] = await Promise.all([
          api
            .get(
              "/api/admin/stats"
            )
            .catch(() => null),

          api
            .get(
              "/api/admin/users"
            )
            .catch(() => null),

          api
            .get(
              "/api/admin/activation-codes"
            )
            .catch(() => null),
        ]);

        if (
          statsResponse?.data
            ?.success
        ) {
          setStats(
            statsResponse.data
              .stats
          );
        }

        if (
          usersResponse?.data
            ?.success
        ) {
          setUsers(
            usersResponse.data
              .users
          );
        }

        if (
          codesResponse?.data
            ?.success
        ) {
          setCodes(
            codesResponse.data
              .codes
          );
        }

      } catch (error) {

        console.error(
          "Admin data error:",
          error
        );

      } finally {

        setLoadingData(false);

      }
    };

  useEffect(() => {

    if (isAuthenticated) {
      fetchAllAdminData();
    }

  }, [isAuthenticated]);

  /* =========================================================
     CODE FUNCTIONS
  ========================================================= */

  const handleCreateCodes =
    async (
      event: React.FormEvent
    ) => {

      event.preventDefault();

      const days =
        durationDays ===
        "custom"
          ? parseInt(
              customDays,
              10
            )
          : durationDays;

      if (
        !days ||
        days <= 0
      ) {

        showToast(
          "أدخل عدد أيام صحيح للمدة",
          "error"
        );

        return;
      }

      const qty =
        parseInt(
          quantity,
          10
        ) || 1;

      setCreatingCode(true);

      try {

        const response =
          await api.post(
            "/api/admin/activation-codes",
            {
              durationDays:
                days,

              quantity: qty,
            }
          );

        if (
          response.data.success
        ) {

          await fetchAllAdminData();

          setQuantity("1");

          showToast(
            response.data.message ||
              "تم إنشاء أكواد التفعيل بنجاح"
          );

        } else {

          showToast(
            response.data.message ||
              "فشل إنشاء الأكواد",
            "error"
          );

        }

      } catch (error: any) {

        showToast(
          error.response?.data
            ?.message ||
            "فشل إنشاء الأكواد",
          "error"
        );

      } finally {

        setCreatingCode(false);

      }
    };

  /* =========================================================
     USER FUNCTIONS
  ========================================================= */

  const handleExtendSubscription =
    async (
      userId: string,
      days: number
    ) => {

      try {

        const response =
          await api.post(
            `/api/admin/users/${userId}/subscription`,
            { days }
          );

        if (
          response.data.success
        ) {

          await fetchAllAdminData();

          showToast(
            response.data.message ||
              `تمت إضافة ${days} يوم`
          );

        } else {

          showToast(
            response.data.message ||
              "فشل تمديد الاشتراك",
            "error"
          );
        }

      } catch (error: any) {

        showToast(
          error.response?.data
            ?.message ||
            "فشل تمديد الاشتراك",
          "error"
        );
      }
    };

  const handleDisableUser =
    async (
      userId: string
    ) => {

      try {

        const response =
          await api.post(
            `/api/admin/users/${userId}/disable`
          );

        if (
          response.data.success
        ) {

          await fetchAllAdminData();

          showToast(
            response.data.message ||
              "تم تعطيل المستخدم"
          );

        } else {

          showToast(
            response.data.message ||
              "فشل تعطيل المستخدم",
            "error"
          );
        }

      } catch (error: any) {

        showToast(
          error.response?.data
            ?.message ||
            "فشل تعطيل المستخدم",
          "error"
        );
      }
    };

  const handleEnableUser =
    async (
      userId: string
    ) => {

      try {

        const response =
          await api.post(
            `/api/admin/users/${userId}/enable`
          );

        if (
          response.data.success
        ) {

          await fetchAllAdminData();

          showToast(
            response.data.message ||
              "تم تفعيل المستخدم"
          );

        } else {

          showToast(
            response.data.message ||
              "فشل تفعيل المستخدم",
            "error"
          );
        }

      } catch (error: any) {

        showToast(
          error.response?.data
            ?.message ||
            "فشل تفعيل المستخدم",
          "error"
        );
      }
    };

  const handleLogoutAll =
    async (
      userId: string
    ) => {

      try {

        const response =
          await api.post(
            `/api/admin/users/${userId}/logout-all`
          );

        if (
          response.data.success
        ) {

          showToast(
            response.data.message ||
              "تم تسجيل الخروج من جميع الأجهزة"
          );

        } else {

          showToast(
            response.data.message ||
              "فشل إنهاء الجلسات",
            "error"
          );
        }

      } catch (error: any) {

        showToast(
          error.response?.data
            ?.message ||
            "فشل إنهاء الجلسات",
          "error"
        );
      }
    };

  const handleDeleteUser =
    async (
      userId: string
    ) => {

      try {

        const response =
          await api.delete(
            `/api/admin/users/${userId}`
          );

        if (
          response.data.success
        ) {

          await fetchAllAdminData();

          showToast(
            response.data.message ||
              "تم حذف المستخدم"
          );

        } else {

          showToast(
            response.data.message ||
              "فشل حذف المستخدم",
            "error"
          );
        }

      } catch (error: any) {

        showToast(
          error.response?.data
            ?.message ||
            "فشل حذف المستخدم",
          "error"
        );
      }
    };

  /* =========================================================
     DELETE CODE
  ========================================================= */

  const handleDeleteCode =
    async (
      codeId: string
    ) => {

      try {

        const response =
          await api.delete(
            `/api/admin/activation-codes/${codeId}`
          );

        if (
          response.data.success
        ) {

          await fetchAllAdminData();

          showToast(
            response.data.message ||
              "تم حذف الكود"
          );

        } else {

          showToast(
            response.data.message ||
              "فشل حذف الكود",
            "error"
          );
        }

      } catch (error: any) {

        showToast(
          error.response?.data
            ?.message ||
            "فشل حذف الكود",
          "error"
        );
      }
    };

  const copyToClipboard =
    async (
      text: string
    ) => {

      try {

        await navigator.clipboard.writeText(
          text
        );

        showToast(
          "تم نسخ الكود"
        );

      } catch {

        showToast(
          "تعذر نسخ الكود",
          "error"
        );
      }
    };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout =
    async () => {

      try {
        await api.post(
          "/api/auth/logout"
        );
      } catch {}

      setIsAuthenticated(
        false
      );

      setCurrentUser(null);

      setEmail("");
      setOtp("");

      setStep("email");

      setAuthError("");

      setActivePage(
        "dashboard"
      );

      setSidebarOpen(false);
    };

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredUsers =
    useMemo(() => {

      let result = users;

      const search =
        userSearch
          .trim()
          .toLowerCase();

      if (search) {

        result =
          result.filter(
            (user) =>
              user.email
                .toLowerCase()
                .includes(search) ||
              user.name
                ?.toLowerCase()
                .includes(search)
          );
      }

      if (
        userStatusFilter ===
        "active"
      ) {

        result =
          result.filter(
            (user) =>
              user.isActive !==
                false &&
              (!user.subscriptionExpiresAt ||
                new Date(
                  user.subscriptionExpiresAt
                ) > new Date())
          );

      } else if (
        userStatusFilter ===
        "expired"
      ) {

        result =
          result.filter(
            (user) =>
              user.subscriptionExpiresAt &&
              new Date(
                user.subscriptionExpiresAt
              ) <= new Date()
          );

      } else if (
        userStatusFilter ===
        "disabled"
      ) {

        result =
          result.filter(
            (user) =>
              user.isActive ===
              false
          );
      }

      return result;

    }, [
      users,
      userSearch,
      userStatusFilter,
    ]);

  const filteredCodes =
    useMemo(() => {

      const search =
        codeSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return codes;
      }

      return codes.filter(
        (code) =>
          code.code
            .toLowerCase()
            .includes(search) ||
          code.user?.email
            ?.toLowerCase()
            .includes(search)
      );

    }, [codes, codeSearch]);

  const navigate =
    (page: Page) => {

      setActivePage(page);
      setSidebarOpen(false);
    };

  /* =========================================================
     LOGIN
  ========================================================= */

  if (!isAuthenticated) {

    return (
      <div
        dir="rtl"
        className="qd-app"

        style={{
          minHeight: "100vh",

          background:
            `radial-gradient(circle at 50% -20%, rgba(232,185,63,.08), transparent 35%), ${COLORS.bgApp}`,

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          padding: 20,
        }}
      >

        <GlobalAppStyles />

        <div
          className="qd-login-card"

          style={{
            width: "100%",
            maxWidth: 430,

            padding: 36,

            position:
              "relative",

            background:
              COLORS.bgPanel,

            border:
              `1px solid ${COLORS.border}`,

            borderRadius: 22,

            boxShadow:
              "0 30px 90px rgba(0,0,0,.38)",
          }}
        >

          <div
            style={{
              width: 58,
              height: 58,

              margin:
                "0 auto 20px",

              borderRadius: 16,

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                COLORS.gold,

              color: "#151208",

              fontSize: 27,
              fontWeight: 900,

              boxShadow:
                "0 10px 30px rgba(232,185,63,.14)",
            }}
          >
            ق
          </div>

          <div
            style={{
              textAlign:
                "center",

              marginBottom: 28,
            }}
          >

            <h1
              style={{
                margin: 0,

                fontSize: 24,

                fontWeight: 800,

                color:
                  COLORS.textPrimary,
              }}
            >
              لوحة تحكم{" "}

              <span
                style={{
                  color:
                    COLORS.gold,
                }}
              >
                قُدْرَة
              </span>
            </h1>

            <p
              style={{
                margin:
                  "9px 0 0",

                color:
                  COLORS.textMuted,

                fontSize: 14,
              }}
            >
              {step ===
              "email"
                ? "أدخل بريد المدير للمتابعة"
                : "أدخل رمز التحقق المرسل إلى بريدك"}
            </p>

          </div>

          {step ===
          "email" ? (

            <form
              onSubmit={
                handleLogin
              }

              style={{
                display: "grid",
                gap: 14,
              }}
            >

              <input
                className="qd-field"

                type="email"

                value={email}

                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }

                placeholder="البريد الإلكتروني"

                required

                dir="ltr"

                style={{
                  width: "100%",

                  padding:
                    "13px 15px",

                  borderRadius: 12,
                }}
              />

              <button
                type="submit"

                disabled={
                  authLoading
                }

                className="qd-btn qd-btn-gold"

                style={{
                  minHeight: 50,
                  fontSize: 15,
                }}
              >
                {authLoading
                  ? "جاري إرسال الرمز..."
                  : "إرسال رمز التحقق"}
              </button>

            </form>

          ) : (

            <form
              onSubmit={
                handleVerifyOtp
              }

              style={{
                display: "grid",
                gap: 14,
              }}
            >

              <input
                className="qd-field"

                type="text"

                maxLength={6}

                inputMode="numeric"

                value={otp}

                onChange={(e) =>
                  setOtp(
                    e.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(0, 6)
                  )
                }

                placeholder="000000"

                required

                dir="ltr"

                autoFocus

                style={{
                  width: "100%",

                  padding: 14,

                  borderRadius: 12,

                  textAlign:
                    "center",

                  fontSize: 26,

                  fontWeight: 700,

                  letterSpacing: 8,
                }}
              />

              <button
                type="submit"

                disabled={
                  authLoading ||
                  otp.length !== 6
                }

                className="qd-btn qd-btn-gold"

                style={{
                  minHeight: 50,
                  fontSize: 15,
                }}
              >
                {authLoading
                  ? "جاري التحقق..."
                  : "دخول إلى لوحة التحكم"}
              </button>

              <button
                type="button"

                onClick={
                  backToEmail
                }

                style={{
                  border: 0,

                  background:
                    "transparent",

                  color:
                    COLORS.textMuted,

                  cursor:
                    "pointer",

                  padding: 8,

                  fontSize: 14,

                  fontFamily:
                    "inherit",
                }}
              >
                تغيير البريد
                الإلكتروني
              </button>

            </form>

          )}

          {authError && (

            <div
              style={{
                marginTop: 17,

                padding:
                  "12px 14px",

                borderRadius: 11,

                background:
                  COLORS.dangerSoft,

                border:
                  `1px solid ${COLORS.dangerBorder}`,

                color:
                  COLORS.danger,

                fontSize: 14,

                textAlign:
                  "center",
              }}
            >
              {authError}
            </div>

          )}

        </div>

      </div>
    );
  }

  /* =========================================================
     ADMIN
  ========================================================= */

  return (
    <div
      dir="rtl"
      className="qd-app"

      style={{
        minHeight:
          "100vh",

        background:
          COLORS.bgApp,
      }}
    >

      <GlobalAppStyles />

      {/* TOAST */}

      {toast && (

        <div
          style={{
            position: "fixed",

            top: 20,
            left: "50%",

            transform:
              "translateX(-50%)",

            zIndex: 10000,

            minWidth: 260,

            maxWidth:
              "calc(100vw - 30px)",

            padding:
              "12px 18px",

            borderRadius: 12,

            background:
              toast.type ===
              "success"
                ? "#173c31"
                : "#421f25",

            border:
              toast.type ===
              "success"
                ? "1px solid rgba(69,212,154,.3)"
                : "1px solid rgba(255,116,124,.3)",

            color:
              toast.type ===
              "success"
                ? "#84ebc1"
                : "#ff9aa0",

            fontWeight: 700,

            fontSize: 14,

            textAlign:
              "center",

            boxShadow:
              "0 15px 45px rgba(0,0,0,.4)",
          }}
        >
          {toast.message}
        </div>

      )}

      {/* CONFIRM */}

      {confirmDialog && (

        <div
          style={{
            position: "fixed",
            inset: 0,

            zIndex: 9998,

            background:
              "rgba(3,5,8,.83)",

            backdropFilter:
              "blur(5px)",

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            padding: 20,
          }}
        >

          <div
            style={{
              background:
                COLORS.bgPanel,

              border:
                `1px solid ${COLORS.border}`,

              borderRadius: 18,

              padding: 27,

              maxWidth: 410,

              width: "100%",

              textAlign:
                "center",

              boxShadow:
                "0 30px 80px rgba(0,0,0,.45)",
            }}
          >

            <div
              style={{
                width: 46,
                height: 46,

                margin:
                  "0 auto 14px",

                borderRadius: 13,

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  COLORS.dangerSoft,

                color:
                  COLORS.danger,

                fontWeight: 900,

                fontSize: 20,
              }}
            >
              !
            </div>

            <p
              style={{
                margin:
                  "0 0 22px",

                fontSize: 15,

                color:
                  COLORS.textSecondary,

                lineHeight: 1.8,
              }}
            >
              {
                confirmDialog.message
              }
            </p>

            <div
              style={{
                display: "flex",

                gap: 9,

                justifyContent:
                  "center",
              }}
            >

              <button
                type="button"

                onClick={() => {

                  confirmDialog.onConfirm();

                  setConfirmDialog(
                    null
                  );

                }}

                className="qd-btn qd-btn-danger"

                style={{
                  padding:
                    "9px 20px",
                }}
              >
                تأكيد
              </button>

              <button
                type="button"

                onClick={() =>
                  setConfirmDialog(
                    null
                  )
                }

                className="qd-btn qd-btn-ghost"

                style={{
                  padding:
                    "9px 20px",
                }}
              >
                إلغاء
              </button>

            </div>

          </div>

        </div>

      )}

      {/* HEADER */}

      <header
        className="qd-header"

        style={{
          height: 72,

          padding:
            "0 25px",

          position:
            "sticky",

          top: 0,

          zIndex: 200,

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          background:
            "rgba(14,19,27,.96)",

          backdropFilter:
            "blur(12px)",

          borderBottom:
            `1px solid ${COLORS.border}`,
        }}
      >

        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            gap: 12,
          }}
        >

          <button
            type="button"

            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }

            className="qd-btn qd-btn-ghost qd-mobile-menu"

            style={{
              width: 42,
              padding: 0,
            }}
          >
            ☰
          </button>

          <div
            style={{
              width: 42,
              height: 42,

              borderRadius: 12,

              background:
                COLORS.gold,

              color: "#151208",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              fontWeight: 900,

              fontSize: 20,
            }}
          >
            ق
          </div>

          <div>

            <div
              style={{
                fontWeight: 800,

                fontSize: 16,

                color:
                  COLORS.textPrimary,
              }}
            >
              لوحة تحكم قُدْرَة
            </div>

            <div
              className="qd-brand-subtitle"

              style={{
                color:
                  COLORS.textMuted,

                fontSize: 12,

                marginTop: 1,
              }}
            >
              إدارة المنصة
            </div>

          </div>

        </div>

        <div
          style={{
            display: "flex",

            alignItems:
              "center",

            gap: 12,
          }}
        >

          <span
            className="qd-header-email"

            dir="ltr"

            style={{
              color:
                COLORS.textSecondary,

              fontSize: 13,
            }}
          >
            {currentUser?.email}
          </span>

          <button
            type="button"

            onClick={
              handleLogout
            }

            className="qd-btn qd-btn-danger"

            style={{
              padding:
                "8px 14px",

              minHeight: 39,
            }}
          >
            خروج
          </button>

        </div>

      </header>

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (

        <div
          className="qd-sidebar-overlay"

          onClick={() =>
            setSidebarOpen(false)
          }

          style={{
            display: "none",

            position: "fixed",

            top: 72,

            left: 0,
            right: 0,
            bottom: 0,

            zIndex: 90,

            background:
              "rgba(0,0,0,.55)",
          }}
        />

      )}

      {/* BODY */}

      <div
        style={{
          display: "flex",

          minHeight:
            "calc(100vh - 72px)",
        }}
      >

        {/* SIDEBAR */}

        <aside
          className={`qd-sidebar ${
            sidebarOpen
              ? "open"
              : ""
          }`}

          style={{
            width: 238,

            flexShrink: 0,

            padding:
              "22px 13px",

            background:
              COLORS.bgHeader,

            borderLeft:
              `1px solid ${COLORS.border}`,
          }}
        >

          <div
            style={{
              padding:
                "0 11px 12px",

              color:
                COLORS.textMuted,

              fontSize: 12,

              fontWeight: 700,
            }}
          >
            الإدارة
          </div>

          <SidebarButton
            active={
              activePage ===
              "dashboard"
            }

            icon="⌂"

            label="الرئيسية"

            onClick={() =>
              navigate(
                "dashboard"
              )
            }
          />

          <SidebarButton
            active={
              activePage ===
              "users"
            }

            icon="👥"

            label="المستخدمون"

            badge={
              stats.users
            }

            onClick={() =>
              navigate("users")
            }
          />

          <SidebarButton
            active={
              activePage ===
              "codes"
            }

            icon="🔑"

            label="أكواد التفعيل"

            badge={
              stats.unusedCodes
            }

            onClick={() =>
              navigate("codes")
            }
          />

          <SidebarButton
            active={
              activePage ===
              "sections"
            }

            icon="▤"

            label="الأقسام"

            onClick={() =>
              navigate(
                "sections"
              )
            }
          />

          <div
            style={{
              height: 1,

              background:
                COLORS.border,

              margin:
                "20px 9px",
            }}
          />

          <div
            style={{
              padding:
                "7px 11px",

              color:
                COLORS.textMuted,

              fontSize: 13,

              lineHeight: 1.9,
            }}
          >
            إدارة المستخدمين
            والاشتراكات والأقسام
            من مكان واحد.
          </div>

        </aside>

        {/* MAIN */}

        <main
          className="qd-main qd-scroll"

          style={{
            flex: 1,

            width: "100%",

            minWidth: 0,

            maxWidth: 1320,

            margin:
              "0 auto",

            padding:
              "30px 32px",
          }}
        >

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {activePage ===
            "dashboard" && (

            <>

              <PageHeader
                title="الرئيسية"

                description="نظرة سريعة على حالة المنصة"

                loading={
                  loadingData
                }

                onRefresh={
                  fetchAllAdminData
                }
              />

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",

                  gap: 14,

                  marginBottom: 24,
                }}
              >

                <StatCard
                  label="إجمالي المستخدمين"
                  value={
                    stats.users
                  }
                  icon="👥"
                />

                <StatCard
                  label="المستخدمون النشطون"
                  value={
                    stats.activeUsers
                  }
                  icon="✓"
                  color={
                    COLORS.success
                  }
                />

                <StatCard
                  label="مسجلون اليوم"
                  value={
                    stats.todayUsers
                  }
                  icon="＋"
                  color={
                    COLORS.blue
                  }
                />

                <StatCard
                  label="هذا الأسبوع"
                  value={
                    stats.weekUsers
                  }
                  icon="↗"
                  color="#b28cff"
                />

                <StatCard
                  label="إجمالي الأكواد"
                  value={
                    stats.activationCodes
                  }
                  icon="🔑"
                />

                <StatCard
                  label="الأكواد المستخدمة"
                  value={
                    stats.usedCodes
                  }
                  icon="✓"
                  color={
                    COLORS.success
                  }
                />

                <StatCard
                  label="الأكواد المتاحة"
                  value={
                    stats.unusedCodes
                  }
                  icon="●"
                  color={
                    COLORS.gold
                  }
                />

                <StatCard
                  label="الجلسات النشطة"
                  value={
                    stats.activeSessions
                  }
                  icon="●"
                  color={
                    COLORS.success
                  }
                />

              </div>

              {/* QUICK ACTIONS */}

              <section
                className="qd-card"

                style={{
                  background:
                    COLORS.bgPanel,

                  border:
                    `1px solid ${COLORS.border}`,

                  borderRadius: 17,

                  padding: 20,

                  marginBottom: 20,
                }}
              >

                <SectionTitle
                  title="الوصول السريع"

                  description="انتقل مباشرة إلى أهم أدوات الإدارة"
                />

                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",

                    gap: 11,
                  }}
                >

                  <QuickAction
                    icon="👥"

                    title="المستخدمون"

                    description="عرض وإدارة الحسابات"

                    onClick={() =>
                      navigate(
                        "users"
                      )
                    }
                  />

                  <QuickAction
                    icon="🔑"

                    title="أكواد التفعيل"

                    description="إنشاء ومراجعة الأكواد"

                    onClick={() =>
                      navigate(
                        "codes"
                      )
                    }
                  />

                  <QuickAction
                    icon="▤"

                    title="الأقسام"

                    description="إدارة الأسئلة والمحتوى"

                    onClick={() =>
                      navigate(
                        "sections"
                      )
                    }
                  />

                </div>

              </section>

              {/* LATEST USERS */}

              <section
                className="qd-card"

                style={{
                  background:
                    COLORS.bgPanel,

                  border:
                    `1px solid ${COLORS.border}`,

                  borderRadius: 17,

                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    padding: 20,

                    display: "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    borderBottom:
                      `1px solid ${COLORS.border}`,
                  }}
                >

                  <SectionTitle
                    title="آخر المستخدمين"

                    description="أحدث الحسابات المسجلة"

                    noMargin
                  />

                  <button
                    type="button"

                    onClick={() =>
                      navigate(
                        "users"
                      )
                    }

                    style={{
                      border: 0,

                      background:
                        "transparent",

                      color:
                        COLORS.gold,

                      cursor:
                        "pointer",

                      fontFamily:
                        "inherit",

                      fontWeight: 700,

                      fontSize: 14,
                    }}
                  >
                    عرض الكل
                  </button>

                </div>

                <UserTable
                  users={users.slice(
                    0,
                    5
                  )}

                  compact

                  onExtend={
                    handleExtendSubscription
                  }

                  onDisable={
                    handleDisableUser
                  }

                  onEnable={
                    handleEnableUser
                  }

                  onLogoutAll={
                    handleLogoutAll
                  }

                  onDelete={
                    handleDeleteUser
                  }

                  showActions={
                    false
                  }
                />

              </section>

            </>

          )}

          {/* =================================================
              USERS
          ================================================= */}

          {activePage ===
            "users" && (

            <>

              <PageHeader
                title="المستخدمون"

                description={`${users.length} مستخدم في النظام`}

                loading={
                  loadingData
                }

                onRefresh={
                  fetchAllAdminData
                }
              />

              <section
                className="qd-card"

                style={{
                  background:
                    COLORS.bgPanel,

                  border:
                    `1px solid ${COLORS.border}`,

                  borderRadius: 17,

                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    padding: 17,

                    borderBottom:
                      `1px solid ${COLORS.border}`,

                    display: "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    gap: 12,

                    flexWrap:
                      "wrap",
                  }}
                >

                  <input
                    className="qd-field"

                    value={
                      userSearch
                    }

                    onChange={(e) =>
                      setUserSearch(
                        e.target.value
                      )
                    }

                    placeholder="ابحث بالاسم أو البريد الإلكتروني..."

                    style={{
                      width: "100%",
                      maxWidth: 420,

                      padding:
                        "12px 15px",

                      borderRadius: 11,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",

                      alignItems:
                        "center",

                      gap: 10,

                      flexWrap:
                        "wrap",
                    }}
                  >

                    <select
                      className="qd-field"

                      value={
                        userStatusFilter
                      }

                      onChange={(e) =>
                        setUserStatusFilter(
                          e.target.value
                        )
                      }

                      style={{
                        minWidth: 150,

                        padding:
                          "10px 14px",

                        borderRadius: 11,
                      }}
                    >
                      <option value="all">
                        كل الحالات
                      </option>

                      <option value="active">
                        نشط
                      </option>

                      <option value="expired">
                        منتهي الاشتراك
                      </option>

                      <option value="disabled">
                        معطل
                      </option>
                    </select>

                    <span
                      style={{
                        color:
                          COLORS.textMuted,

                        fontSize: 13,

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {
                        filteredUsers.length
                      }{" "}
                      نتيجة
                    </span>

                  </div>

                </div>

                <UserTable
                  users={
                    filteredUsers
                  }

                  onExtend={
                    handleExtendSubscription
                  }

                  onDisable={
                    handleDisableUser
                  }

                  onEnable={
                    handleEnableUser
                  }

                  onLogoutAll={
                    handleLogoutAll
                  }

                  onDelete={
                    handleDeleteUser
                  }

                  showActions
                />

              </section>

            </>

          )}

          {/* =================================================
              CODES
          ================================================= */}

          {activePage ===
            "codes" && (

            <>

              <PageHeader
                title="أكواد التفعيل"

                description="إنشاء ومتابعة أكواد الاشتراك"

                loading={
                  loadingData
                }

                onRefresh={
                  fetchAllAdminData
                }
              />

              {/* CREATE CODES */}

              <section
                className="qd-card"

                style={{
                  background:
                    COLORS.bgPanel,

                  border:
                    `1px solid ${COLORS.border}`,

                  borderRadius: 17,

                  padding: 21,

                  marginBottom: 20,
                }}
              >

                <SectionTitle
                  title="إنشاء أكواد جديدة"

                  description="حدد مدة الاشتراك وعدد الأكواد المطلوب إنشاؤها"
                />

                <form
                  onSubmit={
                    handleCreateCodes
                  }

                  className="qd-form-row"

                  style={{
                    display: "flex",

                    gap: 12,

                    alignItems:
                      "flex-end",

                    flexWrap:
                      "wrap",
                  }}
                >

                  <div
                    style={{
                      flex: 1,
                      minWidth: 175,
                    }}
                  >

                    <FieldLabel>
                      مدة الاشتراك
                    </FieldLabel>

                    <select
                      className="qd-field"

                      value={String(
                        durationDays
                      )}

                      onChange={(e) =>
                        setDurationDays(
                          e.target
                            .value ===
                            "custom"
                            ? "custom"
                            : Number(
                                e
                                  .target
                                  .value
                              )
                        )
                      }

                      style={{
                        width: "100%",

                        padding:
                          "11px 14px",

                        borderRadius: 11,
                      }}
                    >

                      <option value="7">
                        7 أيام
                      </option>

                      <option value="30">
                        30 يوم
                      </option>

                      <option value="90">
                        90 يوم
                      </option>

                      <option value="180">
                        180 يوم
                      </option>

                      <option value="365">
                        سنة
                      </option>

                      <option value="custom">
                        مدة مخصصة
                      </option>

                    </select>

                  </div>

                  {durationDays ===
                    "custom" && (

                    <div
                      style={{
                        flex: 1,
                        minWidth: 175,
                      }}
                    >

                      <FieldLabel>
                        عدد الأيام
                      </FieldLabel>

                      <input
                        className="qd-field"

                        type="text"

                        inputMode="numeric"

                        value={
                          customDays
                        }

                        onChange={(e) =>
                          setCustomDays(
                            e.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                4
                              )
                          )
                        }

                        placeholder="مثال: 45"

                        style={{
                          width: "100%",

                          padding:
                            "11px 14px",

                          borderRadius: 11,
                        }}
                      />

                    </div>

                  )}

                  <div
                    style={{
                      flex: 1,
                      minWidth: 175,
                    }}
                  >

                    <FieldLabel>
                      عدد الأكواد
                    </FieldLabel>

                    <input
                      className="qd-field"

                      type="text"

                      inputMode="numeric"

                      value={
                        quantity
                      }

                      onChange={(e) =>
                        setQuantity(
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              3
                            )
                        )
                      }

                      placeholder="1"

                      style={{
                        width: "100%",

                        padding:
                          "11px 14px",

                        borderRadius: 11,
                      }}
                    />

                  </div>

                  <button
                    type="submit"

                    disabled={
                      creatingCode
                    }

                    className="qd-btn qd-btn-gold"

                    style={{
                      minHeight: 50,

                      padding:
                        "11px 23px",
                    }}
                  >
                    {creatingCode
                      ? "جاري الإنشاء..."
                      : "إنشاء الأكواد"}
                  </button>

                </form>

              </section>

              {/* CODES LIST */}

              <section
                className="qd-card"

                style={{
                  background:
                    COLORS.bgPanel,

                  border:
                    `1px solid ${COLORS.border}`,

                  borderRadius: 17,

                  overflow: "hidden",
                }}
              >

                <div
                  className="qd-code-toolbar"

                  style={{
                    padding: 17,

                    borderBottom:
                      `1px solid ${COLORS.border}`,

                    display: "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    gap: 13,
                  }}
                >

                  <div>

                    <h2
                      style={{
                        margin: 0,

                        color:
                          COLORS.textPrimary,

                        fontSize: 18,

                        fontWeight: 800,
                      }}
                    >
                      الأكواد
                    </h2>

                    <div
                      style={{
                        marginTop: 3,

                        color:
                          COLORS.textMuted,

                        fontSize: 12,
                      }}
                    >
                      {
                        filteredCodes.length
                      }{" "}
                      كود
                    </div>

                  </div>

                  <input
                    className="qd-field"

                    value={
                      codeSearch
                    }

                    onChange={(e) =>
                      setCodeSearch(
                        e.target.value
                      )
                    }

                    placeholder="ابحث عن كود..."

                    style={{
                      width: 280,

                      padding:
                        "10px 14px",

                      borderRadius: 11,
                    }}
                  />

                </div>

                <div
                  className="qd-scroll"

                  style={{
                    overflowX:
                      "auto",
                  }}
                >

                  <table
                    style={{
                      width: "100%",

                      minWidth: 800,

                      borderCollapse:
                        "collapse",
                    }}
                  >

                    <thead>

                      <tr
                        style={{
                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >

                        <th style={thStyle}>
                          الكود
                        </th>

                        <th style={thStyle}>
                          المدة
                        </th>

                        <th style={thStyle}>
                          الحالة
                        </th>

                        <th style={thStyle}>
                          المستخدم
                        </th>

                        <th style={thStyle}>
                          الإنشاء
                        </th>

                        <th style={thStyle}>
                          الإجراءات
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredCodes.map(
                        (code) => (

                          <tr
                            key={
                              code.id
                            }

                            className="qd-row"

                            style={{
                              borderBottom:
                                "1px solid #232b37",
                            }}
                          >

                            <td
                              style={{
                                ...tdStyle,

                                color:
                                  COLORS.gold,

                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",

                                fontWeight: 700,

                                direction:
                                  "ltr",

                                textAlign:
                                  "right",
                              }}
                            >
                              {code.code}
                            </td>

                            <td style={tdStyle}>
                              {
                                code.durationDays
                              }{" "}
                              يوم
                            </td>

                            <td style={tdStyle}>

                              <StatusBadge
                                active={
                                  !code.used
                                }

                                activeText="متاح"

                                inactiveText="مستخدم"
                              />

                            </td>

                            <td
                              style={{
                                ...tdStyle,

                                direction:
                                  "ltr",

                                textAlign:
                                  "right",
                              }}
                            >
                              {code.user
                                ?.email ||
                                "-"}
                            </td>

                            <td
                              style={{
                                ...tdStyle,

                                color:
                                  COLORS.textMuted,
                              }}
                            >
                              {formatDate(
                                code.createdAt
                              )}
                            </td>

                            <td style={tdStyle}>

                              <div
                                style={{
                                  display:
                                    "flex",

                                  gap: 7,
                                }}
                              >

                                <button
                                  type="button"

                                  onClick={() =>
                                    copyToClipboard(
                                      code.code
                                    )
                                  }

                                  className="qd-btn qd-btn-ghost"

                                  style={{
                                    minHeight: 36,

                                    padding:
                                      "6px 12px",

                                    fontSize: 13,
                                  }}
                                >
                                  نسخ
                                </button>

                                {!code.used && (

                                  <button
                                    type="button"

                                    onClick={() =>
                                      setConfirmDialog({
                                        message:
                                          "هل أنت متأكد من حذف هذا الكود؟",

                                        onConfirm:
                                          () =>
                                            handleDeleteCode(
                                              code.id
                                            ),
                                      })
                                    }

                                    className="qd-btn qd-btn-danger"

                                    style={{
                                      minHeight: 36,

                                      padding:
                                        "6px 12px",

                                      fontSize: 13,
                                    }}
                                  >
                                    حذف
                                  </button>

                                )}

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {filteredCodes.length ===
                  0 && (

                  <EmptyState text="لا توجد أكواد مطابقة" />

                )}

              </section>

            </>

          )}

          {/* =================================================
              SECTIONS
          ================================================= */}

          {activePage ===
            "sections" && (

            <SectionsList
              api={api}

              showToast={
                showToast
              }
            />

          )}

        </main>

      </div>

    </div>
  );
}

/* =========================================================
   SIDEBAR BUTTON
========================================================= */

function SidebarButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  badge?: number;
  onClick: () => void;
}) {

  return (
    <button
      type="button"

      onClick={onClick}

      className={`qd-sidebar-btn ${
        active ? "active" : ""
      }`}

      style={{
        width: "100%",

        minHeight: 48,

        marginBottom: 5,

        padding:
          "10px 12px",

        border:
          active
            ? "1px solid rgba(232,185,63,.12)"
            : "1px solid transparent",

        borderRadius: 11,

        background:
          active
            ? "rgba(232,185,63,.11)"
            : "transparent",

        color:
          active
            ? COLORS.gold
            : COLORS.textSecondary,

        cursor: "pointer",

        display: "flex",

        alignItems:
          "center",

        gap: 11,

        fontFamily:
          "inherit",

        fontWeight:
          active ? 700 : 600,

        fontSize: 14,

        textAlign:
          "right",
      }}
    >

      <span
        style={{
          width: 28,
          height: 28,

          display:
            "inline-flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          borderRadius: 8,

          background:
            active
              ? "rgba(232,185,63,.09)"
              : "rgba(255,255,255,.025)",

          fontSize: 14,
        }}
      >
        {icon}
      </span>

      <span
        style={{
          flex: 1,
        }}
      >
        {label}
      </span>

      {badge !==
        undefined && (

        <span
          style={{
            minWidth: 27,

            height: 25,

            padding:
              "0 7px",

            borderRadius: 8,

            background:
              active
                ? COLORS.gold
                : "#1b2430",

            color:
              active
                ? "#151208"
                : COLORS.textMuted,

            display:
              "inline-flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            fontSize: 12,

            fontWeight: 800,
          }}
        >
          {badge}
        </span>

      )}

    </button>
  );
}

/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  title,
  description,
  loading,
  onRefresh,
}: {
  title: string;
  description: string;
  loading: boolean;
  onRefresh: () => void;
}) {

  return (
    <div
      className="qd-page-header"

      style={{
        display: "flex",

        alignItems:
          "center",

        justifyContent:
          "space-between",

        gap: 15,

        marginBottom: 24,
      }}
    >

      <div>

        <h1
          className="qd-page-title"

          style={{
            margin: 0,

            color:
              COLORS.textPrimary,

            fontSize: 28,

            lineHeight: 1.35,

            fontWeight: 800,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            margin:
              "6px 0 0",

            color:
              COLORS.textMuted,

            fontSize: 14,
          }}
        >
          {description}
        </p>

      </div>

      <button
        type="button"

        onClick={onRefresh}

        disabled={loading}

        className="qd-btn qd-btn-ghost"

        style={{
          padding:
            "8px 15px",
        }}
      >
        {loading
          ? "جاري التحديث..."
          : "تحديث"}
      </button>

    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  title,
  description,
  noMargin = false,
}: {
  title: string;
  description?: string;
  noMargin?: boolean;
}) {

  return (
    <div
      style={{
        marginBottom:
          noMargin ? 0 : 16,
      }}
    >

      <h2
        style={{
          margin: 0,

          color:
            COLORS.textPrimary,

          fontSize: 18,

          fontWeight: 800,
        }}
      >
        {title}
      </h2>

      {description && (

        <p
          style={{
            margin:
              "4px 0 0",

            color:
              COLORS.textMuted,

            fontSize: 13,
          }}
        >
          {description}
        </p>

      )}

    </div>
  );
}

/* =========================================================
   FIELD LABEL
========================================================= */

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {

  return (
    <label
      style={{
        display: "block",

        marginBottom: 7,

        color:
          COLORS.textSecondary,

        fontSize: 14,

        fontWeight: 700,
      }}
    >
      {children}
    </label>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon,
  color = COLORS.gold,
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
}) {

  return (
    <div
      className="qd-card qd-stat-card"

      style={{
        padding: 18,

        background:
          COLORS.bgPanel,

        border:
          `1px solid ${COLORS.border}`,

        borderRadius: 16,
      }}
    >

      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          marginBottom: 15,
        }}
      >

        <span
          style={{
            width: 38,
            height: 38,

            borderRadius: 10,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            background:
              `${color}18`,

            color,

            fontSize: 16,

            fontWeight: 800,
          }}
        >
          {icon}
        </span>

        <span
          style={{
            color:
              COLORS.textMuted,

            fontSize: 12,
          }}
        >
          الآن
        </span>

      </div>

      <div
        style={{
          color:
            COLORS.textPrimary,

          fontSize: 28,

          lineHeight: 1,

          fontWeight: 800,
        }}
      >
        {value.toLocaleString(
          "ar-SA"
        )}
      </div>

      <div
        style={{
          marginTop: 9,

          color:
            COLORS.textSecondary,

          fontSize: 13,
        }}
      >
        {label}
      </div>

    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {

  return (
    <button
      type="button"

      onClick={onClick}

      className="qd-quick-action"

      style={{
        width: "100%",

        minHeight: 76,

        padding: 14,

        border:
          `1px solid ${COLORS.border}`,

        borderRadius: 13,

        background:
          COLORS.bgPanelAlt,

        color:
          COLORS.textPrimary,

        cursor: "pointer",

        fontFamily:
          "inherit",

        textAlign:
          "right",

        display: "flex",

        alignItems:
          "center",

        gap: 12,
      }}
    >

      <span
        style={{
          width: 42,
          height: 42,

          flexShrink: 0,

          borderRadius: 11,

          background:
            "#1c2531",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          fontSize: 17,
        }}
      >
        {icon}
      </span>

      <span>

        <strong
          style={{
            display: "block",

            color:
              COLORS.textPrimary,

            fontSize: 14,

            fontWeight: 700,
          }}
        >
          {title}
        </strong>

        <small
          style={{
            display: "block",

            marginTop: 3,

            color:
              COLORS.textMuted,

            fontSize: 12,
          }}
        >
          {description}
        </small>

      </span>

    </button>
  );
}

/* =========================================================
   CUSTOM EXTEND
========================================================= */

function CustomExtendControl({
  onExtend,
}: {
  onExtend: (
    days: number
  ) => void;
}) {

  const [days, setDays] =
    useState("");

  return (
    <div
      style={{
        display: "flex",

        gap: 7,

        alignItems:
          "center",
      }}
    >

      <input
        className="qd-field"

        value={days}

        inputMode="numeric"

        onChange={(e) =>
          setDays(
            e.target.value
              .replace(/\D/g, "")
              .slice(0, 4)
          )
        }

        placeholder="عدد الأيام"

        style={{
          width: 115,

          minHeight: 40,

          padding:
            "7px 10px",

          borderRadius: 9,

          fontSize: 13,
        }}
      />

      <button
        type="button"

        onClick={() => {

          const value =
            parseInt(
              days,
              10
            );

          if (value > 0) {

            onExtend(value);

            setDays("");
          }

        }}

        className="qd-btn qd-btn-gold"

        style={{
          minHeight: 40,

          padding:
            "7px 13px",

          fontSize: 13,
        }}
      >
        إضافة
      </button>

    </div>
  );
}

/* =========================================================
   USER TABLE
========================================================= */

function UserTable({
  users,
  compact = false,
  onExtend,
  onDisable,
  onEnable,
  onLogoutAll,
  onDelete,
  showActions = false,
}: {
  users: UserType[];
  compact?: boolean;

  onExtend: (
    id: string,
    days: number
  ) => void;

  onDisable: (
    id: string
  ) => void;

  onEnable: (
    id: string
  ) => void;

  onLogoutAll: (
    id: string
  ) => void;

  onDelete: (
    id: string
  ) => void;

  showActions?: boolean;
}) {

  const [
    expandedUserId,
    setExpandedUserId,
  ] = useState<
    string | null
  >(null);

  return (
    <div
      className="qd-scroll"

      style={{
        overflowX:
          "auto",
      }}
    >

      <table
        style={{
          width: "100%",

          minWidth:
            compact
              ? 650
              : 900,

          borderCollapse:
            "collapse",
        }}
      >

        <thead>

          <tr
            style={{
              borderBottom:
                `1px solid ${COLORS.border}`,
            }}
          >

            <th style={thStyle}>
              المستخدم
            </th>

            <th style={thStyle}>
              البريد الإلكتروني
            </th>

            <th style={thStyle}>
              الاشتراك
            </th>

            {!compact && (

              <th style={thStyle}>
                الحالة
              </th>

            )}

            {!compact && (

              <th style={thStyle}>
                التسجيل
              </th>

            )}

            {showActions && (

              <th style={thStyle}>
                الإجراءات
              </th>

            )}

          </tr>

        </thead>

        <tbody>

          {users.map(
            (user) => {

              const isExpired =
                !!user.subscriptionExpiresAt &&
                new Date(
                  user.subscriptionExpiresAt
                ) <= new Date();

              const isDisabled =
                user.isActive ===
                false;

              const isExpanded =
                expandedUserId ===
                user.id;

              return (
                <React.Fragment
                  key={user.id}
                >

                  <tr
                    className="qd-row"

                    style={{
                      borderBottom:
                        "1px solid #232b37",
                    }}
                  >

                    <td style={tdStyle}>

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap: 10,
                        }}
                      >

                        <div
                          style={{
                            width: 37,
                            height: 37,

                            flexShrink: 0,

                            borderRadius: 10,

                            background:
                              "rgba(232,185,63,.11)",

                            color:
                              COLORS.gold,

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            fontWeight: 800,
                          }}
                        >
                          {getInitials(
                            user.name,
                            user.email
                          )}
                        </div>

                        <div
                          style={{
                            color:
                              COLORS.textPrimary,

                            fontWeight: 700,

                            fontSize: 14,
                          }}
                        >
                          {user.name ||
                            "بدون اسم"}
                        </div>

                      </div>

                    </td>

                    <td
                      style={{
                        ...tdStyle,

                        direction:
                          "ltr",

                        textAlign:
                          "right",
                      }}
                    >
                      {user.email}
                    </td>

                    <td style={tdStyle}>

                      <div
                        style={{
                          display: "flex",

                          flexDirection:
                            "column",

                          alignItems:
                            "flex-start",

                          gap: 5,
                        }}
                      >

                        <StatusBadge
                          active={
                            !isExpired &&
                            !isDisabled
                          }

                          activeText="نشط"

                          inactiveText={
                            isDisabled
                              ? "معطل"
                              : "منتهي"
                          }
                        />

                        {user.subscriptionExpiresAt && (

                          <span
                            style={{
                              color:
                                COLORS.textMuted,

                              fontSize: 12,
                            }}
                          >
                            حتى{" "}
                            {formatDate(
                              user.subscriptionExpiresAt
                            )}
                          </span>

                        )}

                      </div>

                    </td>

                    {!compact && (

                      <td style={tdStyle}>

                        <StatusBadge
                          active={
                            !isDisabled
                          }

                          activeText="فعال"

                          inactiveText="معطل"
                        />

                      </td>

                    )}

                    {!compact && (

                      <td
                        style={{
                          ...tdStyle,

                          color:
                            COLORS.textMuted,
                        }}
                      >
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                    )}

                    {showActions && (

                      <td style={tdStyle}>

                        <button
                          type="button"

                          onClick={() =>
                            setExpandedUserId(
                              isExpanded
                                ? null
                                : user.id
                            )
                          }

                          className="qd-btn qd-btn-ghost"

                          style={{
                            minHeight: 37,

                            padding:
                              "6px 12px",

                            color:
                              COLORS.gold,

                            fontSize: 13,
                          }}
                        >
                          {isExpanded
                            ? "إغلاق"
                            : "إدارة"}
                        </button>

                      </td>

                    )}

                  </tr>

                  {isExpanded && (

                    <tr>

                      <td
                        colSpan={
                          showActions
                            ? 6
                            : 5
                        }

                        style={{
                          padding: 0,

                          background:
                            COLORS.bgPanelAlt,

                          borderBottom:
                            `1px solid ${COLORS.border}`,
                        }}
                      >

                        <div
                          style={{
                            padding: 17,

                            display: "flex",

                            gap: 8,

                            flexWrap:
                              "wrap",

                            alignItems:
                              "center",
                          }}
                        >

                          <ActionButton
                            color={
                              COLORS.success
                            }

                            onClick={() =>
                              onExtend(
                                user.id,
                                30
                              )
                            }
                          >
                            +30 يوم
                          </ActionButton>

                          <ActionButton
                            color={
                              COLORS.success
                            }

                            onClick={() =>
                              onExtend(
                                user.id,
                                90
                              )
                            }
                          >
                            +90 يوم
                          </ActionButton>

                          <ActionButton
                            color={
                              COLORS.success
                            }

                            onClick={() =>
                              onExtend(
                                user.id,
                                365
                              )
                            }
                          >
                            +سنة
                          </ActionButton>

                          <CustomExtendControl
                            onExtend={(
                              days
                            ) =>
                              onExtend(
                                user.id,
                                days
                              )
                            }
                          />

                          {isDisabled ? (

                            <ActionButton
                              color={
                                COLORS.blue
                              }

                              onClick={() =>
                                onEnable(
                                  user.id
                                )
                              }
                            >
                              تفعيل الحساب
                            </ActionButton>

                          ) : (

                            <ActionButton
                              color={
                                COLORS.orange
                              }

                              onClick={() =>
                                onDisable(
                                  user.id
                                )
                              }
                            >
                              تعطيل الحساب
                            </ActionButton>

                          )}

                          <ActionButton
                            color={
                              COLORS.purple
                            }

                            onClick={() =>
                              onLogoutAll(
                                user.id
                              )
                            }
                          >
                            تسجيل خروج من الكل
                          </ActionButton>

                          <ActionButton
                            color={
                              COLORS.danger
                            }

                            onClick={() =>
                              onDelete(
                                user.id
                              )
                            }
                          >
                            حذف المستخدم
                          </ActionButton>

                        </div>

                      </td>

                    </tr>

                  )}

                </React.Fragment>
              );

            }
          )}

        </tbody>

      </table>

      {users.length ===
        0 && (

        <EmptyState text="لا يوجد مستخدمون" />

      )}

    </div>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
  children,
  color,
  onClick,
}: {
  children:
    React.ReactNode;
  color: string;
  onClick: () => void;
}) {

  return (
    <button
      type="button"

      onClick={onClick}

      style={{
        minHeight: 40,

        padding:
          "7px 13px",

        border:
          `1px solid ${color}45`,

        borderRadius: 9,

        background:
          `${color}14`,

        color,

        cursor: "pointer",

        fontFamily:
          "inherit",

        fontSize: 13,

        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {

  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap: 6,

        padding:
          "6px 10px",

        borderRadius: 999,

        background:
          active
            ? COLORS.successSoft
            : COLORS.dangerSoft,

        color:
          active
            ? COLORS.success
            : COLORS.danger,

        fontSize: 12,

        fontWeight: 700,
      }}
    >

      <span
        style={{
          width: 6,
          height: 6,

          borderRadius:
            "50%",

          background:
            "currentColor",
        }}
      />

      {active
        ? activeText
        : inactiveText}

    </span>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  text,
}: {
  text: string;
}) {

  return (
    <div
      style={{
        padding:
          "48px 20px",

        textAlign:
          "center",

        color:
          COLORS.textMuted,

        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

/* =========================================================
   TABLE STYLES
========================================================= */

const thStyle:
  React.CSSProperties = {

  padding:
    "15px 17px",

  textAlign:
    "right",

  fontWeight: 700,

  fontSize: 13,

  color:
    COLORS.textMuted,

  whiteSpace:
    "nowrap",

  background:
    "#141a23",
};

const tdStyle:
  React.CSSProperties = {

  padding:
    "15px 17px",

  textAlign:
    "right",

  color:
    COLORS.textSecondary,

  fontSize: 14,

  whiteSpace:
    "nowrap",
};