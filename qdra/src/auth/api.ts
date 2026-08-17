// يحول localhost إلى IP الجهاز تلقائياً إذا تم الفتح من الجوال في الشبكة المحلية
// ويدعم Vercel (الإنتاج)
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    
    // 🌐 على Vercel (الإنتاج) — استخدم رابط Render السحابي
    if (hostname.includes("vercel.app")) {
      return "https://qdra-1.onrender.com";
    }
    
    // 📱 على الشبكة المحلية (الجوال) — استخدم IP الجهاز
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:3000`;
    }
  }
  return "http://localhost:3000";
};

const API_URL = getApiUrl();
const TOKEN_KEY = "rhal_auth_token";

// حفظ وجلب التوكن محلياً لدعم الجوال
export const setStoredToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const removeStoredToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
};

interface ApiError {
  success: false;
  message: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  subscriptionExpiresAt: string | null;
}

export interface AuthSuccessResponse {
  success: true;
  user: User;
  token?: string;
  message?: string;
}

export interface AuthErrorResponse {
  success: false;
  message: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

/*
|--------------------------------------------------------------------------
| خطأ مخصص لانتهاء الاشتراك (عشان نميزه في AuthContext)
|--------------------------------------------------------------------------
*/
export class SubscriptionExpiredError extends Error {
  constructor() {
    super("انتهى اشتراكك");
    this.name = "SubscriptionExpiredError";
  }
}

/*
|--------------------------------------------------------------------------
| Request Helper
|--------------------------------------------------------------------------
*/

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && options.body !== null) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      if (text) data = text;
    } catch {
      data = null;
    }
  }

  if (data && typeof data === "object" && data.token) {
    setStoredToken(data.token);
  }

  if (!response.ok) {
    // ⬇️ اكتشاف انتهاء الاشتراك (403) ورمي خطأ مخصص
    if (response.status === 403) {
      throw new SubscriptionExpiredError();
    }

    const error = data as Partial<ApiError> | null;
    throw new Error(
      error?.message || `حدث خطأ في الطلب (${response.status})`
    );
  }

  return data as T;
}

/*
|--------------------------------------------------------------------------
| AUTH API
|--------------------------------------------------------------------------
*/

export async function register(
  email: string,
  password: string,
  name?: string,
  activationCode?: string
): Promise<AuthSuccessResponse> {
  const res = await request<AuthSuccessResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, activationCode }),
  });
  if (res.token) setStoredToken(res.token);
  return res;
}

export async function login(
  email: string,
  password: string
): Promise<AuthSuccessResponse> {
  const res = await request<AuthSuccessResponse>("/api/auth/login-direct", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res.token) setStoredToken(res.token);
  return res;
}

export async function getMe(): Promise<AuthSuccessResponse> {
  return request<AuthSuccessResponse>("/api/auth/me");
}

export async function logout(): Promise<{ success: true; message: string }> {
  removeStoredToken();
  return request<{ success: true; message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

// ⬇️ جديد: تجديد الاشتراك باستخدام كود التفعيل
export async function renewSubscription(code: string): Promise<{
  success: boolean;
  message: string;
  subscriptionExpiresAt: string;
}> {
  return request<{
    success: boolean;
    message: string;
    subscriptionExpiresAt: string;
  }>("/api/auth/renew", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

/*
|--------------------------------------------------------------------------
| USER PROGRESS & DATA API
|--------------------------------------------------------------------------
*/

export async function getUserUserData() {
  return request<{
    success: boolean;
    progress: Record<number, any>;
    mistakes: Array<{ sectionId: number; questionId: number }>;
    favorites: Array<{ sectionId: number; questionId: number }>;
    stats: any;
  }>("/api/progress/data");
}

export async function recordQuestionAttempt(payload: {
  sectionId: number;
  questionId: string | number;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeMs?: number;
}) {
  return request("/api/progress/attempt", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeSectionApi(payload: {
  sectionId: number;
  correctAnswers: number;
  totalQuestions: number;
  timeMs: number;
}) {
  return request("/api/progress/complete-section", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function toggleFavoriteApi(payload: {
  sectionId: number;
  questionId: string | number;
}) {
  return request("/api/progress/favorites/toggle", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitSimulatorAttempt(payload: {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score?: number;
  startedAt: string;
  completedAt: string;
}) {
  return request("/api/simulator/attempt", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCompletedBasics() {
  return request<{
    success: boolean;
    completedTopics: string[];
  }>("/api/progress/basics");
}

export async function toggleBasicLesson(topicId: string) {
  return request<{
    success: boolean;
    completed: boolean;
  }>("/api/progress/basics/toggle", {
    method: "POST",
    body: JSON.stringify({ topicId }),
  });
}

// ⬇️ جديد: إحصائيات آخر 7 أيام للرسم البياني المتحرك
export async function getDailyStats() {
  return request<{
    success: boolean;
    dailyStats: Array<{
      date: string;
      label: string;
      correct: number;
      wrong: number;
    }>;
  }>("/api/progress/daily-stats");
}