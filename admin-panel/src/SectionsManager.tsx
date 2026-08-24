import React, { useEffect, useState } from "react";

export interface Section {
  id: number;
  fileId: string;
  name: string;
  category?: string;
  type?: string;
  description?: string;
  questions: any[];
  isActive: boolean;
  order: number;
  questionCount?: number;
}

interface Choice {
  id?: number;
  text: string;
  isCorrect: boolean;
  order?: number;
}

interface Question {
  id?: number;
  text: string;
  explanation?: string;
  type?: string;
  category?: string;
  passage?: string;
  choices: Choice[];
  order?: number;
}

interface SectionDetails extends Omit<Section, "questions"> {
  questions: Question[];
}

interface UIChoice extends Choice {
  _key: string;
}

interface UIQuestion extends Question {
  _key: string;
  choices: UIChoice[];
}

interface UISection extends Omit<SectionDetails, "questions"> {
  questions: UIQuestion[];
}

interface Props {
  api: any;
  showToast: (
    message: string,
    type?: "success" | "error"
  ) => void;
  onEdit?: (id: number) => void;
}

const uid = () =>
  Math.random().toString(36).slice(2) +
  Date.now().toString(36);

/* =========================================================
   DESIGN SYSTEM
========================================================= */

const C = {
  app: "#0a0d12",

  panel: "#11161f",
  panel2: "#151b25",
  panel3: "#19212c",

  input: "#0d1219",
  inputHover: "#101721",

  border: "#2b3544",
  borderStrong: "#435066",

  text: "#f4f7fb",
  text2: "#d2d9e5",
  muted: "#9da9bb",
  placeholder: "#69778c",

  gold: "#e8b93f",
  goldLight: "#f2c957",
  goldSoft: "rgba(232,185,63,.12)",

  green: "#45d49a",
  greenSoft: "rgba(69,212,154,.10)",

  red: "#ff747c",
  redSoft: "rgba(255,116,124,.09)",

  blue: "#70a5ff",
  blueSoft: "rgba(112,165,255,.10)",
};

/* =========================================================
   GLOBAL COMPONENT STYLES
========================================================= */

const Styles = () => (
  <style>{`

    .sm-root {
      font-family:
        "IBM Plex Sans Arabic",
        "Tajawal",
        "Segoe UI",
        Arial,
        sans-serif;

      color: ${C.text};
      font-size: 16px;
      line-height: 1.65;
    }

    .sm-root *,
    .sm-root *::before,
    .sm-root *::after {
      box-sizing: border-box;
    }

    /* ---------- Inputs ---------- */

    .sm-input {
      width: 100%;
      min-height: 52px;

      background: ${C.input};
      color: ${C.text};

      border: 1px solid ${C.border};
      border-radius: 12px;

      padding: 13px 15px;

      outline: none;

      font-family: inherit;
      font-size: 15px;
      font-weight: 500;

      transition:
        background .16s ease,
        border-color .16s ease,
        box-shadow .16s ease;
    }

    .sm-input:hover {
      border-color: ${C.borderStrong};
      background: ${C.inputHover};
    }

    .sm-input:focus {
      border-color: ${C.gold};
      background: #111822;
      box-shadow:
        0 0 0 3px rgba(232,185,63,.11);
    }

    .sm-input::placeholder {
      color: ${C.placeholder};
      opacity: 1;
      font-weight: 400;
    }

    .sm-input[readonly] {
      color: ${C.muted};
      cursor: default;
      background: #0b0f15;
    }

    textarea.sm-input {
      resize: vertical;
      min-height: 110px;
      line-height: 1.9;
    }

    select.sm-input {
      cursor: pointer;
    }

    /* ---------- Buttons ---------- */

    .sm-btn {
      border: 0;
      min-height: 43px;
      border-radius: 10px;

      padding: 9px 17px;

      cursor: pointer;

      font-family: inherit;
      font-size: 14px;
      font-weight: 700;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;

      transition:
        background .15s ease,
        border-color .15s ease,
        color .15s ease,
        transform .08s ease,
        box-shadow .15s ease;
    }

    .sm-btn:active {
      transform: translateY(1px);
    }

    .sm-btn:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .sm-btn-primary {
      background: ${C.gold};
      color: #151208;
    }

    .sm-btn-primary:hover:not(:disabled) {
      background: ${C.goldLight};
      box-shadow:
        0 7px 22px rgba(232,185,63,.13);
    }

    .sm-btn-secondary {
      border: 1px solid ${C.border};
      background: #151b24;
      color: ${C.text2};
    }

    .sm-btn-secondary:hover:not(:disabled) {
      background: #1b2330;
      border-color: ${C.borderStrong};
      color: ${C.text};
    }

    .sm-btn-danger {
      border: 1px solid #553239;
      background: ${C.redSoft};
      color: ${C.red};
    }

    .sm-btn-danger:hover:not(:disabled) {
      background: rgba(255,116,124,.15);
      border-color: #77404a;
    }

    .sm-btn-sync {
      border: 1px solid rgba(112,165,255,.3);
      background: ${C.blueSoft};
      color: ${C.blue};
    }

    .sm-btn-sync:hover:not(:disabled) {
      background: rgba(112,165,255,.18);
      border-color: rgba(112,165,255,.5);
    }

    /* ---------- Scroll ---------- */

    .sm-scroll {
      scrollbar-width: thin;
      scrollbar-color: #39465a transparent;
    }

    .sm-scroll::-webkit-scrollbar {
      width: 9px;
      height: 9px;
    }

    .sm-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .sm-scroll::-webkit-scrollbar-thumb {
      background: #364255;
      border-radius: 20px;
    }

    .sm-scroll::-webkit-scrollbar-thumb:hover {
      background: #4a586e;
    }

    /* ---------- Section table ---------- */

    .sm-table-row {
      transition: background .15s ease;
    }

    .sm-table-row:hover {
      background: rgba(255,255,255,.025);
    }

    /* ---------- Question ---------- */

    .sm-question {
      background: ${C.panel2};
      border: 1px solid ${C.border};
      border-radius: 17px;

      overflow: hidden;

      transition:
        border-color .16s ease,
        box-shadow .16s ease;
    }

    .sm-question:hover {
      border-color: #39465a;
    }

    .sm-question-header {
      padding: 17px 20px;

      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      border-bottom: 1px solid ${C.border};

      background: #171e29;
    }

    .sm-question-body {
      padding: 22px;
    }

    /* ---------- Choice ---------- */

    .sm-choice {
      display: grid;
      grid-template-columns: minmax(0,1fr) auto auto;
      gap: 10px;
      align-items: center;

      padding: 10px;

      border: 1px solid transparent;
      border-radius: 12px;

      transition:
        background .15s ease,
        border-color .15s ease;
    }

    .sm-choice:hover {
      background: rgba(255,255,255,.018);
    }

    .sm-choice.correct {
      background: ${C.greenSoft};
      border-color: rgba(69,212,154,.24);
    }

    /* ---------- Responsive ---------- */

    @media (max-width: 850px) {

      .sm-editor {
        border-radius: 0 !important;
        min-height: 100vh;
      }

      .sm-editor-content {
        padding: 17px !important;
      }

      .sm-question-body {
        padding: 16px;
      }

      .sm-choice {
        grid-template-columns: 1fr;
      }

      .sm-choice-actions {
        justify-content: space-between;
      }

    }

    @media (max-width: 600px) {

      .sm-hide-mobile {
        display: none;
      }

      .sm-title {
        font-size: 24px !important;
      }

    }

  `}</style>
);

/* =========================================================
   COMMON STYLES
========================================================= */

const labelStyle: React.CSSProperties = {
  display: "block",
  color: C.text2,
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 8,
};

const thStyle: React.CSSProperties = {
  padding: "15px 18px",
  color: C.muted,
  fontSize: 13,
  fontWeight: 700,
  textAlign: "right",
  whiteSpace: "nowrap",
  background: "#141a23",
};

const tdStyle: React.CSSProperties = {
  padding: "16px 18px",
  color: C.text2,
  fontSize: 14,
  textAlign: "right",
  whiteSpace: "nowrap",
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Status({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,

        padding: "6px 11px",

        borderRadius: 999,

        background: active
          ? C.greenSoft
          : C.redSoft,

        color: active
          ? C.green
          : C.red,

        fontWeight: 700,
        fontSize: 12,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "currentColor",
        }}
      />

      {active ? "نشط" : "معطل"}
    </span>
  );
}

/* =========================================================
   SECTION EDITOR
========================================================= */

function SectionEditor({
  id,
  api,
  showToast,
  onClose,
  onSaved,
}: {
  id: number;
  api: any;
  showToast: (
    message: string,
    type?: "success" | "error"
  ) => void;
  onClose: () => void;
  onSaved: () => void;
}) {

  const [data, setData] =
    useState<UISection | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* ---------------------------
     Normalize API data
  ---------------------------- */

  const normalizeSection = (
    raw: any
  ): UISection => {

    const s =
      raw?.section ??
      raw?.data ??
      raw ??
      {};

    const buildChoices = (
      q: any
    ): UIChoice[] => {

      if (Array.isArray(q.options)) {

        return q.options.map(
          (option: any, index: number) => ({
            id: undefined,

            text:
              typeof option === "string"
                ? option
                : option?.text ??
                  option?.option ??
                  option?.content ??
                  "",

            isCorrect:
              index ===
              Number(
                q.correctIndex ?? -1
              ),

            _key: uid(),
          })
        );
      }

      if (Array.isArray(q.choices)) {

        let choices: UIChoice[] =
          q.choices.map((choice: any) => {

            const isText =
              typeof choice === "string";

            return {
              id:
                isText
                  ? undefined
                  : choice?.id != null
                  ? Number(choice.id)
                  : undefined,

              text:
                isText
                  ? choice
                  : choice?.text ??
                    choice?.choice ??
                    choice?.option ??
                    "",

              isCorrect:
                isText
                  ? false
                  : Boolean(
                      choice?.isCorrect ??
                        choice?.is_correct ??
                        choice?.correct ??
                        false
                    ),

              _key: uid(),
            };
          });

        if (
          choices.length &&
          !choices.some(
            (choice) =>
              choice.isCorrect
          ) &&
          typeof q.correctIndex ===
            "number"
        ) {
          choices = choices.map(
            (choice, index) => ({
              ...choice,
              isCorrect:
                index ===
                q.correctIndex,
            })
          );
        }

        return choices;
      }

      return [];
    };

    return {
      ...s,

      id: Number(s.id ?? id),

      fileId:
        s.fileId ??
        String(s.id ?? id),

      name: s.name ?? "",

      category:
        s.category ?? "",

      type:
        s.type ?? "",

      description:
        s.description ?? "",

      isActive:
        Boolean(s.isActive),

      order:
        Number(s.order ?? 0),

      questions:
        Array.isArray(s.questions)
          ? s.questions.map(
              (q: any) => ({
                ...q,

                id:
                  q.id != null
                    ? Number(q.id)
                    : undefined,

                text:
                  q.question ??
                  q.text ??
                  "",

                explanation:
                  q.explanation ??
                  "",

                type:
                  q.type ??
                  "single",

                category:
                  q.category ??
                  s.category ??
                  "",

                passage:
                  q.passage ?? "",

                _key: String(
                  q.id ?? uid()
                ),

                choices:
                  buildChoices(q),
              })
            )
          : [],
    };
  };

  /* ---------------------------
     Fetch
  ---------------------------- */

  const fetchSection = async () => {

    setLoading(true);

    try {

      const res =
        await api.get(
          `/api/admin/sections/${id}`
        );

      if (res.data.success) {

        setData(
          normalizeSection(res.data)
        );

      } else {

        showToast(
          res.data.message ||
            "فشل تحميل بيانات القسم",
          "error"
        );
      }

    } catch (e: any) {

      showToast(
        e.response?.data?.message ||
          "فشل تحميل بيانات القسم",
        "error"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchSection();
    // eslint-disable-next-line
  }, [id]);

  /* ---------------------------
     Updates
  ---------------------------- */

  const updateSection = (
    patch: Partial<UISection>
  ) => {

    setData((prev) =>
      prev
        ? { ...prev, ...patch }
        : prev
    );
  };

  const updateQuestion = (
    qKey: string,
    patch: Partial<UIQuestion>
  ) => {

    setData((prev) => {

      if (!prev) return prev;

      return {
        ...prev,

        questions:
          prev.questions.map(
            (question) =>
              question._key === qKey
                ? {
                    ...question,
                    ...patch,
                  }
                : question
          ),
      };
    });
  };

  /* ---------------------------
     Questions
  ---------------------------- */

  const addQuestion = () => {

    setData((prev) => {

      if (!prev) return prev;

      const question:
        UIQuestion = {

        _key: uid(),

        text: "",

        explanation: "",

        passage: "",

        category: "",

        type: "single",

        choices: [
          {
            _key: uid(),
            text: "",
            isCorrect: true,
          },
          {
            _key: uid(),
            text: "",
            isCorrect: false,
          },
        ],
      };

      return {
        ...prev,

        questions: [
          ...prev.questions,
          question,
        ],
      };
    });
  };

  const removeQuestion = (
    qKey: string
  ) => {

    setData((prev) => {

      if (!prev) return prev;

      return {
        ...prev,

        questions:
          prev.questions.filter(
            (question) =>
              question._key !== qKey
          ),
      };
    });
  };

  /* ---------------------------
     Choices
  ---------------------------- */

  const addChoice = (
    qKey: string
  ) => {

    setData((prev) => {

      if (!prev) return prev;

      return {
        ...prev,

        questions:
          prev.questions.map(
            (question) =>
              question._key === qKey
                ? {
                    ...question,

                    choices: [
                      ...question.choices,

                      {
                        _key: uid(),
                        text: "",
                        isCorrect: false,
                      },
                    ],
                  }
                : question
          ),
      };
    });
  };

  const updateChoice = (
    qKey: string,
    cKey: string,
    patch: Partial<UIChoice>
  ) => {

    setData((prev) => {

      if (!prev) return prev;

      return {
        ...prev,

        questions:
          prev.questions.map(
            (question) => {

              if (
                question._key !==
                qKey
              ) {
                return question;
              }

              let choices =
                question.choices.map(
                  (choice) =>
                    choice._key ===
                    cKey
                      ? {
                          ...choice,
                          ...patch,
                        }
                      : choice
                );

              if (
                patch.isCorrect ===
                  true &&
                (question.type ||
                  "single") ===
                  "single"
              ) {
                choices =
                  choices.map(
                    (choice) => ({
                      ...choice,

                      isCorrect:
                        choice._key ===
                        cKey,
                    })
                  );
              }

              return {
                ...question,
                choices,
              };
            }
          ),
      };
    });
  };

  const removeChoice = (
    qKey: string,
    cKey: string
  ) => {

    setData((prev) => {

      if (!prev) return prev;

      return {
        ...prev,

        questions:
          prev.questions.map(
            (question) =>
              question._key === qKey
                ? {
                    ...question,

                    choices:
                      question.choices.filter(
                        (choice) =>
                          choice._key !==
                          cKey
                      ),
                  }
                : question
          ),
      };
    });
  };

  /* ---------------------------
     Save
  ---------------------------- */

  const saveSection =
    async () => {

      if (!data) return;

      if (
        !data.name.trim()
      ) {
        showToast(
          "أدخل اسم القسم",
          "error"
        );
        return;
      }

      for (
        let i = 0;
        i <
        data.questions.length;
        i++
      ) {

        const question =
          data.questions[i];

        if (
          !question.text.trim()
        ) {

          showToast(
            `اكتب نص السؤال رقم ${
              i + 1
            }`,
            "error"
          );

          return;
        }

        if (
          question.choices.length <
          2
        ) {

          showToast(
            `السؤال رقم ${
              i + 1
            } يحتاج اختيارين على الأقل`,
            "error"
          );

          return;
        }

        if (
          question.choices.some(
            (choice) =>
              !choice.text.trim()
          )
        ) {

          showToast(
            `يوجد اختيار فارغ في السؤال رقم ${
              i + 1
            }`,
            "error"
          );

          return;
        }

        if (
          !question.choices.some(
            (choice) =>
              choice.isCorrect
          )
        ) {

          showToast(
            `حدد الإجابة الصحيحة للسؤال رقم ${
              i + 1
            }`,
            "error"
          );

          return;
        }
      }

      setSaving(true);

      try {

        const payload = {

          name:
            data.name.trim(),

          description:
            data.description?.trim() ??
            "",

          category:
            data.category?.trim() ??
            "",

          type:
            data.type?.trim() ?? "",

          isActive:
            data.isActive,

          order:
            Number(data.order) || 0,

          questions:
            data.questions.map(
              (
                question,
                index
              ) => {

                const correctIndex =
                  question.choices.findIndex(
                    (choice) =>
                      choice.isCorrect
                  );

                return {

                  id:
                    question.id !=
                    null
                      ? Number(
                          question.id
                        )
                      : index + 1,

                  category:
                    question.category?.trim() ||
                    data.category?.trim() ||
                    "",

                  question:
                    question.text.trim(),

                  options:
                    question.choices.map(
                      (choice) =>
                        choice.text.trim()
                    ),

                  correctIndex:
                    correctIndex >= 0
                      ? correctIndex
                      : 0,

                  explanation:
                    question.explanation?.trim() ??
                    "",

                  ...(question.passage?.trim()
                    ? {
                        passage:
                          question.passage.trim(),
                      }
                    : {}),
                };
              }
            ),
        };

        const res =
          await api.put(
            `/api/admin/sections/${id}`,
            payload
          );

        if (
          res.data.success
        ) {

          showToast(
            res.data.message ||
              "تم حفظ القسم بنجاح"
          );

          onSaved();
          onClose();

        } else {

          showToast(
            res.data.message ||
              "فشل حفظ القسم",
            "error"
          );
        }

      } catch (e: any) {

        showToast(
          e.response?.data
            ?.message ||
            "فشل حفظ القسم",
          "error"
        );

      } finally {

        setSaving(false);

      }
    };

  /* =========================================================
     EDITOR UI
  ========================================================= */

  return (
    <div
      className="sm-root sm-scroll"
      style={{
        position: "fixed",
        inset: 0,

        zIndex: 9999,

        background:
          "rgba(3,5,8,.86)",

        backdropFilter:
          "blur(6px)",

        overflowY: "auto",

        padding: "22px 16px",
      }}
    >

      <Styles />

      <div
        className="sm-editor"
        style={{
          width: "100%",
          maxWidth: 1180,

          margin: "0 auto",

          background: C.panel,

          border:
            `1px solid ${C.border}`,

          borderRadius: 20,

          overflow: "hidden",

          boxShadow:
            "0 30px 90px rgba(0,0,0,.55)",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            position: "sticky",
            top: 0,

            zIndex: 10,

            minHeight: 82,

            padding:
              "17px 24px",

            background:
              "rgba(17,22,31,.96)",

            backdropFilter:
              "blur(10px)",

            borderBottom:
              `1px solid ${C.border}`,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap: 15,
          }}
        >

          <div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 10,
              }}
            >

              <span
                style={{
                  width: 37,
                  height: 37,

                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  borderRadius: 10,

                  background:
                    C.goldSoft,

                  color:
                    C.gold,

                  fontWeight: 900,
                }}
              >
                ✎
              </span>

              <h2
                style={{
                  margin: 0,
                  color: C.text,
                  fontSize: 21,
                  fontWeight: 800,
                }}
              >
                تعديل القسم
              </h2>

            </div>

            <div
              style={{
                marginTop: 5,
                marginRight: 47,

                color: C.muted,

                fontSize: 13,
              }}
            >
              القسم #{id}
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="sm-btn sm-btn-secondary"
          >
            إغلاق
          </button>

        </div>

        {/* CONTENT */}

        {loading ? (

          <div
            style={{
              padding: 80,
              textAlign: "center",
              color: C.muted,
            }}
          >
            جاري تحميل بيانات
            القسم...
          </div>

        ) : !data ? (

          <div
            style={{
              padding: 80,
              textAlign: "center",
              color: C.red,
            }}
          >
            تعذر تحميل بيانات
            القسم
          </div>

        ) : (

          <>

            <div
              className="sm-editor-content"
              style={{
                padding: 28,

                display: "flex",

                flexDirection:
                  "column",

                gap: 28,
              }}
            >

              {/* SECTION INFO */}

              <section>

                <div
                  style={{
                    marginBottom: 17,
                  }}
                >

                  <h3
                    style={{
                      margin: 0,

                      fontSize: 17,

                      fontWeight: 800,

                      color: C.text,
                    }}
                  >
                    معلومات القسم
                  </h3>

                  <p
                    style={{
                      margin:
                        "4px 0 0",

                      color: C.muted,

                      fontSize: 13,
                    }}
                  >
                    البيانات الأساسية
                    الخاصة بهذا القسم
                  </p>

                </div>

                <div
                  style={{
                    padding: 22,

                    background:
                      C.panel2,

                    border:
                      `1px solid ${C.border}`,

                    borderRadius: 16,
                  }}
                >

                  <div
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(220px,1fr))",

                      gap: 17,
                    }}
                  >

                    <Field label="اسم القسم">

                      <input
                        className="sm-input"

                        value={
                          data.name
                        }

                        onChange={(e) =>
                          updateSection({
                            name:
                              e.target
                                .value,
                          })
                        }

                        placeholder="مثال: القسم 1"
                      />

                    </Field>

                    <Field label="File ID">

                      <input
                        className="sm-input"

                        value={
                          data.fileId
                        }

                        readOnly
                        dir="ltr"
                      />

                    </Field>

                    <Field label="التصنيف">

                      <input
                        className="sm-input"

                        value={
                          data.category ||
                          ""
                        }

                        onChange={(e) =>
                          updateSection({
                            category:
                              e.target
                                .value,
                          })
                        }

                        placeholder="مثال: كمي"
                      />

                    </Field>

                    <Field label="النوع">

                      <input
                        className="sm-input"

                        value={
                          data.type ||
                          ""
                        }

                        onChange={(e) =>
                          updateSection({
                            type:
                              e.target
                                .value,
                          })
                        }

                        placeholder="مثال: اختبار"
                      />

                    </Field>

                    <Field label="الترتيب">

                      <input
                        className="sm-input"

                        type="number"

                        value={
                          data.order
                        }

                        onChange={(e) =>
                          updateSection({
                            order:
                              Number(
                                e.target
                                  .value
                              ),
                          })
                        }
                      />

                    </Field>

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "flex-end",
                      }}
                    >

                      <label
                        style={{
                          minHeight: 52,

                          width:
                            "100%",

                          padding:
                            "0 15px",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap: 11,

                          background:
                            data.isActive
                              ? C.greenSoft
                              : C.input,

                          border:
                            `1px solid ${
                              data.isActive
                                ? "rgba(69,212,154,.25)"
                                : C.border
                            }`,

                          borderRadius: 12,

                          color:
                            data.isActive
                              ? C.green
                              : C.text2,

                          cursor:
                            "pointer",

                          fontSize: 14,

                          fontWeight: 700,
                        }}
                      >

                        <input
                          type="checkbox"

                          checked={
                            data.isActive
                          }

                          onChange={(e) =>
                            updateSection({
                              isActive:
                                e.target
                                  .checked,
                            })
                          }

                          style={{
                            width: 18,
                            height: 18,

                            accentColor:
                              C.gold,
                          }}
                        />

                        القسم نشط

                      </label>

                    </div>

                  </div>

                  <div
                    style={{
                      marginTop: 18,
                    }}
                  >

                    <Field label="الشرح / الوصف">

                      <textarea
                        className="sm-input"

                        value={
                          data.description ||
                          ""
                        }

                        onChange={(e) =>
                          updateSection({
                            description:
                              e.target
                                .value,
                          })
                        }

                        placeholder="اكتب وصفًا واضحًا لمحتوى القسم..."
                      />

                    </Field>

                  </div>

                </div>

              </section>

              {/* QUESTIONS HEADER */}

              <section>

                <div
                  style={{
                    display: "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",

                    gap: 15,

                    flexWrap:
                      "wrap",

                    marginBottom: 16,
                  }}
                >

                  <div>

                    <h3
                      style={{
                        margin: 0,

                        color:
                          C.text,

                        fontSize: 19,

                        fontWeight: 800,
                      }}
                    >
                      الأسئلة
                    </h3>

                    <p
                      style={{
                        margin:
                          "4px 0 0",

                        color:
                          C.muted,

                        fontSize: 13,
                      }}
                    >
                      يحتوي القسم
                      على{" "}
                      <strong
                        style={{
                          color:
                            C.text2,
                        }}
                      >
                        {
                          data
                            .questions
                            .length
                        }
                      </strong>{" "}
                      سؤال
                    </p>

                  </div>

                  <button
                    type="button"

                    onClick={
                      addQuestion
                    }

                    className="sm-btn sm-btn-primary"
                  >
                    <span
                      style={{
                        fontSize: 18,
                      }}
                    >
                      +
                    </span>

                    إضافة سؤال
                  </button>

                </div>

                {/* EMPTY */}

                {data.questions
                  .length === 0 && (

                  <div
                    style={{
                      padding:
                        "50px 20px",

                      textAlign:
                        "center",

                      border:
                        `1px dashed ${C.borderStrong}`,

                      borderRadius: 16,

                      background:
                        C.panel2,
                    }}
                  >

                    <div
                      style={{
                        fontSize: 28,
                        marginBottom: 8,
                      }}
                    >
                      ?
                    </div>

                    <div
                      style={{
                        color:
                          C.text2,

                        fontWeight: 700,
                      }}
                    >
                      لا توجد أسئلة
                      حتى الآن
                    </div>

                    <div
                      style={{
                        color:
                          C.muted,

                        marginTop: 5,

                        fontSize: 13,
                      }}
                    >
                      أضف أول سؤال
                      لهذا القسم
                    </div>

                  </div>

                )}

                {/* QUESTIONS */}

                <div
                  style={{
                    display: "grid",
                    gap: 18,
                  }}
                >

                  {data.questions.map(
                    (q, qi) => (

                      <article
                        key={q._key}

                        className="sm-question"
                      >

                        {/* QUESTION HEADER */}

                        <div className="sm-question-header">

                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap: 11,
                            }}
                          >

                            <span
                              style={{
                                width: 35,
                                height: 35,

                                borderRadius: 9,

                                background:
                                  C.goldSoft,

                                color:
                                  C.gold,

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                fontSize: 14,

                                fontWeight: 800,
                              }}
                            >
                              {qi + 1}
                            </span>

                            <div>

                              <strong
                                style={{
                                  color:
                                    C.text,

                                  fontSize: 15,
                                }}
                              >
                                سؤال{" "}
                                {qi + 1}
                              </strong>

                              <div
                                style={{
                                  marginTop: 2,

                                  color:
                                    C.muted,

                                  fontSize: 12,
                                }}
                              >
                                {
                                  q.choices
                                    .length
                                }{" "}
                                اختيارات
                              </div>

                            </div>

                          </div>

                          <button
                            type="button"

                            onClick={() =>
                              removeQuestion(
                                q._key
                              )
                            }

                            className="sm-btn sm-btn-danger"
                          >
                            حذف السؤال
                          </button>

                        </div>

                        {/* QUESTION BODY */}

                        <div className="sm-question-body">

                          <div
                            style={{
                              display: "grid",
                              gap: 18,
                            }}
                          >

                            <Field label="نص السؤال">

                              <textarea
                                className="sm-input"

                                value={
                                  q.text
                                }

                                onChange={(e) =>
                                  updateQuestion(
                                    q._key,
                                    {
                                      text:
                                        e
                                          .target
                                          .value,
                                    }
                                  )
                                }

                                placeholder="اكتب نص السؤال هنا..."
                              />

                            </Field>

                            <div
                              style={{
                                display:
                                  "grid",

                                gridTemplateColumns:
                                  "repeat(auto-fit,minmax(220px,1fr))",

                                gap: 15,
                              }}
                            >

                              <Field label="نوع السؤال">

                                <input
                                  className="sm-input"

                                  value={
                                    q.category ||
                                    ""
                                  }

                                  onChange={(
                                    e
                                  ) =>
                                    updateQuestion(
                                      q._key,
                                      {
                                        category:
                                          e
                                            .target
                                            .value,
                                      }
                                    )
                                  }

                                  placeholder="مثال: تناظر لفظي"
                                />

                              </Field>

                              <Field label="نوع الإجابة">

                                <select
                                  className="sm-input"

                                  value={
                                    q.type ||
                                    "single"
                                  }

                                  onChange={(
                                    e
                                  ) => {

                                    const type =
                                      e.target
                                        .value;

                                    updateQuestion(
                                      q._key,
                                      {
                                        type,
                                      }
                                    );

                                    if (
                                      type ===
                                      "single"
                                    ) {

                                      const firstCorrect =
                                        q.choices.findIndex(
                                          (
                                            c
                                          ) =>
                                            c.isCorrect
                                        );

                                      q.choices.forEach(
                                        (
                                          c,
                                          index
                                        ) => {

                                          updateChoice(
                                            q._key,
                                            c._key,
                                            {
                                              isCorrect:
                                                firstCorrect >=
                                                0
                                                  ? index ===
                                                    firstCorrect
                                                  : index ===
                                                    0,
                                            }
                                          );
                                        }
                                      );
                                    }

                                  }}
                                >
                                  <option value="single">
                                    إجابة واحدة
                                  </option>

                                  <option value="multiple">
                                    أكثر من إجابة
                                  </option>
                                </select>

                              </Field>

                            </div>

                            <Field label="قطعة القراءة (اختياري)">

                              <textarea
                                className="sm-input"

                                value={
                                  q.passage ||
                                  ""
                                }

                                onChange={(e) =>
                                  updateQuestion(
                                    q._key,
                                    {
                                      passage:
                                        e
                                          .target
                                          .value,
                                    }
                                  )
                                }

                                placeholder="ضع قطعة القراءة هنا إذا كان السؤال مرتبطًا بنص..."
                              />

                            </Field>

                            {/* CHOICES */}

                            <div>

                              <div
                                style={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  justifyContent:
                                    "space-between",

                                  gap: 10,

                                  marginBottom: 10,
                                }}
                              >

                                <label
                                  style={{
                                    ...labelStyle,
                                    marginBottom: 0,
                                  }}
                                >
                                  الاختيارات
                                </label>

                                <span
                                  style={{
                                    color:
                                      C.muted,

                                    fontSize: 12,
                                  }}
                                >
                                  اختر الإجابة
                                  الصحيحة
                                </span>

                              </div>

                              <div
                                style={{
                                  display:
                                    "grid",

                                  gap: 6,
                                }}
                              >

                                {q.choices.map(
                                  (
                                    choice,
                                    ci
                                  ) => (

                                    <div
                                      key={
                                        choice._key
                                      }

                                      className={`sm-choice ${
                                        choice.isCorrect
                                          ? "correct"
                                          : ""
                                      }`}
                                    >

                                      <div
                                        style={{
                                          position:
                                            "relative",
                                        }}
                                      >

                                        <span
                                          style={{
                                            position:
                                              "absolute",

                                            right: 13,

                                            top: "50%",

                                            transform:
                                              "translateY(-50%)",

                                            color:
                                              choice.isCorrect
                                                ? C.green
                                                : C.muted,

                                            fontSize: 12,

                                            fontWeight: 800,

                                            zIndex: 1,
                                          }}
                                        >
                                          {ci + 1}
                                        </span>

                                        <input
                                          className="sm-input"

                                          value={
                                            choice.text
                                          }

                                          onChange={(
                                            e
                                          ) =>
                                            updateChoice(
                                              q._key,
                                              choice._key,
                                              {
                                                text:
                                                  e
                                                    .target
                                                    .value,
                                              }
                                            )
                                          }

                                          placeholder={`نص الاختيار ${
                                            ci +
                                            1
                                          }`}

                                          style={{
                                            paddingRight: 42,
                                          }}
                                        />

                                      </div>

                                      <label
                                        className="sm-choice-actions"

                                        style={{
                                          display:
                                            "flex",

                                          alignItems:
                                            "center",

                                          gap: 8,

                                          minWidth: 80,

                                          color:
                                            choice.isCorrect
                                              ? C.green
                                              : C.text2,

                                          cursor:
                                            "pointer",

                                          fontSize: 13,

                                          fontWeight: 700,
                                        }}
                                      >

                                        <input
                                          type={
                                            q.type ===
                                            "multiple"
                                              ? "checkbox"
                                              : "radio"
                                          }

                                          name={
                                            q.type ===
                                            "multiple"
                                              ? undefined
                                              : `question-${q._key}`
                                          }

                                          checked={
                                            !!choice.isCorrect
                                          }

                                          onChange={(
                                            e
                                          ) =>
                                            updateChoice(
                                              q._key,
                                              choice._key,
                                              {
                                                isCorrect:
                                                  e
                                                    .target
                                                    .checked,
                                              }
                                            )
                                          }

                                          style={{
                                            width: 18,
                                            height: 18,

                                            accentColor:
                                              C.green,
                                          }}
                                        />

                                        {choice.isCorrect
                                          ? "صحيحة"
                                          : "صحيح"}

                                      </label>

                                      <button
                                        type="button"

                                        onClick={() =>
                                          removeChoice(
                                            q._key,
                                            choice._key
                                          )
                                        }

                                        className="sm-btn sm-btn-danger"

                                        style={{
                                          minHeight: 39,
                                          padding:
                                            "7px 11px",
                                        }}

                                        title="حذف الاختيار"
                                      >
                                        ✕
                                      </button>

                                    </div>

                                  )
                                )}

                              </div>

                              <button
                                type="button"

                                onClick={() =>
                                  addChoice(
                                    q._key
                                  )
                                }

                                className="sm-btn sm-btn-secondary"

                                style={{
                                  marginTop: 10,
                                }}
                              >
                                + إضافة اختيار
                              </button>

                            </div>

                            <Field label="شرح الإجابة (اختياري)">

                              <textarea
                                className="sm-input"

                                value={
                                  q.explanation ||
                                  ""
                                }

                                onChange={(e) =>
                                  updateQuestion(
                                    q._key,
                                    {
                                      explanation:
                                        e
                                          .target
                                          .value,
                                    }
                                  )
                                }

                                placeholder="اكتب شرحًا للإجابة الصحيحة..."
                              />

                            </Field>

                          </div>

                        </div>

                      </article>

                    )
                  )}

                </div>

              </section>

            </div>

            {/* STICKY SAVE BAR */}

            <div
              style={{
                position: "sticky",
                bottom: 0,

                zIndex: 10,

                padding:
                  "15px 24px",

                background:
                  "rgba(17,22,31,.96)",

                backdropFilter:
                  "blur(10px)",

                borderTop:
                  `1px solid ${C.border}`,

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap: 15,

                flexWrap:
                  "wrap",
              }}
            >

              <div
                className="sm-hide-mobile"
                style={{
                  color: C.muted,
                  fontSize: 13,
                }}
              >
                تأكد من تحديد
                الإجابة الصحيحة لكل
                سؤال قبل الحفظ.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 9,
                }}
              >

                <button
                  type="button"

                  onClick={
                    saveSection
                  }

                  disabled={
                    saving
                  }

                  className="sm-btn sm-btn-primary"

                  style={{
                    minWidth: 155,
                  }}
                >
                  {saving
                    ? "جاري الحفظ..."
                    : "حفظ التغييرات"}
                </button>

                <button
                  type="button"

                  onClick={onClose}

                  className="sm-btn sm-btn-secondary"
                >
                  إلغاء
                </button>

              </div>

            </div>

          </>

        )}

      </div>

    </div>
  );
}

/* =========================================================
   SECTIONS LIST
========================================================= */

export default function SectionsList({
  api,
  showToast,
  onEdit,
}: Props) {

  const [sections, setSections] =
    useState<Section[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showAdd, setShowAdd] =
    useState(false);

  const [newName, setNewName] =
    useState("");

  const [
    newDescription,
    setNewDescription,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    confirmDelete,
    setConfirmDelete,
  ] = useState<Section | null>(
    null
  );

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null
  );

  // 🆕 حالة المزامنة
  const [syncing, setSyncing] =
    useState(false);

  /* ---------------------------
     Fetch
  ---------------------------- */

  const fetchSections =
    async () => {

      setLoading(true);

      try {

        const res =
          await api.get(
            "/api/admin/sections"
          );

        if (
          res.data.success
        ) {
          setSections(
            res.data.sections
          );
        }

      } catch (e: any) {

        showToast(
          e.response?.data
            ?.message ||
            "فشل تحميل الأقسام",
          "error"
        );

      } finally {

        setLoading(false);

      }
    };

  useEffect(() => {
    fetchSections();
    // eslint-disable-next-line
  }, []);

  /* ---------------------------
     Toggle
  ---------------------------- */

  const toggleSection =
    async (id: number) => {

      try {

        const res =
          await api.post(
            `/api/admin/sections/${id}/toggle`
          );

        if (
          res.data.success
        ) {

          showToast(
            res.data.message
          );

          fetchSections();
        }

      } catch (e: any) {

        showToast(
          e.response?.data
            ?.message ||
            "فشلت العملية",
          "error"
        );
      }
    };

  /* ---------------------------
     Delete
  ---------------------------- */

  const deleteSection =
    async (id: number) => {

      try {

        const res =
          await api.delete(
            `/api/admin/sections/${id}`
          );

        if (
          res.data.success
        ) {

          showToast(
            "تم حذف القسم"
          );

          fetchSections();
        }

      } catch (e: any) {

        showToast(
          e.response?.data
            ?.message ||
            "فشل الحذف",
          "error"
        );
      }
    };

  /* ---------------------------
     Add
  ---------------------------- */

  const addSection =
    async () => {

      if (
        !newName.trim()
      ) {

        showToast(
          "أدخل اسم القسم",
          "error"
        );

        return;
      }

      setSaving(true);

      try {

        const res =
          await api.post(
            "/api/admin/sections",
            {
              name:
                newName.trim(),

              description:
                newDescription.trim(),
            }
          );

        if (
          res.data.success
        ) {

          showToast(
            "تم إنشاء القسم"
          );

          setShowAdd(false);

          setNewName("");

          setNewDescription("");

          await fetchSections();

          const created =
            res.data.section ||
            res.data.data ||
            res.data;

          if (
            created?.id
          ) {
            setEditingId(
              Number(
                created.id
              )
            );
          }

        } else {

          showToast(
            res.data.message ||
              "فشل الإنشاء",
            "error"
          );
        }

      } catch (e: any) {

        showToast(
          e.response?.data
            ?.message ||
            "فشل الإنشاء",
          "error"
        );

      } finally {

        setSaving(false);

      }
    };

  /* ---------------------------
     🆕 Sync from files
  ---------------------------- */

  const syncFromFiles =
    async () => {

      setSyncing(true);

      try {

        const res =
          await api.post(
            "/api/admin/sections/sync-from-files"
          );

        if (
          res.data.success
        ) {

          showToast(
            res.data.message ||
              "تمت المزامنة بنجاح ✅"
          );

          await fetchSections();

        } else {

          showToast(
            res.data.message ||
              "فشلت المزامنة",
            "error"
          );
        }

      } catch (e: any) {

        showToast(
          e.response?.data
            ?.message ||
            "فشلت المزامنة من الملفات",
          "error"
        );
      } finally {

        setSyncing(false);

      }
    };

  /* ---------------------------
     Filter
  ---------------------------- */

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filtered =
    sections.filter(
      (section) => {

        if (
          !normalizedSearch
        ) {
          return true;
        }

        return (
          section.name
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||

          String(section.id) ===
            normalizedSearch ||

          String(
            section.fileId ?? ""
          )
            .toLowerCase()
            .includes(
              normalizedSearch
            )
        );
      }
    );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="sm-root"
      style={{
        display: "flex",

        flexDirection:
          "column",

        gap: 22,
      }}
    >

      <Styles />

      {/* PAGE HEADER */}

      <header
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap: 16,

          flexWrap:
            "wrap",
        }}
      >

        <div>

          <h1
            className="sm-title"

            style={{
              margin: 0,

              color: C.text,

              fontSize: 28,

              lineHeight: 1.35,

              fontWeight: 800,
            }}
          >
            إدارة الأقسام
          </h1>

          <p
            style={{
              margin: "7px 0 0",

              color: C.muted,

              fontSize: 14,
            }}
          >
            إنشاء وتعديل الأقسام
            والأسئلة والاختيارات
          </p>

        </div>

        <button
          type="button"

          onClick={() =>
            setShowAdd(true)
          }

          className="sm-btn sm-btn-primary"

          style={{
            minHeight: 46,
            padding:
              "10px 20px",
          }}
        >
          <span
            style={{
              fontSize: 19,
            }}
          >
            +
          </span>

          إضافة قسم
        </button>

      </header>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit,minmax(160px,1fr))",

          gap: 12,
        }}
      >

        <div
          style={{
            padding: 16,

            background:
              C.panel,

            border:
              `1px solid ${C.border}`,

            borderRadius: 14,
          }}
        >
          <div
            style={{
              color: C.muted,
              fontSize: 13,
            }}
          >
            إجمالي الأقسام
          </div>

          <div
            style={{
              marginTop: 5,

              color: C.text,

              fontSize: 24,

              fontWeight: 800,
            }}
          >
            {sections.length}
          </div>
        </div>

        <div
          style={{
            padding: 16,

            background:
              C.panel,

            border:
              `1px solid ${C.border}`,

            borderRadius: 14,
          }}
        >
          <div
            style={{
              color: C.muted,
              fontSize: 13,
            }}
          >
            الأقسام النشطة
          </div>

          <div
            style={{
              marginTop: 5,

              color: C.green,

              fontSize: 24,

              fontWeight: 800,
            }}
          >
            {
              sections.filter(
                (section) =>
                  section.isActive
              ).length
            }
          </div>
        </div>

        <div
          style={{
            padding: 16,

            background:
              C.panel,

            border:
              `1px solid ${C.border}`,

            borderRadius: 14,
          }}
        >
          <div
            style={{
              color: C.muted,
              fontSize: 13,
            }}
          >
            إجمالي الأسئلة
          </div>

          <div
            style={{
              marginTop: 5,

              color: C.gold,

              fontSize: 24,

              fontWeight: 800,
            }}
          >
            {sections.reduce(
              (total, section) =>
                total +
                (section.questionCount ??
                  section.questions
                    ?.length ??
                  0),
              0
            )}
          </div>
        </div>

      </div>

      {/* TABLE CARD */}

      <section
        style={{
          overflow: "hidden",

          background:
            C.panel,

          border:
            `1px solid ${C.border}`,

          borderRadius: 17,

          boxShadow:
            "0 12px 35px rgba(0,0,0,.12)",
        }}
      >

        {/* TOOLBAR */}

        <div
          style={{
            padding: 17,

            borderBottom:
              `1px solid ${C.border}`,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap: 12,

            flexWrap:
              "wrap",
          }}
        >

          <div
            style={{
              flex: 1,

              minWidth: 220,

              maxWidth: 400,
            }}
          >

            <input
              className="sm-input"

              value={search}

              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }

              placeholder="ابحث باسم القسم أو رقمه..."
            />

          </div>

          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              gap: 12,

              flexWrap: "wrap",
            }}
          >

            <span
              style={{
                color: C.muted,
                fontSize: 13,
              }}
            >
              {filtered.length} نتيجة
            </span>

            {/* 🆕 زر المزامنة من الملفات */}
            <button
              type="button"
              onClick={syncFromFiles}
              disabled={syncing || loading}
              className="sm-btn sm-btn-sync"
              title="مزامنة الأقسام من ملفات JSON في VS Code"
            >
              {syncing ? (
                <>
                  <span style={{
                    display: "inline-block",
                    animation: "spin 1s linear infinite",
                  }}>⟳</span>
                  جاري المزامنة...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  مزامنة من الملفات
                </>
              )}
            </button>

            <button
              type="button"

              onClick={
                fetchSections
              }

              disabled={
                loading
              }

              className="sm-btn sm-btn-secondary"
            >
              {loading
                ? "جاري التحديث..."
                : "تحديث"}
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div
          className="sm-scroll"

          style={{
            overflow: "auto",
            maxHeight: "66vh",
          }}
        >

          <table
            style={{
              width: "100%",

              borderCollapse:
                "collapse",

              minWidth: 720,
            }}
          >

            <thead
              style={{
                position:
                  "sticky",

                top: 0,

                zIndex: 2,
              }}
            >

              <tr
                style={{
                  borderBottom:
                    `1px solid ${C.border}`,
                }}
              >
                <th style={thStyle}>
                  الرقم
                </th>

                <th style={thStyle}>
                  اسم القسم
                </th>

                <th style={thStyle}>
                  الأسئلة
                </th>

                <th style={thStyle}>
                  الحالة
                </th>

                <th style={thStyle}>
                  الإجراءات
                </th>
              </tr>

            </thead>

            <tbody>

              {filtered.map(
                (section) => (

                  <tr
                    key={
                      section.id
                    }

                    className="sm-table-row"

                    style={{
                      borderBottom:
                        "1px solid #232b37",
                    }}
                  >

                    <td
                      style={{
                        ...tdStyle,

                        color:
                          C.muted,
                      }}
                    >
                      {section.fileId}
                    </td>

                    <td style={tdStyle}>

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap: 11,
                        }}
                      >

                        <span
                          style={{
                            width: 34,
                            height: 34,

                            borderRadius: 9,

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            flexShrink: 0,

                            background:
                              C.goldSoft,

                            color:
                              C.gold,

                            fontWeight: 800,

                            fontSize: 13,
                          }}
                        >
                          {section.name
                            ?.trim()
                            .charAt(0) ||
                            "ق"}
                        </span>

                        <span
                          style={{
                            color:
                              C.text,

                            fontWeight: 700,

                            fontSize: 15,
                          }}
                        >
                          {section.name}
                        </span>

                      </div>

                    </td>

                    <td style={tdStyle}>

                      <span
                        style={{
                          display:
                            "inline-flex",

                          minWidth: 35,
                          height: 28,

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          padding:
                            "0 9px",

                          borderRadius: 8,

                          background:
                            "#19212c",

                          color:
                            C.text2,

                          fontWeight: 700,
                        }}
                      >
                        {section.questionCount ??
                          section.questions
                            ?.length ??
                          0}
                      </span>

                    </td>

                    <td style={tdStyle}>
                      <Status
                        active={
                          section.isActive
                        }
                      />
                    </td>

                    <td style={tdStyle}>

                      <div
                        style={{
                          display:
                            "flex",

                          flexWrap:
                            "wrap",

                          gap: 7,
                        }}
                      >

                        <button
                          type="button"

                          onClick={() =>
                            setEditingId(
                              section.id
                            )
                          }

                          className="sm-btn sm-btn-secondary"

                          style={{
                            color:
                              C.gold,

                            borderColor:
                              "#514525",
                          }}
                        >
                          تعديل
                        </button>

                        {onEdit && (

                          <button
                            type="button"

                            onClick={() =>
                              onEdit(
                                section.id
                              )
                            }

                            className="sm-btn sm-btn-secondary"
                          >
                            الأسئلة
                          </button>

                        )}

                        <button
                          type="button"

                          onClick={() =>
                            toggleSection(
                              section.id
                            )
                          }

                          className="sm-btn sm-btn-secondary"
                        >
                          {section.isActive
                            ? "تعطيل"
                            : "تفعيل"}
                        </button>

                        <button
                          type="button"

                          onClick={() =>
                            setConfirmDelete(
                              section
                            )
                          }

                          className="sm-btn sm-btn-danger"
                        >
                          حذف
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

          {!loading &&
            filtered.length ===
              0 && (

              <div
                style={{
                  padding:
                    "55px 20px",

                  textAlign:
                    "center",

                  color:
                    C.muted,
                }}
              >
                لا توجد أقسام
                مطابقة للبحث
              </div>

            )}

        </div>

      </section>

      {/* =====================================================
          ADD SECTION MODAL
      ===================================================== */}

      {showAdd && (

        <div
          style={{
            position: "fixed",
            inset: 0,

            zIndex: 9998,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            padding: 18,

            background:
              "rgba(3,5,8,.83)",

            backdropFilter:
              "blur(5px)",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: 480,

              background:
                C.panel,

              border:
                `1px solid ${C.border}`,

              borderRadius: 18,

              boxShadow:
                "0 30px 80px rgba(0,0,0,.5)",

              overflow:
                "hidden",
            }}
          >

            <div
              style={{
                padding:
                  "19px 22px",

                borderBottom:
                  `1px solid ${C.border}`,
              }}
            >

              <h2
                style={{
                  margin: 0,

                  color:
                    C.text,

                  fontSize: 19,

                  fontWeight: 800,
                }}
              >
                إضافة قسم جديد
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",

                  color:
                    C.muted,

                  fontSize: 13,
                }}
              >
                أنشئ القسم ثم
                أضف الأسئلة من
                المحرر
              </p>

            </div>

            <div
              style={{
                padding: 22,

                display: "grid",

                gap: 17,
              }}
            >

              <Field label="اسم القسم">

                <input
                  autoFocus

                  className="sm-input"

                  value={
                    newName
                  }

                  onChange={(e) =>
                    setNewName(
                      e.target.value
                    )
                  }

                  placeholder="مثال: القسم 201"
                />

              </Field>

              <Field label="الوصف">

                <textarea
                  className="sm-input"

                  value={
                    newDescription
                  }

                  onChange={(e) =>
                    setNewDescription(
                      e.target.value
                    )
                  }

                  placeholder="وصف مختصر لمحتوى القسم..."
                />

              </Field>

            </div>

            <div
              style={{
                padding:
                  "15px 22px",

                borderTop:
                  `1px solid ${C.border}`,

                display: "flex",

                justifyContent:
                  "flex-end",

                gap: 9,
              }}
            >

              <button
                type="button"

                onClick={
                  addSection
                }

                disabled={
                  saving
                }

                className="sm-btn sm-btn-primary"
              >
                {saving
                  ? "جاري الإنشاء..."
                  : "إنشاء القسم"}
              </button>

              <button
                type="button"

                onClick={() =>
                  setShowAdd(
                    false
                  )
                }

                className="sm-btn sm-btn-secondary"
              >
                إلغاء
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          DELETE CONFIRM
      ===================================================== */}

      {confirmDelete && (

        <div
          style={{
            position: "fixed",
            inset: 0,

            zIndex: 9998,

            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            padding: 18,

            background:
              "rgba(3,5,8,.83)",

            backdropFilter:
              "blur(5px)",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: 420,

              padding: 25,

              textAlign:
                "center",

              background:
                C.panel,

              border:
                `1px solid ${C.border}`,

              borderRadius: 18,

              boxShadow:
                "0 30px 80px rgba(0,0,0,.5)",
            }}
          >

            <div
              style={{
                width: 48,
                height: 48,

                margin:
                  "0 auto 14px",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius: 13,

                background:
                  C.redSoft,

                color:
                  C.red,

                fontSize: 20,

                fontWeight: 900,
              }}
            >
              !
            </div>

            <h3
              style={{
                margin:
                  "0 0 8px",

                color:
                  C.text,

                fontSize: 18,
              }}
            >
              حذف القسم
            </h3>

            <p
              style={{
                margin:
                  "0 0 22px",

                color:
                  C.muted,

                fontSize: 14,

                lineHeight: 1.8,
              }}
            >
              هل تريد حذف
              <strong
                style={{
                  color:
                    C.text2,
                }}
              >
                {" "}
                "
                {
                  confirmDelete.name
                }
                "
              </strong>
              ؟
              <br />
              لا يمكن التراجع عن
              هذه العملية.
            </p>

            <div
              style={{
                display: "flex",

                justifyContent:
                  "center",

                gap: 9,
              }}
            >

              <button
                type="button"

                onClick={() => {

                  deleteSection(
                    confirmDelete.id
                  );

                  setConfirmDelete(
                    null
                  );

                }}

                className="sm-btn sm-btn-danger"
              >
                نعم، حذف القسم
              </button>

              <button
                type="button"

                onClick={() =>
                  setConfirmDelete(
                    null
                  )
                }

                className="sm-btn sm-btn-secondary"
              >
                إلغاء
              </button>

            </div>

          </div>

        </div>

      )}

      {/* EDITOR */}

      {editingId !== null && (

        <SectionEditor
          id={editingId}

          api={api}

          showToast={
            showToast
          }

          onClose={() =>
            setEditingId(null)
          }

          onSaved={
            fetchSections
          }
        />

      )}

    </div>
  );
}