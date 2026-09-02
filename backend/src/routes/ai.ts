import { FastifyInstance } from "fastify";

/* =========================================================
   🎓 المعلم الذكي في قُدرة — معلم شخصي متكيف وسريع

   ترتيب النماذج:
   1) Gemini 3.7 Flash      — 20 طلباً يومياً
   2) Gemini 3.6 Flash      — 20 طلباً يومياً
   3) Gemini 3.5 Flash      — 20 طلباً يومياً
   4) Gemini 3.5 Flash Lite — 500 طلب يومياً
   5) Gemini 3.1 Flash Lite — 500 طلب يومياً

   =========================================================
   المميزات المحفوظة:
   - Adaptive Teaching
   - تحليل أداء الطالب الحقيقي
   - تحليل حسب category
   - الأداء الحديث أهم من القديم
   - معرفة نقاط القوة والضعف
   - شرح تأسيسي
   - شرح متدرج
   - شرح مختصر
   - شرح متقدم
   - إعادة الشرح
   - منع اختراع الأسئلة
   - منع اختراع الخيارات
   - الاعتماد على الإجابة المؤكدة
   - استيعاب المقروء
   - سؤال مشابه من البنك
   - اختبار تفاعلي
   - حفظ المحادثة
   - Failover تلقائي
   - Streaming

   =========================================================
   تحسينات السرعة:
   - Cache لبنك الأسئلة
   - عدم قراءة sections/questions مع كل رسالة
   - عدم البحث في كل بنك الأسئلة عند كل passage
   - قراءة آخر 300 محاولة للطالب فقط
   - نفس إعداد التفكير لكل النماذج
   - low للأسئلة العادية
   - medium للأسئلة العميقة
   - maxOutputTokens مناسب
   - timeout مستقل لكل نموذج
========================================================= */

// =========================================================
// 🤖 نماذج Gemini
// =========================================================

const MODEL_37_FLASH = "gemini-3.7-flash";
const MODEL_36_FLASH = "gemini-3.6-flash";
const MODEL_35_FLASH = "gemini-3.5-flash";
const MODEL_35_FLASH_LITE = "gemini-3.5-flash-lite";
const MODEL_31_FLASH_LITE = "gemini-3.1-flash-lite";

// =========================================================
// 📊 الحدود اليومية
// =========================================================

const MODEL_37_DAILY_CAP = Number(
  process.env.GEMINI_37_DAILY_CAP || 20
);

const MODEL_36_DAILY_CAP = Number(
  process.env.GEMINI_36_DAILY_CAP || 20
);

const MODEL_35_DAILY_CAP = Number(
  process.env.GEMINI_35_FLASH_DAILY_CAP || 20
);

const MODEL_35_LITE_DAILY_CAP = Number(
  process.env.GEMINI_35_LITE_DAILY_CAP || 500
);

const MODEL_31_LITE_DAILY_CAP = Number(
  process.env.GEMINI_31_LITE_DAILY_CAP || 500
);

const QUOTA_WARNING_THRESHOLD = 0.9;

// =========================================================
// 🌐 Gemini Streaming URL
// =========================================================

const GEMINI_STREAM_URL_FOR = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

// =========================================================
// 🤖 ترتيب النماذج
// =========================================================

const GEMINI_MODELS = [
  {
    model: MODEL_37_FLASH,
    cap: MODEL_37_DAILY_CAP,
  },
  {
    model: MODEL_36_FLASH,
    cap: MODEL_36_DAILY_CAP,
  },
  {
    model: MODEL_35_FLASH,
    cap: MODEL_35_DAILY_CAP,
  },
  {
    model: MODEL_35_FLASH_LITE,
    cap: MODEL_35_LITE_DAILY_CAP,
  },
  {
    model: MODEL_31_FLASH_LITE,
    cap: MODEL_31_LITE_DAILY_CAP,
  },
] as const;

// =========================================================
// 📊 إعدادات تحليل مستوى الطالب
// =========================================================

const STUDENT_PROFILE_ATTEMPT_LIMIT = 300;
const RECENT_SKILL_ATTEMPT_LIMIT = 20;
const MIN_SKILL_SAMPLE = 8;

// =========================================================
// ⚡ Cache بنك الأسئلة
// =========================================================

const QUESTION_INDEX_TTL_MS =
  10 * 60 * 1000;

interface CachedQuestionMeta {
  category: string;
  passage: string;
}

interface CachedBankQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;
  explanation?: string;
  passage?: string;
}

interface QuestionIndexCache {
  at: number;

  questionMeta: Map<
    string,
    CachedQuestionMeta
  >;

  sectionCategory: Map<
    number,
    string
  >;

  allQuestions: CachedBankQuestion[];
}

let questionIndexCache:
  | QuestionIndexCache
  | null = null;

let questionIndexRefreshPromise:
  | Promise<QuestionIndexCache>
  | null = null;

// =========================================================
// 📊 عداد الاستخدام
// =========================================================

function pacificDateKey(): string {
  return new Date().toLocaleDateString(
    "en-CA",
    {
      timeZone:
        "America/Los_Angeles",
    }
  );
}

const usageCounters =
  new Map<string, number>();

function incrementUsage(
  model: string
): number {
  const key =
    `${pacificDateKey()}:${model}`;

  const next =
    (usageCounters.get(key) || 0) + 1;

  usageCounters.set(
    key,
    next
  );

  return next;
}

function getUsage(
  model: string
): number {
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
    cap *
      QUOTA_WARNING_THRESHOLD
  );
}

function isModelAtCap(
  model: string,
  cap: number
): boolean {
  return (
    getUsage(model) >= cap
  );
}

setInterval(
  () => {
    const todayKey =
      pacificDateKey();

    for (
      const key of
        usageCounters.keys()
    ) {
      if (
        !key.startsWith(
          todayKey
        )
      ) {
        usageCounters.delete(
          key
        );
      }
    }
  },
  60 * 60 * 1000
).unref?.();

// =========================================================
// 🧠 التفكير
//
// مهم:
// جميع النماذج تستخدم نفس المستويات.
//
// عادي      → low
// عميق      → medium
//
// لا يوجد نموذج يحصل على إعداد مختلف.
// =========================================================

const NORMAL_THINKING_LEVEL =
  "low" as const;

const DEEP_THINKING_LEVEL =
  "medium" as const;

function getThinkingLevel(
  useDeepReasoning: boolean
): "low" | "medium" {
  return useDeepReasoning
    ? DEEP_THINKING_LEVEL
    : NORMAL_THINKING_LEVEL;
}

const DEEP_REASONING_CATEGORIES =
  new Set([
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
  const now =
    Date.now();

  const timestamps =
    (
      rateLimitStore.get(
        userId
      ) || []
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

  timestamps.push(
    now
  );

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

setInterval(
  () => {
    const now =
      Date.now();

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

      if (
        fresh.length === 0
      ) {
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
  },
  15 * 60 * 1000
).unref?.();

// =========================================================
// 🧩 الاختبار المعلق
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
  new Map<
    string,
    PendingQuiz
  >();

const lastCategoryStore =
  new Map<string, string>();

const PENDING_QUIZ_TTL_MS =
  30 * 60 * 1000;

function getPendingQuiz(
  userId: string
): PendingQuiz | null {
  const pending =
    pendingQuizStore.get(
      userId
    );

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

  if (
    trimmed.length <= 8
  ) {
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
      pending.options[i].replace(
        /[\s\u064B-\u065F]/g,
        ""
      );

    if (
      opt &&
      normalized &&
      (
        normalized === opt ||
        normalized.includes(
          opt
        )
      )
    ) {
      return i;
    }
  }

  return null;
}

// =========================================================
// 🧠 Adaptive Teaching
// =========================================================

type TeachingDepth =
  | "foundation"
  | "guided"
  | "concise"
  | "advanced";

interface SkillStat {
  name: string;

  correct: number;
  total: number;
  accuracy: number;

  historicalCorrect: number;
  historicalTotal: number;
  historicalAccuracy: number;
}

interface InternalStudentProfile {
  skills: SkillStat[];

  strengths: string[];
  weaknesses: string[];

  solvedQuestions: number;
  accuracy: number;
}

// =========================================================
// 🧹 توحيد أسماء الفئات
// =========================================================

function normalizeCategory(
  value?: string
): string {
  return String(value || "")
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function findCurrentSkill(
  skills: SkillStat[],
  category?: string
): SkillStat | undefined {
  if (!category) {
    return undefined;
  }

  const wanted =
    normalizeCategory(
      category
    );

  const exact =
    skills.find(
      (skill) =>
        normalizeCategory(
          skill.name
        ) === wanted
    );

  if (exact) {
    return exact;
  }

  return skills.find(
    (skill) => {
      const name =
        normalizeCategory(
          skill.name
        );

      if (
        !name ||
        !wanted
      ) {
        return false;
      }

      return (
        name.includes(
          wanted
        ) ||
        wanted.includes(
          name
        )
      );
    }
  );
}

// =========================================================
// 🎯 تحديد مستوى الشرح
// =========================================================

function determineTeachingDepth(
  profile:
    | InternalStudentProfile
    | null,
  category?: string
): {
  depth: TeachingDepth;
  skill?: SkillStat;
  source:
    | "skill"
    | "general"
    | "unknown";
} {
  if (!profile) {
    return {
      depth: "guided",
      source: "unknown",
    };
  }

  const skill =
    findCurrentSkill(
      profile.skills,
      category
    );

  if (
    skill &&
    skill.total >=
      MIN_SKILL_SAMPLE
  ) {
    if (
      skill.accuracy < 60
    ) {
      return {
        depth:
          "foundation",
        skill,
        source: "skill",
      };
    }

    if (
      skill.accuracy < 80
    ) {
      return {
        depth: "guided",
        skill,
        source: "skill",
      };
    }

    if (
      skill.accuracy < 90
    ) {
      return {
        depth: "concise",
        skill,
        source: "skill",
      };
    }

    return {
      depth: "advanced",
      skill,
      source: "skill",
    };
  }

  if (
    profile.solvedQuestions >=
    15
  ) {
    if (
      profile.accuracy < 60
    ) {
      return {
        depth:
          "foundation",
        skill,
        source: "general",
      };
    }

    if (
      profile.accuracy < 80
    ) {
      return {
        depth: "guided",
        skill,
        source: "general",
      };
    }

    if (
      profile.accuracy < 90
    ) {
      return {
        depth: "concise",
        skill,
        source: "general",
      };
    }

    return {
      depth: "advanced",
      skill,
      source: "general",
    };
  }

  return {
    depth: "guided",
    skill,
    source: "unknown",
  };
}

// =========================================================
// 📚 تعليمات التدريس
// =========================================================

function buildTeachingInstruction(
  depth: TeachingDepth
): string {
  switch (depth) {
    case "foundation":
      return `
أسلوب التدريس المطلوب لهذا الطالب في هذه المهارة: تأسيسي.

- ابدأ من أساس الفكرة.
- لا تفترض أن الطالب يعرف المصطلحات أو القاعدة.
- اشرح معنى الفكرة أولاً بلغة سهلة.
- قسم الحل إلى خطوات صغيرة وواضحة.
- لا تقفز مباشرة إلى النتيجة.
- اربط كل خطوة بالسؤال الحالي.
- وضح سبب صحة الإجابة بطريقة بسيطة.
- وضح الفخ الذي قد يجعل الطالب يختار المشتت.
- اختم بقاعدة سهلة وقصيرة.
- لا تكثر المعلومات في خطوة واحدة.
- لا تخبر الطالب أنه ضعيف أو أن مستواه منخفض.
`;

    case "guided":
      return `
أسلوب التدريس المطلوب لهذا الطالب في هذه المهارة: متدرج.

- اشرح الفكرة باختصار قبل الحل.
- حل السؤال خطوة بخطوة.
- وضح نقطة التفكير الأساسية.
- اشرح سبب الإجابة الصحيحة.
- وضح أهم مشتت إذا كان مفيداً.
- اختم بقاعدة عملية لسؤال مشابه.
- لا تشرح أساسيات بعيدة عن السؤال دون حاجة.
`;

    case "concise":
      return `
أسلوب التدريس المطلوب لهذا الطالب في هذه المهارة: مختصر.

- الطالب لديه فهم جيد نسبياً لهذه المهارة.
- ابدأ مباشرة بفكرة السؤال.
- اختصر الخطوات البديهية.
- ركز على سبب اختيار الإجابة.
- ركز على المشتت أو الفخ المهم.
- اختم بقاعدة قصيرة.
- لا تطل في شرح معلومات يعرفها الطالب غالباً.
`;

    case "advanced":
      return `
أسلوب التدريس المطلوب لهذا الطالب في هذه المهارة: متقدم.

- افترض إلماماً جيداً بأساس المهارة.
- أعط الحل بصورة مباشرة ومركزة.
- لا تعد شرح المبادئ الأساسية إلا إذا طلب الطالب.
- ركز على الدقيقة اللغوية أو المنطقية التي تحسم السؤال.
- وضح المشتت الأقوى فقط إذا كانت له قيمة تعليمية.
- اجعل القاعدة النهائية دقيقة ومختصرة.
- لا تخبر الطالب بأن النظام صنفه متقدماً.
`;
  }
}

// =========================================================
// 🔄 إعادة الشرح
// =========================================================

function isConfusionMessage(
  message?: string
): boolean {
  if (!message) {
    return false;
  }

  const q =
    message.trim();

  return /ما\s*فهمت|مو\s*فاهم|مش\s*فاهم|لم\s*أفهم|وضح|وضّح|اشرح\s*أكثر|شرح\s*أكثر|أبسط|بسطها|بسّطها|من\s*الصفر|كيف\s*يعني|ليش\s*كذا|وش\s*يعني/.test(
    q
  );
}

const REEXPLAIN_INSTRUCTION = `
الطالب يشير إلى أنه لم يفهم الشرح السابق أو يريد تبسيطاً إضافياً.

تعليمات إعادة الشرح:
- لا تكرر الشرح السابق بنفس الكلمات.
- غير طريقة الشرح.
- ابدأ من نقطة أبسط.
- استخدم كلمات أسهل وجملاً أقصر.
- قسم الفكرة إلى خطوات صغيرة.
- إذا كان هناك مصطلح غير واضح، فاشرح معناه.
- لا تنشئ سؤالاً تدريبياً جديداً.
- لا تخترع خيارات.
- ركز على نقطة الالتباس المحتملة.
`;

// =========================================================
// 🧠 شخصية المعلم
// =========================================================

const BASE_SYSTEM_PROMPT = `
أنت "المعلم الذكي في قُدرة"، مدرس خصوصي خبير في القسم اللفظي من اختبار القدرات العامة (قياس) في السعودية.

هدفك ليس إعطاء الإجابة فقط، بل تعليم كل طالب بالطريقة المناسبة لمستواه الحقيقي.

تخصصك:
التناظر اللفظي، إكمال الجمل، الخطأ السياقي، المفردة المختلفة، استيعاب المقروء، المفردات، العلاقات بين الكلمات، واستراتيجيات القدرات اللفظية.

شخصيتك:
- واضح وذكي وصبور وطبيعي.
- تكيف مع مستوى الطالب.
- لا تستخدم نفس مقدار الشرح لجميع الطلاب.
- لا تكثر الشرح للطالب المتمكن.
- لا تختصر بصورة مخلة مع الطالب الذي يحتاج تأسيساً.
- مشجع دون مبالغة.
- لا تتحدث بأسلوب روبوتي أو رسمي مفرط.

التخصيص:
- النظام يحلل نتائج الطالب الحقيقية المسجلة في المنصة حسب الموضوع.
- ستصلك تعليمات تحدد مستوى الشرح المناسب للطالب.
- التزم بمستوى الشرح الذي يحدده النظام.
- مستوى الشرح يعتمد على أداء الطالب في المهارة الحالية قدر الإمكان.
- الأداء الحديث في المهارة أهم من الأداء القديم.
- لا تذكر للطالب تصنيفه الداخلي.
- لا تقل للطالب إنه ضعيف أو أن النظام صنفه بمستوى معين.
- لا تعرض نسبه أو عدد محاولاته إلا إذا طلب إحصائياته صراحة.
- استخدم البيانات داخلياً فقط لتخصيص طريقة التعليم.
- إذا كان الطالب متمكناً، اختصر.
- إذا كان يحتاج تأسيساً، ابدأ من الأساس.
- إذا قال إنه لم يفهم، غير طريقة الشرح وبسطها.

فهم السياق:
- أنت تتابع محادثة مستمرة.
- قد يقول الطالب "ما فهمت" أو "ليش؟" أو "وضح أكثر" أو "أعطني مثالاً".
- اربط هذه الرسائل بالشرح السابق.
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
- عندما يطلب الطالب سؤالاً تدريبياً أو اختباراً أو سؤالاً مشابهاً، استخدم فقط السؤال الذي يرسله النظام من بنك أسئلة قُدرة.
- إذا لم يتوفر سؤال من البنك، أخبر الطالب أن السؤال التدريبي غير متوفر حالياً.
- لا تعوض ذلك بسؤال من عندك.

الإجابة الصحيحة — إلزامي:
- إذا أرسل النظام الإجابة الصحيحة المؤكدة، فهي نهائية.
- لا تعد اختيار الإجابة بنفسك.
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
استخدم العناوين عند فائدتها، وليس بشكل آلي في كل رد.

الفكرة

الحل

لماذا؟

المشتت

القاعدة

إذا كان مستوى الطالب متقدماً، اختصر الشرح.
إذا كان مستوى الطالب تأسيسياً، قسم الشرح إلى خطوات أبسط.

التدريب التفاعلي:
- إذا طلب الطالب اختباراً أو سؤالاً تدريبياً، استخدم سؤال البنك فقط.
- لا تكشف الإجابة قبل إجابة الطالب.
- لا تغير الخيارات.
- إذا أرسل النظام نتيجة برمجية لإجابة الطالب، فهي نهائية.
- لا تعد تقييم الإجابة بنفسك.
- اشرح النتيجة بما يناسب مستوى الطالب.

منع الهلوسة:
- لا تخترع إجابات.
- لا تخترع خيارات.
- لا تخترع أسئلة تدريبية.
- لا تدع أن سؤالاً من عندك موجود في بنك الأسئلة.
- لا تدع وجود معلومات لم يرسلها النظام.
- إذا تعذر تحديد معلومة من المعطيات، قل ذلك بوضوح.

الإملاء والكتابة:
- اكتب بالعربية الفصحى الواضحة.
- راجع الإملاء والنحو والصياغة قبل الرد.
- راجع الهمزات والتاء المربوطة والتاء المفتوحة.
- لا تكتب كلمات ملتصقة.
- لا تكرر الحروف بالخطأ.
- لا تستخدم كلمات مشوهة.
- لا تعرض رموزاً برمجية للطالب.
- لا تكتب \\n أو \\t كنص ظاهر.

تنسيق الرد:
- استخدم نصاً عادياً فقط.
- لا تستخدم Markdown.
- لا تستخدم علامات الشباك للعناوين.
- لا تستخدم النجمتين لتغليظ النص.
- لا تستخدم HTML.
- اكتب العناوين مباشرة دون رموز.
- استخدم الأسطر الفارغة لتنظيم الشرح.
- لا تغير نص السؤال أو الخيارات الأصلية من البنك.
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

// =========================================================
// 📊 إحصائيات المنصة
// =========================================================

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

    for (const section of sections) {
      if (
        Array.isArray(
          section.questions
        )
      ) {
        questions +=
          (
            section.questions as any[]
          ).length;
      }
    }

    platformStatsCache = {
      sections:
        sections.length,

      questions,

      at: Date.now(),
    };
  } catch (error) {
    console.error(
      "platform stats error:",
      error
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
// ⚡ بناء فهرس الأسئلة
// =========================================================

async function refreshQuestionIndex(
  app: FastifyInstance
): Promise<QuestionIndexCache> {
  if (
    questionIndexRefreshPromise
  ) {
    return questionIndexRefreshPromise;
  }

  questionIndexRefreshPromise =
    (async () => {
      try {
        const sections =
          await app.prisma.section.findMany({
            where: {
              isActive:
                true,
            },

            select: {
              id: true,
              name: true,
              category: true,
              type: true,
              questions: true,
            },
          });

        const questionMeta =
          new Map<
            string,
            CachedQuestionMeta
          >();

        const sectionCategory =
          new Map<
            number,
            string
          >();

        const allQuestions:
          CachedBankQuestion[] =
          [];

        for (
          const section of sections
        ) {
          const fallbackCategory =
            normalizeCategory(
              section.category ||
                section.type ||
                section.name ||
                `قسم ${section.id}`
            );

          sectionCategory.set(
            section.id,
            fallbackCategory
          );

          const questions =
            Array.isArray(
              section.questions
            )
              ? section.questions
              : [];

          for (
            const question of
              questions as any[]
          ) {
            if (
              !question ||
              !question.question
            ) {
              continue;
            }

            const text =
              String(
                question.question
              );

            const category =
              normalizeCategory(
                question.category ||
                  fallbackCategory
              );

            const passage =
              String(
                question.passage ||
                  question.context ||
                  question.passageText ||
                  question.readingPassage ||
                  question.paragraph ||
                  ""
              ).trim();

            questionMeta.set(
              text,
              {
                category,
                passage,
              }
            );

            allQuestions.push({
              question:
                text,

              options:
                Array.isArray(
                  question.options
                )
                  ? question.options
                  : [],

              correctIndex:
                typeof question.correctIndex ===
                "number"
                  ? question.correctIndex
                  : 0,

              category,

              explanation:
                question.explanation,

              passage,
            });
          }
        }

        const result:
          QuestionIndexCache = {
          at: Date.now(),

          questionMeta,

          sectionCategory,

          allQuestions,
        };

        questionIndexCache =
          result;

        console.log(
          `[AI cache] Question index refreshed: ${allQuestions.length} questions`
        );

        return result;
      } finally {
        questionIndexRefreshPromise =
          null;
      }
    })();

  return questionIndexRefreshPromise;
}

async function getQuestionIndex(
  app: FastifyInstance
): Promise<QuestionIndexCache> {
  if (
    questionIndexCache &&
    Date.now() -
      questionIndexCache.at <
      QUESTION_INDEX_TTL_MS
  ) {
    return questionIndexCache;
  }

  return refreshQuestionIndex(
    app
  );
}

function getCachedQuestionMeta(
  questionText: string
): CachedQuestionMeta | undefined {
  return questionIndexCache?.questionMeta.get(
    questionText
  );
}

function getCachedSectionCategory(
  sectionId: number
): string | undefined {
  return questionIndexCache?.sectionCategory.get(
    sectionId
  );
}

// =========================================================
// 📊 تصنيف المهارة
// =========================================================

function classifySkill(
  accuracy: number,
  total: number
):
  | "قوة"
  | "متوسط"
  | "ضعف"
  | "غير كافٍ" {
  if (
    total <
    MIN_SKILL_SAMPLE
  ) {
    return "غير كافٍ";
  }

  if (
    accuracy >= 90
  ) {
    return "قوة";
  }

  if (
    accuracy < 70
  ) {
    return "ضعف";
  }

  return "متوسط";
}

// =========================================================
// 🧠 بناء ملف الطالب
// =========================================================

async function buildStudentProfile(
  app: FastifyInstance,
  userId: string
): Promise<InternalStudentProfile | null> {
  const attempts:
    Array<{
      sectionId: number;
      questionId: string;
      isCorrect: boolean;
      createdAt: Date;
    }> =
    await app.prisma.questionAttempt.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt:
          "desc",
      },

      take:
        STUDENT_PROFILE_ATTEMPT_LIMIT,

      select: {
        sectionId:
          true,

        questionId:
          true,

        isCorrect:
          true,

        createdAt:
          true,
      },
    });

  if (
    attempts.length === 0
  ) {
    return null;
  }

  /*
    إذا لم يكن الـ cache جاهزاً بعد،
    نبنيه مرة واحدة فقط.
  */

  if (
    !questionIndexCache
  ) {
    await getQuestionIndex(
      app
    );
  }

  const attemptsBySkill =
    new Map<
      string,
      Array<{
        isCorrect: boolean;
        createdAt: Date;
      }>
    >();

  for (
    const attempt of attempts
  ) {
    const meta =
      getCachedQuestionMeta(
        String(
          attempt.questionId
        )
      );

    const category =
      normalizeCategory(
        meta?.category ||
          getCachedSectionCategory(
            attempt.sectionId
          ) ||
          `قسم ${attempt.sectionId}`
      );

    const list =
      attemptsBySkill.get(
        category
      ) || [];

    list.push({
      isCorrect:
        attempt.isCorrect,

      createdAt:
        attempt.createdAt,
    });

    attemptsBySkill.set(
      category,
      list
    );
  }

  const skills:
    SkillStat[] = [];

  for (
    const [
      name,
      skillAttempts,
    ] of attemptsBySkill.entries()
  ) {
    const recentAttempts =
      skillAttempts.slice(
        0,
        RECENT_SKILL_ATTEMPT_LIMIT
      );

    const recentCorrect =
      recentAttempts.filter(
        (attempt) =>
          attempt.isCorrect
      ).length;

    const recentTotal =
      recentAttempts.length;

    const recentAccuracy =
      recentTotal > 0
        ? Math.round(
            (
              recentCorrect /
              recentTotal
            ) *
              100
          )
        : 0;

    const historicalCorrect =
      skillAttempts.filter(
        (attempt) =>
          attempt.isCorrect
      ).length;

    const historicalTotal =
      skillAttempts.length;

    const historicalAccuracy =
      historicalTotal > 0
        ? Math.round(
            (
              historicalCorrect /
              historicalTotal
            ) *
              100
          )
        : 0;

    skills.push({
      name,

      correct:
        recentCorrect,

      total:
        recentTotal,

      accuracy:
        recentAccuracy,

      historicalCorrect,

      historicalTotal,

      historicalAccuracy,
    });
  }

  skills.sort(
    (a, b) =>
      a.accuracy -
      b.accuracy
  );

  const strengths =
    skills
      .filter(
        (skill) =>
          classifySkill(
            skill.accuracy,
            skill.total
          ) ===
          "قوة"
      )
      .map(
        (skill) =>
          skill.name
      );

  const weaknesses =
    skills
      .filter(
        (skill) =>
          classifySkill(
            skill.accuracy,
            skill.total
          ) ===
          "ضعف"
      )
      .map(
        (skill) =>
          skill.name
      );

  const totalCorrect =
    attempts.filter(
      (attempt) =>
        attempt.isCorrect
    ).length;

  const total =
    attempts.length;

  const accuracy =
    total > 0
      ? Math.round(
          (
            totalCorrect /
            total
          ) *
            100
        )
      : 0;

  return {
    skills,

    strengths,

    weaknesses,

    solvedQuestions:
      total,

    accuracy,
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
  const index =
    await getQuestionIndex(
      app
    );

  let pool =
    index.allQuestions;

  if (category) {
    const wanted =
      normalizeCategory(
        category
      );

    const exact =
      pool.filter(
        (item) =>
          normalizeCategory(
            item.category
          ) === wanted
      );

    if (
      exact.length > 0
    ) {
      pool = exact;
    } else {
      pool =
        pool.filter(
          (item) => {
            const itemCategory =
              normalizeCategory(
                item.category
              );

            return (
              itemCategory.includes(
                wanted
              ) ||
              wanted.includes(
                itemCategory
              )
            );
          }
        );
    }
  }

  if (excludeText) {
    pool =
      pool.filter(
        (item) =>
          item.question !==
          excludeText
      );
  }

  if (
    pool.length === 0
  ) {
    return null;
  }

  const picked =
    pool[
      Math.floor(
        Math.random() *
          pool.length
      )
    ];

  return {
    question:
      picked.question,

    options:
      Array.isArray(
        picked.options
      )
        ? picked.options
        : [],

    correctIndex:
      typeof picked.correctIndex ===
      "number"
        ? picked.correctIndex
        : 0,

    category:
      picked.category,

    explanation:
      picked.explanation,

    passage:
      String(
        picked.passage ||
          ""
      ),
  };
}

// =========================================================
// 🔍 النية
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
  } catch (error) {
    console.error(
      "loadRecentConversation error:",
      error
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
          id:
            recent.id,
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
  } catch (error) {
    console.error(
      "saveConversationTurn error:",
      error
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
  // ⚡ بناء الـCache في الخلفية
  // =======================================================

  refreshQuestionIndex(
    app
  ).catch(
    (error) => {
      console.error(
        "Initial question cache error:",
        error
      );
    }
  );

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
        request.headers.origin ||
        "*";

      return reply
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
      const user =
        (
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
        success:
          true,

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

        models:
          GEMINI_MODELS.map(
            ({
              model,
              cap,
            }) => ({
              model,

              used:
                getUsage(
                  model
                ),

              cap,

              remaining:
                Math.max(
                  0,
                  cap -
                    getUsage(
                      model
                    )
                ),
            })
          ),
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
      const user =
        (
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
      } catch (error) {
        console.error(
          "feedback save error:",
          error
        );
      }

      return reply.send({
        success:
          true,
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

      const user =
        (
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

      if (
        !rate.allowed
      ) {
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
            question:
              string;

            options:
              string[];

            correctIndex:
              number;

            category?:
              string;

            passage?:
              string;

            context?:
              string;

            passageText?:
              string;

            readingPassage?:
              string;

            paragraph?:
              string;
          };

          history?: Array<{
            role:
              string;

            text:
              string;
          }>;

          studentProfile?: {
            level?:
              string;

            solvedQuestions?:
              number;

            accuracy?:
              number;

            strengths?:
              string[];

            weaknesses?:
              string[];
          };
        };

      const contents: Array<{
        role:
          string;

        parts: Array<{
          text:
            string;
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
          const message of
            recent
        ) {
          const role =
            message.role ===
            "assistant"
              ? "model"
              : "user";

          const text =
            String(
              message.text ||
                ""
            ).slice(
              0,
              1500
            );

          if (!text) {
            continue;
          }

          contents.push({
            role,

            parts: [
              {
                text,
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
          normalizeCategory(
            cq.category
          ) || undefined;

        currentQuestionText =
          cq.question;

        if (
          currentCategory
        ) {
          lastCategoryStore.set(
            userId,
            currentCategory
          );
        }

        if (
          currentCategory &&
          DEEP_REASONING_CATEGORIES.has(
            currentCategory
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

        if (
          !passage &&
          cq.question
        ) {
          const cached =
            getCachedQuestionMeta(
              cq.question
            );

          if (
            cached?.passage
          ) {
            passage =
              cached.passage;
          }
        }

        if (
          !passage &&
          cq.question
        ) {
          try {
            const index =
              await getQuestionIndex(
                app
              );

            const cached =
              index.questionMeta.get(
                cq.question
              );

            if (
              cached?.passage
            ) {
              passage =
                cached.passage;
            }
          } catch (error) {
            console.error(
              "passage lookup error:",
              error
            );
          }
        }

        const isReadingComprehension =
          currentCategory ===
            "استيعاب المقروء" ||
          passage.length >
            0;

        const explainMsg =
          [
            `السؤال من قسم ${
              currentCategory ||
              "غير محدد"
            }:`,
            "",

            passage
              ? `قطعة الاستيعاب المقروء:\n${passage}`
              : "",

            "",

            "السؤال:",

            cq.question,

            "",

            "الخيارات الموجودة في بنك الأسئلة:",

            ...(
              Array.isArray(
                cq.options
              )
                ? cq.options
                : []
            ).map(
              (
                option,
                index
              ) =>
                `${
                  index + 1
                }) ${option}`
            ),

            "",

            correctOption
              ? `الإجابة الصحيحة المؤكدة من بنك الأسئلة: ${correctOption}`
              : "",

            "",

            isReadingComprehension
              ? [
                  "هذه مسألة استيعاب مقروء.",
                  "اقرأ القطعة كاملة قبل التحليل.",
                  "اعتبر القطعة المصدر الأساسي للإجابة.",
                  "اربط المعلومات الواردة فيها عند الحاجة.",
                  "لا تستخدم معلومات خارجية لإثبات الإجابة.",
                ].join(
                  "\n"
                )
              : "",

            "",

            "اشرح هذا السؤال وفق مستوى الشرح الذي حدده النظام للطالب.",
            "استخدم السؤال والخيارات المرسلة فقط.",
            "ممنوع تغيير السؤال أو الخيارات.",
            "ممنوع إضافة خيارات جديدة.",
            "اعتمد على الإجابة الصحيحة المؤكدة ولا تغيرها.",
          ]
            .filter(
              Boolean
            )
            .join(
              "\n"
            );

        contents.push({
          role:
            "user",

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

        // ===================================================
        // إجابة اختبار معلق
        // ===================================================

        const pending =
          getPendingQuiz(
            userId
          );

        if (
          pending
        ) {
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
                pending.correctIndex
              ];

            const studentOption =
              pending.options[
                matchedIndex
              ];

            currentCategory =
              pending.category;

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
                    option,
                    index
                  ) =>
                    `${
                      index + 1
                    }) ${option}`
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
                  ? "اشرح سبب صحة الإجابة والقاعدة بما يناسب مستوى الطالب."
                  : "اشرح لماذا الإجابة الصحيحة هي الصائبة ولماذا اختيار الطالب كان مشتتاً، بما يناسب مستوى الطالب.",

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
              role:
                "user",

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

        // ===================================================
        // الطلب العادي
        // ===================================================

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

            currentCategory =
              effectiveCategory;

            const bank =
              await fetchSimilarQuestion(
                app,
                effectiveCategory,
                currentQuestionText
              );

            if (
              bank
            ) {
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
                  [
                    "الطالب يطلب سؤالاً تدريبياً.",

                    "",

                    "هذا سؤال حقيقي من بنك أسئلة قُدرة.",

                    bankPassage
                      ? `قطعة الاستيعاب المقروء:\n${bankPassage}`
                      : "",

                    `السؤال كما هو في البنك:\n${bank.question}`,

                    `الخيارات كما هي في البنك:\n${bank.options
                      .map(
                        (
                          option,
                          index
                        ) =>
                          `${
                            index + 1
                          }) ${option}`
                      )
                      .join(
                        "\n"
                      )}`,

                    "",
                    "تعليمات:",
                    "- اعرض السؤال كما هو.",
                    "- اعرض الخيارات كما هي.",
                    "- لا تغير أي كلمة.",
                    "- لا تكشف الإجابة.",
                    "- انتظر إجابة الطالب.",
                    "- ممنوع اختراع سؤال آخر.",
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      "\n\n"
                    );

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
                  bank.category
                ) {
                  currentCategory =
                    bank.category;

                  lastCategoryStore.set(
                    userId,
                    bank.category
                  );
                }

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
                role:
                  "user",

                parts: [
                  {
                    text:
                      "لا يوجد سؤال مناسب متوفر من بنك أسئلة قُدرة حالياً. أخبر الطالب بذلك باختصار. ممنوع اختراع سؤال بديل.",
                  },
                ],
              });
            }
          } else {
            currentCategory =
              currentCategory ||
              lastCategoryStore.get(
                userId
              );

            contents.push({
              role:
                "user",

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
      // 🧠 قراءة نتائج الطالب الحقيقية
      // =====================================================

      let internalProfile:
        | InternalStudentProfile
        | null =
        null;

      const profileStartedAt =
        Date.now();

      try {
        internalProfile =
          await buildStudentProfile(
            app,
            userId
          );
      } catch (error) {
        console.error(
          "AI profile build error:",
          error
        );
      }

      console.log(
        `[AI profile] ${Date.now() - profileStartedAt}ms`
      );

      // =====================================================
      // 🎯 المهارة الحالية
      // =====================================================

      const effectiveCategory =
        normalizeCategory(
          currentCategory ||
            cq?.category ||
            lastCategoryStore.get(
              userId
            ) ||
            ""
        ) ||
        undefined;

      // =====================================================
      // 🎯 مستوى الشرح
      // =====================================================

      const teaching =
        determineTeachingDepth(
          internalProfile,
          effectiveCategory
        );

      const teachingInstruction =
        buildTeachingInstruction(
          teaching.depth
        );

      // =====================================================
      // SYSTEM PROMPT
      // =====================================================

      let dynamicSystemPrompt =
        BASE_SYSTEM_PROMPT;

      dynamicSystemPrompt +=
        teachingInstruction;

      // =====================================================
      // 📊 بيانات الطالب
      // =====================================================

      if (
        internalProfile
      ) {
        dynamicSystemPrompt +=
          `

بيانات تعليمية داخلية حقيقية مأخوذة من نتائج الطالب في المنصة.
لا تعرض هذه البيانات للطالب من تلقاء نفسك.

إجمالي أحدث المحاولات المقروءة: ${internalProfile.solvedQuestions}
الدقة العامة في هذه المحاولات: ${internalProfile.accuracy}%
`;

        if (
          effectiveCategory
        ) {
          dynamicSystemPrompt +=
            `المهارة الحالية: ${effectiveCategory}\n`;
        }

        if (
          teaching.skill
        ) {
          dynamicSystemPrompt +=
            `
أداء الطالب الحديث في المهارة الحالية:
آخر ${teaching.skill.total} محاولة متاحة:
الصحيح: ${teaching.skill.correct}
الدقة الحديثة: ${teaching.skill.accuracy}%

الأداء الأوسع في السجل المقروء لهذه المهارة:
عدد المحاولات: ${teaching.skill.historicalTotal}
الصحيح: ${teaching.skill.historicalCorrect}
الدقة: ${teaching.skill.historicalAccuracy}%
`;
        } else if (
          effectiveCategory
        ) {
          dynamicSystemPrompt +=
            `
لا توجد عينة كافية ومطابقة للمهارة الحالية.
لا تفترض أن الطالب متقدم أو ضعيف اعتماداً على تخمين.
`;
        }

        if (
          internalProfile.strengths
            .length >
          0
        ) {
          dynamicSystemPrompt +=
            `
المهارات ذات الأداء القوي حديثاً:
${internalProfile.strengths.join(
  "، "
)}
`;
        }

        if (
          internalProfile.weaknesses
            .length >
          0
        ) {
          dynamicSystemPrompt +=
            `
المهارات التي تحتاج عناية أكبر:
${internalProfile.weaknesses.join(
  "، "
)}
`;
        }
      } else if (
        body.studentProfile
      ) {
        dynamicSystemPrompt +=
          `

لا توجد حتى الآن بيانات كافية محفوظة في QuestionAttempt.
توجد بيانات احتياطية من الواجهة.
استخدمها بحذر ولا تعرضها من تلقاء نفسك.

الدقة العامة: ${
            body
              .studentProfile
              .accuracy !=
            null
              ? `${body.studentProfile.accuracy}%`
              : "غير معروفة"
          }
`;
      }

      // =====================================================
      // 🔄 إعادة الشرح
      // =====================================================

      if (
        !cq &&
        isConfusionMessage(
          body.question
        )
      ) {
        dynamicSystemPrompt +=
          REEXPLAIN_INSTRUCTION;
      }

      // =====================================================
      // 🏫 معلومات المنصة
      // =====================================================

      try {
        const stats =
          await getPlatformStats(
            app
          );

        dynamicSystemPrompt +=
          PLATFORM_KNOWLEDGE
            .replace(
              "{SECTIONS_COUNT}",
              String(
                stats.sections
              )
            )
            .replace(
              "{QUESTIONS_COUNT}",
              String(
                stats.questions
              )
            );
      } catch {
        // لا نوقف الطلب بسبب إحصائيات المنصة
      }

      // =====================================================
      // تعليمات نهائية
      // =====================================================

      dynamicSystemPrompt += `

تعليمات نهائية للتخصيص:
- مستوى الشرح تم تحديده برمجياً من نتائج الطالب الحقيقية المسجلة في المنصة.
- إذا توفرت بيانات كافية عن المهارة الحالية، فهي أهم من النسبة العامة.
- الأداء الحديث أهم من الأخطاء القديمة.
- لا تعتبر نسبة مرتفعة في عدد قليل جداً من الأسئلة دليلاً كافياً على الإتقان.
- لا تغير عمق الشرح عشوائياً.
- لا تذكر التصنيف الداخلي للطالب.
- لا تذكر الدقة أو عدد المحاولات إلا إذا طلب الطالب إحصائياته صراحة.
- إذا كان الشرح تأسيسياً، فلا تفترض معرفة الأساس.
- إذا كان الشرح متقدماً، فلا تكرر الأساسيات دون حاجة.
- حافظ دائماً على السؤال والخيارات والإجابة المؤكدة من النظام.
`;

      // =====================================================
      // ⚙️ Generation Config
      //
      // كل النماذج تستخدم نفس الإعداد:
      // low  = سؤال عادي
      // medium = سؤال يحتاج استدلالاً أعمق
      //
      // لا temperature.
      // =====================================================

const thinkingLevel =
  getThinkingLevel(
    useDeepReasoning
  );

const generationConfig = {
  maxOutputTokens: 8192,

  thinkingConfig: {
    thinkingLevel,
  },
};

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
      // 🤖 النماذج المتاحة
      // =====================================================

      const candidates:
        Array<{
          model: string;
          url: string;
          cap: number;
        }> = [];

      for (
        const {
          model,
          cap,
        } of GEMINI_MODELS
      ) {
        if (
          isModelAtCap(
            model,
            cap
          )
        ) {
          console.warn(
            `[Gemini quota] ${model} وصل للحد اليومي: ${getUsage(
              model
            )}/${cap}`
          );

          continue;
        }

        if (
          isModelNearCap(
            model,
            cap
          )
        ) {
          console.warn(
            `[Gemini quota] ${model} اقترب من الحد: ${getUsage(
              model
            )}/${cap}`
          );
        }

        candidates.push({
          model,

          cap,

          url:
            GEMINI_STREAM_URL_FOR(
              model
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
      // ⏱️ Timeout
      // =====================================================

      const MODEL_TIMEOUT_MS =
        Number(
          process.env
            .GEMINI_REQUEST_TIMEOUT_MS ||
            30000
        );

      let fullAssistantText =
        "";

      const outgoingUserText =
        cq?.question
          ? [
              `السؤال: ${cq.question}`,

              cq.passage
                ? `قطعة الاستيعاب:\n${cq.passage}`
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

      let chosen =
        candidates[0];

      try {
        let upstream:
          | Response
          | null =
          null;

        let lastErrMsg =
          "";

        for (
          const candidate of
            candidates
        ) {
          const controller =
            new AbortController();

          const timeout =
            setTimeout(
              () =>
                controller.abort(),
              MODEL_TIMEOUT_MS
            );

          try {
            const requestStartedAt =
              Date.now();

            console.log(
              `[Gemini] تجربة ${candidate.model} | thinking=${thinkingLevel} | usage=${getUsage(
                candidate.model
              )}/${candidate.cap}`
            );

            const response =
              await fetch(
                candidate.url,

                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",

                    "Accept":
                      "text/event-stream",

                    "x-goog-api-key":
                      apiKey,
                  },

                  body:
                    JSON.stringify(
                      payload
                    ),

                  signal:
                    controller.signal,
                }
              );

            clearTimeout(
              timeout
            );

            console.log(
              `[Gemini] HTTP ${response.status} via ${candidate.model} in ${
                Date.now() -
                requestStartedAt
              }ms`
            );

            if (
              response.ok
            ) {
              upstream =
                response;

              chosen =
                candidate;

              break;
            }

            let errorMessage =
              response.statusText;

            try {
              const errorBody =
                await response.json();

              errorMessage =
                errorBody
                  ?.error
                  ?.message ||
                errorMessage;
            } catch {
              // لا شيء
            }

            lastErrMsg =
              `${response.status} ${errorMessage}`;

            console.error(
              `[Gemini] ❌ فشل ${candidate.model}: ${lastErrMsg}`
            );

            /*
              ننتقل للنموذج التالي
              فقط في الأخطاء التي قد تكون
              مؤقتة أو مرتبطة بالازدحام/الحصة.
            */

            if (
              response.status ===
                429 ||
              response.status ===
                500 ||
              response.status ===
                502 ||
              response.status ===
                503 ||
              response.status ===
                504
            ) {
              continue;
            }

            /*
              400 / 401 / 403 / 404
              غالباً مشكلة طلب أو مفتاح،
              فلا نضيع وقت تجربة نماذج أخرى.
            */

            break;
          } catch (error: any) {
            clearTimeout(
              timeout
            );

            lastErrMsg =
              error?.name ===
              "AbortError"
                ? "Request timeout"
                : error?.message ||
                  "fetch error";

            console.error(
              `[Gemini] ❌ خطأ ${candidate.model}: ${lastErrMsg}`
            );

            /*
              Timeout أو network error:
              نجرب النموذج التالي.
            */

            continue;
          }
        }

        if (
          !upstream
        ) {
          return reply
            .status(502)
            .send({
              success:
                false,

              message:
                /quota|429/i.test(
                  lastErrMsg
                )
                  ? "تم تجاوز حد الاستخدام. حاول مجدداً لاحقاً."
                  : /high demand|overloaded|temporarily unavailable|503|504|timeout/i.test(
                      lastErrMsg
                    )
                  ? "الخادم مزدحم حالياً. حاول مرة أخرى بعد قليل."
                  : "تعذر الحصول على إجابة الآن. حاول مرة أخرى.",
            });
        }

        // ===================================================
        // 📊 احتساب النموذج الناجح
        // ===================================================

        const newUsage =
          incrementUsage(
            chosen.model
          );

        console.log(
          `[Gemini usage] ${chosen.model}: ${newUsage}/${chosen.cap}`
        );

        console.log(
          `[Adaptive Teaching] user=${userId} category=${
            effectiveCategory ||
            "unknown"
          } depth=${
            teaching.depth
          } source=${
            teaching.source
          } skillAccuracy=${
            teaching.skill?.accuracy ??
            "N/A"
          } skillAttempts=${
            teaching.skill?.total ??
            0
          } thinking=${
            thinkingLevel
          }`
        );

        // ===================================================
        // 📡 SSE
        // ===================================================

        const origin =
          request.headers.origin ||
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
          return reply.raw.end();
        }

        const decoder =
          new TextDecoder(
            "utf-8"
          );

        let buffer =
          "";

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
              /\r?\n/
            );

          buffer =
            lines.pop() ||
            "";

          for (
            const line of
              lines
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

            const jsonString =
              trimmed
                .slice(5)
                .trim();

            if (
              !jsonString ||
              jsonString ===
                "[DONE]"
            ) {
              continue;
            }

            try {
              const chunk =
                JSON.parse(
                  jsonString
                );

              const parts =
                chunk
                  ?.candidates?.[0]
                  ?.content
                  ?.parts;

              if (
                !Array.isArray(
                  parts
                )
              ) {
                continue;
              }

              for (
                const part of
                  parts
              ) {
                const piece =
                  part?.text;

                if (
                  typeof piece !==
                    "string" ||
                  !piece
                ) {
                  continue;
                }

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
            } catch {
              /*
                إذا كان chunk غير مكتمل،
                نتركه للـbuffer التالي.
              */
            }
          }
        }

        // ===================================================
        // آخر Buffer
        // ===================================================

        const lastLine =
          buffer.trim();

        if (
          lastLine.startsWith(
            "data:"
          )
        ) {
          const jsonString =
            lastLine
              .slice(5)
              .trim();

          if (
            jsonString &&
            jsonString !==
              "[DONE]"
          ) {
            try {
              const chunk =
                JSON.parse(
                  jsonString
                );

              const parts =
                chunk
                  ?.candidates?.[0]
                  ?.content
                  ?.parts;

              if (
                Array.isArray(
                  parts
                )
              ) {
                for (
                  const part of
                    parts
                ) {
                  const piece =
                    part?.text;

                  if (
                    typeof piece ===
                      "string" &&
                    piece
                  ) {
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
                }
              }
            } catch {
              // تجاهل
            }
          }
        }

        // ===================================================
        // النهاية
        // ===================================================

        if (
          !emitted
        ) {
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

                thinkingLevel,
              }
            )}\n\n`
          );
        }
      } catch (error: any) {
        console.error(
          "AI stream failed:",
          error?.message ||
            error
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
        } catch {
          // تجاهل
        }
      } finally {
        if (
          !reply.raw.writableEnded
        ) {
          reply.raw.end();
        }

        // =================================================
        // 💾 حفظ المحادثة
        // =================================================

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

          /*
            الحفظ لا يعطل استجابة الطالب.
          */

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