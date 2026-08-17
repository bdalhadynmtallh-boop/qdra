import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || smtpUser;

if (!smtpUser || !smtpPass) {
  console.warn("⚠️ إعدادات SMTP_USER أو SMTP_PASS غير موجودة في ملف .env");
}

// إنشاء محرك الإرسال باستعمال سيرفرات Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // استخدام منفذ TLS (587)
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendLoginCode(
  email: string,
  code: string
) {
  if (!smtpUser || !smtpPass) {
    throw new Error("EMAIL_SERVICE_NOT_CONFIGURED");
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: "إشعار دخول جديد - RHAL",
      html: `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>

          <body style="
            margin:0;
            padding:40px 15px;
            background:#f4f4f4;
            font-family:Arial,sans-serif;
          ">

            <div style="
              max-width:500px;
              margin:auto;
              background:#ffffff;
              border-radius:18px;
              padding:35px 25px;
              text-align:center;
            ">

              <h1 style="margin:0 0 10px;">
                RHAL
              </h1>

              <h2>
                إشعار تسجيل الدخول
              </h2>

              <p style="color:#666;">
                تم تسجيل دخول جديد إلى حسابك. الرمز المرجعي للعملية هو:
              </p>

              <div style="
                margin:25px 0;
                padding:20px;
                background:#f1f1f1;
                border-radius:14px;
                font-size:32px;
                font-weight:bold;
                letter-spacing:10px;
              ">
                ${code}
              </div>

              <p style="
                color:#999;
                font-size:13px;
                margin-top:30px;
              ">
                إذا لم تقم بتسجيل الدخول بنفسك، يُرجى مراجعة حماية حسابك.
              </p>

            </div>

          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("❌ فشل إرسال البريد عبر Gmail:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
}