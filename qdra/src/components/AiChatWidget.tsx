import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import {
  getStoredToken,
} from "../auth/api";

import {
  cn,
} from "../utils/cn";

/* =========================================================
   🛠️ خطأ الصيانة
========================================================= */

class AiMaintenanceError extends Error {}

/* =========================================================
   🌐 رابط الـ API
========================================================= */

const getApiUrl = () => {
  if (
    typeof window !==
    "undefined"
  ) {
    const hostname =
      window.location.hostname;

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return "http://localhost:3000";
    }

    return "https://qdra-1.onrender.com";
  }

  return "http://localhost:3000";
};

const API_URL =
  getApiUrl();

/* =========================================================
   💬 أنواع الرسائل
========================================================= */

interface Message {
  role:
    | "user"
    | "assistant";

  text: string;

  feedback?:
    | "up"
    | "down";

  truncated?: boolean;
}

interface HistoryMessage {
  role:
    | "user"
    | "assistant";

  text: string;
}

/* =========================================================
   🎓 سياق السؤال
========================================================= */

export interface AiQuestionContext {
  question: string;

  options: string[];

  correctIndex: number;

  category?: string;

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
    label:
      "ما فهمت",

    prompt:
      "ما فهمت الشرح، اشرحه لي بطريقة أبسط وبأسلوب مختلف تمامًا، ولا تكرر نفس طريقة الشرح السابقة.",
  },

  {
    label:
      "اشرح أبسط",

    prompt:
      "اشرح لي الفكرة من الصفر وبأبسط كلمات ممكنة، وكأني أتعلمها لأول مرة.",
  },

  {
    label:
      "أعطني مثال",

    prompt:
      "أعطني مثالًا جديدًا وبسيطًا يوضح نفس الفكرة، ثم وضح لي كيف يرتبط المثال بالسؤال.",
  },

  {
    label:
      "اختبرني",

    prompt:
      "اختبرني بسؤال تدريبي جديد على نفس المهارة، ولا تعطيني الإجابة مباشرة.",
  },

  {
    label:
      "سؤال مشابه",

    prompt:
      "أعطني سؤالًا مشابهًا لهذا السؤال للتدريب، مع خيارات، ثم انتظر إجابتي قبل شرح الحل.",
  },
];

/* =========================================================
   ⭐ أمر متابعة الشرح المقطوع
========================================================= */

const CONTINUE_PROMPT =
  "أكمل الشرح من حيث توقفت بالضبط، دون إعادة ما سبق ذكره.";

/* =========================================================
   🎓 المعلم الذكي
========================================================= */

export default function AiChatWidget() {
  const [
    open,
    setOpen,
  ] = useState(
    false
  );

  const [
    messages,
    setMessages,
  ] = useState<
    Message[]
  >([]);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    maintenanceMessage,
    setMaintenanceMessage,
  ] = useState<
    string | null
  >(null);

  const [
    unread,
    setUnread,
  ] = useState(
    false
  );

  const [
    historyLoaded,
    setHistoryLoaded,
  ] = useState(
    false
  );

  const scrollRef =
    useRef<HTMLDivElement>(
      null
    );

  const messagesRef =
    useRef<
      Message[]
    >([]);

  const abortControllerRef =
    useRef<
      AbortController | null
    >(null);

  /*
   * يمنع تحديث React لكل token صغير.
   * نجمع القطع ونحدث الواجهة تقريبًا كل frame.
   */
  const renderFrameRef =
    useRef<
      number | null
    >(null);

  /* =========================================================
     🔄 مزامنة الرسائل
  ========================================================= */

  useEffect(
    () => {
      messagesRef.current =
        messages;
    },
    [
      messages,
    ]
  );

  /* =========================================================
     🧹 تنظيف الطلب عند إزالة المكون
  ========================================================= */

  useEffect(
    () => {
      return () => {
        abortControllerRef.current?.abort();

        abortControllerRef.current =
          null;

        if (
          renderFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            renderFrameRef.current
          );

          renderFrameRef.current =
            null;
        }
      };
    },
    []
  );

  /* =========================================================
     📥 استرجاع آخر جلسة
  ========================================================= */

  const restoreHistory =
    useCallback(
      async () => {
        try {
          const token =
            getStoredToken();

          const res =
            await fetch(
              `${API_URL}/api/ai/history`,
              {
                method:
                  "GET",

                headers: {
                  ...(token
                    ? {
                        Authorization:
                          `Bearer ${token}`,
                      }
                    : {}),
                },

                credentials:
                  "include",
              }
            );

          if (
            !res.ok
          ) {
            return false;
          }

          const data =
            await res.json();

          if (
            Array.isArray(
              data?.messages
            ) &&
            data.messages.length >
              0
          ) {
            const restoredMessages:
              Message[] =
              data.messages
                .filter(
                  (
                    message: unknown
                  ): message is Message =>
                    !!message &&
                    typeof message ===
                      "object" &&
                    "role" in
                      message &&
                    "text" in
                      message &&
                    (
                      (
                        message as Message
                      ).role ===
                        "user" ||
                      (
                        message as Message
                      ).role ===
                        "assistant"
                    ) &&
                    typeof (
                      message as Message
                    ).text ===
                      "string"
                )
                .map(
                  (
                    message:
                      Message
                  ) => ({
                    role:
                      message.role,

                    text:
                      message.text,

                    ...(message.feedback
                      ? {
                          feedback:
                            message.feedback,
                        }
                      : {}),

                    ...(message.truncated
                      ? {
                          truncated:
                            true,
                        }
                      : {}),
                  })
                );

            if (
              restoredMessages.length >
              0
            ) {
              messagesRef.current =
                restoredMessages;

              setMessages(
                restoredMessages
              );

              return true;
            }
          }
        } catch {
          // فشل الاسترجاع لا يمنع فتح المعلم
        }

        return false;
      },
      []
    );

  /* =========================================================
     👋 تهيئة المحادثة
  ========================================================= */

  useEffect(
    () => {
      if (
        !open ||
        historyLoaded
      ) {
        return;
      }

      let cancelled =
        false;

      const initializeChat =
        async () => {
          const restored =
            await restoreHistory();

          if (
            cancelled
          ) {
            return;
          }

          if (
            !restored
          ) {
            const welcomeMessage:
              Message = {
              role:
                "assistant",

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

            setMessages([
              welcomeMessage,
            ]);
          }

          setHistoryLoaded(
            true
          );
        };

      initializeChat();

      return () => {
        cancelled =
          true;
      };
    },
    [
      open,
      historyLoaded,
      restoreHistory,
    ]
  );

  /* =========================================================
     📡 الطلب الموحد
  ========================================================= */

  const performStreamingRequest =
    useCallback(
      async (
        newMessages:
          Message[],

        payload: {
          question?:
            string;

          currentQuestion?:
            AiQuestionContext;

          history:
            HistoryMessage[];
        }
      ) => {
        if (
          loading
        ) {
          return;
        }

        setLoading(
          true
        );

        setError(
          null
        );

        setMaintenanceMessage(
          null
        );

        abortControllerRef.current?.abort();

        const controller =
          new AbortController();

        abortControllerRef.current =
          controller;

        const assistantPlaceholder:
          Message = {
          role:
            "assistant",

          text:
            "",
        };

        const messagesWithPlaceholder:
          Message[] = [
          ...newMessages,
          assistantPlaceholder,
        ];

        messagesRef.current =
          messagesWithPlaceholder;

        setMessages(
          messagesWithPlaceholder
        );

        try {
          const token =
            getStoredToken();

          const res =
            await fetch(
              `${API_URL}/api/ai/ask`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  ...(token
                    ? {
                        Authorization:
                          `Bearer ${token}`,
                      }
                    : {}),
                },

                credentials:
                  "include",

                signal:
                  controller.signal,

                body:
                  JSON.stringify(
                    payload
                  ),
              }
            );

          /* =================================================
             🚦 أخطاء HTTP
          ================================================= */

          if (
            res.status ===
            401
          ) {
            throw new Error(
              "انتهت جلسة تسجيل الدخول. سجّل الدخول مرة أخرى."
            );
          }

          if (
            res.status ===
            403
          ) {
            throw new Error(
              "ليس لديك صلاحية لاستخدام المعلم الذكي."
            );
          }

          if (
            res.status ===
            503
          ) {
            const errorData =
              await res
                .json()
                .catch(
                  () =>
                    null
                );

            // 🛠️ وضع الصيانة: نعرض رسالة الصيانة التي حددها الأدمن
            if (
              errorData?.maintenance
            ) {
              throw new AiMaintenanceError(
                errorData?.message ||
                  "🛠️ المعلم الذكي تحت الصيانة حالياً، نعمل على تحسين الخدمة وسيعود قريباً."
              );
            }

            throw new Error(
              errorData?.message ||
                "الخدمة غير متاحة حالياً. حاول مرة أخرى لاحقاً."
            );
          }

          if (
            res.status ===
            429
          ) {
            const errorData =
              await res
                .json()
                .catch(
                  () =>
                    null
                );

            throw new Error(
              errorData?.message ||
                "لقد وصلت للحد الأقصى من الاستخدام. حاول مرة أخرى لاحقًا."
            );
          }

          if (
            !res.ok
          ) {
            const errorData =
              await res
                .json()
                .catch(
                  () =>
                    null
                );

            throw new Error(
              errorData?.message ||
                "تعذر الحصول على إجابة الآن."
            );
          }

          /* =================================================
             📡 التأكد من وجود البث
          ================================================= */

          if (
            !res.body
          ) {
            throw new Error(
              "الخادم لم يُرجع بثًا للمعلم."
            );
          }

          const reader =
            res.body.getReader();

          const decoder =
            new TextDecoder(
              "utf-8"
            );

          let buffer =
            "";

          let fullAssistantText =
            "";

          let streamFinished =
            false;

          let wasTruncated =
            false;

          /*
           * تحديث الرسالة التي يتم بثها.
           *
           * لا يتم استدعاء setMessages مع كل token مباشرة،
           * بل مرة واحدة لكل animation frame.
           */
          const scheduleStreamingRender =
            () => {
              if (
                renderFrameRef.current !==
                null
              ) {
                return;
              }

              renderFrameRef.current =
                requestAnimationFrame(
                  () => {
                    renderFrameRef.current =
                      null;

                    const text =
                      fullAssistantText;

                    setMessages(
                      (
                        prev
                      ) => {
                        const updated =
                          [
                            ...prev,
                          ];

                        const lastIndex =
                          updated.length -
                          1;

                        if (
                          lastIndex >=
                            0 &&
                          updated[
                            lastIndex
                          ]?.role ===
                            "assistant"
                        ) {
                          updated[
                            lastIndex
                          ] = {
                            ...updated[
                              lastIndex
                            ],
                            text,
                          };
                        }

                        messagesRef.current =
                          updated;

                        return updated;
                      }
                    );
                  }
                );
            };

          /*
           * يضمن عرض آخر محتوى حتى لو انتهى البث
           * قبل تنفيذ animation frame المنتظر.
           */
          const flushStreamingRender =
            () => {
              if (
                renderFrameRef.current !==
                null
              ) {
                cancelAnimationFrame(
                  renderFrameRef.current
                );

                renderFrameRef.current =
                  null;
              }

              const text =
                fullAssistantText;

              setMessages(
                (
                  prev
                ) => {
                  const updated =
                    [
                      ...prev,
                    ];

                  const lastIndex =
                    updated.length -
                    1;

                  if (
                    lastIndex >=
                      0 &&
                    updated[
                      lastIndex
                    ]?.role ===
                      "assistant"
                  ) {
                    updated[
                      lastIndex
                    ] = {
                      ...updated[
                        lastIndex
                      ],
                      text,
                    };
                  }

                  messagesRef.current =
                    updated;

                  return updated;
                }
              );
            };

          /* =================================================
             🧩 معالجة سطر SSE
          ================================================= */

          const processLine =
            (
              line:
                string
            ) => {
              const trimmed =
                line.trim();

              if (
                !trimmed
              ) {
                return;
              }

              if (
                trimmed.startsWith(
                  ":"
                )
              ) {
                return;
              }

              if (
                !trimmed.startsWith(
                  "data:"
                )
              ) {
                return;
              }

              const jsonStr =
                trimmed
                  .slice(
                    5
                  )
                  .trim();

              if (
                !jsonStr ||
                jsonStr ===
                  "[DONE]"
              ) {
                return;
              }

              let parsed:
                any;

              try {
                parsed =
                  JSON.parse(
                    jsonStr
                  );
              } catch {
                console.warn(
                  "⚠️ تعذر تحليل SSE:",
                  jsonStr
                );

                return;
              }

              /* =============================================
                 ❌ خطأ من السيرفر
              ============================================= */

              if (
                parsed?.error
              ) {
                throw new Error(
                  String(
                    parsed.error
                  )
                );
              }

              /* =============================================
                 ✅ نهاية البث
              ============================================= */

              if (
                parsed?.done ===
                true
              ) {
                streamFinished =
                  true;

                console.log(
                  "✅ AI STREAM DONE",
                  {
                    model:
                      parsed.model,

                    finishReason:
                      parsed.finishReason,

                    thinkingLevel:
                      parsed.thinkingLevel,

                    truncated:
                      parsed.truncated,

                    textLength:
                      fullAssistantText.length,
                  }
                );

                if (
                  parsed.truncated ===
                    true ||
                  parsed.finishReason ===
                    "length" ||
                  parsed.finishReason ===
                    "MAX_TOKENS"
                ) {
                  wasTruncated =
                    true;
                }

                return;
              }

              /* =============================================
                 ✍️ Streaming النص
              ============================================= */

              if (
                typeof parsed?.piece ===
                "string" &&
                parsed.piece
              ) {
                fullAssistantText +=
                  parsed.piece;

                scheduleStreamingRender();
              }
            };

          /* =================================================
             🔄 قراءة البث
          ================================================= */

          while (
            true
          ) {
            const {
              done,
              value,
            } =
              await reader.read();

            if (
              done
            ) {
              break;
            }

            if (
              !value
            ) {
              continue;
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
              processLine(
                line
              );
            }
          }

          /* =================================================
             🧹 آخر جزء
          ================================================= */

          buffer +=
            decoder.decode();

          if (
            buffer.trim()
          ) {
            const finalLines =
              buffer.split(
                /\r?\n/
              );

            for (
              const line of
                finalLines
            ) {
              if (
                line.trim()
              ) {
                processLine(
                  line
                );
              }
            }
          }

          flushStreamingRender();

          /* =================================================
             📡 تشخيص إغلاق الستريم
          ================================================= */

          console.log(
            "📡 AI STREAM CLOSED",
            {
              streamFinished,

              textLength:
                fullAssistantText.length,

              textPreview:
                fullAssistantText.slice(
                  -150
                ),
            }
          );

          /* =================================================
             ❌ لم تصل إجابة
          ================================================= */

          if (
            !fullAssistantText.trim()
          ) {
            throw new Error(
              "لم تصل إجابة من المعلم. حاول مرة أخرى."
            );
          }

          /* =================================================
             ⚠️ الستريم انقطع بدون done
          ================================================= */

          if (
            !streamFinished
          ) {
            console.error(
              "❌ AI STREAM CLOSED WITHOUT DONE",
              {
                textLength:
                  fullAssistantText.length,

                lastCharacters:
                  fullAssistantText.slice(
                    -200
                  ),
              }
            );

            wasTruncated =
              true;
          }

          /* =================================================
             ⚠️ تعليم الإجابة كمقطوعة
          ================================================= */

          if (
            wasTruncated
          ) {
            setMessages(
              (
                prev
              ) => {
                const updated =
                  [
                    ...prev,
                  ];

                const lastIndex =
                  updated.length -
                  1;

                if (
                  lastIndex >=
                    0 &&
                  updated[
                    lastIndex
                  ]?.role ===
                    "assistant"
                ) {
                  updated[
                    lastIndex
                  ] = {
                    ...updated[
                      lastIndex
                    ],
                    truncated:
                      true,
                  };
                }

                messagesRef.current =
                  updated;

                return updated;
              }
            );

            setError(
              'توقف الشرح قبل اكتماله. اضغط "أكمل الشرح" لمتابعته.'
            );
          }

          /*
           * لو جاءت إجابة أثناء إغلاق النافذة،
           * نُظهر مؤشر unread.
           */
          if (
            !open
          ) {
            setUnread(
              true
            );
          }
        } catch (
          err:
            unknown
        ) {
          /* =================================================
             🚫 Abort طبيعي
          ================================================= */

          if (
            err instanceof
              DOMException &&
            err.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "❌ AI REQUEST ERROR:",
            err
          );

          // 🛠️ وضع الصيانة: رسالة الصيانة تظهر داخل نافذة المحادثة
          if (
            err instanceof
              AiMaintenanceError
          ) {
            const text =
              err.message;

            // نحذف الرسالة الفارغة (placeholder) إن وجدت ثم نضيف رسالة الصيانة
            const base =
              [...messagesRef.current];

            const last =
              base[
                base.length -
                  1
              ];

            if (
              last?.role ===
                "assistant" &&
              !last.text
            ) {
              base.pop();
            }

            messagesRef.current =
              [
                ...base,

                {
                  role:
                    "assistant",

                  text,
                },
              ];

            setMessages(
              messagesRef.current
            );

            setMaintenanceMessage(
              text
            );

            setError(
              null
            );

            return;
          }

          const message =
            err instanceof
              Error
              ? err.message
              : "تعذر الاتصال بالخادم.";

          setError(
            message
          );

          setMessages(
            (
              prev
            ) => {
              const last =
                prev[
                  prev.length -
                    1
                ];

              /*
               * نحذف placeholder فقط إذا لم يصل
               * أي نص بالفعل.
               */
              if (
                last?.role ===
                  "assistant" &&
                !last.text
              ) {
                const updated =
                  prev.slice(
                    0,
                    -1
                  );

                messagesRef.current =
                  updated;

                return updated;
              }

              /*
               * إذا وصل جزء من الرد ثم حدث خطأ،
               * نبقي النص ونعلّمه بأنه مقطوع.
               */
              if (
                last?.role ===
                  "assistant" &&
                last.text
              ) {
                const updated =
                  [
                    ...prev,
                  ];

                updated[
                  updated.length -
                    1
                ] = {
                  ...last,
                  truncated:
                    true,
                };

                messagesRef.current =
                  updated;

                return updated;
              }

              return prev;
            }
          );
        } finally {
          if (
            renderFrameRef.current !==
            null
          ) {
            cancelAnimationFrame(
              renderFrameRef.current
            );

            renderFrameRef.current =
              null;
          }

          if (
            abortControllerRef.current ===
            controller
          ) {
            abortControllerRef.current =
              null;
          }

          setLoading(
            false
          );
        }
      },
      [
        loading,
        open,
      ]
    );

  /* =========================================================
     🎓 سؤال من الصفحة
  ========================================================= */

  const askWithContext =
    useCallback(
      (
        ctx:
          AiQuestionContext
      ) => {
        if (
          loading ||
          !ctx?.question
        ) {
          return;
        }

        setOpen(
          true
        );

        setUnread(
          false
        );

        setInput(
          ""
        );

        setError(
          null
        );

        const currentMessages =
          messagesRef.current;

        const newMessages:
          Message[] = [
          ...currentMessages,

          {
            role:
              "user",

            text:
              `📌 السؤال: ${ctx.question}`,
          },
        ];

        messagesRef.current =
          newMessages;

        setMessages(
          newMessages
        );

        /*
         * نستبعد رسالة السؤال الحالية من history،
         * لأن السؤال نفسه سيصل في currentQuestion.
         *
         * هذا يقلل التكرار داخل prompt.
         */
        const history:
          HistoryMessage[] =
          currentMessages
            .filter(
              (
                message
              ) =>
                Boolean(
                  message.text.trim()
                )
            )
            .slice(
              -8
            )
            .map(
              (
                message
              ) => ({
                role:
                  message.role,

                text:
                  message.text,
              })
            );

        performStreamingRequest(
          newMessages,
          {
            currentQuestion:
              ctx,

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
     📥 استقبال حدث السؤال
  ========================================================= */

  useEffect(
    () => {
      const handler =
        (
          e:
            Event
        ) => {
          const customEvent =
            e as CustomEvent<AiQuestionContext>;

          const ctx =
            customEvent.detail;

          if (
            ctx &&
            typeof ctx.question ===
              "string" &&
            ctx.question.trim()
          ) {
            askWithContext(
              ctx
            );
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
    },
    [
      askWithContext,
    ]
  );

  /* =========================================================
     ⬇️ التمرير التلقائي
  ========================================================= */

  useEffect(
    () => {
      const element =
        scrollRef.current;

      if (
        !element
      ) {
        return;
      }

      requestAnimationFrame(
        () => {
          element.scrollTop =
            element.scrollHeight;
        }
      );
    },
    [
      messages,
      loading,
    ]
  );

  /* =========================================================
     ✉️ إرسال رسالة
  ========================================================= */

  const send =
    useCallback(
      async (
        overrideText?:
          string
      ) => {
        const question =
          (
            overrideText ??
            input
          ).trim();

        if (
          !question ||
          loading
        ) {
          return;
        }

        setInput(
          ""
        );

        setError(
          null
        );

        const currentMessages =
          messagesRef.current;

        const newMessages:
          Message[] = [
          ...currentMessages,

          {
            role:
              "user",

            text:
              question,
          },
        ];

        messagesRef.current =
          newMessages;

        setMessages(
          newMessages
        );

        /*
         * لا نكرر السؤال الحالي داخل history.
         * الـBackend يستلمه أصلًا في question.
         */
        const history:
          HistoryMessage[] =
          currentMessages
            .filter(
              (
                message
              ) =>
                Boolean(
                  message.text.trim()
                )
            )
            .slice(
              -8
            )
            .map(
              (
                message
              ) => ({
                role:
                  message.role,

                text:
                  message.text,
              })
            );

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
     ➡️ إكمال شرح مقطوع
  ========================================================= */

  const continueTruncated =
    useCallback(
      () => {
        if (
          loading
        ) {
          return;
        }

        send(
          CONTINUE_PROMPT
        );
      },
      [
        loading,
        send,
      ]
    );

  /* =========================================================
     👍👎 التقييم
  ========================================================= */

  const sendFeedback =
    useCallback(
      async (
        index:
          number,

        rating:
          | "up"
          | "down"
      ) => {
        setMessages(
          (
            prev
          ) => {
            const updated =
              [
                ...prev,
              ];

            if (
              updated[
                index
              ]
            ) {
              updated[
                index
              ] = {
                ...updated[
                  index
                ],

                feedback:
                  rating,
              };
            }

            messagesRef.current =
              updated;

            return updated;
          }
        );

        try {
          const token =
            getStoredToken();

          await fetch(
            `${API_URL}/api/ai/feedback`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },

              credentials:
                "include",

              body:
                JSON.stringify(
                  {
                    messageIndex:
                      index,

                    rating,
                  }
                ),
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
      {/* زر فتح المعلم */}

      <button
        type="button"
        onClick={() => {
          setOpen(
            true
          );

          setUnread(
            false
          );
        }}
        className={cn(
          "fixed bottom-24 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all md:bottom-6 md:left-6",
          "bg-gold-500 text-black hover:bg-gold-400 active:scale-95",
          open &&
            "hidden"
        )}
        aria-label="المعلم الذكي"
        title="المعلم الذكي"
      >
        <Bot
          size={
            26
          }
        />

        {unread &&
          !open && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
              1
            </span>
          )}
      </button>

      {/* نافذة المعلم */}

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-ink-950/95 backdrop-blur-sm sm:inset-auto sm:bottom-6 sm:left-6 sm:h-[600px] sm:max-h-[80vh] sm:w-[380px] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-2xl">

          {/* Header */}

          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-l from-gold-500/20 to-transparent px-4 py-3">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-black">
                <Sparkles
                  size={
                    20
                  }
                />
              </div>

              <div>
                <div className="text-sm font-extrabold text-ink-50">
                  المعلم الذكي
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">

                  {maintenanceMessage ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

                      <span className="text-red-300">
                        تحت الصيانة
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

                      {loading
                        ? "يفكر الآن..."
                        : "جاهز للإجابة"}
                    </>
                  )}
                </div>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(
                  false
                )
              }
              className="press flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-300 hover:bg-white/10"
              aria-label="إغلاق"
            >
              <X
                size={
                  18
                }
              />
            </button>

          </div>

          {/* Messages */}

          <div
            ref={
              scrollRef
            }
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >

            {messages.map(
              (
                m,
                i
              ) => (
                <div
                  key={`${i}-${m.role}`}
                  className={cn(
                    m.role ===
                      "user"
                      ? "mr-auto max-w-[85%]"
                      : "ml-auto max-w-[85%]"
                  )}
                >

                  {m.text && (
                    <div
                      className={cn(
                        "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                        m.role ===
                          "user"
                          ? "rounded-tr-sm bg-gold-500 text-black"
                          : "rounded-tl-sm border border-white/10 bg-white/5 text-ink-100"
                      )}
                    >
                      {
                        m.text
                      }
                    </div>
                  )}

                  {/* تنبيه القطع */}

                  {m.role ===
                    "assistant" &&
                    m.truncated && (
                      <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2">

                        <span className="text-[11px] font-semibold text-amber-300">
                          الشرح توقف قبل اكتماله
                        </span>

                        <button
                          type="button"
                          onClick={
                            continueTruncated
                          }
                          disabled={
                            loading
                          }
                          className="press shrink-0 rounded-lg bg-amber-400/90 px-2.5 py-1 text-[11px] font-bold text-black transition hover:bg-amber-400 disabled:opacity-40"
                        >
                          أكمل الشرح
                        </button>

                      </div>
                    )}

                  {/* تقييم */}

                  {m.role ===
                    "assistant" &&
                    m.text &&
                    i > 0 &&
                    !(
                      loading &&
                      i ===
                        messages.length -
                          1
                    ) && (
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
                          <ThumbsUp
                            size={
                              12
                            }
                          />
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
                          <ThumbsDown
                            size={
                              12
                            }
                          />
                        </button>

                      </div>
                    )}

                </div>
              )
            )}

            {/* انتظار أول قطعة */}

            {loading &&
              messages[
                messages.length -
                  1
              ]?.role ===
                "assistant" &&
              !messages[
                messages.length -
                  1
              ]?.text && (
                <div className="ml-auto flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-ink-300">

                  <Loader2
                    size={
                      14
                    }
                    className="animate-spin text-gold-400"
                  />

                  المعلم يفكر...

                </div>
              )}

            {/* مؤشر أثناء استمرار Streaming بعد ظهور النص */}

            {loading &&
              messages[
                messages.length -
                  1
              ]?.role ===
                "assistant" &&
              Boolean(
                messages[
                  messages.length -
                    1
                ]?.text
              ) && (
                <div className="ml-auto flex items-center gap-1.5 px-1 text-[10px] font-semibold text-gold-400/80">
                  <Loader2
                    size={
                      11
                    }
                    className="animate-spin"
                  />
                  يكتب...
                </div>
              )}

          </div>

          {/* Quick actions */}

          {messages.length >
            1 &&
            !loading && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-1.5">

                {QUICK_ACTIONS.map(
                  (
                    action
                  ) => (
                    <button
                      key={
                        action.label
                      }
                      type="button"
                      onClick={() =>
                        send(
                          action.prompt
                        )
                      }
                      className="press rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[10px] font-bold text-gold-300 transition hover:bg-gold-500/20"
                    >
                      {
                        action.label
                      }
                    </button>
                  )
                )}

              </div>
            )}

          {/* Error */}

          {error && (
            <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">
              {
                error
              }
            </div>
          )}

          {/* 🛠️ بانر الصيانة */}

          {maintenanceMessage && (
            <div className="mx-4 mb-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">
              🛠️ المعلم الذكي تحت الصيانة حالياً — لن تصل إجابات جديدة حتى يعود للعمل.
            </div>
          )}

          {/* Input */}

          <div className="border-t border-white/10 p-3">

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 focus-within:border-gold-500/40">

              <input
                type="text"
                value={
                  input
                }
                onChange={(
                  e
                ) =>
                  setInput(
                    e.target.value
                  )
                }
                onKeyDown={(
                  e
                ) => {
                  if (
                    e.key ===
                      "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();

                    send();
                  }
                }}
                placeholder="اكتب سؤالك في القدرات اللفظية..."
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink-50 outline-none placeholder:text-ink-400"
                disabled={
                  loading
                }
                maxLength={
                  2000
                }
                autoComplete="off"
              />

              <button
                type="button"
                onClick={() =>
                  send()
                }
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
                    size={
                      16
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={
                      16
                    }
                  />
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