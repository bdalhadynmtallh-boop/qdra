import type { FastifyInstance } from "fastify";

// دالة مساعدة لتحديث الستريك
async function updateStreak(fastify: FastifyInstance, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const stats = await fastify.prisma.userStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    await fastify.prisma.userStats.create({
      data: {
        userId,
        streakCount: 1,
        lastActiveDate: today,
      },
    });
    return 1;
  }

  const lastActive = stats.lastActiveDate;
  let newStreak = stats.streakCount;

  if (!lastActive) {
    newStreak = 1;
  } else if (lastActive === today) {
    return newStreak;
  } else {
    const lastDate = new Date(lastActive);
    const nowDate = new Date(today);
    const diffInDays = Math.floor((nowDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    if (diffInDays === 1) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  }

  await fastify.prisma.userStats.update({
    where: { userId },
    data: {
      streakCount: newStreak,
      lastActiveDate: today,
    },
  });

  return newStreak;
}

export async function progressRoutes(fastify: FastifyInstance) {
  // =========================================================================
  // 1. جلب كل بيانات وتقدم المستخدم
  // =========================================================================
  fastify.get("/data", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const userProgress = await fastify.prisma.userProgress.findMany({
      where: { userId },
    });

    const allAttempts = await fastify.prisma.questionAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const favorites = await fastify.prisma.favoriteQuestion.findMany({
      where: { userId },
      select: { sectionId: true, questionId: true },
    });

    const stats = await fastify.prisma.userStats.findUnique({
      where: { userId },
    });

    const progressMap: Record<
      string | number,
      { completed: boolean; answeredIds: Array<string | number>; correctIds: Array<string | number> }
    > = {};

    const latestAttemptPerQuestion = new Map<string, boolean>();
    const mistakesSet = new Set<string>();

    userProgress.forEach((p: typeof userProgress[number]) => {
      progressMap[p.sectionId] = {
        completed: p.completed,
        answeredIds: [],
        correctIds: [],
      };
    });

    allAttempts.forEach((att: typeof allAttempts[number]) => {
      const sId = att.sectionId;
      const rawQId = att.questionId;
      const parsedNum = Number(rawQId);
      const qId = !isNaN(parsedNum) && String(parsedNum) === rawQId ? parsedNum : rawQId;

      const qKey = `${sId}_${rawQId}`;

      if (!progressMap[sId]) {
        progressMap[sId] = {
          completed: false,
          answeredIds: [],
          correctIds: [],
        };
      }

      if (!progressMap[sId].answeredIds.includes(qId as never)) {
        progressMap[sId].answeredIds.push(qId as never);
      }

      if (att.isCorrect && !progressMap[sId].correctIds.includes(qId as never)) {
        progressMap[sId].correctIds.push(qId as never);
      }

      if (!latestAttemptPerQuestion.has(qKey)) {
        latestAttemptPerQuestion.set(qKey, att.isCorrect);
        if (!att.isCorrect) {
          mistakesSet.add(qKey);
        }
      }
    });

    const formattedMistakes = Array.from(mistakesSet).map((key) => {
      const [sId, qId] = key.split("_");
      const numQ = Number(qId);
      return {
        sectionId: Number(sId),
        questionId: !isNaN(numQ) && String(numQ) === qId ? numQ : qId,
      };
    });

    const formattedFavorites = favorites.map((f: typeof favorites[number]) => {
      const numQ = Number(f.questionId);
      return {
        sectionId: f.sectionId,
        questionId: !isNaN(numQ) && String(numQ) === f.questionId ? numQ : f.questionId,
      };
    });

    const streakData = stats
      ? {
          count: stats.streakCount || 0,
          lastActiveDate: stats.lastActiveDate || "",
        }
      : { count: 0, lastActiveDate: "" };

    return reply.send({
      success: true,
      progress: progressMap,
      mistakes: formattedMistakes,
      favorites: formattedFavorites,
      stats,
      streakData,
    });
  });

  // =========================================================================
  // 2. تسجيل محاولة إجابة سؤال — ✅ معدّل ليحفظ timeMs
  // =========================================================================
  fastify.post("/attempt", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    // ✅ جديد: استخراج timeMs من الـ body
    const { sectionId, questionId, selectedAnswer, correctAnswer, isCorrect, timeMs } = request.body as any;
    const timeSeconds = Math.max(0, Math.round((Number(timeMs) || 0) / 1000));

    const strQuestionId = String(questionId);
    const numSectionId = Number(sectionId);

    await fastify.prisma.questionAttempt.create({
      data: {
        userId,
        sectionId: numSectionId,
        questionId: strQuestionId,
        selectedAnswer: Number(selectedAnswer || 0),
        correctAnswer: Number(correctAnswer || 0),
        isCorrect: Boolean(isCorrect),
      },
    });

    const previousAttempt = await fastify.prisma.questionAttempt.findFirst({
      where: {
        userId,
        sectionId: numSectionId,
        questionId: strQuestionId,
      },
      orderBy: { createdAt: "desc" },
      skip: 1,
    });

    const isFirstTimeAnswering = !previousAttempt;

    const newStreak = await updateStreak(fastify, userId);

    await fastify.prisma.userStats.upsert({
      where: { userId },
      update: {
        totalQuestions: isFirstTimeAnswering ? { increment: 1 } : undefined,
        totalAttempts: { increment: 1 },
        correctAnswers: isCorrect ? { increment: 1 } : undefined,
        wrongAnswers: !isCorrect ? { increment: 1 } : undefined,
        // ✅ جديد: زيادة وقت الدراسة
        totalStudyTimeSeconds: timeSeconds > 0 ? { increment: timeSeconds } : undefined,
        lastActivityAt: new Date(),
        streakCount: newStreak,
      },
      create: {
        userId,
        totalQuestions: 1,
        totalAttempts: 1,
        correctAnswers: isCorrect ? 1 : 0,
        wrongAnswers: isCorrect ? 0 : 1,
        totalStudyTimeSeconds: timeSeconds, // ✅ جديد
        lastActivityAt: new Date(),
        streakCount: newStreak,
      },
    });

    return reply.send({ success: true, streakCount: newStreak });
  });

  // =========================================================================
  // 3. إنهاء قسم
  // =========================================================================
  fastify.post("/complete-section", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const { sectionId, correctAnswers, totalQuestions } = request.body as any;

    const newStreak = await updateStreak(fastify, userId);

    await fastify.prisma.userProgress.upsert({
      where: {
        userId_sectionId: {
          userId,
          sectionId: Number(sectionId),
        },
      },
      update: {
        completed: true,
        correctAnswers: Number(correctAnswers),
        questionsAnswered: Number(totalQuestions),
      },
      create: {
        userId,
        sectionId: Number(sectionId),
        completed: true,
        correctAnswers: Number(correctAnswers),
        questionsAnswered: Number(totalQuestions),
      },
    });

    await fastify.prisma.userStats.upsert({
      where: { userId },
      update: {
        completedSections: { increment: 1 },
        streakCount: newStreak,
      },
      create: {
        userId,
        completedSections: 1,
        streakCount: newStreak,
      },
    });

    return reply.send({ success: true, streakCount: newStreak });
  });

  // =========================================================================
  // 4. جلب دروس الأساسيات المكتملة
  // =========================================================================
  fastify.get("/basics", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const completedLessons = await fastify.prisma.basicLessonProgress.findMany({
      where: { userId },
      select: { topicId: true },
    });

    const completedTopicIds = completedLessons.map(
      (l: typeof completedLessons[number]) => l.topicId
    );

    return reply.send({
      success: true,
      completedTopics: completedTopicIds,
    });
  });

  // =========================================================================
  // 5. حفظ/إلغاء حفظ درس أساسيات
  // =========================================================================
  fastify.post("/basics/toggle", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const { topicId } = request.body as { topicId: string };

    const existing = await fastify.prisma.basicLessonProgress.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId,
        },
      },
    });

    if (existing) {
      await fastify.prisma.basicLessonProgress.delete({
        where: { id: existing.id },
      });
      return reply.send({ success: true, completed: false });
    } else {
      await fastify.prisma.basicLessonProgress.create({
        data: {
          userId,
          topicId,
        },
      });

      const newStreak = await updateStreak(fastify, userId);

      await fastify.prisma.userStats.upsert({
        where: { userId },
        update: {
          streakCount: newStreak,
        },
        create: {
          userId,
          streakCount: newStreak,
        },
      });

      return reply.send({ success: true, completed: true, streakCount: newStreak });
    }
  });

  // =========================================================================
  // 6. تبديل المفضلة
  // =========================================================================
  fastify.post("/favorites/toggle", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const { sectionId, questionId } = request.body as any;
    const numSectionId = Number(sectionId);
    const strQuestionId = String(questionId);

    const existing = await fastify.prisma.favoriteQuestion.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId: strQuestionId,
        },
      },
    });

    if (existing) {
      await fastify.prisma.favoriteQuestion.delete({
        where: { id: existing.id },
      });
      return reply.send({ success: true, favorited: false });
    } else {
      await fastify.prisma.favoriteQuestion.create({
        data: {
          userId,
          sectionId: numSectionId,
          questionId: strQuestionId,
        },
      });
      return reply.send({ success: true, favorited: true });
    }
  });

  // =========================================================================
  // 7. إحصائيات آخر 7 أيام
  // =========================================================================
  fastify.get("/daily-stats", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const days: Array<{ date: string; label: string }> = [];
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceSunday = dayOfWeek;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - daysSinceSunday + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      days.push({ date: `${yyyy}-${mm}-${dd}`, label: dayNames[d.getDay()] });
    }

    const startDate = new Date(days[0].date + "T00:00:00.000Z");

    const attempts = await fastify.prisma.questionAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: { isCorrect: true, createdAt: true },
    });

    const map: Record<string, { correct: number; wrong: number }> = {};
    days.forEach((d) => (map[d.date] = { correct: 0, wrong: 0 }));

    attempts.forEach((att: any) => {
      if (!att.createdAt) return;

      const localDate = new Date(att.createdAt);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, "0");
      const day = String(localDate.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;

      if (map[key]) {
        if (att.isCorrect) {
          map[key].correct += 1;
        } else {
          map[key].wrong += 1;
        }
      }
    });

    const dailyStats = days.map((d) => ({
      date: d.date,
      label: d.label,
      correct: map[d.date].correct,
      wrong: map[d.date].wrong,
    }));

    return reply.send({ success: true, dailyStats });
  });
}