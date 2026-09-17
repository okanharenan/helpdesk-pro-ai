-- Campos opcionais preenchidos automaticamente pela classificação de IA
-- ao criar um chamado. Todos nullable, então esta migration é segura
-- (não quebra linhas existentes) e pode ser aplicada com `prisma migrate deploy`.
ALTER TABLE "Ticket" ADD COLUMN "aiCategory" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "aiSuggestedPriority" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "aiSummary" TEXT;
