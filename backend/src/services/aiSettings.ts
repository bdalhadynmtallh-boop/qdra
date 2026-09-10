/* =========================================================
   ⚙️ إعدادات المعلم الذكي — قراءة/كتابة من قاعدة البيانات

   - سجل واحد في جدول AiSettings (id = 1)
   - تُدار من لوحة التحكم بدون إعادة Deploy
   - Cache قصير (15 ثانية) حتى لا يُضرب الداتابيس مع كل طلب،
     وعند التحديث من اللوحة يتم إبطال الكاش فوراً
   - إذا فشلت القراءة (مثلاً قبل تطبيق الـ Migration)
     تُستخدم القيم الافتراضية حتى لا يتعطل المعلم الذكي
========================================================= */

const SETTINGS_CACHE_TTL_MS = 15 * 1000;

export const AI_DEFAULT_MODEL = "moonshotai/kimi-k3";
export const AI_DEFAULT_DAILY_LIMIT = 100;
export const AI_DEFAULT_HOURLY_LIMIT = 30;
export const AI_DEFAULT_MAINTENANCE_MESSAGE =
  "🛠️ المعلم الذكي تحت الصيانة حالياً، نعمل على تحسين الخدمة وسيعود قريباً.";

export interface AiSettings {
  enabled: boolean;
  model: string;
  dailyLimit: number;
  hourlyLimit: number;
  maintenanceMessage: string;
  updatedAt?: string | null;
}

function defaultSettings(): AiSettings {
  return {
    enabled: true,
    model: AI_DEFAULT_MODEL,
    dailyLimit: AI_DEFAULT_DAILY_LIMIT,
    hourlyLimit: AI_DEFAULT_HOURLY_LIMIT,
    maintenanceMessage: AI_DEFAULT_MAINTENANCE_MESSAGE,
    updatedAt: null,
  };
}

let settingsCache: {
  value: AiSettings;
  loadedAt: number;
} | null = null;

let settingsInFlight: Promise<AiSettings> | null = null;

export function invalidateAiSettingsCache(): void {
  settingsCache = null;
}

export async function getAiSettings(
  prisma: any
): Promise<AiSettings> {
  if (
    settingsCache &&
    Date.now() - settingsCache.loadedAt <
      SETTINGS_CACHE_TTL_MS
  ) {
    return settingsCache.value;
  }

  if (settingsInFlight) {
    return settingsInFlight;
  }

  settingsInFlight = (async () => {
    try {
      const row = await prisma.aiSettings.upsert({
        where: { id: 1 },
        create: {},
        update: {},
      });

      const value: AiSettings = {
        enabled: row?.enabled !== false,
        model:
          typeof row?.model === "string" && row.model
            ? row.model
            : AI_DEFAULT_MODEL,
        dailyLimit:
          Number.isInteger(row?.dailyLimit) && row.dailyLimit > 0
            ? row.dailyLimit
            : AI_DEFAULT_DAILY_LIMIT,
        hourlyLimit:
          Number.isInteger(row?.hourlyLimit) && row.hourlyLimit > 0
            ? row.hourlyLimit
            : AI_DEFAULT_HOURLY_LIMIT,
        maintenanceMessage:
          typeof row?.maintenanceMessage === "string" &&
          row.maintenanceMessage
            ? row.maintenanceMessage
            : AI_DEFAULT_MAINTENANCE_MESSAGE,
        updatedAt: row?.updatedAt ?? null,
      };

      settingsCache = {
        value,
        loadedAt: Date.now(),
      };

      return value;
    } catch (error) {
      console.error(
        "[AI settings] فشل قراءة إعدادات المعلم الذكي من قاعدة البيانات، سيتم استخدام القيم الافتراضية:",
        error instanceof Error ? error.message : error
      );

      // لا نكاش عند الفشل حتى لا يُعاد المحاولة في كل طلب
      const value = defaultSettings();

      settingsCache = {
        value,
        loadedAt: Date.now(),
      };

      return value;
    } finally {
      settingsInFlight = null;
    }
  })();

  return settingsInFlight;
}