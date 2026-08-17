import type { FastifyInstance } from "fastify";

export async function progressRoutes(fastify: FastifyInstance) {
  // =========================================================================
  // 1. جلب كل بيانات وتقدم المستخدم الحقيقية من قاعدة البيانات
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

    const formattedFavorites = favorites.map(
  (f: typeof favorites[number]) => {
      const numQ = Number(f.questionId);
      return {
        sectionId: f.sectionId,
        questionId: !isNaN(numQ) && String(numQ) === f.questionId ? numQ : f.questionId,
      };
    });

    return reply.send({
      success: true,
      progress: progressMap,
      mistakes: formattedMistakes,
      favorites: formattedFavorites,
      stats,
    });
  });

  // =========================================================================
  // 2. تسجيل محاولة إجابة سؤال وحفظها في قاعدة البيانات
  // =========================================================================
  fastify.post("/attempt", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const { sectionId, questionId, selectedAnswer, correctAnswer, isCorrect } = request.body as any;

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

    await fastify.prisma.userStats.upsert({
      where: { userId },
      update: {
        totalQuestions: isFirstTimeAnswering ? { increment: 1 } : undefined,
        correctAnswers: isCorrect ? { increment: 1 } : undefined,
        wrongAnswers: !isCorrect ? { increment: 1 } : undefined,
        lastActivityAt: new Date(),
      },
      create: {
        userId,
        totalQuestions: 1,
        correctAnswers: isCorrect ? 1 : 0,
        wrongAnswers: isCorrect ? 0 : 1,
        lastActivityAt: new Date(),
      },
    });

    return reply.send({ success: true });
  });

  // =========================================================================
  // 3. إنهاء قسم وحفظه في UserProgress
  // =========================================================================
  fastify.post("/complete-section", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request as any).user?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: "غير مصرح" });
    }

    const { sectionId, correctAnswers, totalQuestions } = request.body as any;

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

    return reply.send({ success: true });
  });

  // =========================================================================
  // 4. جلب دروس الأساسيات المكتملة للمستخدم
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
  // 5. حفظ/إلغاء حفظ درس أساسيات كمكتمل
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
      return reply.send({ success: true, completed: true });
    }
  });

  // =========================================================================
  // 6. تبديل المفضلة (إضافة/إزالة)
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
}