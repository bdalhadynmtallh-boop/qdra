import { FastifyInstance } from "fastify";

/* =========================================================
   🎓 المعلم الذكي في قُدرة — معلم شخصي حقيقي

   ترتيب النماذج:
   1) Gemini 3.7 Flash      — حد داخلي 20 طلباً يومياً
   2) Gemini 3.5 Flash Lite — حد داخلي 500
   3) Gemini 3.1 Flash Lite — حد داخلي 500

   المفتاح:
   GEMINI_API_KEY

   ملاحظة:
   العدادات الحالية داخل ذاكرة السيرفر.
   إعادة تشغيل السيرفر تعيد العدادات إلى صفر.
========================================================= */

// =========================================================
// 🤖 نماذج Gemini
// =========================================================

const PRIMARY_MODEL = "gemini-3.7-flash";
const SECONDARY_MODEL = "gemini-3.5-flash-lite";
const FALLBACK_MODEL = "gemini-3.1-flash-lite";

// =========================================================
// 📊 الحدود اليومية
// =========================================================

const PRIMARY_DAILY_CAP = Number(
  process.env.GEMINI_37_DAILY_CAP || 20
);

const SECONDARY_DAILY_CAP = Number(
  process.env.GEMINI_35_DAILY_CAP || 500
);

const FALLBACK_DAILY_CAP = Number(
  process.env.GEMINI_31_DAILY_CAP || 500
);

const QUOTA_WARNING_THRESHOLD = 0.9;

const GEMINI_STREAM_URL_FOR = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

// =========================================================
// 📊 عدّاد الاستهلاك اليومي
// =========================================================

function pacificDateKey(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

const usageCounters = new Map<string, number>();

function incrementUsage(model: string): number {
  const key = `${pacificDateKey()}:${model}`;

  const next =
    (usageCounters.get(key) || 0) + 1;

  usageCounters.set(key, next);

  return next;
}

function getUsage(model: string): number {
  return (
    usageCounters.get(
      `${pacificDateKey()}:${model}`
    ) || 0
  );
}

function isModelNearCap(
  model: string,
  cap: number
): boolean {
  return (
    getUsage(model) >=
    cap * QUOTA_WARNING_THRESHOLD
  );
}

function isModelAtCap(
  model: string,
  cap: number
): boolean {
  return getUsage(model) >= cap;
}

// تنظيف عدادات الأيام القديمة
setInterval(() => {
  const todayKey = pacificDateKey();

  for (const key of usageCounters.keys()) {
    if (!key.startsWith(todayKey)) {
      usageCounters.delete(key);
    }
  }
}, 60 * 60 * 1000).unref?.();

// =========================================================
// 🧠 التفكير العميق
// =========================================================

const DEEP_REASONING_CATEGORIES = new Set([
  "استيعاب المقروء",
  "الخطأ السياقي",
]);

// =========================================================
// 🚦 Rate Limiting
// =========================================================

const RATE_LIMIT_WINDOW_MS =
  60 * 60 * 1000;

const RATE_LIMIT_MAX_REQUESTS = 30;

const rateLimitStore =
  new Map<string, number[]>();

function checkRateLimit(
  userId: string
): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();

  const timestamps = (
    rateLimitStore.get(userId) || []
  ).filter(
    (t) =>
      now - t <
      RATE_LIMIT_WINDOW_MS
  );

  if (
    timestamps.length >=
    RATE_LIMIT_MAX_REQUESTS
  ) {
    rateLimitStore.set(
      userId,
      timestamps
    );

    return {
      allowed: false,
      remaining: 0,
    };
  }

  timestamps.push(now);

  rateLimitStore.set(
    userId,
    timestamps
  );

  return {
    allowed: true,

    remaining:
      RATE_LIMIT_MAX_REQUESTS -
      timestamps.length,
  };
}

setInterval(() => {
  const now = Date.now();

  for (
    const [
      userId,
      timestamps,
    ] of rateLimitStore.entries()
  ) {
    const fresh =
      timestamps.filter(
        (t) =>
          now - t <
          RATE_LIMIT_WINDOW_MS
      );

    if (fresh.length === 0) {
      rateLimitStore.delete(
        userId
      );
    } else {
      rateLimitStore.set(
        userId,
        fresh
      );
    }
  }
}, 15 * 60 * 1000).unref?.();

// =========================================================
// 🧩 سؤال "اختبرني" المعلق
// =========================================================

interface PendingQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;
  passage?: string;
  createdAt: number;
}

const pendingQuizStore =
  new Map<string, PendingQuiz>();

const lastCategoryStore =
  new Map<string, string>();

const PENDING_QUIZ_TTL_MS =
  30 * 60 * 1000;

function getPendingQuiz(
  userId: string
): PendingQuiz | null {
  const pending =
    pendingQuizStore.get(userId);

  if (!pending) {
    return null;
  }

  if (
    Date.now() -
      pending.createdAt >
    PENDING_QUIZ_TTL_MS
  ) {
    pendingQuizStore.delete(
      userId
    );

    return null;
  }

  return pending;
}

const ARABIC_LETTERS = [
  "أ",
  "ب",
  "ج",
  "د",
  "هـ",
];

function matchStudentAnswer(
  message: string,
  pending: PendingQuiz
): number | null {
  const trimmed =
    message.trim();

  // رقم مباشر
  const numMatch =
    trimmed.match(/\d+/);

  if (numMatch) {
    const idx =
      parseInt(
        numMatch[0],
        10
      ) - 1;

    if (
      idx >= 0 &&
      idx <
        pending.options.length &&
      trimmed.length <= 6
    ) {
      return idx;
    }
  }

  // حرف عربي
  if (trimmed.length <= 8) {
    for (
      let i = 0;
      i <
        ARABIC_LETTERS.length &&
      i <
        pending.options.length;
      i++
    ) {
      if (
        trimmed.includes(
          ARABIC_LETTERS[i]
        )
      ) {
        return i;
      }
    }
  }

  // تطابق نصي
  const normalized =
    trimmed.replace(
      /[\s\u064B-\u065F]/g,
      ""
    );

  for (
    let i = 0;
    i <
    pending.options.length;
    i++
  ) {
    const opt =
      pending.options[
        i
      ].replace(
        /[\s\u064B-\u065F]/g,
        ""
      );

    if (
      opt &&
      normalized &&
      (
        normalized === opt ||
        normalized.includes(opt)
      )
    ) {
      return i;
    }
  }

  return null;
}

// =========================================================
// 🧠 شخصية المعلم
// =========================================================

const BASE_SYSTEM_PROMPT = `
أنت "المعلم الذكي في قُدرة"، مدرّس خصوصي خبير في القسم اللفظي من اختبار القدرات العامة (قياس) في السعودية.

تخصصك:
التناظر اللفظي، إكمال الجمل، الخطأ السياقي، المفردة المختلفة، استيعاب المقروء، المفردات، العلاقات بين الكلمات، واستراتيجيات القدرات اللفظية.

شخصيتك:
- واضح وذكي وصبور وطبيعي.
- مختصر عندما يكون السؤال سهلاً، ومفصل عندما يكون صعباً.
- مشجع دون مبالغة.
- لا تتحدث بأسلوب روبوتي أو رسمي مفرط.
- استخدم أسلوب مدرس خبير.

فهم السياق:
- أنت تتابع محادثة مستمرة.
- قد يقول الطالب "ما فهمت" أو "ليش؟" أو "وضح أكثر" أو "أعطني مثالاً".
- اربط هذه الرسائل بالشرح السابق.
- إذا قال الطالب "ما فهمت"، فأعد الشرح بطريقة أبسط.
- لا تطلب إعادة السؤال إذا كان المقصود واضحاً.

مصدر الأسئلة والخيارات — إلزامي جداً:

- لا تخترع أي سؤال من نفسك.
- لا تنشئ سؤالاً جديداً من خيالك.
- لا تنشئ خيارات جديدة.
- لا تغير صياغة سؤال موجود في بنك الأسئلة.
- لا تغير نص أي خيار موجود في البنك.
- لا تضف خياراً.
- لا تحذف خياراً.
- لا تستبدل خيارات البنك بخيارات من عندك.
- لا تخترع إجابة صحيحة.
- عندما يطلب الطالب سؤالاً تدريبياً أو اختباراً أو مثالاً، استخدم فقط السؤال الذي يرسله النظام من بنك أسئلة قُدرة.
- إذا لم يتوفر سؤال من البنك، أخبر الطالب أن السؤال التدريبي غير متوفر حالياً.
- لا تعوض ذلك بسؤال من عندك.

الإجابة الصحيحة — إلزامي:

- إذا أرسل النظام الإجابة الصحيحة المؤكدة، فهي نهائية.
- لا تعيد اختيار الإجابة بنفسك.
- لا تغير الإجابة الصحيحة.
- اشرح لماذا الإجابة المحددة من النظام صحيحة.
- تعامل فقط مع الخيارات المرسلة من النظام.

استيعاب المقروء:

- إذا أرسلت قطعة استيعاب مقروء، فهي جزء أساسي من السؤال.
- اقرأ القطعة كاملة.
- اعتمد عليها بوصفها المصدر الأساسي للإجابة.
- اربط المعلومات الواردة فيها عند الحاجة.
- لا تستخدم معلومات خارجية لإثبات الإجابة إذا كان يمكن تحديدها من القطعة.
- لا تتجاهل أجزاء القطعة أثناء الاستدلال.
- إذا كانت الإجابة الصحيحة مؤكدة من النظام، فلا تغيرها.

شرح السؤال الحالي:

استخدم عند الحاجة هذا التنظيم:

الفكرة

اشرح الفكرة الأساسية.

الحل

اذكر الإجابة الصحيحة المؤكدة.

لماذا؟

اشرح سبب صحة الإجابة.

المشتت

اشرح أقوى خيار خاطئ عند الحاجة.

القاعدة

اذكر القاعدة أو الطريقة المفيدة لسؤال مشابه.

التدريب التفاعلي:

- إذا قال الطالب "اختبرني" أو "أعطني سؤالاً" أو "سؤال مشابه" أو "أعطني مثالاً"، استخدم فقط سؤال البنك الذي أرسله النظام.
- لا تكشف الإجابة الصحيحة قبل إجابة الطالب.
- لا تغير الخيارات.
- إذا أرسل النظام نتيجة برمجية لإجابة الطالب، فالنتيجة نهائية.
- لا تعيد تقييم صحة الإجابة بنفسك.
- اشرح النتيجة فقط.

منع الهلوسة:

- لا تخترع إجابات.
- لا تخترع خيارات.
- لا تخترع أسئلة تدريبية.
- لا تدع أن سؤالاً من عندك موجود في بنك الأسئلة.
- لا تدع وجود معلومات لم يرسلها النظام.
- إذا تعذر تحديد معلومة من المعطيات، قل ذلك بوضوح.

الإملاء والكتابة:

- اكتب بالعربية الفصحى الواضحة.
- راجع الإملاء والنحو والصياغة قبل إخراج الرد.
- راجع الهمزات والتاء المربوطة والتاء المفتوحة.
- لا تكتب كلمات ملتصقة.
- لا تكرر الحروف بالخطأ.
- لا تستخدم كلمات مشوهة.
- لا تعرض رموزاً برمجية للطالب.
- لا تكتب \\n أو \\t كنص ظاهر.

تنسيق الرد:

- استخدم نصاً عادياً فقط.
- لا تستخدم Markdown.
- لا تستخدم علامات الشباك لإنشاء العناوين.
- لا تستخدم النجمتين لتغليظ النص.
- لا تستخدم الشرطة السفلية للتنسيق.
- لا تستخدم HTML.
- لا تستخدم علامات الاقتباس البرمجية.
- اكتب العناوين مباشرة دون رموز.
- استخدم الأسطر الفارغة لتنظيم الشرح.
- لا تغير نص السؤال أو الخيارات الأصلية من البنك.

الأسلوب:

- ابدأ بالإجابة المباشرة ثم الشرح.
- استخدم العناوين القصيرة عند الحاجة.
- تجنب الفقرات الطويلة.
- كن موجزاً في السهل ومفصلاً في الصعب.
`;

// =========================================================
// 🏫 معرفة المنصة
// =========================================================

const PLATFORM_KNOWLEDGE = `
معرفتك بمنصة قُدرة:

- اسم المنصة: قُدرة — منصة تدريب على القسم اللفظي من اختبار القدرات (قياس).
- المؤسس: [اكتب اسم المؤسس هنا].
- نبذة: [اكتب نبذة قصيرة عن المنصة ورؤيتها هنا].

المميزات:
1) أقسام تدريبية مصنفة.
2) محاكي اختبار شامل بمؤقت وتقرير أداء.
3) ملفات PDF لكل قسم.
4) دروس الأساسيات.
5) متابعة التقدم والإحصائيات والمفضلة ومراجعة الأخطاء.
6) المعلم الذكي.

- الاشتراك يفعل برمز تفعيل يحدد المدة.
- عدد الأقسام الحالي: {SECTIONS_COUNT}.
- عدد الأسئلة الحالي: {QUESTIONS_COUNT}.
- إذا سئلت عن معلومة غير موجودة هنا، فلا تخترعها.
`;

let platformStatsCache: {
  sections: number;
  questions: number;
  at: number;
} | null = null;

const PLATFORM_STATS_TTL =
  10 * 60 * 1000;

async function getPlatformStats(
  app: FastifyInstance
) {
  if (
    platformStatsCache &&
    Date.now() -
      platformStatsCache.at <
      PLATFORM_STATS_TTL
  ) {
    return platformStatsCache;
  }

  try {
    const sections =
      await app.prisma.section.findMany({
        where: {
          isActive: true,
        },

        select: {
          questions: true,
        },
      });

    let questions = 0;

    for (const s of sections) {
      if (
        Array.isArray(
          s.questions
        )
      ) {
        questions += (
          s.questions as any[]
        ).length;
      }
    }

    platformStatsCache = {
      sections:
        sections.length,

      questions,

      at: Date.now(),
    };
  } catch (e) {
    console.error(
      "platform stats error:",
      e
    );

    if (
      !platformStatsCache
    ) {
      platformStatsCache = {
        sections: 0,
        questions: 0,
        at: Date.now(),
      };
    }
  }

  return platformStatsCache;
}

// =========================================================
// 🤖 تحليل مستوى الطالب
// =========================================================

interface SkillStat {
  name: string;
  correct: number;
  total: number;
  accuracy: number;
}

function classifySkill(
  accuracy: number,
  total: number
):
  | "قوة"
  | "متوسط"
  | "ضعف"
  | "غير كافٍ" {
  const MIN_SAMPLE = 8;

  if (total < MIN_SAMPLE) {
    return "غير كافٍ";
  }

  if (accuracy >= 90) {
    return "قوة";
  }

  if (accuracy < 70) {
    return "ضعف";
  }

  return "متوسط";
}

async function buildStudentProfile(
  app: FastifyInstance,
  userId: string
) {
  const attempts: Array<{
    sectionId: number;
    questionId: string;
    isCorrect: boolean;
  }> =
    await app.prisma.questionAttempt.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take: 150,

      select: {
        sectionId: true,
        questionId: true,
        isCorrect: true,
      },
    });

  if (
    attempts.length === 0
  ) {
    return null;
  }

  const sectionIds = [
    ...new Set(
      attempts.map(
        (a: any) =>
          a.sectionId
      )
    ),
  ];

  const sections =
    await app.prisma.section.findMany({
      where: {
        id: {
          in: sectionIds,
        },
      },

      select: {
        id: true,
        questions: true,
      },
    });

  const qCategory =
    new Map<
      string,
      string
    >();

  for (const sec of sections) {
    const questions =
      Array.isArray(
        sec.questions
      )
        ? sec.questions
        : [];

    for (
      const q of questions as Array<{
        id?: string | number;
        category?: string;
      }>
    ) {
      if (
        q &&
        q.id !== undefined
      ) {
        qCategory.set(
          String(q.id),

          q.category ||
            `قسم ${sec.id}`
        );
      }
    }
  }

  const stats =
    new Map<
      string,
      SkillStat
    >();

  for (const a of attempts) {
    const cat =
      qCategory.get(
        String(
          a.questionId
        )
      ) ||
      `قسم ${a.sectionId}`;

    const cur =
      stats.get(cat) || {
        name: cat,
        correct: 0,
        total: 0,
        accuracy: 0,
      };

    cur.total += 1;

    if (a.isCorrect) {
      cur.correct += 1;
    }

    stats.set(
      cat,
      cur
    );
  }

  const skills:
    SkillStat[] = [];

  for (
    const s of stats.values()
  ) {
    s.accuracy =
      Math.round(
        (
          s.correct /
          s.total
        ) * 100
      );

    skills.push(s);
  }

  skills.sort(
    (a, b) =>
      a.accuracy -
      b.accuracy
  );

  const strengths =
    skills
      .filter(
        (s) =>
          classifySkill(
            s.accuracy,
            s.total
          ) === "قوة"
      )
      .map(
        (s) => s.name
      );

  const weaknesses =
    skills
      .filter(
        (s) =>
          classifySkill(
            s.accuracy,
            s.total
          ) === "ضعف"
      )
      .map(
        (s) => s.name
      );

  const totalCorrect =
    attempts.filter(
      (a) => a.isCorrect
    ).length;

  const total =
    attempts.length;

  return {
    skills,
    strengths,
    weaknesses,
    solvedQuestions: total,

    accuracy:
      Math.round(
        (
          totalCorrect /
          total
        ) * 100
      ),
  };
}

// =========================================================
// 📚 سؤال مشابه
// =========================================================

interface BankQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;
  explanation?: string;
  passage?: string;
}

async function fetchSimilarQuestion(
  app: FastifyInstance,
  category?: string,
  excludeText?: string
): Promise<BankQuestion | null> {
  const sections =
    await app.prisma.section.findMany({
      where: {
        isActive: true,
      },

      select: {
        id: true,
        questions: true,
      },

      take: 40,
    });

  const all: Array<{
    question: any;
    sectionId: number;
  }> = [];

  for (const sec of sections) {
    if (
      Array.isArray(
        sec.questions
      )
    ) {
      for (
        const q of sec.questions as any[]
      ) {
        if (
          q &&
          q.question
        ) {
          all.push({
            question: q,
            sectionId:
              sec.id,
          });
        }
      }
    }
  }

  let pool = all;

  if (category) {
    const exact =
      all.filter(
        (x) =>
          (
            x.question
              .category ||
            ""
          ) === category
      );

    if (
      exact.length > 0
    ) {
      pool = exact;
    } else {
      pool =
        all.filter(
          (x) => {
            const c =
              String(
                x.question
                  .category ||
                  ""
              );

            return (
              c.includes(
                category
              ) ||
              category.includes(
                c
              )
            );
          }
        );
    }

    if (
      pool.length === 0
    ) {
      return null;
    }
  }

  if (excludeText) {
    pool =
      pool.filter(
        (x) =>
          x.question
            .question !==
          excludeText
      );
  }

  if (
    pool.length === 0
  ) {
    return null;
  }

  const pick =
    pool[
      Math.floor(
        Math.random() *
          pool.length
      )
    ];

  return {
    question:
      pick.question
        .question,

    options:
      Array.isArray(
        pick.question
          .options
      )
        ? pick.question
            .options
        : [],

    correctIndex:
      typeof pick
        .question
        .correctIndex ===
      "number"
        ? pick.question
            .correctIndex
        : 0,

    category:
      pick.question
        .category,

    explanation:
      pick.question
        .explanation,

    passage: String(
      pick.question
        .passage ||
        pick.question
          .context ||
        pick.question
          .passageText ||
        pick.question
          .readingPassage ||
        pick.question
          .paragraph ||
        ""
    ),
  };
}

// =========================================================
// 🔍 كشف النية
// =========================================================

function detectIntent(
  question: string
): {
  action:
    | "similar"
    | "quiz"
    | "harder"
    | "easier"
    | "other";
} {
  const q =
    question.trim();

  if (
    /اختبرني|سؤال(ا| التدريبي| تدريبي)?|امتحن|جرّبني|حدّثني|سؤال مشابه|مشابه|أعطني مثال|اعطني مثال|مثال/.test(
      q
    )
  ) {
    return {
      action:
        "similar",
    };
  }

  if (
    /أصعب|صعب أكثر|رفع المستوى|أصعب سؤال/.test(
      q
    )
  ) {
    return {
      action:
        "harder",
    };
  }

  if (
    /أسهل|سهل|أبسط|أدنى مستوى/.test(
      q
    )
  ) {
    return {
      action:
        "easier",
    };
  }

  return {
    action: "other",
  };
}

// =========================================================
// 💾 المحادثة
// =========================================================

const SESSION_ACTIVE_WINDOW_MS =
  30 * 60 * 1000;

async function loadRecentConversation(
  app: FastifyInstance,
  userId: string
) {
  try {
    const convo =
      await app.prisma.aiConversation.findFirst({
        where: {
          userId,
        },

        orderBy: {
          updatedAt:
            "desc",
        },
      });

    if (!convo) {
      return null;
    }

    const isStale =
      Date.now() -
        new Date(
          convo.updatedAt
        ).getTime() >
      SESSION_ACTIVE_WINDOW_MS;

    if (isStale) {
      return null;
    }

    return convo;
  } catch (e) {
    console.error(
      "loadRecentConversation error:",
      e
    );

    return null;
  }
}

async function saveConversationTurn(
  app: FastifyInstance,
  userId: string,
  updatedMessages: Array<{
    role: string;
    text: string;
  }>
) {
  try {
    const recent =
      await loadRecentConversation(
        app,
        userId
      );

    if (recent) {
      await app.prisma.aiConversation.update({
        where: {
          id: recent.id,
        },

        data: {
          messages:
            updatedMessages as any,
        },
      });
    } else {
      await app.prisma.aiConversation.create({
        data: {
          userId,

          messages:
            updatedMessages as any,
        },
      });
    }
  } catch (e) {
    console.error(
      "saveConversationTurn error:",
      e
    );
  }
}

// =========================================================
// 🚀 Routes
// =========================================================

export async function aiRoutes(
  app: FastifyInstance
) {
  // =======================================================
  // CORS
  // =======================================================

  app.options(
    "/ai/ask",
    async (
      request,
      reply
    ) => {
      const origin =
        request.headers
          .origin ||
        "*";

      reply
        .header(
          "Access-Control-Allow-Origin",
          origin
        )
        .header(
          "Access-Control-Allow-Credentials",
          "true"
        )
        .header(
          "Access-Control-Allow-Methods",
          "POST, OPTIONS"
        )
        .header(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Cookie"
        )
        .header(
          "Access-Control-Max-Age",
          "3600"
        )
        .status(204)
        .send();
    }
  );

  // =======================================================
  // HISTORY
  // =======================================================

  app.get(
    "/ai/history",
    {
      preHandler:
        app.authenticate,
    },
    async (
      request,
      reply
    ) => {
      const user = (
        request as any
      ).user as
        | {
            id?: string;
          }
        | undefined;

      const userId =
        user?.id;

      if (!userId) {
        return reply
          .status(401)
          .send({
            success:
              false,

            message:
              "يجب تسجيل الدخول.",
          });
      }

      const convo =
        await loadRecentConversation(
          app,
          userId
        );

      return reply.send({
        success: true,

        messages:
          convo?.messages ??
          [],
      });
    }
  );

  // =======================================================
  // QUOTA STATUS
  // =======================================================

  app.get(
    "/ai/quota-status",
    {
      preHandler:
        app.authenticate,
    },
    async (
      _request,
      reply
    ) => {
      return reply.send({
        success: true,

        date:
          pacificDateKey(),

        primary: {
          model:
            PRIMARY_MODEL,

          used:
            getUsage(
              PRIMARY_MODEL
            ),

          cap:
            PRIMARY_DAILY_CAP,

          remaining:
            Math.max(
              0,

              PRIMARY_DAILY_CAP -
                getUsage(
                  PRIMARY_MODEL
                )
            ),
        },

        secondary: {
          model:
            SECONDARY_MODEL,

          used:
            getUsage(
              SECONDARY_MODEL
            ),

          cap:
            SECONDARY_DAILY_CAP,

          remaining:
            Math.max(
              0,

              SECONDARY_DAILY_CAP -
                getUsage(
                  SECONDARY_MODEL
                )
            ),
        },

        fallback: {
          model:
            FALLBACK_MODEL,

          used:
            getUsage(
              FALLBACK_MODEL
            ),

          cap:
            FALLBACK_DAILY_CAP,

          remaining:
            Math.max(
              0,

              FALLBACK_DAILY_CAP -
                getUsage(
                  FALLBACK_MODEL
                )
            ),
        },
      });
    }
  );

  // =======================================================
  // FEEDBACK
  // =======================================================

  app.post(
    "/ai/feedback",
    {
      preHandler:
        app.authenticate,
    },
    async (
      request,
      reply
    ) => {
      const user = (
        request as any
      ).user as
        | {
            id?: string;
          }
        | undefined;

      const userId =
        user?.id;

      if (!userId) {
        return reply
          .status(401)
          .send({
            success:
              false,

            message:
              "يجب تسجيل الدخول.",
          });
      }

      const {
        messageIndex,
        rating,
      } =
        request.body as {
          messageIndex?: number;

          rating?:
            | "up"
            | "down";
        };

      if (
        rating !==
          "up" &&
        rating !==
          "down"
      ) {
        return reply
          .status(400)
          .send({
            success:
              false,

            message:
              "قيمة تقييم غير صالحة.",
          });
      }

      try {
        await app.prisma.aiFeedback.create({
          data: {
            userId,

            messageIndex:
              messageIndex ??
              -1,

            rating,
          },
        });
      } catch (e) {
        console.error(
          "feedback save error:",
          e
        );
      }

      return reply.send({
        success: true,
      });
    }
  );

  // =======================================================
  // 🤖 ASK
  // =======================================================

  app.post(
    "/ai/ask",
    {
      preHandler:
        app.authenticate,
    },
    async (
      request,
      reply
    ) => {
      const apiKey =
        process.env
          .GEMINI_API_KEY;

      if (!apiKey) {
        return reply
          .status(500)
          .send({
            success:
              false,

            message:
              "لم يتم إعداد مفتاح الذكاء الاصطناعي.",
          });
      }

      const user = (
        request as any
      ).user as
        | {
            id?: string;
          }
        | undefined;

      const userId =
        user?.id;

      if (!userId) {
        return reply
          .status(401)
          .send({
            success:
              false,

            message:
              "يجب تسجيل الدخول.",
          });
      }

      // =====================================================
      // RATE LIMIT
      // =====================================================

      const rate =
        checkRateLimit(
          userId
        );

      if (!rate.allowed) {
        return reply
          .status(429)
          .send({
            success:
              false,

            message:
              "لقد استخدمت الحد الأقصى من الأسئلة لهذه الساعة. حاول مجدداً بعد قليل.",
          });
      }

      // =====================================================
      // BODY
      // =====================================================

      const body =
        request.body as {
          question?: string;

          currentQuestion?: {
            question: string;
            options: string[];
            correctIndex: number;
            category?: string;
            passage?: string;

            context?: string;
            passageText?: string;
            readingPassage?: string;
            paragraph?: string;
          };

          history?: Array<{
            role: string;
            text: string;
          }>;

          studentProfile?: {
            level?: string;
            solvedQuestions?: number;
            accuracy?: number;
            strengths?: string[];
            weaknesses?: string[];
          };
        };

      const contents: Array<{
        role: string;

        parts: Array<{
          text: string;
        }>;
      }> = [];

      // =====================================================
      // HISTORY
      // =====================================================

      if (
        Array.isArray(
          body?.history
        )
      ) {
        const recent =
          body.history.slice(
            -8
          );

        for (
          const m of recent
        ) {
          const role =
            m.role ===
            "assistant"
              ? "model"
              : "user";

          contents.push({
            role,

            parts: [
              {
                text: String(
                  m.text ||
                    ""
                ).slice(
                  0,
                  1500
                ),
              },
            ],
          });
        }
      }

      let currentCategory:
        | string
        | undefined;

      let currentQuestionText:
        | string
        | undefined;

      let useDeepReasoning =
        false;

      let verifiedAnswerHandled =
        false;

      const cq =
        body?.currentQuestion;

      // =====================================================
      // السؤال الحالي
      // =====================================================

      if (
        cq &&
        cq.question
      ) {
        currentCategory =
          cq.category;

        currentQuestionText =
          cq.question;

        if (cq.category) {
          lastCategoryStore.set(
            userId,
            String(
              cq.category
            )
          );
        }

        if (
          cq.category &&
          DEEP_REASONING_CATEGORIES.has(
            cq.category
          )
        ) {
          useDeepReasoning =
            true;
        }

        const validOptions =
          Array.isArray(
            cq.options
          ) &&
          cq.options.length >=
            2 &&
          typeof cq.correctIndex ===
            "number" &&
          cq.correctIndex >=
            0 &&
          cq.correctIndex <
            cq.options.length;

        const correctOption =
          validOptions
            ? cq.options[
                cq.correctIndex
              ]
            : null;

        // ===================================================
        // القطعة
        // ===================================================

        let passage =
          typeof cq.passage ===
          "string"
            ? cq.passage.trim()
            : "";

        if (!passage) {
          passage =
            String(
              cq.context ||
                cq.passageText ||
                cq.readingPassage ||
                cq.paragraph ||
                ""
            ).trim();
        }

        if (!passage) {
          try {
            const secs =
              await app.prisma.section.findMany({
                where: {
                  isActive:
                    true,
                },

                select: {
                  questions:
                    true,
                },
              });

            outer: for (
              const sec of secs
            ) {
              const qs =
                Array.isArray(
                  sec.questions
                )
                  ? (sec.questions as any[])
                  : [];

              for (
                const q of qs
              ) {
                if (
                  !q ||
                  q.question !==
                    cq.question
                ) {
                  continue;
                }

                const p =
                  String(
                    q.passage ||
                      q.context ||
                      q.passageText ||
                      q.readingPassage ||
                      q.paragraph ||
                      ""
                  ).trim();

                if (p) {
                  passage =
                    p;

                  break outer;
                }
              }
            }
          } catch (e) {
            console.error(
              "passage lookup error:",
              e
            );
          }
        }

        const isReadingComprehension =
          cq.category ===
            "استيعاب المقروء" ||
          passage.length >
            0;

        const explainMsg =
          [
            `السؤال من قسم ${
              cq.category ||
              "غير محدد"
            }:`,

            "",

            passage
              ? `========== قطعة الاستيعاب المقروء ==========\n${passage}\n========== نهاية القطعة ==========`
              : "",

            "",

            "السؤال:",

            cq.question,

            "",

            "الخيارات الموجودة في بنك الأسئلة:",

            ...cq.options.map(
              (
                o,
                i
              ) =>
                `${
                  i + 1
                }) ${o}`
            ),

            "",

            correctOption
              ? `الإجابة الصحيحة المؤكدة من بنك الأسئلة: ${correctOption}`
              : "",

            "",

            isReadingComprehension
              ? [
                  "هذه مسألة استيعاب مقروء.",
                  "اقرأ قطعة الاستيعاب كاملة قبل تحليل السؤال.",
                  "اعتبر القطعة المصدر الأساسي للإجابة.",
                  "اربط بين المعلومات الواردة في القطعة عند الحاجة.",
                  "لا تستخدم معلومات خارجية لإثبات الإجابة.",
                ].join(
                  "\n"
                )
              : "",

            "",

            "اشرح هذا السؤال بالضبط.",
            "استخدم السؤال والخيارات المرسلة فقط.",
            "ممنوع تغيير السؤال أو الخيارات.",
            "ممنوع إضافة خيارات جديدة.",
            "اعتمد على الإجابة الصحيحة المؤكدة ولا تغيرها.",
            "وضح لماذا الإجابة صحيحة.",
            "وضح لماذا أقوى مشتت خاطئ غير صحيح.",
            "اذكر القاعدة المفيدة لسؤال مشابه.",
          ]
            .filter(
              Boolean
            )
            .join(
              "\n"
            );

        contents.push({
          role: "user",

          parts: [
            {
              text:
                explainMsg,
            },
          ],
        });
      } else {
        // ===================================================
        // سؤال يدوي
        // ===================================================

        const question =
          (
            body?.question ||
            ""
          ).trim();

        if (!question) {
          return reply
            .status(400)
            .send({
              success:
                false,

              message:
                "يرجى كتابة سؤال أولاً.",
            });
        }

        if (
          question.length >
          12000
        ) {
          return reply
            .status(400)
            .send({
              success:
                false,

              message:
                "السؤال أو قطعة الاستيعاب طويلة جداً. الحد الأقصى 12000 حرف.",
            });
        }

        const pending =
          getPendingQuiz(
            userId
          );

        if (pending) {
          const matchedIndex =
            matchStudentAnswer(
              question,
              pending
            );

          if (
            matchedIndex !==
            null
          ) {
            const isCorrect =
              matchedIndex ===
              pending.correctIndex;

            const correctOption =
              pending.options[
                pending
                  .correctIndex
              ];

            const studentOption =
              pending.options[
                matchedIndex
              ];

            const verificationMsg =
              [
                "النظام تحقق برمجياً من إجابة الطالب. لا تعد الحكم على الصحة بنفسك.",

                "",

                pending.passage
                  ? `قطعة الاستيعاب المقروء:\n${pending.passage}`
                  : "",

                "",

                `السؤال: ${pending.question}`,

                "",

                "الخيارات الأصلية:",

                ...pending.options.map(
                  (
                    o,
                    i
                  ) =>
                    `${
                      i +
                      1
                    }) ${o}`
                ),

                "",

                `إجابة الطالب: ${studentOption}`,

                `الإجابة الصحيحة: ${correctOption}`,

                `النتيجة المؤكدة: ${
                  isCorrect
                    ? "إجابة صحيحة"
                    : "إجابة خاطئة"
                }`,

                "",

                isCorrect
                  ? "أخبر الطالب أنه أصاب واشرح السبب والقاعدة بإيجاز."
                  : "اشرح لماذا الإجابة الصحيحة هي الصائبة ولماذا اختياره مشتت.",

                "",

                "ممنوع اختراع سؤال أو خيارات.",
              ]
                .filter(
                  Boolean
                )
                .join(
                  "\n"
                );

            contents.push({
              role: "user",

              parts: [
                {
                  text:
                    verificationMsg,
                },
              ],
            });

            if (
              pending.category &&
              DEEP_REASONING_CATEGORIES.has(
                pending.category
              )
            ) {
              useDeepReasoning =
                true;
            }

            if (
              pending.category
            ) {
              lastCategoryStore.set(
                userId,
                String(
                  pending.category
                )
              );
            }

            pendingQuizStore.delete(
              userId
            );

            verifiedAnswerHandled =
              true;
          }
        }

        if (
          !verifiedAnswerHandled
        ) {
          const intent =
            detectIntent(
              question
            );

          if (
            intent.action ===
            "similar"
          ) {
            const effectiveCategory =
              currentCategory ||
              lastCategoryStore.get(
                userId
              );

            const bank =
              await fetchSimilarQuestion(
                app,
                effectiveCategory,
                currentQuestionText
              );

            if (bank) {
              const bankPassage =
                typeof bank.passage ===
                "string"
                  ? bank.passage.trim()
                  : "";

              const validBank =
                Array.isArray(
                  bank.options
                ) &&
                bank.options.length >=
                  2 &&
                typeof bank.correctIndex ===
                  "number" &&
                bank.correctIndex >=
                  0 &&
                bank.correctIndex <
                  bank.options.length;

              if (
                !validBank
              ) {
                contents.push({
                  role:
                    "user",

                  parts: [
                    {
                      text:
                        "لم يتم العثور على سؤال تدريبي صالح من بنك الأسئلة حالياً. أخبر الطالب أن السؤال غير متوفر. ممنوع اختراع سؤال بديل.",
                    },
                  ],
                });
              } else {
                const trainingMessage =
                  `الطالب يطلب سؤالاً تدريبياً. هذا سؤال حقيقي من بنك أسئلة قُدرة:\n\n` +

                  (
                    bankPassage
                      ? `قطعة الاستيعاب المقروء:\n${bankPassage}\n\n`
                      : ""
                  ) +

                  `السؤال كما هو في البنك:\n${bank.question}\n\n` +

                  `الخيارات كما هي في البنك:\n${bank.options
                    .map(
                      (
                        o,
                        i
                      ) =>
                        `${
                          i +
                          1
                        }) ${o}`
                    )
                    .join(
                      "\n"
                    )}\n\n` +

                  `تعليمات:
- اعرض السؤال كما هو.
- اعرض الخيارات كما هي.
- لا تغير أي كلمة.
- لا تكشف الإجابة.
- انتظر إجابة الطالب.
- ممنوع اختراع سؤال آخر.`;

                contents.push({
                  role:
                    "user",

                  parts: [
                    {
                      text:
                        trainingMessage,
                    },
                  ],
                });

                pendingQuizStore.set(
                  userId,
                  {
                    question:
                      bank.question,

                    options:
                      bank.options,

                    correctIndex:
                      bank.correctIndex,

                    category:
                      bank.category,

                    passage:
                      bankPassage,

                    createdAt:
                      Date.now(),
                  }
                );

                if (
                  bank.category &&
                  DEEP_REASONING_CATEGORIES.has(
                    bank.category
                  )
                ) {
                  useDeepReasoning =
                    true;
                }
              }
            } else {
              contents.push({
                role: "user",

                parts: [
                  {
                    text:
                      "لا يوجد سؤال مناسب متوفر من بنك أسئلة قُدرة حالياً. أخبر الطالب بذلك باختصار. ممنوع اختراع سؤال بديل.",
                  },
                ],
              });
            }
          } else {
            contents.push({
              role: "user",

              parts: [
                {
                  text:
                    question,
                },
              ],
            });
          }
        }
      }

      // =====================================================
      // ملف الطالب
      // =====================================================

      let studentProfile =
        body?.studentProfile;

      try {
        const profile =
          await buildStudentProfile(
            app,
            userId
          );

        if (profile) {
          studentProfile = {
            ...studentProfile,

            solvedQuestions:
              profile.solvedQuestions,

            accuracy:
              profile.accuracy,

            strengths:
              profile.strengths,

            weaknesses:
              profile.weaknesses,
          };
        }
      } catch (e) {
        console.error(
          "AI profile build error:",
          e
        );
      }

      // =====================================================
      // SYSTEM PROMPT
      // =====================================================

      let dynamicSystemPrompt =
        BASE_SYSTEM_PROMPT;

      if (
        studentProfile
      ) {
        dynamicSystemPrompt +=
          `\n\nبيانات الطالب الحالية، استخدمها للتخصيص فقط:\n` +

          `أسئلة محلولة: ${
            studentProfile.solvedQuestions ??
            "غير معروف"
          }\n` +

          `الدقة العامة: ${
            studentProfile.accuracy !=
            null
              ? `${studentProfile.accuracy}%`
              : "غير معروف"
          }\n` +

          `${
            studentProfile.strengths
              ?.length
              ? `نقاط القوة: ${studentProfile.strengths.join(
                  "، "
                )}\n`
              : ""
          }` +

          `${
            studentProfile.weaknesses
              ?.length
              ? `نقاط الضعف: ${studentProfile.weaknesses.join(
                  "، "
                )}`
              : ""
          }`;
      }

      // =====================================================
      // معرفة المنصة
      // =====================================================

      try {
        const pStats =
          await getPlatformStats(
            app
          );

        dynamicSystemPrompt +=
          PLATFORM_KNOWLEDGE
            .replace(
              "{SECTIONS_COUNT}",
              String(
                pStats.sections
              )
            )
            .replace(
              "{QUESTIONS_COUNT}",
              String(
                pStats.questions
              )
            );
      } catch {}

      // =====================================================
      // CONFIG
      // =====================================================

      const generationConfig: Record<
        string,
        any
      > = {
        temperature: 0.4,

        maxOutputTokens:
          8192,
      };

      if (
        useDeepReasoning
      ) {
        generationConfig.thinkingConfig =
          {
            thinkingLevel:
              "high",
          };
      }

      const payload = {
        contents,

        systemInstruction: {
          parts: [
            {
              text:
                dynamicSystemPrompt,
            },
          ],
        },

        generationConfig,
      };

      // =====================================================
      // ✅ قائمة النماذج بالترتيب
      // =====================================================

      const candidates: Array<{
        model: string;
        url: string;
      }> = [];

      // =====================================================
      // 1) Gemini 3.7 Flash — 20
      // =====================================================

      if (
        !isModelAtCap(
          PRIMARY_MODEL,
          PRIMARY_DAILY_CAP
        )
      ) {
        if (
          isModelNearCap(
            PRIMARY_MODEL,
            PRIMARY_DAILY_CAP
          )
        ) {
          console.warn(
            `[Gemini quota] ${PRIMARY_MODEL}: ${getUsage(
              PRIMARY_MODEL
            )}/${PRIMARY_DAILY_CAP}`
          );
        }

        candidates.push({
          model:
            PRIMARY_MODEL,

          url:
            GEMINI_STREAM_URL_FOR(
              PRIMARY_MODEL
            ),
        });
      }

      // =====================================================
      // 2) Gemini 3.5 Flash Lite
      // =====================================================

      if (
        !isModelAtCap(
          SECONDARY_MODEL,
          SECONDARY_DAILY_CAP
        )
      ) {
        candidates.push({
          model:
            SECONDARY_MODEL,

          url:
            GEMINI_STREAM_URL_FOR(
              SECONDARY_MODEL
            ),
        });
      }

      // =====================================================
      // 3) Gemini 3.1 Flash Lite
      // =====================================================

      if (
        !isModelAtCap(
          FALLBACK_MODEL,
          FALLBACK_DAILY_CAP
        )
      ) {
        candidates.push({
          model:
            FALLBACK_MODEL,

          url:
            GEMINI_STREAM_URL_FOR(
              FALLBACK_MODEL
            ),
        });
      }

      if (
        candidates.length ===
        0
      ) {
        return reply
          .status(503)
          .send({
            success:
              false,

            message:
              "المعلم الذكي وصل للحد الأقصى من الاستخدام لهذا اليوم.",
          });
      }

      // =====================================================
      // TIMEOUT
      // =====================================================

      const controller =
        new AbortController();

      let timeout =
        setTimeout(
          () =>
            controller.abort(),
          90000
        );

      const kickIdle =
        () => {
          clearTimeout(
            timeout
          );

          timeout =
            setTimeout(
              () =>
                controller.abort(),
              60000
            );
        };

      let fullAssistantText =
        "";

      const outgoingUserText =
        cq?.question
          ? [
              `📌 السؤال: ${cq.question}`,

              cq.passage
                ? `📖 قطعة الاستيعاب:\n${cq.passage}`
                : "",
            ]
              .filter(
                Boolean
              )
              .join(
                "\n\n"
              )
          : (
              body?.question ||
              ""
            ).trim();

      // =====================================================
      // 🔄 REQUEST + FAILOVER
      // =====================================================

      try {
        let upstream:
          | Response
          | null = null;

        let chosen =
          candidates[0];

        let lastErrMsg =
          "";

        for (
          const cand of candidates
        ) {
          try {
            console.log(
              `[Gemini] تجربة ${cand.model}`
            );

            const res =
              await fetch(
                `${cand.url}&key=${apiKey}`,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify(
                      payload
                    ),

                  signal:
                    controller.signal,
                }
              );

            if (res.ok) {
              upstream =
                res;

              chosen =
                cand;

              console.log(
                `[Gemini] ✅ يعمل عبر ${cand.model}`
              );

              break;
            }

            let errMsg =
              res.statusText;

            try {
              const e =
                await res.json();

              errMsg =
                e?.error
                  ?.message ||
                errMsg;
            } catch {}

            lastErrMsg =
              `${res.status} ${errMsg}`;

            console.error(
              `[Gemini] ❌ ${cand.model}:`,
              lastErrMsg
            );

            // الانتقال دائماً للنموذج التالي
            // إذا كان هناك نموذج آخر.
            continue;
          } catch (
            fetchErr: any
          ) {
            lastErrMsg =
              fetchErr
                ?.message ||
              "fetch error";

            console.error(
              `[Gemini] ❌ ${cand.model}:`,
              lastErrMsg
            );

            if (
              controller
                .signal
                .aborted
            ) {
              break;
            }

            continue;
          }
        }

        if (!upstream) {
          clearTimeout(
            timeout
          );

          return reply
            .status(502)
            .send({
              success:
                false,

              message:
                /quota|429/i.test(
                  lastErrMsg
                )
                  ? "تم تجاوز حد الاستخدام اليومي. حاول مجدداً لاحقاً."
                  : /high demand|overloaded|temporarily unavailable|503/i.test(
                      lastErrMsg
                    )
                  ? "الخادم مزدحم حالياً. حاول مرة أخرى بعد قليل."
                  : "تعذر الحصول على إجابة الآن. حاول مرة أخرى.",
            });
        }

        // يحتسب فقط النموذج الذي نجح
        incrementUsage(
          chosen.model
        );

        console.log(
          `[Gemini usage] ${chosen.model}: ${getUsage(
            chosen.model
          )}`
        );

        // ===================================================
        // SSE
        // ===================================================

        const origin =
          request.headers
            .origin ||
          "*";

        reply.raw.writeHead(
          200,
          {
            "Content-Type":
              "text/event-stream; charset=utf-8",

            "Cache-Control":
              "no-cache, no-transform",

            Connection:
              "keep-alive",

            "X-Accel-Buffering":
              "no",

            "Access-Control-Allow-Origin":
              origin,

            "Access-Control-Allow-Credentials":
              "true",
          }
        );

        const reader =
          upstream.body?.getReader();

        if (!reader) {
          clearTimeout(
            timeout
          );

          return reply.raw.end();
        }

        const decoder =
          new TextDecoder(
            "utf-8"
          );

        let buffer = "";
        let emitted =
          false;

        while (true) {
          const {
            done,
            value,
          } =
            await reader.read();

          if (done) {
            break;
          }

          kickIdle();

          buffer +=
            decoder.decode(
              value,
              {
                stream:
                  true,
              }
            );

          const lines =
            buffer.split(
              "\n"
            );

          buffer =
            lines.pop() ||
            "";

          for (
            const line of lines
          ) {
            const trimmed =
              line.trim();

            if (
              !trimmed.startsWith(
                "data:"
              )
            ) {
              continue;
            }

            const jsonStr =
              trimmed
                .slice(5)
                .trim();

            if (
              !jsonStr ||
              jsonStr ===
                "[DONE]"
            ) {
              continue;
            }

            try {
              const chunk =
                JSON.parse(
                  jsonStr
                );

              const piece =
                chunk
                  ?.candidates?.[0]
                  ?.content
                  ?.parts?.[0]
                  ?.text;

              if (piece) {
                emitted =
                  true;

                fullAssistantText +=
                  piece;

                reply.raw.write(
                  `data: ${JSON.stringify(
                    {
                      piece,
                    }
                  )}\n\n`
                );
              }
            } catch {}
          }
        }

        // آخر buffer
        if (
          buffer
            .trim()
            .startsWith(
              "data:"
            )
        ) {
          const jsonStr =
            buffer
              .trim()
              .slice(5)
              .trim();

          if (
            jsonStr &&
            jsonStr !==
              "[DONE]"
          ) {
            try {
              const chunk =
                JSON.parse(
                  jsonStr
                );

              const piece =
                chunk
                  ?.candidates?.[0]
                  ?.content
                  ?.parts?.[0]
                  ?.text;

              if (piece) {
                emitted =
                  true;

                fullAssistantText +=
                  piece;

                reply.raw.write(
                  `data: ${JSON.stringify(
                    {
                      piece,
                    }
                  )}\n\n`
                );
              }
            } catch {}
          }
        }

        clearTimeout(
          timeout
        );

        if (!emitted) {
          reply.raw.write(
            `data: ${JSON.stringify(
              {
                error:
                  "لم تصل إجابة واضحة. حاول إعادة صياغة السؤال.",
              }
            )}\n\n`
          );
        } else {
          reply.raw.write(
            `data: ${JSON.stringify(
              {
                done:
                  true,

                model:
                  chosen.model,
              }
            )}\n\n`
          );
        }
      } catch (
        err: any
      ) {
        clearTimeout(
          timeout
        );

        console.error(
          "AI stream failed:",
          err?.message ||
            err
        );

        try {
          if (
            !reply.raw
              .headersSent
          ) {
            return reply
              .status(500)
              .send({
                success:
                  false,

                message:
                  "حدث خطأ غير متوقع في المعالج.",
              });
          }

          reply.raw.write(
            `data: ${JSON.stringify(
              {
                error:
                  "تعذر الاتصال بخدمة الذكاء الاصطناعي.",
              }
            )}\n\n`
          );
        } catch {}
      } finally {
        clearTimeout(
          timeout
        );

        if (
          !reply.raw
            .writableEnded
        ) {
          reply.raw.end();
        }

        if (
          outgoingUserText &&
          fullAssistantText
        ) {
          const priorHistory =
            Array.isArray(
              body?.history
            )
              ? body.history
              : [];

          const updated = [
            ...priorHistory,

            {
              role:
                "user",

              text:
                outgoingUserText,
            },

            {
              role:
                "assistant",

              text:
                fullAssistantText,
            },
          ];

          saveConversationTurn(
            app,
            userId,
            updated
          ).catch(
            () => {}
          );
        }
      }
    }
  );
}