/* =========================================================
   📊 عدادات استخدام المعلم الذكي (في الذاكرة)

   أبسط طريقة لتتبع الإحصائيات المطلوبة في لوحة التحكم
   بدون إنشاء نظام Analytics ضخم:
   - عدد طلبات اليوم / آخر ساعة
   - عدد المستخدمين الذين استخدموا المعلم اليوم
   - عدد الطلبات المرفوضة بسبب Rate Limit

   ملاحظة: العدادات تُعاد للصفر عند إعادة تشغيل السيرفر.
========================================================= */

function activityTodayKey(): string {
  return new Date().toLocaleDateString("en-CA");
}

function activityCurrentHourKey(): string {
  return `${activityTodayKey()}:${new Date().getHours()}`;
}

interface AiActivityState {
  dateKey: string;
  hourKey: string;
  dayRequests: number;
  hourRequests: number;
  dayUsers: Set<string>;
  dayRejected: number;
  hourRejected: number;
}

const activityState: AiActivityState = {
  dateKey: activityTodayKey(),
  hourKey: activityCurrentHourKey(),
  dayRequests: 0,
  hourRequests: 0,
  dayUsers: new Set<string>(),
  dayRejected: 0,
  hourRejected: 0,
};

function rolloverActivityCounters(): void {
  const today = activityTodayKey();

  if (activityState.dateKey !== today) {
    activityState.dateKey = today;
    activityState.dayRequests = 0;
    activityState.dayUsers = new Set<string>();
    activityState.dayRejected = 0;
  }

  const hour = activityCurrentHourKey();

  if (activityState.hourKey !== hour) {
    activityState.hourKey = hour;
    activityState.hourRequests = 0;
    activityState.hourRejected = 0;
  }
}

/** يُسجَّل عند نجاح تنفيذ طلب المعلم فعلياً */
export function recordAiRequest(userId: string): void {
  rolloverActivityCounters();

  activityState.dayRequests += 1;
  activityState.hourRequests += 1;

  if (userId) {
    activityState.dayUsers.add(userId);
  }
}

/** يُسجَّل عند رفض الطلب بسبب الحد الساعي أو اليومي */
export function recordAiRejection(): void {
  rolloverActivityCounters();

  activityState.dayRejected += 1;
  activityState.hourRejected += 1;
}

export function getAiActivityStats(): {
  dateKey: string;
  dayRequests: number;
  hourRequests: number;
  dayUsers: number;
  dayRejected: number;
  hourRejected: number;
} {
  rolloverActivityCounters();

  return {
    dateKey: activityState.dateKey,
    dayRequests: activityState.dayRequests,
    hourRequests: activityState.hourRequests,
    dayUsers: activityState.dayUsers.size,
    dayRejected: activityState.dayRejected,
    hourRejected: activityState.hourRejected,
  };
}