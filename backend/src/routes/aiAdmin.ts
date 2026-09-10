import { FastifyInstance } from "fastify";

import {
  AI_MODELS,
  getUsage,
} from "./ai.js";

import {
  getAiSettings,
  invalidateAiSettingsCache,
} from "../services/aiSettings.js";

import {
  getAiActivityStats,
} from "../services/aiActivity.js";

import { logAdminActivity } from "./admin.js";

// ============================================================
// HELPERS
// ============================================================

// أسماء العرض للموديلات الموجودة فعلياً في كود المعلم الذكي
const MODEL_LABELS: Record<string, string> = {
  "moonshotai/kimi-k3": "Kimi K3",
  "deepseek/deepseek-v4-pro": "DeepSeek V4 Pro",
  "qwen/qwen3.8-max:free": "Qwen 3.8 Max",
  "qwen/qwen3.7-max:free": "Qwen 3.7 Max",
  "qwen/qwen3.7-plus:free": "Qwen 3.7 Plus",
  "qwen/qwen3.6-plus:free": "Qwen 3.6 Plus",
};

function modelLabel(model: string): string {
  return MODEL_LABELS[model] || model;
}

function availableModels() {
  // ⚠️ لا نُرجع apiKeyEnv ولا أي شيء حسّاس هنا
  return AI_MODELS.map(({ model, cap }) => ({
    model,

    label: modelLabel(model),

    cap,
  }));
}

function publicSettings(settings: {
  enabled: boolean;
  model: string;
  dailyLimit: number;
  hourlyLimit: number;
  maintenanceMessage: string;
  updatedAt?: string | null;
}) {
  return {
    ...settings,

    modelLabel: modelLabel(settings.model),

    availableModels: availableModels(),
  };
}

// ============================================================
// AI ADMIN ROUTES (محمية بصلاحيات Admin)
// ============================================================

export async function aiAdminRoutes(app: FastifyInstance) {
  // جميع مسارات الإدارة محمية
  app.addHook(
    "preHandler",
    app.authenticateAdmin
  );

  // ============================================================
  // READ SETTINGS
  // ============================================================

  app.get(
    "/ai/settings",

    async (_request, reply) => {
      const settings =
        await getAiSettings(
          app.prisma
        );

      return reply.send({
        success: true,

        settings:
          publicSettings(
            settings
          ),
      });
    }
  );

  // ============================================================
  // UPDATE SETTINGS
  // ============================================================

  app.put(
    "/ai/settings",

    async (request, reply) => {
      const body =
        request.body as {
          enabled?: unknown;

          model?: unknown;

          dailyLimit?: unknown;

          hourlyLimit?: unknown;

          maintenanceMessage?: unknown;
        };

      const data: {
        enabled?: boolean;

        model?: string;

        dailyLimit?: number;

        hourlyLimit?: number;

        maintenanceMessage?: string;
      } = {};

      // =====================================
      // الحالة (يعمل / صيانة)
      // =====================================

      if (
        body?.enabled !==
        undefined
      ) {
        if (
          typeof body.enabled !==
          "boolean"
        ) {
          return reply
            .status(400)
            .send({
              success:
                false,

              message:
                "قيمة حالة المعلم غير صالحة.",
            });
        }

        data.enabled =
          body.enabled;
      }

      // =====================================
      // الموديل الأساسي
      // =====================================

      if (
        body?.model !==
        undefined
      ) {
        const model =
          String(
            body.model || ""
          );

        if (
          !AI_MODELS.some(
            (entry) =>
              entry.model ===
              model
          )
        ) {
          return reply
            .status(400)
            .send({
              success:
                false,

              message:
                "الموديل المختار غير موجود في قائمة الموديلات المتاحة.",
            });
        }

        data.model = model;
      }

      return validateLimits(
        request,
        reply,
        body,
        data
      );
    }
  );

  // ============================================================
  // STATS
  // ============================================================

  app.get(
    "/ai/stats",

    async (_request, reply) => {
      const settings =
        await getAiSettings(
          app.prisma
        );

      const activity =
        getAiActivityStats();

      return reply.send({
        success: true,

        stats: activity,

        model: settings.model,

        modelLabel: modelLabel(
          settings.model
        ),

        enabled: settings.enabled,

        usageByModel: AI_MODELS.map(
          ({
            model,
            cap,
          }) => {
            const used =
              getUsage(model);

            return {
              model,

              label: modelLabel(
                model
              ),

              used,

              cap,

              atCap: used >= cap,
            };
          }
        ),
      });
    }
  );
}

/* ============================================================
   ✅ التحقق من الحدود ورسالة الصيانة
============================================================ */

function validateLimits(
  request: any,
  reply: any,
  body: {
    dailyLimit?: unknown;

    hourlyLimit?: unknown;

    maintenanceMessage?: unknown;
  },

  data: {
    enabled?: boolean;

    model?: string;

    dailyLimit?: number;

    hourlyLimit?: number;

    maintenanceMessage?: string;
  }
) {
  // =====================================
  // الحد اليومي لكل مستخدم
  // =====================================

  if (
    body?.dailyLimit !==
    undefined
  ) {
    const value =
      Number(
        body.dailyLimit
      );

    if (
      !Number.isInteger(
        value
      ) ||
      value < 1 ||
      value > 100000
    ) {
      return reply
        .status(400)
        .send({
          success:
            false,

          message:
            "الحد اليومي يجب أن يكون رقماً بين 1 و 100000.",
        });
    }

    data.dailyLimit =
      value;
  }

  // =====================================
  // الحد بالساعة لكل مستخدم
  // =====================================

  if (
    body?.hourlyLimit !==
    undefined
  ) {
    const value =
      Number(
        body.hourlyLimit
      );

    if (
      !Number.isInteger(
        value
      ) ||
      value < 1 ||
      value > 100000
    ) {
      return reply
        .status(400)
        .send({
          success:
            false,

          message:
            "الحد الساعي يجب أن يكون رقماً بين 1 و 100000.",
        });
    }

    data.hourlyLimit =
      value;
  }

  // =====================================
  // رسالة الصيانة
  // =====================================

  if (
    body?.maintenanceMessage !==
    undefined
  ) {
    const value =
      String(
        body.maintenanceMessage ||
          ""
      ).trim();

    if (!value) {
      return reply
        .status(400)
        .send({
          success:
            false,

          message:
            "رسالة الصيانة لا يمكن أن تكون فارغة.",
        });
    }

    if (
      value.length >
      1000
    ) {
      return reply
        .status(400)
        .send({
          success:
            false,

          message:
            "رسالة الصيانة طويلة جداً (الحد الأقصى 1000 حرف).",
        });
    }

    data.maintenanceMessage =
      value;
  }

  if (
    Object.keys(data)
      .length ===
    0
  ) {
    return reply
      .status(400)
      .send({
        success:
          false,

        message:
          "لا توجد إعدادات لتحديثها.",
      });
  }

  return saveAiSettings(
    request.server,
    request,
    reply,
    data
  );
}

/* ============================================================
   💾 حفظ الإعدادات + تسجيل النشاط
============================================================ */

async function saveAiSettings(
  app: FastifyInstance,
  request: any,
  reply: any,
  data: {
    enabled?: boolean;
    model?: string;
    dailyLimit?: number;
    hourlyLimit?: number;
    maintenanceMessage?: string;
  }
) {
  try {
    await app.prisma.aiSettings.upsert({
      where: { id: 1 },

      create: {
        ...data,
      },

      update: {
        ...data,
      },
    });

    // إبطال الكاش حتى تُطبَّق الإعدادات فوراً
    invalidateAiSettingsCache();

    const settings =
      await getAiSettings(
        app.prisma
      );

    await logAdminActivity(
      app,
      request,
      {
        action: "ai_settings_update",

        target: "المعلم الذكي",

        details: Object.entries(data)
          .map(
            ([key, value]) =>
              `${key}=${
                typeof value === "string"
                  ? value
                  : JSON.stringify(value)
              }`
          )
          .join("، "),
      }
    );

    return reply.send({
      success: true,

      message:
        "تم حفظ إعدادات المعلم الذكي بنجاح",

      settings: publicSettings(
        settings
      ),
    });
  } catch (error) {
    request.log.error(
      error,
      "Failed to update AI settings"
    );

    return reply.status(500).send({
      success: false,

      message:
        "تعذر حفظ إعدادات المعلم الذكي، حاول مرة أخرى.",
    });
  }
}