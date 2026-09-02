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

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname.includes("vercel.app")) {
      return "https://qdra-1.onrender.com";
    }

    if (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1"
    ) {
      return `http://${hostname}:3000`;
    }
  }

  return "http://localhost:3000";
};

const API_URL = getApiUrl();

interface Message {
  role: "user" | "assistant";
  text: string;
  feedback?: "up" | "down";
}

// =========================================================
// 🎓 سياق السؤال المرسل للمعلم الذكي
// =========================================================
export interface AiQuestionContext {
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;

  // ⭐ مهم جدًا لاستيعاب المقروء
  // يتم إرسال القطعة كاملة للباك إند
  passage?: string;
}

const QUICK_ACTIONS: {
  label: string;
  prompt: string;
}[] = [
  {
    label: "ما فهمت",
    prompt: "ما فهمت الشرح، اشرحه لي بطريقة أبسط.",
  },
  {
    label: "اشرح أبسط",
    prompt: "اشرح لي الفكرة بأسلوب أبسط.",
  },
  {
    label: "أعطني مثال",
    prompt: "أعطني مثالاً آخر أوضح.",
  },
  {
    label: "اختبرني",
    prompt: "اختبرني بسؤال تدريبي الآن.",
  },
  {
    label: "سؤال مشابه",
    prompt: "أعطني سؤالاً مشابهاً من بنك الأسئلة.",
  },
];

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // ✅ Ref لأحدث نسخة من الرسائل
  // =========================================================
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // =========================================================
  // ✅ استرجاع آخر جلسة من الخادم
  // =========================================================
  const restoreHistory = useCallback(async () => {
    try {
      const token = getStoredToken();

      const res = await fetch(
        `${API_URL}/api/ai/history`,
        {
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

      if (!res.ok) return false;

      const data = await res.json();

      if (
        Array.isArray(data?.messages) &&
        data.messages.length > 0
      ) {
        setMessages(data.messages);
        return true;
      }
    } catch {
      // فشل الاسترجاع لا يمنع فتح المعلم
    }

    return false;
  }, []);

  // =========================================================
  // ✅ الترحيب عند أول فتح
  // =========================================================
  useEffect(() => {
    if (!open || historyLoaded) return;

    (async () => {
      const restored = await restoreHistory();

      if (!restored) {
        setMessages([
          {
            role: "assistant",
            text:
              "أهلًا بك 👋 أنا معلمك الذكي. " +
              "اسألني عن أي سؤال في القدرات اللفظية — " +
              "التناظر اللفظي، إكمال الجمل، الخطأ السياقي، " +
              "المفردة الشاذة، أو استيعاب المقروء. " +
              "وأشرح لك الحل خطوة بخطوة!",
          },
        ]);
      }

      setHistoryLoaded(true);
    })();
  }, [
    open,
    historyLoaded,
    restoreHistory,
  ]);

  // =========================================================
  // ✅ الطلب الموحد للمعلم الذكي
  // =========================================================
  const performStreamingRequest = useCallback(
    async (
      newMessages: Message[],
      payload: {
        question?: string;
        currentQuestion?: AiQuestionContext;
        history: any[];
      }
    ) => {
      setLoading(true);
      setError(null);

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          text: "",
        },
      ]);

      try {
        const token = getStoredToken();

        const res = await fetch(
          `${API_URL}/api/ai/ask`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            credentials: "include",

            // ⭐ payload يحتوي الآن على passage
            // عندما يكون السؤال من استيعاب المقروء
            body: JSON.stringify(payload),
          }
        );

        if (res.status === 429) {
          const errorData = await res
            .json()
            .catch(() => null);

          throw new Error(
            errorData?.message ||
              "لقد وصلت للحد الأقصى من الأسئلة لهذه الساعة."
          );
        }

        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => null);

          throw new Error(
            errorData?.message ||
              "تعذر الحصول على إجابة الآن."
          );
        }

        const reader = res.body?.getReader();

        if (!reader) {
          throw new Error(
            "تعذر قراءة مخرجات الخدمة."
          );
        }

        const decoder = new TextDecoder();

        let buffer = "";
        let fullAssistantText = "";

        while (true) {
          const { done, value } =
            await reader.read();

          if (done) break;

          buffer += decoder.decode(value, {
            stream: true,
          });

          const lines = buffer.split("\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed.startsWith("data:")) {
              continue;
            }

            const jsonStr = trimmed
              .slice(5)
              .trim();

            if (!jsonStr) continue;

            try {
              const parsed =
                JSON.parse(jsonStr);

              if (parsed.error) {
                setError(parsed.error);
              } else if (parsed.done) {
                // الخادم أنهى البث
              } else if (parsed.piece) {
                fullAssistantText +=
                  parsed.piece;

                setMessages((prev) => {
                  const updated = [...prev];

                  if (updated.length > 0) {
                    updated[
                      updated.length - 1
                    ] = {
                      role: "assistant",
                      text: fullAssistantText,
                    };
                  }

                  return updated;
                });
              }
            } catch {
              // تجاهل أجزاء SSE غير المكتملة
            }
          }
        }
      } catch (err: any) {
        setError(
          err.message ||
            "تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت."
        );

        setMessages((prev) => {
          if (
            prev.length > 0 &&
            prev[prev.length - 1].role ===
              "assistant" &&
            !prev[prev.length - 1].text
          ) {
            return prev.slice(0, -1);
          }

          return prev;
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // =========================================================
  // 🎓 فتح المعلم وشرح سؤال محدد
  // =========================================================
  const askWithContext = useCallback(
    (ctx: AiQuestionContext) => {
      if (loading) return;

      setOpen(true);
      setUnread(false);
      setInput("");

      const userText =
        `📌 السؤال: ${ctx.question}`;

      // =====================================================
      // ⭐ لا نحذف passage هنا
      // ctx كامل ينتقل إلى الباك إند
      // =====================================================
      setTimeout(() => {
        const currentMessages =
          messagesRef.current;

        const newMessages: Message[] = [
          ...currentMessages,
          {
            role: "user",
            text: userText,
          },
        ];

        const history = newMessages
          .slice(-8)
          .map((m) => ({
            role: m.role,
            text: m.text,
          }));

        performStreamingRequest(
          newMessages,
          {
            currentQuestion: ctx,
            history,
          }
        );
      }, 50);
    },
    [
      loading,
      performStreamingRequest,
    ]
  );

  // =========================================================
  // ✅ استقبال سؤال من QuestionView
  // =========================================================
  useEffect(() => {
    const handler = (e: Event) => {
      const ctx =
        (
          e as CustomEvent<AiQuestionContext>
        ).detail;

      if (ctx && ctx.question) {
        askWithContext(ctx);
      }
    };

    window.addEventListener(
      "qdra:ask-teacher",
      handler
    );

    return () =>
      window.removeEventListener(
        "qdra:ask-teacher",
        handler
      );
  }, [askWithContext]);

  // =========================================================
  // ✅ تمرير الشات لأسفل تلقائيًا
  // =========================================================
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // =========================================================
  // ✅ إرسال رسالة عادية
  // =========================================================
  const send = async (
    overrideText?: string
  ) => {
    const question = (
      overrideText ?? input
    ).trim();

    if (!question || loading) return;

    setInput("");
    setError(null);

    const newMessages: Message[] = [
      ...messages,
      {
        role: "user",
        text: question,
      },
    ];

    const history = newMessages
      .slice(-8)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    await performStreamingRequest(
      newMessages,
      {
        question,
        history,
      }
    );
  };

  // =========================================================
  // ✅ تقييم رد المعلم
  // =========================================================
  const sendFeedback = async (
    index: number,
    rating: "up" | "down"
  ) => {
    setMessages((prev) => {
      const updated = [...prev];

      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          feedback: rating,
        };
      }

      return updated;
    });

    try {
      const token = getStoredToken();

      await fetch(
        `${API_URL}/api/ai/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
      // التقييم اختياري ولا يؤثر على المحادثة
    }
  };

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
          {/* Header */}
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

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {messages.map((m, i) => {
              const isLastAssistant =
                m.role === "assistant" &&
                i === messages.length - 1 &&
                !loading &&
                m.text;

              return (
                <div
                  key={i}
                  className={cn(
                    m.role === "user"
                      ? "mr-auto max-w-[85%]"
                      : "ml-auto max-w-[85%]"
                  )}
                >
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
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}
                </div>
              );
            })}

            {loading &&
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

          {/* Quick actions */}
          {messages.length > 1 &&
            !loading && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-1.5">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() =>
                      send(a.prompt)
                    }
                    className="press rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[10px] font-bold text-gold-300 transition hover:bg-gold-500/20"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 focus-within:border-gold-500/40">
              <input
                type="text"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    send();
                  }
                }}
                placeholder="اكتب سؤالك في القدرات اللفظية..."
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink-50 outline-none placeholder:text-ink-400"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => send()}
                disabled={
                  loading || !input.trim()
                }
                className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-black transition hover:bg-gold-400 disabled:opacity-40"
                aria-label="إرسال"
              >
                <Send size={16} />
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