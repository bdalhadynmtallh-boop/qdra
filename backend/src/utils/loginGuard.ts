// ========================================
// 🛡️ حماية تسجيل الدخول من هجمات التخمين
// 5 محاولات فاشلة = حظر 15 دقيقة
// ========================================

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 دقيقة

interface Rec {
  fails: number;
  lockUntil: number | null;
}

const store = new Map<string, Rec>();

function get(key: string): Rec {
  if (!store.has(key)) store.set(key, { fails: 0, lockUntil: null });
  return store.get(key)!;
}

// هل المفتاح محظور؟ يرجع الدقايق المتبقية أو null
export function isLocked(key: string): number | null {
  const rec = get(key);
  if (rec.lockUntil && Date.now() < rec.lockUntil) {
    return Math.ceil((rec.lockUntil - Date.now()) / 60000);
  }
  if (rec.lockUntil) {
    rec.fails = 0;
    rec.lockUntil = null;
  }
  return null;
}

// تسجيل محاولة فاشلة
export function recordFail(...keys: string[]) {
  for (const key of keys) {
    const rec = get(key);
    rec.fails += 1;
    if (rec.fails >= MAX_FAILS) {
      rec.lockUntil = Date.now() + LOCK_MS;
      rec.fails = 0;
    }
  }
}

// مسح العداد عند نجاح الدخول
export function clearFails(...keys: string[]) {
  keys.forEach((k) => store.delete(k));
}