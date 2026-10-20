-- Eixo 3: situação financeira calculada (nunca digitada à mão). Copiado de schema.sql.
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
