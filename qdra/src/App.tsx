import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { AppDataProvider } from "./context/AppDataContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import LandingPage from "./components/LandingPage";
import SubscriptionExpiredModal from "./components/SubscriptionExpiredModal"; // ⬅️ جديد

import HomePage from "./pages/HomePage";
import BasicsPage from "./pages/BasicsPage";
import SectionsPage from "./pages/SectionsPage";
import SectionQuizPage from "./pages/SectionQuizPage";
import SimulatorPage from "./pages/SimulatorPage";
import MistakesPage from "./pages/MistakesPage";
import FavoritesPage from "./pages/FavoritesPage";
import StatsPage from "./pages/StatsPage";
import AuthPage from "./pages/AuthPage";

function AppContent() {
  const { user, loading, subscriptionExpired } = useAuth(); // ⬅️ أضفنا subscriptionExpired
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-ink-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500/20 border-t-gold-400" />
      </div>
    );
  }

  /*
   * ⬇️ جديد: إذا انتهى الاشتراك، نعرض شاشة التجديد فوراً
   */
  if (subscriptionExpired) {
    return <SubscriptionExpiredModal />;
  }

  /*
   * المستخدم غير مسجل دخول
   */
  if (!user) {
    if (showAuth) {
      return (
        <div className="relative min-h-screen bg-white text-slate-900 dark:bg-ink-950 dark:text-white">
          {/* زر العودة */}
          <button
            type="button"
            onClick={() => setShowAuth(false)}
            className="
              absolute right-4 top-4 z-50
              flex items-center gap-2
              rounded-xl
              border border-gold-500/30
              bg-gold-500/10
              px-4 py-2.5
              text-xs font-bold
              text-gold-700
              transition-all
              hover:bg-gold-500/20
              active:scale-95
              dark:text-gold-300
            "
          >
            <ArrowRight size={16} />
            <span>العودة للرئيسية</span>
          </button>

          <AuthPage />
        </div>
      );
    }

    return (
      <LandingPage
        onStartNow={() => {
          setShowAuth(true);
        }}
      />
    );
  }

  /*
   * المستخدم مسجل دخول
   */
  return (
    <AppDataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/basics" element={<BasicsPage />} />
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/sections/:id" element={<SectionQuizPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/mistakes" element={<MistakesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/stats" element={<StatsPage />} />

          {/* أي مسار غير معروف يرجع للرئيسية */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      {/*
        مهم جدًا:
        HashRouter أصبح خارج حالة تسجيل الدخول،
        لذلك AuthPage يقدر يستخدم useNavigate بدون صفحة بيضاء.
      */}
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ThemeProvider>
  );
}