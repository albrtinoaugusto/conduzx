-- Suspensão, eliminação lógica e período de teste por empresa.
-- trial_dias NULL = sem limite. As empresas já existentes ficam sem limite (não são bloqueadas por esta migração);
-- as novas começam com 45 dias, contados a partir de criado_em.
ALTER TABLE escolas ADD COLUMN suspensa_em timestamptz;--> statement-breakpoint
ALTER TABLE escolas ADD COLUMN eliminada_em timestamptz;--> statement-breakpoint
ALTER TABLE escolas ADD COLUMN trial_dias integer CHECK (trial_dias BETWEEN 1 AND 3650);--> statement-breakpoint
ALTER TABLE escolas ALTER COLUMN trial_dias SET DEFAULT 45;
