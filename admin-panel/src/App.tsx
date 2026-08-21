import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ✅ قراءة الرابط من متغير البيئة
const API_URL = import.meta.env.VITE_API_URL || "https://qdra-1.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ✅ interceptor لإرسال التوكن من الكوكيز في الهيدر (يعمل عبر الدومينات)
api.interceptors.request.use((config) => {
  const cookies = document.cookie.split(";").reduce((acc, c) => {
    const [key, value] = c.trim().split("=");
    if (key && value) acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  const token = cookies.rhal_session;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ interceptor لحفظ التوكن إذا رجع في response
api.interceptors.response.use((response) => {
  const newToken = response.data?.token;
  if (newToken) {
    document.cookie = `rhal_session=${newToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
  return response;
});

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
  user?: { id: string; email: string; name?: string };
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

type Page = "dashboard" | "users" | "codes";

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function getInitials(name?: string, email?: string) {
  const value = name?.trim() || email?.trim() || "؟";
  return value.charAt(0).toUpperCase();
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  const [stats, setStats] = useState<StatsType>({
    users: 0, activeUsers: 0, todayUsers: 0, weekUsers: 0,
    activationCodes: 0, usedCodes: 0, unusedCodes: 0,
    activeSessions: 0, admins: 0, suspendedUsers: 0,
  });

  const [users, setUsers] = useState<UserType[]>([]);
  const [codes, setCodes] = useState<CodeType[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activePage, setActivePage] = useState<Page>("dashboard");

  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [codeSearch, setCodeSearch] = useState("");

  const [durationDays, setDurationDays] = useState<number | "custom">(30);
  const [customDays, setCustomDays] = useState("30");
  const [quantity, setQuantity] = useState("1");
  const [creatingCode, setCreatingCode] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await api.post("/api/auth/login", { email: email.trim() });
      if (response.data.success) setStep("otp");
      else setAuthError(response.data.message || "تعذر إرسال رمز التحقق");
    } catch (error: any) {
      setAuthError(error.response?.data?.message || "خطأ في إرسال رمز التحقق.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await api.post("/api/auth/verify-login", { email: email.trim(), code: otp.trim() });
      if (response.data.success) {
        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        setStep("email");
        setOtp("");
        await fetchAllAdminData();
      } else {
        setAuthError(response.data.message || "رمز التحقق غير صحيح.");
      }
    } catch (error: any) {
      setAuthError(error.response?.data?.message || "رمز التحقق غير صحيح.");
    } finally {
      setAuthLoading(false);
    }
  };

  const backToEmail = () => {
    setStep("email");
    setOtp("");
    setAuthError("");
  };

  const fetchAllAdminData = async () => {
    setLoadingData(true);
    try {
      const [statsResponse, usersResponse, codesResponse] = await Promise.all([
        api.get("/api/admin/stats").catch(() => null),
        api.get("/api/admin/users").catch(() => null),
        api.get("/api/admin/activation-codes").catch(() => null),
      ]);
      if (statsResponse?.data?.success) setStats(statsResponse.data.stats);
      if (usersResponse?.data?.success) setUsers(usersResponse.data.users);
      if (codesResponse?.data?.success) setCodes(codesResponse.data.codes);
    } catch (error) {
      console.error("Admin data error:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAllAdminData();
  }, [isAuthenticated]);

  const handleCreateCodes = async (event: React.FormEvent) => {
    event.preventDefault();

    const days = durationDays === "custom" ? parseInt(customDays, 10) : durationDays;
    if (!days || days <= 0) {
      showToast("أدخل عدد أيام صحيح للمدة", "error");
      return;
    }

    const qty = parseInt(quantity, 10) || 1;

    setCreatingCode(true);
    try {
      const response = await api.post("/api/admin/activation-codes", {
        durationDays: days,
        quantity: qty,
      });
      if (response.data.success) {
        await fetchAllAdminData();
        setQuantity("1");
        showToast(response.data.message || "تم إنشاء أكواد التفعيل بنجاح");
      } else {
        showToast(response.data.message || "فشل إنشاء الأكواد", "error");
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "فشل إنشاء الأكواد", "error");
    } finally {
      setCreatingCode(false);
    }
  };

  const handleExtendSubscription = async (userId: string, days: number) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/subscription`, { days });
      if (response.data.success) {
        await fetchAllAdminData();
        showToast(response.data.message || `تمت إضافة ${days} يوم`);
      } else showToast(response.data.message || "فشل تمديد الاشتراك", "error");
    } catch (error: any) {
      showToast(error.response?.data?.message || "فشل تمديد الاشتراك", "error");
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/disable`);
      if (response.data.success) {
        await fetchAllAdminData();
        showToast(response.data.message || "تم تعطيل المستخدم");
      } else showToast(response.data.message || "فشل تعطيل المستخدم", "error");
    } catch (error: any) {
      showToast(error.response?.data?.message || "فشل تعطيل المستخدم", "error");
    }
  };

  const handleEnableUser = async (userId: string) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/enable`);
      if (response.data.success) {
        await fetchAllAdminData();
        showToast(response.data.message || "تم تفعيل المستخدم");
      } else showToast(response.data.message || "فشل تفعيل المستخدم", "error");
    } catch (error: any) {
      showToast(error.response?.data?.message || "فشل تفعيل المستخدم", "error");
    }
  };

  const handleLogoutAll = async (userId: string) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/logout-all`);
      if (response.data.success) showToast(response.data.message || "تم تسجيل الخروج من جميع الأجهزة");
      else showToast(response.data.message || "فشل إنهاء الجلسات", "error");
    } catch (error: any) {
      showToast(error.response?.data?.message || "فشل إنهاء الجلسات", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`);
      if (response.data.success) {
        await fetchAllAdminData();
        showToast(response.data.message || "تم حذف المستخدم");
      } else showToast(response.data.message || "فشل حذف المستخدم", "error");
    } catch (error: any) {
      showToast(error.response?.data?.message || "فشل حذف المستخدم", "error");
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const response = await api.delete(`/api/admin/activation-codes/${codeId}`);
      if (response.data.success) {
        await fetchAllAdminData();
        showToast(response.data.message || "تم حذف الكود");
      } else showToast(response.data.message || "فشل حذف الكود", "error");
    } catch (error: any) {
      showToast(error.response?.data?.message || "فشل حذف الكود", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("تم نسخ الكود!");
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {}
    document.cookie = "rhal_session=; path=/; max-age=0";
    setIsAuthenticated(false);
    setCurrentUser(null);
    setEmail("");
    setOtp("");
    setStep("email");
    setAuthError("");
    setActivePage("dashboard");
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    const search = userSearch.trim().toLowerCase();
    if (search) {
      result = result.filter(
        (user) => user.email.toLowerCase().includes(search) || user.name?.toLowerCase().includes(search)
      );
    }
    if (userStatusFilter === "active") {
      result = result.filter(
        (u) => u.isActive !== false && (!u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt) > new Date())
      );
    } else if (userStatusFilter === "expired") {
      result = result.filter((u) => u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) <= new Date());
    } else if (userStatusFilter === "disabled") {
      result = result.filter((u) => u.isActive === false);
    }
    return result;
  }, [users, userSearch, userStatusFilter]);

  const filteredCodes = useMemo(() => {
    const search = codeSearch.trim().toLowerCase();
    if (!search) return codes;
    return codes.filter(
      (code) => code.code.toLowerCase().includes(search) || code.user?.email?.toLowerCase().includes(search)
    );
  }, [codes, codeSearch]);

  if (!isAuthenticated) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#090b10", color: "#fff", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 410, background: "#11141c", border: "1px solid #232735", borderRadius: 24, padding: 32, boxShadow: "0 25px 70px rgba(0,0,0,.35)" }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "#d4a126", color: "#08090c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, margin: "0 auto 18px" }}>ق</div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>لوحة تحكم <span style={{ color: "#d4a126" }}>قُدْرَة</span></h1>
            <p style={{ color: "#7f8799", fontSize: 13, marginTop: 8 }}>{step === "email" ? "أدخل بريد المدير للمتابعة" : "أدخل رمز التحقق المرسل إلى بريدك"}</p>
          </div>
          {step === "email" ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" required dir="ltr" style={{ width: "100%", boxSizing: "border-box", padding: "14px 15px", borderRadius: 13, border: "1px solid #292e3d", background: "#0b0e14", color: "#fff", outline: "none", fontSize: 14 }} />
              <button type="submit" disabled={authLoading} style={{ border: 0, borderRadius: 13, padding: "14px", background: "#d4a126", color: "#090b10", fontWeight: 900, cursor: "pointer", opacity: authLoading ? 0.6 : 1 }}>
                {authLoading ? "جاري إرسال الرمز..." : "إرسال رمز التحقق"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="text" maxLength={6} inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required dir="ltr" autoFocus style={{ width: "100%", boxSizing: "border-box", padding: "15px", borderRadius: 13, border: "1px solid #292e3d", background: "#0b0e14", color: "#fff", outline: "none", textAlign: "center", fontSize: 24, fontWeight: 800, letterSpacing: 8 }} />
              <button type="submit" disabled={authLoading || otp.length !== 6} style={{ border: 0, borderRadius: 13, padding: "14px", background: "#d4a126", color: "#090b10", fontWeight: 900, cursor: "pointer", opacity: authLoading || otp.length !== 6 ? 0.6 : 1 }}>
                {authLoading ? "جاري التحقق..." : "دخول إلى لوحة التحكم"}
              </button>
              <button type="button" onClick={backToEmail} style={{ border: 0, background: "transparent", color: "#8d95a7", cursor: "pointer", padding: 8 }}>تغيير البريد الإلكتروني</button>
            </form>
          )}
          {authError && <div style={{ marginTop: 16, padding: "11px 13px", borderRadius: 11, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.18)", color: "#f87171", fontSize: 13, textAlign: "center" }}>{authError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#090b10", color: "#fff", fontFamily: "'Cairo', sans-serif" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "12px 24px", borderRadius: 12, background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
          {toast.message}
        </div>
      )}

      {confirmDialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#11141c", border: "1px solid #232735", borderRadius: 18, padding: 28, maxWidth: 380, width: "100%", textAlign: "center" }}>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#e5e7eb" }}>{confirmDialog.message}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} style={{ border: 0, borderRadius: 10, padding: "10px 20px", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>تأكيد</button>
              <button onClick={() => setConfirmDialog(null)} style={{ border: "1px solid #292e3c", borderRadius: 10, padding: "10px 20px", background: "transparent", color: "#aab1c0", fontWeight: 700, cursor: "pointer" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <header style={{ height: 68, borderBottom: "1px solid #202430", background: "#0d1016", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "#d4a126", color: "#08090c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18 }}>ق</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>لوحة تحكم قُدْرَة</div>
            <div style={{ color: "#687184", fontSize: 11 }}>إدارة المنصة</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#9aa2b2", fontSize: 13 }}>{currentUser?.email}</span>
          <button onClick={handleLogout} style={{ border: "1px solid #3a2428", background: "#1a1013", color: "#f87171", borderRadius: 10, padding: "8px 13px", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>تسجيل الخروج</button>
        </div>
      </header>

      <div style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>
        <aside style={{ width: 210, flexShrink: 0, borderLeft: "1px solid #202430", background: "#0d1016", padding: "22px 12px" }}>
          <div style={{ color: "#60697a", fontSize: 10, fontWeight: 800, padding: "0 12px 10px" }}>الإدارة</div>
          <SidebarButton active={activePage === "dashboard"} icon="⌂" label="الرئيسية" onClick={() => setActivePage("dashboard")} />
          <SidebarButton active={activePage === "users"} icon="👥" label="المستخدمون" badge={stats.users} onClick={() => setActivePage("users")} />
          <SidebarButton active={activePage === "codes"} icon="🔑" label="أكواد التفعيل" badge={stats.unusedCodes} onClick={() => setActivePage("codes")} />
          <div style={{ height: 1, background: "#202430", margin: "18px 10px" }} />
          <div style={{ padding: "10px 12px", color: "#555d6d", fontSize: 11, lineHeight: 1.8 }}>لوحة احترافية لإدارة المستخدمين وأكواد التفعيل.</div>
        </aside>

        <main style={{ flex: 1, padding: "28px", maxWidth: 1250, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {activePage === "dashboard" && (
            <>
              <PageHeader title="الرئيسية" description="نظرة سريعة على حالة المنصة" loading={loadingData} onRefresh={fetchAllAdminData} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 24 }}>
                <StatCard label="إجمالي المستخدمين" value={stats.users} icon="👥" />
                <StatCard label="المستخدمون النشطون" value={stats.activeUsers} icon="✓" />
                <StatCard label="مسجلون اليوم" value={stats.todayUsers} icon="📅" />
                <StatCard label="مسجلون هذا الأسبوع" value={stats.weekUsers} icon="📊" />
                <StatCard label="إجمالي الأكواد" value={stats.activationCodes} icon="🔑" />
                <StatCard label="الأكواد المستخدمة" value={stats.usedCodes} icon="✓" />
                <StatCard label="الأكواد المتاحة" value={stats.unusedCodes} icon="◉" />
                <StatCard label="الجلسات النشطة" value={stats.activeSessions} icon="🟢" />
              </div>
              <section style={{ background: "#11141c", border: "1px solid #222735", borderRadius: 18, padding: 20, marginBottom: 18 }}>
                <h2 style={{ margin: "0 0 15px", fontSize: 16 }}>الوصول السريع</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <QuickAction icon="👥" title="المستخدمون" description="عرض وإدارة الحسابات" onClick={() => setActivePage("users")} />
                  <QuickAction icon="🔑" title="أكواد التفعيل" description="إنشاء ومراجعة الأكواد" onClick={() => setActivePage("codes")} />
                </div>
              </section>
              <section style={{ background: "#11141c", border: "1px solid #222735", borderRadius: 18, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16 }}>آخر المستخدمين</h2>
                    <p style={{ margin: "4px 0 0", color: "#697284", fontSize: 11 }}>أحدث الحسابات المسجلة</p>
                  </div>
                  <button onClick={() => setActivePage("users")} style={{ border: 0, background: "transparent", color: "#d4a126", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>عرض الكل</button>
                </div>
                <UserTable users={users.slice(0, 5)} compact onExtend={handleExtendSubscription} onDisable={handleDisableUser} onEnable={handleEnableUser} onLogoutAll={handleLogoutAll} onDelete={handleDeleteUser} showActions={false} />
              </section>
            </>
          )}

          {activePage === "users" && (
            <>
              <PageHeader title="المستخدمون" description={`${users.length} مستخدم في النظام`} loading={loadingData} onRefresh={fetchAllAdminData} />
              <section style={{ background: "#11141c", border: "1px solid #222735", borderRadius: 18, overflow: "hidden" }}>
                <div style={{ padding: 18, borderBottom: "1px solid #222735", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, maxWidth: 420, minWidth: 200 }}>
                    <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="البحث بالاسم أو البريد..." style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 11, border: "1px solid #292e3c", background: "#0b0e14", color: "#fff", outline: "none", fontFamily: "inherit", fontSize: 12 }} />
                  </div>
                  <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} style={{ padding: "11px 14px", borderRadius: 11, border: "1px solid #292e3c", background: "#0b0e14", color: "#fff", outline: "none", fontFamily: "inherit", fontSize: 12 }}>
                    <option value="all">الكل</option>
                    <option value="active">نشط</option>
                    <option value="expired">منتهي الاشتراك</option>
                    <option value="disabled">معطل</option>
                  </select>
                  <span style={{ color: "#697284", fontSize: 12 }}>{filteredUsers.length} نتيجة</span>
                </div>
                <UserTable users={filteredUsers} onExtend={handleExtendSubscription} onDisable={handleDisableUser} onEnable={handleEnableUser} onLogoutAll={handleLogoutAll} onDelete={handleDeleteUser} showActions={true} />
              </section>
            </>
          )}

          {activePage === "codes" && (
            <>
              <PageHeader title="أكواد التفعيل" description="إنشاء ومتابعة أكواد الاشتراك" loading={loadingData} onRefresh={fetchAllAdminData} />
              <section style={{ background: "#11141c", border: "1px solid #222735", borderRadius: 18, padding: 20, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16 }}>إنشاء أكواد جديدة</h2>
                    <p style={{ margin: "4px 0 0", color: "#697284", fontSize: 11 }}>اختر مدة الاشتراك وعدد الأكواد</p>
                  </div>
                </div>
                <form onSubmit={handleCreateCodes} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ display: "block", color: "#7f8798", fontSize: 11, marginBottom: 6 }}>مدة الاشتراك</label>
                    <select
                      value={String(durationDays)}
                      onChange={(e) => setDurationDays(e.target.value === "custom" ? "custom" : Number(e.target.value))}
                      style={{ width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 10, border: "1px solid #292e3c", background: "#0b0e14", color: "#fff", outline: "none", fontFamily: "inherit" }}
                    >
                      <option value="7">7 أيام</option>
                      <option value="30">30 يوم</option>
                      <option value="90">90 يوم</option>
                      <option value="180">180 يوم</option>
                      <option value="365">سنة</option>
                      <option value="custom">مخصص (أحدد الأيام بنفسي)</option>
                    </select>
                  </div>

                  {durationDays === "custom" && (
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <label style={{ display: "block", color: "#d4a126", fontSize: 11, marginBottom: 6 }}>عدد الأيام المخصص</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="مثال: 45"
                        style={{ width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 10, border: "1px solid #d4a126", background: "#0b0e14", color: "#fff", outline: "none", fontFamily: "inherit" }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ display: "block", color: "#7f8798", fontSize: 11, marginBottom: 6 }}>عدد الأكواد</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="1"
                      style={{ width: "100%", boxSizing: "border-box", padding: 11, borderRadius: 10, border: "1px solid #292e3c", background: "#0b0e14", color: "#fff", outline: "none", fontFamily: "inherit" }}
                    />
                  </div>

                  <button type="submit" disabled={creatingCode} style={{ alignSelf: "flex-end", border: 0, borderRadius: 10, padding: "11px 20px", background: "#d4a126", color: "#08090c", fontWeight: 900, cursor: "pointer", opacity: creatingCode ? 0.6 : 1, fontFamily: "inherit" }}>
                    {creatingCode ? "جاري الإنشاء..." : "إنشاء الأكواد"}
                  </button>
                </form>
              </section>

              <section style={{ background: "#11141c", border: "1px solid #222735", borderRadius: 18, overflow: "hidden" }}>
                <div style={{ padding: 18, borderBottom: "1px solid #222735", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div><h2 style={{ margin: 0, fontSize: 16 }}>الأكواد</h2></div>
                  <input value={codeSearch} onChange={(e) => setCodeSearch(e.target.value)} placeholder="البحث عن كود..." style={{ width: 220, padding: "10px 12px", borderRadius: 10, border: "1px solid #292e3c", background: "#0b0e14", color: "#fff", outline: "none", fontFamily: "inherit", fontSize: 12 }} />
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ color: "#697284", borderBottom: "1px solid #222735" }}>
                        <th style={thStyle}>الكود</th>
                        <th style={thStyle}>المدة</th>
                        <th style={thStyle}>الحالة</th>
                        <th style={thStyle}>المستخدم</th>
                        <th style={thStyle}>الإنشاء</th>
                        <th style={thStyle}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((code) => (
                        <tr key={code.id} style={{ borderBottom: "1px solid #1b1f29" }}>
                          <td style={{ ...tdStyle, color: "#d4a126", fontFamily: "monospace", fontWeight: 800, direction: "ltr", textAlign: "right" }}>{code.code}</td>
                          <td style={tdStyle}>{code.durationDays} يوم</td>
                          <td style={tdStyle}><StatusBadge active={!code.used} activeText="متاح" inactiveText="مستخدم" /></td>
                          <td style={{ ...tdStyle, color: "#9ca3b2" }}>{code.user?.email || "-"}</td>
                          <td style={{ ...tdStyle, color: "#697284" }}>{formatDate(code.createdAt)}</td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => copyToClipboard(code.code)} style={{ border: "1px solid #292e3c", background: "transparent", color: "#aab1c0", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>نسخ</button>
                              {!code.used && (
                                <button onClick={() => setConfirmDialog({ message: "هل أنت متأكد من حذف هذا الكود؟", onConfirm: () => handleDeleteCode(code.id) })} style={{ border: "1px solid #3a2428", background: "transparent", color: "#f87171", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>حذف</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredCodes.length === 0 && <EmptyState text="لا توجد أكواد مطابقة" />}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarButton({ active, icon, label, badge, onClick }: { active: boolean; icon: string; label: string; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "100%", border: 0, borderRadius: 11, padding: "11px 12px", marginBottom: 5, background: active ? "rgba(212,161,38,.13)" : "transparent", color: active ? "#d4a126" : "#8a92a3", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", fontWeight: active ? 800 : 600, textAlign: "right" }}>
      <span>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{ minWidth: 22, height: 22, borderRadius: 7, background: active ? "#d4a126" : "#1b202b", color: active ? "#08090c" : "#737c8d", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{badge}</span>
      )}
    </button>
  );
}

function PageHeader({ title, description, loading, onRefresh }: { title: string; description: string; loading: boolean; onRefresh: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 15, marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>{title}</h1>
        <p style={{ margin: "5px 0 0", color: "#697284", fontSize: 12 }}>{description}</p>
      </div>
      <button onClick={onRefresh} disabled={loading} style={{ border: "1px solid #292e3c", background: "#11141c", color: "#aab1c0", borderRadius: 10, padding: "9px 13px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, opacity: loading ? 0.5 : 1 }}>
        {loading ? "جاري التحديث..." : "تحديث"}
      </button>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{ background: "#11141c", border: "1px solid #222735", borderRadius: 17, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(212,161,38,.09)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</span>
        <span style={{ color: "#626b7d", fontSize: 10 }}>الآن</span>
      </div>
      <div style={{ fontSize: 27, fontWeight: 900, lineHeight: 1 }}>{value.toLocaleString("ar-SA")}</div>
      <div style={{ marginTop: 8, color: "#737c8d", fontSize: 11 }}>{label}</div>
    </div>
  );
}

function QuickAction({ icon, title, description, onClick }: { icon: string; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ border: "1px solid #242a38", background: "#0d1016", borderRadius: 13, padding: 14, color: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "right", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, background: "#171b24", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <span>
        <strong style={{ display: "block", fontSize: 12 }}>{title}</strong>
        <small style={{ display: "block", marginTop: 3, color: "#697284", fontSize: 10 }}>{description}</small>
      </span>
    </button>
  );
}

function CustomExtendControl({ onExtend }: { onExtend: (days: number) => void }) {
  const [days, setDays] = useState("");
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        value={days}
        onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="أيام مخصصة"
        style={{ width: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid #292e3c", background: "#0b0e14", color: "#fff", outline: "none", fontFamily: "inherit", fontSize: 11 }}
      />
      <button
        onClick={() => {
          const d = parseInt(days, 10);
          if (d > 0) {
            onExtend(d);
            setDays("");
          }
        }}
        style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#d4a126", color: "#08090c", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
      >
        إضافة
      </button>
    </div>
  );
}

function UserTable({ users, compact = false, onExtend, onDisable, onEnable, onLogoutAll, onDelete, showActions = false }: { users: UserType[]; compact?: boolean; onExtend: (id: string, days: number) => void; onDisable: (id: string) => void; onEnable: (id: string) => void; onLogoutAll: (id: string) => void; onDelete: (id: string) => void; showActions?: boolean }) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #222735", color: "#697284" }}>
            <th style={thStyle}>المستخدم</th>
            <th style={thStyle}>البريد الإلكتروني</th>
            <th style={thStyle}>الاشتراك</th>
            {!compact && <th style={thStyle}>الحالة</th>}
            {!compact && <th style={thStyle}>التسجيل</th>}
            {showActions && <th style={thStyle}>إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) <= new Date();
            const isDisabled = user.isActive === false;
            const isExpanded = expandedUserId === user.id;

            return (
              <React.Fragment key={user.id}>
                <tr style={{ borderBottom: "1px solid #1b1f29" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(212,161,38,.1)", color: "#d4a126", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                        {getInitials(user.name, user.email)}
                      </div>
                      <div>
                        <div style={{ color: "#f4f5f7", fontWeight: 800 }}>{user.name || "بدون اسم"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, direction: "ltr", textAlign: "right", color: "#b4bac6" }}>{user.email}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <StatusBadge active={!isExpired && !isDisabled} activeText="نشط" inactiveText={isDisabled ? "معطل" : "منتهي"} />
                      {user.subscriptionExpiresAt && (
                        <span style={{ fontSize: 10, color: "#697284" }}>{formatDate(user.subscriptionExpiresAt)}</span>
                      )}
                    </div>
                  </td>
                  {!compact && (
                    <td style={tdStyle}>
                      <StatusBadge active={!isDisabled} activeText="فعال" inactiveText="معطل" />
                    </td>
                  )}
                  {!compact && (
                    <td style={{ ...tdStyle, color: "#697284" }}>{formatDate(user.createdAt)}</td>
                  )}
                  {showActions && (
                    <td style={tdStyle}>
                      <button onClick={() => setExpandedUserId(isExpanded ? null : user.id)} style={{ border: "1px solid #292e3c", background: "transparent", color: "#d4a126", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>
                        {isExpanded ? "إغلاق" : "إدارة"}
                      </button>
                    </td>
                  )}
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={showActions ? 6 : 5} style={{ padding: 0, background: "#0d1016" }}>
                      <div style={{ padding: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button onClick={() => onExtend(user.id, 30)} style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>+30 يوم</button>
                        <button onClick={() => onExtend(user.id, 90)} style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>+90 يوم</button>
                        <button onClick={() => onExtend(user.id, 365)} style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#10b981", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>+سنة</button>
                        <CustomExtendControl onExtend={(d) => onExtend(user.id, d)} />
                        {isDisabled ? (
                          <button onClick={() => onEnable(user.id)} style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>تفعيل الحساب</button>
                        ) : (
                          <button onClick={() => onDisable(user.id)} style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#f59e0b", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>تعطيل الحساب</button>
                        )}
                        <button onClick={() => onLogoutAll(user.id)} style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#6366f1", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>تسجيل خروج من الكل</button>
                        <button onClick={() => onDelete(user.id)} style={{ border: 0, borderRadius: 8, padding: "8px 14px", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>حذف المستخدم</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {users.length === 0 && <EmptyState text="لا يوجد مستخدمون" />}
    </div>
  );
}

function StatusBadge({ active, activeText, inactiveText }: { active: boolean; activeText: string; inactiveText: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 7, background: active ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.08)", color: active ? "#34d399" : "#f87171", fontSize: 10, fontWeight: 800 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {active ? activeText : inactiveText}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: 35, textAlign: "center", color: "#5e6677", fontSize: 12 }}>{text}</div>;
}

const thStyle: React.CSSProperties = { padding: "13px 15px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "13px 15px", textAlign: "right", color: "#aab1bf", whiteSpace: "nowrap" };