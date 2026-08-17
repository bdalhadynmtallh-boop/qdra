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
  type User,
} from "./api";

interface AuthContextValue {
  user: User | null;

  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    email: string,
    password: string,
    name?: string,
    activationCode?: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | فحص الجلسة عند فتح الموقع
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const response =
          await getMe();

        if (
          mounted &&
          response.success
        ) {
          setUser(
            response.user
          );
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
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

  async function login(
    email: string,
    password: string
  ) {
    const response =
      await apiLogin(
        email,
        password
      );

    /*
    | apiLogin لن يصل هنا إلا إذا
    | كان الرد ناجحًا، لأن request()
    | يرمي Error عند HTTP error.
    */

    setUser(
      response.user
    );
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
    const response =
      await apiRegister(
        email,
        password,
        name,
        activationCode
      );

    /*
    | التسجيل ينشئ الجلسة مباشرة
    */

    setUser(
      response.user
    );
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
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth يجب أن يكون داخل AuthProvider"
    );
  }

  return context;
}