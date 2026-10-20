ALTER TYPE papel_utilizador ADD VALUE IF NOT EXISTS 'super_admin';--> statement-breakpoint
ALTER TABLE utilizadores ALTER COLUMN escola_id DROP NOT NULL;
