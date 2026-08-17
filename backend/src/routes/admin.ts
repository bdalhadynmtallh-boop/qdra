
import { FastifyInstance } from "fastify";
import crypto from "node:crypto";

// ============================================================
// TYPES
// ============================================================

interface CreateCodeBody {
  durationDays: number;
  quantity?: number;
}

interface UpdateUserBody {
  name?: string | null;
  email?: string;
}

interface SubscriptionBody {
  days: number;
}

interface AdminActivityBody {
  action: string;
  target?: string;
  targetId?: string;
  details?: string;
}

// ============================================================
// HELPERS
// ============================================================

function generateActivationCode(): string {
  const part1 = crypto.randomBytes(3).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(3).toString("hex").toUpperCase();
  const part3 = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `RHAL-${part1}-${part2}-${part3}`;
}

// ============================================================
// ADMIN ACTIVITY LOGGER
// ============================================================

async function logAdminActivity(
  app: FastifyInstance,
  request: any,
  data: AdminActivityBody
) {
  try {
    const adminId = request.admin?.id;

    if (!adminId) {
      request.log.warn(
        "Admin activity was not logged because admin ID is missing"
      );
      return;
    }

    await app.prisma.adminActivity.create({
      data: {
        adminId,
        action: data.action,
        target: data.target ?? null,
        targetId: data.targetId ?? null,
        details: data.details ?? null,
      },
    });
  } catch (error) {
    // فشل تسجيل النشاط لا يجب أن يكسر العملية الأساسية
    request.log.error(
      error,
      "Failed to save admin activity"
    );
  }
}

// ============================================================
// ADMIN ROUTES
// ============================================================

export async function adminRoutes(app: FastifyInstance) {
  // جميع مسارات الإدارة محمية
  app.addHook(
    "preHandler",
    app.authenticateAdmin
  );

  // ============================================================
  // DASHBOARD STATS
  // ============================================================

  app.get("/stats", async (request, reply) => {
    try {
      const now = new Date();

      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(
        startOfWeek.getDate() - 7
      );

      const [
        users,
        activeUsers,
        todayUsers,
        activationCodes,
        usedCodes,
        unusedCodes,
        activeSessions,
        admins,
        suspendedUsers,
      ] = await Promise.all([
        app.prisma.user.count(),

        app.prisma.user.count({
          where: {
            isActive: true,
            subscriptionExpiresAt: {
              gt: now,
            },
          },
        }),

        app.prisma.user.count({
          where: {
            createdAt: {
              gte: startOfDay,
            },
          },
        }),

        app.prisma.activationCode.count(),

        app.prisma.activationCode.count({
          where: {
            used: true,
          },
        }),

        app.prisma.activationCode.count({
          where: {
            used: false,
          },
        }),

        app.prisma.session.count({
          where: {
            expiresAt: {
              gt: now,
            },
          },
        }),

        app.prisma.user.count({
          where: {
            role: "ADMIN",
          },
        }),

        app.prisma.user.count({
          where: {
            isActive: false,
          },
        }),
      ]);

      const weekUsers =
        await app.prisma.user.count({
          where: {
            createdAt: {
              gte: startOfWeek,
            },
          },
        });

      return reply.send({
        success: true,

        stats: {
          users,
          activeUsers,
          todayUsers,
          weekUsers,

          activationCodes,
          usedCodes,
          unusedCodes,

          activeSessions,

          admins,
          suspendedUsers,
        },
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تحميل إحصائيات لوحة التحكم",
      });
    }
  });

  // ============================================================
  // USERS - LIST
  // ============================================================

  app.get<{
    Querystring: {
      search?: string;
      status?: string;
      page?: string;
      limit?: string;
    };
  }>("/users", async (request, reply) => {
    try {
      const search =
        request.query.search?.trim() || "";

      const page = Math.max(
        Number(request.query.page || 1),
        1
      );

      const limit = Math.min(
        Math.max(
          Number(request.query.limit || 50),
          1
        ),
        100
      );

      const now = new Date();

      const where: any = {};

      if (search) {
        where.OR = [
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            id: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }

      if (request.query.status === "active") {
        where.isActive = true;
        where.subscriptionExpiresAt = {
          gt: now,
        };
      }

      if (request.query.status === "inactive") {
        where.isActive = false;
      }

      if (request.query.status === "expired") {
        where.subscriptionExpiresAt = {
          lte: now,
        };
      }

      if (request.query.status === "admin") {
        where.role = "ADMIN";
      }

      const [total, users] =
        await Promise.all([
          app.prisma.user.count({
            where,
          }),

          app.prisma.user.findMany({
            where,

            orderBy: {
              createdAt: "desc",
            },

            skip: (page - 1) * limit,

            take: limit,

            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,

              createdAt: true,
              updatedAt: true,
              lastLoginAt: true,

              subscriptionExpiresAt: true,

              _count: {
                select: {
                  sessions: true,
                  activationCodes: true,
                },
              },
            },
          }),
        ]);

      return reply.send({
        success: true,

        users,

        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(
            total / limit
          ),
        },
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تحميل المستخدمين",
      });
    }
  });

  // ============================================================
  // USER DETAILS
  // ============================================================

  app.get<{
    Params: {
      id: string;
    };
  }>("/users/:id", async (request, reply) => {
    try {
      const user =
        await app.prisma.user.findUnique({
          where: {
            id: request.params.id,
          },

          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,

            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,

            subscriptionExpiresAt: true,

            sessions: {
              orderBy: {
                createdAt: "desc",
              },

              select: {
                id: true,
                createdAt: true,
                expiresAt: true,
              },
            },

            activationCodes: {
              orderBy: {
                createdAt: "desc",
              },

              select: {
                id: true,
                code: true,
                durationDays: true,
                used: true,
                activatedAt: true,
                expiresAt: true,
                createdAt: true,
              },
            },
          },
        });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message:
            "المستخدم غير موجود",
        });
      }

      return reply.send({
        success: true,
        user,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تحميل بيانات المستخدم",
      });
    }
  });

  // ============================================================
  // UPDATE USER
  // ============================================================

  app.patch<{
    Params: {
      id: string;
    };

    Body: UpdateUserBody;
  }>("/users/:id", async (request, reply) => {
    try {
      const { name, email } =
        request.body;

      const user =
        await app.prisma.user.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message:
            "المستخدم غير موجود",
        });
      }

      const data: {
        name?: string | null;
        email?: string;
      } = {};

      if (name !== undefined) {
        data.name =
          name?.trim() || null;
      }

      if (email !== undefined) {
        const normalizedEmail =
          email.trim().toLowerCase();

        if (!normalizedEmail) {
          return reply.status(400).send({
            success: false,
            message:
              "البريد الإلكتروني غير صحيح",
          });
        }

        const emailOwner =
          await app.prisma.user.findUnique({
            where: {
              email: normalizedEmail,
            },
          });

        if (
          emailOwner &&
          emailOwner.id !== user.id
        ) {
          return reply.status(409).send({
            success: false,
            message:
              "البريد الإلكتروني مستخدم بالفعل",
          });
        }

        data.email =
          normalizedEmail;
      }

      const updatedUser =
        await app.prisma.user.update({
          where: {
            id: user.id,
          },

          data,

          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            subscriptionExpiresAt: true,
          },
        });

      await logAdminActivity(
        app,
        request,
        {
          action: "UPDATE_USER",
          target: "USER",
          targetId: user.id,
          details: JSON.stringify({
            oldEmail: user.email,
            newEmail:
              updatedUser.email,
            oldName: user.name,
            newName:
              updatedUser.name,
          }),
        }
      );

      return reply.send({
        success: true,
        user: updatedUser,
        message:
          "تم تحديث بيانات المستخدم",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تعديل المستخدم",
      });
    }
  });

  // ============================================================
  // DELETE USER
  // ============================================================

  app.delete<{
    Params: {
      id: string;
    };
  }>("/users/:id", async (request, reply) => {
    try {
      const user =
        await app.prisma.user.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message:
            "المستخدم غير موجود",
        });
      }

      const adminEmail =
        process.env.ADMIN_EMAIL
          ?.trim()
          .toLowerCase();

      if (
        adminEmail &&
        user.email.toLowerCase() ===
          adminEmail
      ) {
        return reply.status(403).send({
          success: false,
          message:
            "لا يمكن حذف حساب الأدمن الرئيسي",
        });
      }

      await app.prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      await logAdminActivity(
        app,
        request,
        {
          action: "DELETE_USER",
          target: "USER",
          targetId: user.id,
          details: JSON.stringify({
            email: user.email,
            name: user.name,
          }),
        }
      );

      return reply.send({
        success: true,
        message:
          "تم حذف المستخدم",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر حذف المستخدم",
      });
    }
  });

  // ============================================================
  // DISABLE USER
  // ============================================================

  app.post<{
    Params: {
      id: string;
    };
  }>("/users/:id/disable", async (
    request,
    reply
  ) => {
    try {
      const user =
        await app.prisma.user.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message:
            "المستخدم غير موجود",
        });
      }

      const adminEmail =
        process.env.ADMIN_EMAIL
          ?.trim()
          .toLowerCase();

      if (
        adminEmail &&
        user.email.toLowerCase() ===
          adminEmail
      ) {
        return reply.status(403).send({
          success: false,
          message:
            "لا يمكن تعطيل الأدمن الرئيسي",
        });
      }

      await app.prisma.$transaction([
        app.prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            isActive: false,
          },
        }),

        app.prisma.session.deleteMany({
          where: {
            userId: user.id,
          },
        }),
      ]);

      await logAdminActivity(
        app,
        request,
        {
          action: "DISABLE_USER",
          target: "USER",
          targetId: user.id,
          details: `تم تعطيل المستخدم ${user.email}`,
        }
      );

      return reply.send({
        success: true,
        message:
          "تم إيقاف الحساب وتسجيل خروجه من جميع الأجهزة",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر إيقاف المستخدم",
      });
    }
  });

  // ============================================================
  // ENABLE USER
  // ============================================================

  app.post<{
    Params: {
      id: string;
    };
  }>("/users/:id/enable", async (
    request,
    reply
  ) => {
    try {
      const user =
        await app.prisma.user.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message:
            "المستخدم غير موجود",
        });
      }

      await app.prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          isActive: true,

          // إذا كان المستخدم موقوفًا
          // نعيده لمستخدم عادي
          role:
            user.role === "SUSPENDED"
              ? "USER"
              : user.role,
        },
      });

      await logAdminActivity(
        app,
        request,
        {
          action: "ENABLE_USER",
          target: "USER",
          targetId: user.id,
          details: `تم تفعيل المستخدم ${user.email}`,
        }
      );

      return reply.send({
        success: true,
        message:
          "تم تفعيل الحساب",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تفعيل المستخدم",
      });
    }
  });

  // ============================================================
  // EXTEND SUBSCRIPTION
  // ============================================================

  app.post<{
    Params: {
      id: string;
    };

    Body: SubscriptionBody;
  }>("/users/:id/subscription", async (
    request,
    reply
  ) => {
    try {
      const days =
        Number(request.body?.days);

      if (
        !Number.isInteger(days) ||
        days <= 0
      ) {
        return reply.status(400).send({
          success: false,
          message:
            "عدد الأيام يجب أن يكون رقمًا صحيحًا وأكبر من صفر",
        });
      }

      if (days > 3650) {
        return reply.status(400).send({
          success: false,
          message:
            "الحد الأقصى للإضافة هو 3650 يومًا",
        });
      }

      const user =
        await app.prisma.user.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message:
            "المستخدم غير موجود",
        });
      }

      const now =
        new Date();

      const currentExpiry =
        user.subscriptionExpiresAt &&
        user.subscriptionExpiresAt >
          now
          ? user.subscriptionExpiresAt
          : now;

      const newExpiry =
        new Date(currentExpiry);

      newExpiry.setDate(
        newExpiry.getDate() +
          days
      );

      const updatedUser =
        await app.prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            subscriptionExpiresAt:
              newExpiry,

            isActive: true,

            role:
              user.role === "SUSPENDED"
                ? "USER"
                : user.role,
          },

          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            subscriptionExpiresAt:
              true,
          },
        });

      await logAdminActivity(
        app,
        request,
        {
          action:
            "EXTEND_SUBSCRIPTION",

          target: "USER",

          targetId: user.id,

          details: JSON.stringify({
            email: user.email,
            days,
            oldExpiry:
              user.subscriptionExpiresAt,
            newExpiry,
          }),
        }
      );

      return reply.send({
        success: true,
        user: updatedUser,
        message:
          `تمت إضافة ${days} يوم إلى الاشتراك`,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تجديد الاشتراك",
      });
    }
  });

  // ============================================================
  // LOGOUT ALL USER SESSIONS
  // ============================================================

  app.post<{
    Params: {
      id: string;
    };
  }>("/users/:id/logout-all", async (
    request,
    reply
  ) => {
    try {
      const user =
        await app.prisma.user.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!user) {
        return reply.status(404).send({
          success: false,
          message:
            "المستخدم غير موجود",
        });
      }

      const result =
        await app.prisma.session.deleteMany({
          where: {
            userId: user.id,
          },
        });

      await logAdminActivity(
        app,
        request,
        {
          action:
            "LOGOUT_ALL_SESSIONS",

          target: "USER",

          targetId: user.id,

          details: JSON.stringify({
            email: user.email,
            deletedSessions:
              result.count,
          }),
        }
      );

      return reply.send({
        success: true,
        deletedSessions:
          result.count,
        message:
          "تم تسجيل خروج المستخدم من جميع الأجهزة",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر إنهاء جلسات المستخدم",
      });
    }
  });

  // ============================================================
  // ACTIVATION CODES - LIST / SEARCH
  // ============================================================

  app.get<{
    Querystring: {
      search?: string;
      status?: string;
    };
  }>("/activation-codes", async (
    request,
    reply
  ) => {
    try {
      const search =
        request.query.search?.trim() ||
        "";

      const where: any = {};

      if (search) {
        where.OR = [
          {
            code: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ];
      }

      if (
        request.query.status ===
        "used"
      ) {
        where.used = true;
      }

      if (
        request.query.status ===
        "unused"
      ) {
        where.used = false;
      }

      const codes =
        await app.prisma.activationCode.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

      return reply.send({
        success: true,
        codes,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تحميل أكواد التفعيل",
      });
    }
  });

  // ============================================================
  // CREATE ACTIVATION CODES
  // ============================================================

  app.post<{
    Body: CreateCodeBody;
  }>("/activation-codes", async (
    request,
    reply
  ) => {
    const durationDays =
      Number(
        request.body?.durationDays
      );

    const quantity = Math.min(
      Math.max(
        Number(
          request.body?.quantity ?? 1
        ),
        1
      ),
      100
    );

    if (
      !Number.isInteger(
        durationDays
      ) ||
      durationDays <= 0
    ) {
      return reply.status(400).send({
        success: false,
        message:
          "مدة التفعيل يجب أن تكون عدد أيام صحيحًا وأكبر من صفر",
      });
    }

    if (durationDays > 3650) {
      return reply.status(400).send({
        success: false,
        message:
          "المدة القصوى المسموحة هي 3650 يومًا",
      });
    }

    try {
      const codes =
        Array.from(
          {
            length: quantity,
          },
          () =>
            generateActivationCode()
        );

      const createdCodes =
        await app.prisma.activationCode.createManyAndReturn(
          {
            data: codes.map(
              (code) => ({
                code,
                durationDays,
              })
            ),

            select: {
              id: true,
              code: true,
              durationDays: true,
              used: true,
              createdAt: true,
              activatedAt: true,
              expiresAt: true,
              userId: true,
            },
          }
        );

      await logAdminActivity(
        app,
        request,
        {
          action:
            "CREATE_ACTIVATION_CODES",

          target:
            "ACTIVATION_CODE",

          details: JSON.stringify({
            quantity:
              createdCodes.length,

            durationDays,
          }),
        }
      );

      return reply.status(201).send({
        success: true,
        message:
          `تم إنشاء ${createdCodes.length} كود`,
        codes: createdCodes,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "حدث خطأ أثناء إنشاء أكواد التفعيل",
      });
    }
  });

  // ============================================================
  // DELETE UNUSED ACTIVATION CODE
  // ============================================================

  app.delete<{
    Params: {
      id: string;
    };
  }>("/activation-codes/:id", async (
    request,
    reply
  ) => {
    try {
      const code =
        await app.prisma.activationCode.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!code) {
        return reply.status(404).send({
          success: false,
          message:
            "الكود غير موجود",
        });
      }

      if (code.used) {
        return reply.status(400).send({
          success: false,
          message:
            "لا يمكن حذف كود تم استخدامه",
        });
      }

      await app.prisma.activationCode.delete({
        where: {
          id: code.id,
        },
      });

      await logAdminActivity(
        app,
        request,
        {
          action:
            "DELETE_ACTIVATION_CODE",

          target:
            "ACTIVATION_CODE",

          targetId: code.id,

          details: JSON.stringify({
            code: code.code,
            durationDays:
              code.durationDays,
          }),
        }
      );

      return reply.send({
        success: true,
        message:
          "تم حذف كود التفعيل",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر حذف كود التفعيل",
      });
    }
  });

  // ============================================================
  // CURRENT SESSIONS
  // ============================================================

  app.get("/sessions", async (
    request,
    reply
  ) => {
    try {
      const sessions =
        await app.prisma.session.findMany({
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            createdAt: true,
            expiresAt: true,

            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

      return reply.send({
        success: true,
        sessions,
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تحميل الجلسات",
      });
    }
  });

  // ============================================================
  // DELETE SESSION
  // ============================================================

  app.delete<{
    Params: {
      id: string;
    };
  }>("/sessions/:id", async (
    request,
    reply
  ) => {
    try {
      const session =
        await app.prisma.session.findUnique({
          where: {
            id: request.params.id,
          },
        });

      if (!session) {
        return reply.status(404).send({
          success: false,
          message:
            "الجلسة غير موجودة",
        });
      }

      await app.prisma.session.delete({
        where: {
          id: session.id,
        },
      });

      await logAdminActivity(
        app,
        request,
        {
          action:
            "DELETE_SESSION",

          target:
            "SESSION",

          targetId:
            session.id,

          details: JSON.stringify({
            userId:
              session.userId,
          }),
        }
      );

      return reply.send({
        success: true,
        message:
          "تم إنهاء الجلسة",
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر إنهاء الجلسة",
      });
    }
  });

  // ============================================================
  // ADMIN ACTIVITY LOG
  // ============================================================

  app.get<{
    Querystring: {
      action?: string;
      page?: string;
      limit?: string;
    };
  }>("/activities", async (
    request,
    reply
  ) => {
    try {
      const page = Math.max(
        Number(
          request.query.page || 1
        ),
        1
      );

      const limit = Math.min(
        Math.max(
          Number(
            request.query.limit ||
              50
          ),
          1
        ),
        100
      );

      const where: any = {};

      if (request.query.action) {
        where.action =
          request.query.action;
      }

      const [
        total,
        activities,
      ] = await Promise.all([
        app.prisma.adminActivity.count({
          where,
        }),

        app.prisma.adminActivity.findMany(
          {
            where,

            orderBy: {
              createdAt:
                "desc",
            },

            skip:
              (page - 1) *
              limit,

            take: limit,

            select: {
              id: true,
              action: true,
              target: true,
              targetId: true,
              details: true,
              createdAt: true,

              admin: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          }
        ),
      ]);

      return reply.send({
        success: true,

        activities,

        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(
            total / limit
          ),
        },
      });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        success: false,
        message:
          "تعذر تحميل سجل الإدارة",
      });
    }
  });
}

