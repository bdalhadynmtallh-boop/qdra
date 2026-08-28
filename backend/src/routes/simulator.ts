import type { FastifyInstance } from "fastify";

export async function simulatorRoutes(fastify: FastifyInstance) {
  // =========================================================================
  // تسجيل محاولة محاكي
  // =========================================================================
  fastify.post(
    "/attempt",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: "غير مصرح",
        });
      }

      const {
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        score,
        startedAt,
        completedAt,
      } = request.body as {
        totalQuestions?: number;
        correctAnswers?: number;
        wrongAnswers?: number;
        score?: number;
        startedAt?: string;
        completedAt?: string;
      };

      const total = Number(totalQuestions || 0);
      let correct = Number(correctAnswers || 0);
      let wrong = Number(wrongAnswers || 0);

      if (total <= 0) {
        return reply.status(400).send({
          success: false,
          message: "عدد أسئلة المحاكي غير صحيح",
        });
      }

      // 🔐 أمان: منع أرقام سالبة أو مجموع يتجاوز الإجمالي (لا نثق بالعميل)
      if (!Number.isFinite(correct) || correct < 0) correct = 0;
      if (!Number.isFinite(wrong) || wrong < 0) wrong = 0;
      if (correct + wrong > total) {
        correct = Math.min(correct, total);
        wrong = Math.min(wrong, total - correct);
      }

      const calculatedScore = Math.round((correct / total) * 100);

      const finalScore =
        typeof score === "number" && !Number.isNaN(score)
          ? Math.max(0, Math.min(100, score))
          : calculatedScore;

      // حساب مدة المحاكي بالثواني إن كانت التواريخ موجودة
      let durationSeconds = 0;

      if (startedAt && completedAt) {
        const start = new Date(startedAt).getTime();
        const end = new Date(completedAt).getTime();

        if (
          !Number.isNaN(start) &&
          !Number.isNaN(end) &&
          end >= start
        ) {
          durationSeconds = Math.floor((end - start) / 1000);
        }
      }

      const currentStats = await fastify.prisma.userStats.findUnique({
        where: { userId },
      });

      const previousBest = currentStats?.bestSimulatorScore ?? null;

      const newBest =
        previousBest === null
          ? finalScore
          : Math.max(previousBest, finalScore);

      const updatedStats = await fastify.prisma.userStats.upsert({
        where: { userId },

        update: {
          totalSimulators: {
            increment: 1,
          },

          bestSimulatorScore: newBest,

          totalStudyTimeSeconds:
            durationSeconds > 0
              ? {
                  increment: durationSeconds,
                }
              : undefined,

          lastActivityAt: new Date(),
        },

        create: {
          userId,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          completedSections: 0,
          totalSimulators: 1,
          bestSimulatorScore: finalScore,
          totalStudyTimeSeconds: durationSeconds,
          lastActivityAt: new Date(),
        },
      });

      return reply.send({
        success: true,
        simulator: {
          totalQuestions: total,
          correctAnswers: correct,
          wrongAnswers: wrong,
          score: finalScore,
          durationSeconds,
        },
        stats: {
          totalSimulators: updatedStats.totalSimulators,
          bestSimulatorScore: updatedStats.bestSimulatorScore,
        },
      });
    }
  );
}