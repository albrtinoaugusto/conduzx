-- Data real da inscrição (data_inscricao, já existente) vs data de registo no sistema (criado_em, automática).
-- A contagem do exame teórico começa na primeira aula.
ALTER TABLE inscricoes ADD COLUMN data_primeira_aula date;--> statement-breakpoint
ALTER TABLE inscricoes ADD COLUMN exame_aviso_visto_em timestamptz;--> statement-breakpoint
ALTER TABLE inscricoes ADD COLUMN exame_aviso_visto_por uuid REFERENCES utilizadores(id);--> statement-breakpoint
CREATE INDEX inscricoes_primeira_aula_idx ON inscricoes (escola_id, data_primeira_aula)
  WHERE eliminado_em IS NULL AND data_primeira_aula IS NOT NULL;--> statement-breakpoint

-- Banco de perguntas: conteúdo da plataforma, comum a todas as escolas (sem escola_id).
CREATE TABLE perguntas_teste (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enunciado  text NOT NULL UNIQUE,
  imagem_url text,
  opcoes     jsonb NOT NULL,
  correta    smallint NOT NULL CHECK (correta BETWEEN 0 AND 3),
  ativo      boolean NOT NULL DEFAULT true,
  criado_em  timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Venda do acesso aos testes: registada pela secretaria, nunca apagada; anula-se com motivo.
CREATE TABLE acessos_testes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       uuid NOT NULL REFERENCES escolas(id),
  aluno_id        uuid NOT NULL REFERENCES alunos(id),
  valor_centavos  bigint NOT NULL CHECK (valor_centavos > 0),
  metodo          metodo_pagamento NOT NULL DEFAULT 'dinheiro',
  referencia      text,
  concedido_por   uuid REFERENCES utilizadores(id),
  criado_em       timestamptz NOT NULL DEFAULT now(),
  anulado_em      timestamptz,
  anulado_por     uuid REFERENCES utilizadores(id),
  motivo_anulacao text,
  CHECK ((anulado_em IS NULL) = (motivo_anulacao IS NULL))
);--> statement-breakpoint
CREATE UNIQUE INDEX acessos_testes_ativo_unico ON acessos_testes (escola_id, aluno_id) WHERE anulado_em IS NULL;--> statement-breakpoint

-- Cada realização de um teste. O servidor é quem guarda o tempo e corrige.
CREATE TABLE tentativas_teste (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id    uuid NOT NULL REFERENCES escolas(id),
  aluno_id     uuid NOT NULL REFERENCES alunos(id),
  perguntas    jsonb NOT NULL,
  respostas    jsonb NOT NULL DEFAULT '{}'::jsonb,
  iniciado_em  timestamptz NOT NULL DEFAULT now(),
  expira_em    timestamptz NOT NULL,
  terminado_em timestamptz,
  certas       smallint,
  erradas      smallint,
  aprovado     boolean
);--> statement-breakpoint
CREATE INDEX tentativas_teste_aluno_idx ON tentativas_teste (escola_id, aluno_id, iniciado_em DESC);--> statement-breakpoint
CREATE UNIQUE INDEX tentativas_teste_aberta_unica ON tentativas_teste (aluno_id) WHERE terminado_em IS NULL;--> statement-breakpoint

-- Limite de tentativas de entrada no portal do aluno. A chave é um hash (sem BI/telefone em claro).
CREATE TABLE tentativas_login_aluno (
  chave         text PRIMARY KEY,
  falhas        smallint NOT NULL DEFAULT 0,
  bloqueado_ate timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
