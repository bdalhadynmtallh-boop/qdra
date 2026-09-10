-- CreateTable
CREATE TABLE "AiSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "model" TEXT NOT NULL DEFAULT 'moonshotai/kimi-k3',
    "dailyLimit" INTEGER NOT NULL DEFAULT 100,
    "hourlyLimit" INTEGER NOT NULL DEFAULT 30,
    "maintenanceMessage" TEXT NOT NULL DEFAULT '🛠️ المعلم الذكي تحت الصيانة حالياً، نعمل على تحسين الخدمة وسيعود قريباً.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSettings_pkey" PRIMARY KEY ("id")
);