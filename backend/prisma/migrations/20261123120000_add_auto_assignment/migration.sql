-- AlterTable: agente pode ficar ausente (não recebe tickets na distribuição automática)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "available" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AssignmentSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "mode" TEXT NOT NULL DEFAULT 'SUPERADMIN',
    "lastAssignedId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentSettings_pkey" PRIMARY KEY ("id")
);

-- Começa no modo atual (todo ticket novo vai para o SUPERADMIN): nada muda até alguém escolher outro modo
INSERT INTO "AssignmentSettings" ("id", "mode", "updatedAt") VALUES (1, 'SUPERADMIN', CURRENT_TIMESTAMP);