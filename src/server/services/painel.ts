import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import type { Ctx } from "@/server/auth/sessao";

type Num = number | string | null;
const n = (v: Num) => Number(v ?? 0);

/** Indicadores do painel — uma ida à base de dados por bloco, sempre por escola. */
export async function obterPainel(ctx: Ctx) {
  const e = ctx.escolaId;

  const kpis = await db.execute<{
    recebido_mes: Num;
    recebido_mes_anterior: Num;
    alunos_ativos: Num;
    inscricoes_mes: Num;
    pendentes: Num;
    pendentes_hoje: Num;
    saldo_aberto: Num;
    total_ativas: Num;
    pago_ativas: Num;
    total_inscricoes: Num;
    registados: Num;
    concluidos: Num;
  }>(sql`
    select
      (select coalesce(sum(valor_centavos),0) from pagamentos
        where escola_id = ${e} and anulado_em is null and pago_em >= date_trunc('month', now())) as recebido_mes,
      (select coalesce(sum(valor_centavos),0) from pagamentos
        where escola_id = ${e} and anulado_em is null
          and pago_em >= date_trunc('month', now()) - interval '1 month'
          and pago_em < date_trunc('month', now())) as recebido_mes_anterior,
      (select count(distinct aluno_id) from inscricoes
        where escola_id = ${e} and eliminado_em is null and estado_aluno = 'ativo') as alunos_ativos,
      (select count(*) from inscricoes
        where escola_id = ${e} and eliminado_em is null and data_inscricao >= date_trunc('month', now())) as inscricoes_mes,
      (select count(*) from inscricoes
        where escola_id = ${e} and eliminado_em is null and estado_inatro <> 'registado' and estado_aluno <> 'desistiu') as pendentes,
      (select count(*) from inscricoes
        where escola_id = ${e} and eliminado_em is null and estado_inatro = 'pendente' and criado_em >= current_date) as pendentes_hoje,
      (select coalesce(sum(f.saldo_centavos),0) from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
        where f.escola_id = ${e} and i.estado_aluno = 'ativo') as saldo_aberto,
      (select coalesce(sum(f.preco_total_centavos),0) from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
        where f.escola_id = ${e} and i.estado_aluno <> 'desistiu') as total_ativas,
      (select coalesce(sum(f.pago_centavos),0) from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
        where f.escola_id = ${e} and i.estado_aluno <> 'desistiu') as pago_ativas,
      (select count(*) from inscricoes where escola_id = ${e} and eliminado_em is null) as total_inscricoes,
      (select count(*) from inscricoes where escola_id = ${e} and eliminado_em is null and estado_inatro = 'registado') as registados,
      (select count(*) from inscricoes where escola_id = ${e} and eliminado_em is null and estado_aluno = 'concluido') as concluidos
  `);
  const k = kpis.rows[0];

  const situacoes = await db.execute<{ situacao: string; total: Num }>(sql`
    select f.situacao_pagamento as situacao, count(*) as total
    from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
    where f.escola_id = ${e} and i.estado_aluno <> 'desistiu'
    group by 1
  `);
  const sit = Object.fromEntries(situacoes.rows.map((r) => [r.situacao, n(r.total)]));

  const dias = await db.execute<{ dia: string; total: Num }>(sql`
    select d::date::text as dia, coalesce(sum(p.valor_centavos), 0) as total
    from generate_series(current_date - 6, current_date, interval '1 day') d
    left join pagamentos p on p.escola_id = ${e} and p.anulado_em is null and p.pago_em::date = d::date
    group by d order by d
  `);

  const porCategoria = await db.execute<{ nome: string; alunos: Num; total: Num; pago: Num }>(sql`
    select c.nome, count(*) as alunos, sum(f.preco_total_centavos) as total, sum(f.pago_centavos) as pago
    from inscricoes i
    join categorias c on c.id = i.categoria_id
    join inscricoes_financeiro f on f.inscricao_id = i.id
    where i.escola_id = ${e} and i.eliminado_em is null and i.estado_aluno = 'ativo'
    group by c.nome order by count(*) desc limit 4
  `);

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a * 100) / b) : 0);
  const recebidoMes = n(k.recebido_mes);
  const anterior = n(k.recebido_mes_anterior);

  return {
    recebidoMes,
    variacaoRecebido: anterior > 0 ? Math.round(((recebidoMes - anterior) * 100) / anterior) : null,
    alunosAtivos: n(k.alunos_ativos),
    inscricoesMes: n(k.inscricoes_mes),
    pendentes: n(k.pendentes),
    pendentesHoje: n(k.pendentes_hoje),
    saldoAberto: n(k.saldo_aberto),
    situacoes: {
      pago: sit.pago ?? 0,
      parcial: sit.parcial ?? 0,
      sem_pagamento: sit.sem_pagamento ?? 0,
    },
    recebimentos7dias: dias.rows.map((r) => n(r.total)),
    taxaCobranca: pct(n(k.pago_ativas), n(k.total_ativas)),
    taxaRegistados: pct(n(k.registados), n(k.total_inscricoes)),
    taxaConcluidos: pct(n(k.concluidos), n(k.total_inscricoes)),
    porCategoria: porCategoria.rows.map((r) => ({
      nome: r.nome,
      alunos: n(r.alunos),
      pctPago: pct(n(r.pago), n(r.total)),
    })),
  };
}
