import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  renewSubscription,
  SubscriptionExpiredError,
  type User,
} from "../auth/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  subscriptionExpired: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string,
    activationCode?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  renew: (code: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// فحص محلي: هل تاريخ الاشتراك في الماضي؟
function isExpired(u: User | null): boolean {
  if (!u?.subscriptionExpiresAt) return false;
  return new Date(u.subscriptionExpiresAt).getTime() <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | فحص الجلسة عند فتح الموقع
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const response = await getMe();

        if (mounted && response.success) {
          // ⬇️ فحص محلي إضافي: حتى لو السيرفر ما منع، نحن نمنع
          if (isExpired(response.user)) {
            setSubscriptionExpired(true);
            setUser(null);
          } else {
            setUser(response.user);
            setSubscriptionExpired(false);
          }
        }
      } catch (err) {
        if (!mounted) return;

        if (err instanceof SubscriptionExpiredError) {
          setSubscriptionExpired(true);
        }
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */
  async function login(email: string, password: string) {
    const response = await apiLogin(email, password);

    if (isExpired(response.user)) {
      setSubscriptionExpired(true);
      setUser(null);
    } else {
      setUser(response.user);
      setSubscriptionExpired(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REGISTER
  |--------------------------------------------------------------------------
  */
  async function register(
    email: string,
    password: string,
    name?: string,
    activationCode?: string
  ) {
    const response = await apiRegister(email, password, name, activationCode);
    setUser(response.user);
    setSubscriptionExpired(false);
  }

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */
  async function logout() {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setSubscriptionExpired(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENEW (تجديد الاشتراك)
  |--------------------------------------------------------------------------
  */
  async function renew(
    code: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await renewSubscription(code);

      if (res.success) {
        try {
          const meRes = await getMe();
          if (meRes.success) {
            setUser(meRes.user);
          }
        } catch {
          // إذا فشل الجلب، نكتفي بفتح القفل
        }

        setSubscriptionExpired(false);
        return { success: true, message: res.message };
      }

      return { success: false, message: "فشل تجديد الاشتراك" };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "حدث خطأ أثناء التجديد",
      };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        subscriptionExpired,
        login,
        register,
        logout,
        renew,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth يجب أن يكون داخل AuthProvider");
  }

  return context;
}