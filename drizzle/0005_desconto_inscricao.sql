-- Desconto por inscrição (ex.: promoção da escola). O preço da categoria continua congelado em
-- preco_total_centavos; o valor a pagar é preco_total_centavos - desconto_centavos.
ALTER TABLE inscricoes ADD COLUMN desconto_centavos bigint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE inscricoes ADD COLUMN desconto_motivo text;--> statement-breakpoint
ALTER TABLE inscricoes ADD CONSTRAINT inscricoes_desconto_check
  CHECK (desconto_centavos >= 0 AND desconto_centavos <= preco_total_centavos);--> statement-breakpoint

-- A situação financeira passa a contar com o desconto. As colunas antigas mantêm o nome e o significado.
DROP VIEW inscricoes_financeiro;--> statement-breakpoint
CREATE VIEW inscricoes_financeiro AS
SELECT
  i.id AS inscricao_id,
  i.escola_id,
  i.preco_total_centavos,
  COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) AS pago_centavos,
  (i.preco_total_centavos - i.desconto_centavos)
    - COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) AS saldo_centavos,
  CASE WHEN i.preco_total_centavos - i.desconto_centavos = 0 THEN 100
       ELSE ROUND(100.0 * COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0)
                  / (i.preco_total_centavos - i.desconto_centavos), 1)
  END AS percentagem_paga,
  CASE
    WHEN i.preco_total_centavos - i.desconto_centavos = 0 THEN 'pago'
    WHEN COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) = 0
      THEN 'sem_pagamento'
    WHEN COALESCE(SUM(p.valor_centavos) FILTER (WHERE p.anulado_em IS NULL), 0) < i.preco_total_centavos - i.desconto_centavos
      THEN 'parcial'
    ELSE 'pago'
  END AS situacao_pagamento,
  i.desconto_centavos,
  i.preco_total_centavos - i.desconto_centavos AS valor_a_pagar_centavos
FROM inscricoes i
LEFT JOIN pagamentos p ON p.inscricao_id = i.id
WHERE i.eliminado_em IS NULL
GROUP BY i.id;
