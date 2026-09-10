const BASE_URL = import.meta.env.VITE_API_URL || "https://qdra-1.onrender.com";

// ============================================================
// BASE FETCH FUNCTION
// ============================================================

export async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `ط®ط·ط£ ظپظٹ ط§ظ„ط·ظ„ط¨ (${response.status})`);
  }

  return data;
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export interface DashboardStats {
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

export async function getStats() {
  return adminFetch<{ success: boolean; stats: DashboardStats }>("/admin/stats");
}

// ============================================================
// USERS
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  subscriptionExpiresAt: string | null;
  _count?: {
    sessions: number;
    activationCodes: number;
  };
}

export interface UsersListResponse {
  success: boolean;
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getUsers(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return adminFetch<UsersListResponse>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export async function getUserDetails(id: string) {
  return adminFetch<{ success: boolean; user: any }>(`/admin/users/${id}`);
}

export async function updateUser(
  id: string,
  data: { name?: string | null; email?: string }
) {
  return adminFetch<{ success: boolean; user: User; message: string }>(
    `/admin/users/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteUser(id: string) {
  return adminFetch<{ success: boolean; message: string }>(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function disableUser(id: string) {
  return adminFetch<{ success: boolean; message: string }>(
    `/admin/users/${id}/disable`,
    { method: "POST" }
  );
}

export async function enableUser(id: string) {
  return adminFetch<{ success: boolean; message: string }>(
    `/admin/users/${id}/enable`,
    { method: "POST" }
  );
}

export async function extendSubscription(id: string, days: number) {
  return adminFetch<{ success: boolean; user: User; message: string }>(
    `/admin/users/${id}/subscription`,
    {
      method: "POST",
      body: JSON.stringify({ days }),
    }
  );
}

export async function logoutAllSessions(id: string) {
  return adminFetch<{ success: boolean; deletedSessions: number; message: string }>(
    `/admin/users/${id}/logout-all`,
    { method: "POST" }
  );
}

// ============================================================
// ACTIVATION CODES
// ============================================================

export interface ActivationCode {
  id: string;
  code: string;
  durationDays: number;
  used: boolean;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  userId: string | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export async function getActivationCodes(params?: {
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return adminFetch<{ success: boolean; codes: ActivationCode[] }>(
    `/admin/activation-codes${qs ? `?${qs}` : ""}`
  );
}

export async function createActivationCodes(durationDays: number, quantity: number = 1) {
  return adminFetch<{ success: boolean; codes: ActivationCode[]; message: string }>(
    "/admin/activation-codes",
    {
      method: "POST",
      body: JSON.stringify({ durationDays, quantity }),
    }
  );
}

export async function deleteActivationCode(id: string) {
  return adminFetch<{ success: boolean; message: string }>(
    `/admin/activation-codes/${id}`,
    { method: "DELETE" }
  );
}

// ============================================================
// SESSIONS
// ============================================================

export async function getSessions() {
  return adminFetch<{ success: boolean; sessions: any[] }>("/admin/sessions");
}

export async function deleteSession(id: string) {
  return adminFetch<{ success: boolean; message: string }>(`/admin/sessions/${id}`, {
    method: "DELETE",
  });
}

// ============================================================
// ADMIN ACTIVITIES
// ============================================================

export async function getActivities(params?: {
  action?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.action) query.set("action", params.action);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return adminFetch<{
    success: boolean;
    activities: any[];
    pagination: any;
  }>(`/admin/activities${qs ? `?${qs}` : ""}`);
}
// ============================================================
// AI SETTINGS (ط§ظ„ظ…ط¹ظ„ظ… ط§ظ„ط°ظƒظٹ)
// ============================================================
export interface AiSettings {
  enabled: boolean;
  model: string;
  dailyLimit: number;
  hourlyLimit: number;
  maintenanceMessage: string;
  availableModels: { model: string; label: string; cap: number }[];
}
export interface AiStats {
  dateKey: string;
  dayRequests: number;
  hourRequests: number;
  dayUsers: number;
  dayRejected: number;
  hourRejected: number;
  currentModel: string;
  enabled: boolean;
}
export async function getAiSettings() {
  return adminFetch<{ success: boolean; settings: AiSettings }>('/admin/ai/settings');
}
export async function updateAiSettings(
  data: Partial<{
    aiEnabled: boolean;
    aiModel: string;
    aiDailyLimit: number;
    aiHourlyLimit: number;
    aiMaintenanceMessage: string;
  }>
) {
  return adminFetch<{ success: boolean; settings: AiSettings; message: string }>('/admin/ai/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
export async function getAiStats() {
  return adminFetch<{ success: boolean; stats: AiStats }>('/admin/ai/stats');
}
