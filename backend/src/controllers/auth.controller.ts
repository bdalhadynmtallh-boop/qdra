import { FastifyReply, FastifyRequest } from "fastify";
import argon2 from "argon2";
import crypto from "node:crypto";
import { Prisma } from "../generated/prisma/client.js";
import { createSession } from "../services/session.service.js";
import { sendLoginCode } from "../services/email.service.js";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  activationCode?: string;
}

interface DirectLoginBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
}

interface VerifyLoginBody {
  email: string;
  code: string;
}

interface ResendLoginCodeBody {
  email: string;
}

function generateLoginCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// التحقق من كود التفعيل (يدعم Master Code + قاعدة البيانات)
async function validateActivationCode(
  prisma: any,
  code: string
): Promise<{
  valid: boolean;
  message: string;
  durationDays: number;
  activationId?: string;
  isMaster: boolean;
}> {
  const MASTER_CODE = process.env.ACTIVATION_CODE;

  // أولاً: تحقق من Master Code (من البيئة)
  if (MASTER_CODE && code === MASTER_CODE.trim()) {
    return {
      valid: true,
      message: "Master code",
      durationDays: 365,
      isMaster: true,
    };
  }

  // ثانياً: ابحث في قاعدة البيانات
  const activation = await prisma.activationCode.findUnique({
    where: { code },
  });

  if (!activation) {
    return { valid: false, message: "رمز التفعيل غير صحيح", durationDays: 0, isMaster: false };
  }

  if (activation.used) {
    return { valid: false, message: "رمز التفعيل مستخدم بالفعل", durationDays: 0, isMaster: false };
  }

  if (activation.expiresAt && activation.expiresAt <= new Date()) {
    return { valid: false, message: "رمز التفعيل منتهي الصلاحية", durationDays: 0, isMaster: false };
  }

  return {
    valid: true,
    message: "DB code",
    durationDays: activation.durationDays,
    activationId: activation.id,
    isMaster: false,
  };
}

export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  const { email, password, name, activationCode } = request.body;

  if (!email || !password) {
    return reply.status(400).send({
      success: false,
      message: "البريد الإلكتروني وكلمة المرور مطلوبان",
    });
  }

  if (!activationCode) {
    return reply.status(400).send({
      success: false,
      message: "رمز التفعيل مطلوب",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedActivationCode = activationCode.trim();

  if (password.length < 8) {
    return reply.status(400).send({
      success: false,
      message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    });
  }

  const existingUser = await request.server.prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return reply.status(409).send({
      success: false,
      message: "البريد الإلكتروني مستخدم بالفعل",
    });
  }

  // التحقق الموحّد من كود التفعيل
  const validation = await validateActivationCode(
    request.server.prisma,
    normalizedActivationCode
  );

  if (!validation.valid) {
    // ⬇️ مُصحّح: 400 بدل 403 عشان الفرونت ما يفسرها على إنها "انتهى اشتراكك"
    return reply.status(400).send({
      success: false,
      message: validation.message,
    });
  }

  const hashedPassword = await argon2.hash(password);

  try {
    const result = await request.server.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const now = new Date();
        const subscriptionExpiresAt = new Date(now);
        subscriptionExpiresAt.setDate(
          subscriptionExpiresAt.getDate() + validation.durationDays
        );

        const createdUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            name: name?.trim() || null,
            subscriptionExpiresAt,
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            subscriptionExpiresAt: true,
          },
        });

        // حدّث كود قاعدة البيانات فقط إذا ما كان Master Code
        if (!validation.isMaster && validation.activationId) {
          await tx.activationCode.update({
            where: { id: validation.activationId },
            data: {
              used: true,
              userId: createdUser.id,
              activatedAt: now,
            },
          });
        }

        return createdUser;
      }
    );

    const session = await createSession(request.server.prisma, result.id);

    reply.setCookie("rhal_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return reply.status(201).send({
      success: true,
      requiresVerification: false,
      user: result,
      token: session.token,
      message: "تم إنشاء الحساب وتفعيل اشتراكك بنجاح",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "حدث خطأ أثناء إنشاء الحساب",
    });
  }
}

export async function loginDirect(
  request: FastifyRequest<{ Body: DirectLoginBody }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  if (!email || !password) {
    return reply.status(400).send({
      success: false,
      message: "البريد الإلكتروني وكلمة المرور مطلوبان",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await request.server.prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.password) {
    return reply.status(401).send({
      success: false,
      message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    });
  }

  const validPassword = await argon2.verify(user.password, password);

  if (!validPassword) {
    return reply.status(401).send({
      success: false,
      message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    });
  }

  const session = await createSession(request.server.prisma, user.id);

  // ✅ تحديث آخر تسجيل دخول (يظهر في لوحة التحكم)
  await request.server.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  reply.setCookie("rhal_session", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return reply.send({
    success: true,
    requiresVerification: false,
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    },
    message: "تم تسجيل الدخول بنجاح",
  });
}

export async function login(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const { email } = request.body;

  if (!email) {
    return reply.status(400).send({
      success: false,
      message: "البريد الإلكتروني مطلوب",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await request.server.prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return reply.status(404).send({
      success: false,
      message: "البريد الإلكتروني غير مسجل في النظام",
    });
  }

  const code = generateLoginCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await request.server.prisma.emailVerificationCode.deleteMany({
    where: { email: normalizedEmail, used: false },
  });

  await request.server.prisma.emailVerificationCode.create({
    data: { email: normalizedEmail, codeHash, expiresAt },
  });

  try {
    await sendLoginCode(normalizedEmail, code);
  } catch (error) {
    request.log.error({ err: error }, "خطأ أثناء إرسال البريد");
    return reply.status(500).send({
      success: false,
      message: "تعذر إرسال رمز التحقق إلى البريد الإلكتروني",
    });
  }

  return reply.send({
    success: true,
    requiresVerification: true,
    email: normalizedEmail,
    message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
  });
}

export async function verifyLogin(
  request: FastifyRequest<{ Body: VerifyLoginBody }>,
  reply: FastifyReply
) {
  const { email, code } = request.body;

  if (!email || !code) {
    return reply.status(400).send({
      success: false,
      message: "البريد الإلكتروني ورمز التحقق مطلوبان",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  const verification =
    await request.server.prisma.emailVerificationCode.findFirst({
      where: { email: normalizedEmail, used: false },
      orderBy: { createdAt: "desc" },
    });

  if (!verification || verification.expiresAt <= new Date()) {
    return reply.status(400).send({
      success: false,
      message: "رمز التحقق غير صحيح أو منتهي الصلاحية",
    });
  }

  const providedHash = hashCode(normalizedCode);

  if (providedHash !== verification.codeHash) {
    return reply.status(400).send({
      success: false,
      message: "رمز التحقق غير صحيح",
    });
  }

  const user = await request.server.prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return reply.status(404).send({
      success: false,
      message: "المستخدم غير موجود",
    });
  }

  await request.server.prisma.emailVerificationCode.update({
    where: { id: verification.id },
    data: { used: true },
  });

  const session = await createSession(request.server.prisma, user.id);

  // ✅ تحديث آخر تسجيل دخول
  await request.server.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  reply.setCookie("rhal_session", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return reply.send({
    success: true,
    requiresVerification: false,
    token: session.token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    },
  });
}

export async function resendLoginCode(
  request: FastifyRequest<{ Body: ResendLoginCodeBody }>,
  reply: FastifyReply
) {
  const { email } = request.body;
  if (!email) return reply.status(400).send({ success: false, message: "البريد مطلوب" });
  
  const normalizedEmail = email.trim().toLowerCase();
  const code = generateLoginCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await request.server.prisma.emailVerificationCode.deleteMany({
    where: { email: normalizedEmail, used: false },
  });

  await request.server.prisma.emailVerificationCode.create({
    data: { email: normalizedEmail, codeHash, expiresAt },
  });

  await sendLoginCode(normalizedEmail, code);

  return reply.send({ success: true, message: "تم إرسال رمز تحقق جديد" });
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  let token = request.cookies.rhal_session;

  if (!token && request.headers.authorization) {
    const parts = request.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  if (token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await request.server.prisma.session.deleteMany({ where: { tokenHash } });
  }

  reply.clearCookie("rhal_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return reply.send({ success: true, message: "تم تسجيل الخروج" });
}