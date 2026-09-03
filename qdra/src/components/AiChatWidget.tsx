import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { getStoredToken } from "../auth/api";
import { cn } from "../utils/cn";

/* =========================================================
   🌐 رابط الـ API
   ========================================================= */

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // تشغيل محلي
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return "http://localhost:3000";
    }

    // أي نسخة منشورة
    return "https://qdra-1.onrender.com";
  }

  return "http://localhost:3000";
};

const API_URL = getApiUrl();

/* =========================================================
   💬 أنواع الرسائل
   ========================================================= */

interface Message {
  role: "user" | "assistant";
  text: string;
  feedback?: "up" | "down";
}

interface HistoryMessage {
  role: "user" | "assistant";
  text: string;
}

/* =========================================================
   🎓 سياق السؤال المرسل للمعلم الذكي
   ========================================================= */

export interface AiQuestionContext {
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;

  // ⭐ مهم جدًا لاستيعاب المقروء
  passage?: string;
}

/* =========================================================
   ⚡ الأوامر السريعة
   ========================================================= */

const QUICK_ACTIONS: {
  label: string;
  prompt: string;
}[] = [
  {
    label: "ما فهمت",
    prompt: "ما فهمت الشرح، اشرحه لي بطريقة أبسط وبأسلوب مختلف تمامًا، ولا تكرر نفس طريقة الشرح السابقة.",
  },
  {
    label: "اشرح أبسط",
    prompt: "اشرح لي الفكرة من الصفر وبأبسط كلمات ممكنة، وكأني أتعلمها لأول مرة.",
  },
  {
    label: "أعطني مثال",
    prompt: "أعطني مثالًا جديدًا وبسيطًا يوضح نفس الفكرة، ثم وضح لي كيف يرتبط المثال بالسؤال.",
  },
  {
    label: "اختبرني",
    prompt: "اختبرني بسؤال تدريبي جديد على نفس المهارة، ولا تعطيني الإجابة مباشرة.",
  },
  {
    label: "سؤال مشابه",
    prompt: "أعطني سؤالًا مشابهًا لهذا السؤال للتدريب، مع خيارات، ثم انتظر إجابتي قبل شرح الحل.",
  },
];

/* =========================================================
   🎓 المعلم الذكي
   ========================================================= */

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ⭐ الاحتفاظ بأحدث الرسائل دائمًا
  const messagesRef = useRef<Message[]>([]);

  // ⭐ التحكم في الطلب الحالي
  const abortControllerRef =
    useRef<AbortController | null>(null);

  /* =========================================================
     🔄 مزامنة الرسائل مع الـ Ref
     ========================================================= */

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* =========================================================
     🧹 تنظيف الطلب عند إزالة المكون
     ========================================================= */

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  /* =========================================================
     📥 استرجاع آخر جلسة من الخادم
     ========================================================= */

  const restoreHistory = useCallback(async () => {
    try {
      const token = getStoredToken();

      const res = await fetch(
        `${API_URL}/api/ai/history`,
        {
          method: "GET",
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        return false;
      }

      const data = await res.json();

      if (
        Array.isArray(data?.messages) &&
        data.messages.length > 0
      ) {
        const restoredMessages: Message[] =
          data.messages
            .filter(
              (message: unknown): message is Message =>
                !!message &&
                typeof message === "object" &&
                "role" in message &&
                "text" in message &&
                ((message as Message).role ===
                  "user" ||
                  (message as Message).role ===
                    "assistant") &&
                typeof (message as Message).text ===
                  "string"
            )
            .map((message: Message) => ({
              role: message.role,
              text: message.text,
              ...(message.feedback
                ? {
                    feedback:
                      message.feedback,
                  }
                : {}),
            }));

        if (restoredMessages.length > 0) {
          messagesRef.current =
            restoredMessages;

          setMessages(restoredMessages);

          return true;
        }
      }
    } catch {
      // فشل الاسترجاع لا يمنع فتح المعلم
    }

    return false;
  }, []);

  /* =========================================================
     👋 الترحيب عند أول فتح
     ========================================================= */

  useEffect(() => {
    if (!open || historyLoaded) {
      return;
    }

    let cancelled = false;

    const initializeChat = async () => {
      const restored = await restoreHistory();

      if (cancelled) {
        return;
      }

      if (!restored) {
        const welcomeMessage: Message = {
          role: "assistant",
          text:
            "أهلًا بك 👋 أنا معلمك الذكي.\n\n" +
            "اسألني عن أي سؤال في القدرات اللفظية — " +
            "التناظر اللفظي، إكمال الجمل، الخطأ السياقي، " +
            "المفردة المختلفة، أو استيعاب المقروء.\n\n" +
            "وأشرح لك الحل خطوة بخطوة وبطريقة تناسب فهمك.",
        };

        messagesRef.current = [
          welcomeMessage,
        ];

        setMessages([welcomeMessage]);
      }

      setHistoryLoaded(true);
    };

    initializeChat();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    historyLoaded,
    restoreHistory,
  ]);

  /* =========================================================
     📡 الطلب الموحد للمعلم الذكي
     ========================================================= */

  const performStreamingRequest =
    useCallback(
      async (
        newMessages: Message[],
        payload: {
          question?: string;
          currentQuestion?: AiQuestionContext;
          history: HistoryMessage[];
        }
      ) => {
        if (loading) {
          return;
        }

        setLoading(true);
        setError(null);

        // ⭐ إلغاء أي طلب سابق احتياطيًا
        abortControllerRef.current?.abort();

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        const assistantPlaceholder: Message =
          {
            role: "assistant",
            text: "",
          };

        const messagesWithPlaceholder: Message[] =
          [
            ...newMessages,
            assistantPlaceholder,
          ];

        messagesRef.current =
          messagesWithPlaceholder;

        setMessages(messagesWithPlaceholder);

        try {
          const token = getStoredToken();

          const res = await fetch(
            `${API_URL}/api/ai/ask`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                ...(token
                  ? {
                      Authorization: `Bearer ${token}`,
                    }
                  : {}),
              },
              credentials: "include",
              signal: controller.signal,

              body: JSON.stringify(payload),
            }
          );

          /* =====================================================
             🚦 تحديد الأخطاء قبل قراءة البث
             ===================================================== */

          if (res.status === 401) {
            throw new Error(
              "انتهت جلسة تسجيل الدخول. سجّل الدخول مرة أخرى."
            );
          }

          if (res.status === 403) {
            throw new Error(
              "ليس لديك صلاحية لاستخدام المعلم الذكي."
            );
          }

          if (res.status === 429) {
            const errorData =
              await res
                .json()
                .catch(() => null);

            throw new Error(
              errorData?.message ||
                "لقد وصلت للحد الأقصى من الاستخدام. حاول مرة أخرى لاحقًا."
            );
          }

          if (!res.ok) {
            const errorData =
              await res
                .json()
                .catch(() => null);

            throw new Error(
              errorData?.message ||
                "تعذر الحصول على إجابة الآن."
            );
          }

          const reader =
            res.body?.getReader();

          if (!reader) {
            throw new Error(
              "تعذر قراءة مخرجات الخدمة."
            );
          }

          const decoder = new TextDecoder(
            "utf-8"
          );

          let buffer = "";
          let fullAssistantText = "";
          let streamFinished = false;

          /* =====================================================
             🧩 معالجة رسالة SSE
             ===================================================== */

          const processLine = (
            line: string
          ) => {
            const trimmed = line.trim();

            if (!trimmed) {
              return;
            }

            if (!trimmed.startsWith("data:")) {
              return;
            }

            const jsonStr = trimmed
              .slice(5)
              .trim();

            if (!jsonStr) {
              return;
            }

            try {
              const parsed = JSON.parse(
                jsonStr
              );

              if (parsed.error) {
                setError(
                  String(parsed.error)
                );
                return;
              }

              if (parsed.done) {
                streamFinished = true;
                return;
              }

              if (
                typeof parsed.piece ===
                "string"
              ) {
                fullAssistantText +=
                  parsed.piece;

                setMessages((prev) => {
                  const updated = [...prev];

                  if (
                    updated.length > 0 &&
                    updated[
                      updated.length - 1
                    ].role === "assistant"
                  ) {
                    updated[
                      updated.length - 1
                    ] = {
                      role: "assistant",
                      text: fullAssistantText,
                    };
                  }

                  messagesRef.current =
                    updated;

                  return updated;
                });
              }
            } catch {
              // تجاهل JSON غير المكتمل
            }
          };

          /* =====================================================
             🔄 قراءة البث
             ===================================================== */

          while (true) {
            const { done, value } =
              await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(
              value,
              {
                stream: true,
              }
            );

            const lines =
              buffer.split("\n");

            // ⭐ الاحتفاظ بالسطر الأخير
            // إذا كان غير مكتمل
            buffer =
              lines.pop() || "";

            for (const line of lines) {
              processLine(line);
            }
          }

          /* =====================================================
             🧹 معالجة آخر جزء من البث
             ===================================================== */

          buffer += decoder.decode();

          if (buffer.trim()) {
            processLine(buffer);
          }

          /* =====================================================
             ⚠️ الباك إند أنهى الاتصال بدون نص
             ===================================================== */

          if (
            !streamFinished &&
            !fullAssistantText.trim()
          ) {
            throw new Error(
              "لم تصل إجابة من المعلم. حاول مرة أخرى."
            );
          }
        } catch (err: unknown) {
          // ⭐ إلغاء الطلب ليس خطأ للمستخدم
          if (
            err instanceof DOMException &&
            err.name === "AbortError"
          ) {
            return;
          }

          const message =
            err instanceof Error
              ? err.message
              : "تعذر الاتصال بالخادم.";

          setError(message);

          setMessages((prev) => {
            const last =
              prev[prev.length - 1];

            // حذف فقاعة المعلم الفارغة
            if (
              last?.role === "assistant" &&
              !last.text
            ) {
              const updated =
                prev.slice(0, -1);

              messagesRef.current =
                updated;

              return updated;
            }

            return prev;
          });
        } finally {
          if (
            abortControllerRef.current ===
            controller
          ) {
            abortControllerRef.current =
              null;
          }

          setLoading(false);
        }
      },
      [loading]
    );

  /* =========================================================
     🎓 فتح المعلم وشرح سؤال محدد
     ========================================================= */

  const askWithContext = useCallback(
    (ctx: AiQuestionContext) => {
      if (loading || !ctx?.question) {
        return;
      }

      setOpen(true);
      setUnread(false);
      setInput("");
      setError(null);

      // ⭐ نأخذ آخر نسخة حقيقية من الرسائل
      const currentMessages =
        messagesRef.current;

      const userText =
        `📌 السؤال: ${ctx.question}`;

      const newMessages: Message[] = [
        ...currentMessages,
        {
          role: "user",
          text: userText,
        },
      ];

      // ⭐ تحديث الواجهة فورًا
      messagesRef.current =
        newMessages;

      setMessages(newMessages);

      const history: HistoryMessage[] =
        newMessages
          .slice(-8)
          .map((message) => ({
            role: message.role,
            text: message.text,
          }));

      performStreamingRequest(
        newMessages,
        {
          currentQuestion: ctx,
          history,
        }
      );
    },
    [
      loading,
      performStreamingRequest,
    ]
  );

  /* =========================================================
     📥 استقبال سؤال من QuestionView
     ========================================================= */

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent =
        e as CustomEvent<AiQuestionContext>;

      const ctx = customEvent.detail;

      if (
        ctx &&
        typeof ctx.question ===
          "string" &&
        ctx.question.trim()
      ) {
        askWithContext(ctx);
      }
    };

    window.addEventListener(
      "qdra:ask-teacher",
      handler
    );

    return () => {
      window.removeEventListener(
        "qdra:ask-teacher",
        handler
      );
    };
  }, [askWithContext]);

  /* =========================================================
     ⬇️ تمرير الشات لأسفل تلقائيًا
     ========================================================= */

  useEffect(() => {
    const element =
      scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTop =
      element.scrollHeight;
  }, [messages, loading]);

  /* =========================================================
     ✉️ إرسال رسالة عادية
     ========================================================= */

  const send = useCallback(
    async (overrideText?: string) => {
      const question = (
        overrideText ?? input
      ).trim();

      if (!question || loading) {
        return;
      }

      setInput("");
      setError(null);

      const currentMessages =
        messagesRef.current;

      const newMessages: Message[] = [
        ...currentMessages,
        {
          role: "user",
          text: question,
        },
      ];

      messagesRef.current =
        newMessages;

      const history: HistoryMessage[] =
        newMessages
          .slice(-8)
          .map((message) => ({
            role: message.role,
            text: message.text,
          }));

      await performStreamingRequest(
        newMessages,
        {
          question,
          history,
        }
      );
    },
    [
      input,
      loading,
      performStreamingRequest,
    ]
  );

  /* =========================================================
     👍👎 تقييم رد المعلم
     ========================================================= */

  const sendFeedback = useCallback(
    async (
      index: number,
      rating: "up" | "down"
    ) => {
      // ⭐ تحديث الواجهة فورًا
      setMessages((prev) => {
        const updated = [...prev];

        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            feedback: rating,
          };
        }

        messagesRef.current =
          updated;

        return updated;
      });

      try {
        const token = getStoredToken();

        await fetch(
          `${API_URL}/api/ai/feedback`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            credentials: "include",
            body: JSON.stringify({
              messageIndex: index,
              rating,
            }),
          }
        );
      } catch {
        // التقييم اختياري
      }
    },
    []
  );

  /* =========================================================
     🖥️ الواجهة
     ========================================================= */

  return (
    <>
      {/* =====================================================
          زر فتح المعلم
      ===================================================== */}

      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setUnread(false);
        }}
        className={cn(
          "fixed bottom-24 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all md:bottom-6 md:left-6",
          "bg-gold-500 text-black hover:bg-gold-400 active:scale-95",
          open && "hidden"
        )}
        aria-label="المعلم الذكي"
        title="المعلم الذكي"
      >
        <Bot size={26} />

        {unread && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
            1
          </span>
        )}
      </button>

      {/* =====================================================
          نافذة المعلم
      ===================================================== */}

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-ink-950/95 backdrop-blur-sm sm:inset-auto sm:bottom-6 sm:left-6 sm:h-[600px] sm:max-h-[80vh] sm:w-[380px] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-2xl">
          {/* =================================================
              Header
          ================================================= */}

          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-l from-gold-500/20 to-transparent px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-black">
                <Sparkles size={20} />
              </div>

              <div>
                <div className="text-sm font-extrabold text-ink-50">
                  المعلم الذكي
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  جاهز للإجابة
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="press flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-300 hover:bg-white/10"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          {/* =================================================
              Messages
          ================================================= */}

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {messages.map((m, i) => {
              return (
                <div
                  key={`${i}-${m.role}`}
                  className={cn(
                    m.role === "user"
                      ? "mr-auto max-w-[85%]"
                      : "ml-auto max-w-[85%]"
                  )}
                >
                  {m.text && (
                    <div
                      className={cn(
                        "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                        m.role === "user"
                          ? "rounded-tr-sm bg-gold-500 text-black"
                          : "rounded-tl-sm border border-white/10 bg-white/5 text-ink-100"
                      )}
                    >
                      {m.text}
                    </div>
                  )}

                  {/* ⭐ تقييم ردود المعلم */}
                  {m.role === "assistant" &&
                    m.text &&
                    i > 0 && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            sendFeedback(
                              i,
                              "up"
                            )
                          }
                          className={cn(
                            "press flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 text-ink-400 transition hover:bg-white/10",
                            m.feedback ===
                              "up" &&
                              "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                          )}
                          aria-label="رد مفيد"
                          title="رد مفيد"
                        >
                          <ThumbsUp size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            sendFeedback(
                              i,
                              "down"
                            )
                          }
                          className={cn(
                            "press flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 text-ink-400 transition hover:bg-white/10",
                            m.feedback ===
                              "down" &&
                              "border-red-400/40 bg-red-400/10 text-red-400"
                          )}
                          aria-label="رد غير مفيد"
                          title="رد غير مفيد"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}
                </div>
              );
            })}

            {/* =================================================
                مؤشر التفكير
            ================================================= */}

            {loading &&
              messages[
                messages.length - 1
              ]?.role === "assistant" &&
              messages[
                messages.length - 1
              ]?.text === "" && (
                <div className="ml-auto flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-ink-300">
                  <Loader2
                    size={14}
                    className="animate-spin text-gold-400"
                  />
                  المعلم يفكر...
                </div>
              )}
          </div>

          {/* =================================================
              Quick actions
          ================================================= */}

          {messages.length > 1 &&
            !loading && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() =>
                      send(action.prompt)
                    }
                    className="press rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[10px] font-bold text-gold-300 transition hover:bg-gold-500/20"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

          {/* =================================================
              Error
          ================================================= */}

          {error && (
            <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">
              {error}
            </div>
          )}

          {/* =================================================
              Input
          ================================================= */}

          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 focus-within:border-gold-500/40">
              <input
                type="text"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="اكتب سؤالك في القدرات اللفظية..."
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink-50 outline-none placeholder:text-ink-400"
                disabled={loading}
                maxLength={2000}
                autoComplete="off"
              />

              <button
                type="button"
                onClick={() => send()}
                disabled={
                  loading ||
                  !input.trim()
                }
                className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-black transition hover:bg-gold-400 disabled:opacity-40"
                aria-label="إرسال"
                title="إرسال"
              >
                {loading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>

            <p className="mt-1.5 text-center text-[10px] text-ink-400">
              يجيب عن أسئلة القسم اللفظي من قدرات
            </p>
          </div>
        </div>
      )}
    </>
  );
}