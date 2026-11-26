-- Notas internas: comentários que só a equipe enxerga (os existentes continuam públicos)
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "internal" BOOLEAN NOT NULL DEFAULT false;