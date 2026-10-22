-- Sistema de gestão para escolas de condução - modelo de dados do MVP (PostgreSQL)
-- Princípios: multi-escola (escola_id em tudo), nada é apagado de verdade,
-- dinheiro em inteiros (centavos), tres estados independentes por inscricao.

CREATE TYPE papel_utilizador   AS ENUM ('atendente', 'gestor', 'admin', 'super_admin');
CREATE TYPE estado_aluno       AS ENUM ('ativo', 'desistiu', 'concluido');
CREATE TYPE estado_inatro      AS ENUM ('nao_registado', 'pendente', 'registado');
CREATE TYPE metodo_pagamento   AS ENUM ('dinheiro', 'mpesa', 'emola', 'transferencia', 'outro');

CREATE TABLE escolas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  telefone    text,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE utilizadores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id     uuid REFERENCES escolas(id),
  nome          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  papel         papel_utilizador NOT NULL DEFAULT 'atendente',
  ativo         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alunos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id        uuid NOT NULL REFERENCES escolas(id),
  nome_completo    text NOT NULL,
  data_nascimento  date NOT NULL,
  bi_numero        text,
  telefone         text,
  email            text,
  endereco         text,
  criado_por       uuid REFERENCES utilizadores(id),
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now(),
  eliminado_em     timestamptz
);

-- Um BI não se repete dentro da mesma escola (ignorando registos eliminados)
CREATE UNIQUE INDEX alunos_bi_unico
  ON alunos (escola_id, bi_numero)
  WHERE bi_numero IS NOT NULL AND eliminado_em IS NULL;

CREATE INDEX alunos_nome_idx ON alunos (escola_id, lower(nome_completo));

-- Categorias configuraveis por escola (codigos, nomes e precos NAO ficam fixos no codigo)
CREATE TABLE categorias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       uuid NOT NULL REFERENCES escolas(id),
  codigo          text NOT NULL,          -- ex.: 'B'; confirmar com o INATRO
  nome            text NOT NULL,
  preco_centavos  bigint NOT NULL CHECK (preco_centavos >= 0),
  ativo           boolean NOT NULL DEFAULT true,
  UNIQUE (escola_id, codigo)
);

-- Inscrição = aluno + categoria. Um aluno pode ter várias (ex.: tira outra categoria depois).
CREATE TABLE inscricoes (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id                 uuid NOT NULL REFERENCES escolas(id),
  aluno_id                  uuid NOT NULL REFERENCES alunos(id),
  categoria_id              uuid NOT NULL REFERENCES categorias(id),

  -- preço congelado no momento da inscrição (mudar o preço depois não altera inscrições antigas)
  preco_total_centavos      bigint NOT NULL CHECK (preco_total_centavos >= 0),

  -- eixo 1: situação do aluno
  estado_aluno              estado_aluno NOT NULL DEFAULT 'ativo',

  -- eixo 2: situacao no INATRO (registo manual pelo atendente)
  estado_inatro             estado_inatro NOT NULL DEFAULT 'nao_registado',
  inatro_numero_processo    text,
  inatro_ultima_tentativa   timestamptz,
  inatro_nota               text,          -- ex.: 'sistema em baixo as 10h'

  -- eixo 3 (pagamento) é CALCULADO a partir da tabela pagamentos (ver view abaixo)

  data_inscricao            date NOT NULL DEFAULT current_date,
  criado_por                uuid REFERENCES utilizadores(id),
  criado_em                 timestamptz NOT NULL DEFAULT now(),
  atualizado_em             timestamptz NOT NULL DEFAULT now(),
  eliminado_em              timestamptz
);

-- Lista rapida de "pendentes de INATRO" por escola
CREATE INDEX inscricoes_pendentes_idx
  ON inscricoes (escola_id, estado_inatro)
  WHERE eliminado_em IS NULL AND estado_inatro <> 'registado';

CREATE INDEX inscricoes_aluno_idx ON inscricoes (aluno_id);

-- Cada pagamento é um registo próprio. Não se edita nem apaga: anula-se com motivo.
CREATE TABLE pagamentos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id        uuid NOT NULL REFERENCES escolas(id),
  inscricao_id     uuid NOT NULL REFERENCES inscricoes(id),
  valor_centavos   bigint NOT NULL CHECK (valor_centavos > 0),
  metodo           metodo_pagamento NOT NULL DEFAULT 'dinheiro',
  referencia       text,                   -- nº de recibo / transação
  pago_em          timestamptz NOT NULL DEFAULT now(),
  registado_por    uuid REFERENCES utilizadores(id),
  anulado_em       timestamptz,
  anulado_por      uuid REFERENCES utilizadores(id),
  motivo_anulacao  text,
  CHECK ((anulado_em IS NULL) = (motivo_anulacao IS NULL))
);

CREATE INDEX pagamentos_inscricao_idx ON pagamentos (inscricao_id);

-- Documentos (BI digitalizado, foto, comprovativos). O ficheiro vive em storage S3-compatível.
CREATE TABLE documentos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id      uuid NOT NULL REFERENCES escolas(id),
  aluno_id       uuid NOT NULL REFERENCES alunos(id),
  inscricao_id   uuid REFERENCES inscricoes(id),
  tipo           text NOT NULL,            -- 'bi', 'foto', 'comprovativo', ...
  storage_key    text NOT NULL,
  nome_ficheiro  text NOT NULL,
  mime_type      text NOT NULL,
  enviado_por    uuid REFERENCES utilizadores(id),
  criado_em      timestamptz NOT NULL DEFAULT now()
);

-- Historico / audit log: quem fez o que e quando (inclui acoes do assistente de IA)
CREATE TABLE historico (
  id             bigserial PRIMARY KEY,
  escola_id      uuid NOT NULL REFERENCES escolas(id),
  utilizador_id  uuid REFERENCES utilizadores(id),
  origem         text NOT NULL DEFAULT 'app',   -- 'app' | 'assistente'
  entidade       text NOT NULL,                 -- 'aluno', 'inscricao', 'pagamento', ...
  entidade_id    uuid NOT NULL,
  acao           text NOT NULL,                 -- 'criou', 'atualizou', 'anulou', ...
  dados          jsonb,                         -- antes/depois, sem dados sensíveis em excesso
  criado_em      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX historico_entidade_idx ON historico (entidade, entidade_id, criado_em DESC);

-- Eixo 3: situacao financeira calculada (nunca digitada a mao)
CREATE VIEW inscricoes_financeiro AS
SELECT
  i.id AS inscricao_id,
  i.escola_id,
  i.preco_total_centavos,
  COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) AS pago_centavos,
  i.preco_total_centavos
    - COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) AS saldo_centavos,
  CASE WHEN i.preco_total_centavos = 0 THEN 100
       ELSE ROUND(100.0 * COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0)
                  / i.preco_total_centavos, 1)
  END AS percentagem_paga,
  CASE
    WHEN COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) = 0
      THEN 'sem_pagamento'
    WHEN COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) < i.preco_total_centavos
      THEN 'parcial'
    ELSE 'pago'
  END AS situacao_pagamento
FROM inscricoes i
LEFT JOIN pagamentos p ON p.inscricao_id = i.id
WHERE i.eliminado_em IS NULL
GROUP BY i.id;

-- Exemplo do caso descrito:
-- Albertino (nascido em 1999) inscreve-se na categoria da carta e paga 30% do total.
-- 1) INSERT em alunos; 2) INSERT em inscricoes (preco_total_centavos copiado da categoria);
-- 3) INSERT em pagamentos com 30% do valor; 4) se o INATRO falhar,
--    UPDATE inscricoes SET estado_inatro = 'pendente', inatro_nota = '...' .
