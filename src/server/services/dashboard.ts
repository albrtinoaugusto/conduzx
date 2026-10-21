import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import type { Ctx } from "@/server/auth/session";

type Num = number | string | null;
const n = (v: Num) => Number(v ?? 0);

/** Indicadores do painel — uma ida à base de dados por bloco, sempre por escola. */
export async function getDashboard(ctx: Ctx) {
  const e = ctx.schoolId;

  const kpis = await db.execute<{
    received_month: Num;
    received_prev_month: Num;
    active_students: Num;
    enrollments_month: Num;
    pending: Num;
    pending_today: Num;
    open_balance: Num;
    total_active: Num;
    paid_active: Num;
    total_enrollments: Num;
    registered: Num;
    completed: Num;
  }>(sql`
    select
      (select coalesce(sum(valor_centavos),0) from pagamentos
        where escola_id = ${e} and anulado_em is null and pago_em >= date_trunc('month', now())) as received_month,
      (select coalesce(sum(valor_centavos),0) from pagamentos
        where escola_id = ${e} and anulado_em is null
          and pago_em >= date_trunc('month', now()) - interval '1 month'
          and pago_em < date_trunc('month', now())) as received_prev_month,
      (select count(distinct aluno_id) from inscricoes
        where escola_id = ${e} and eliminado_em is null and estado_aluno = 'ativo') as active_students,
      (select count(*) from inscricoes
        where escola_id = ${e} and eliminado_em is null and data_inscricao >= date_trunc('month', now())) as enrollments_month,
      (select count(*) from inscricoes
        where escola_id = ${e} and eliminado_em is null and estado_inatro <> 'registado' and estado_aluno <> 'desistiu') as pending,
      (select count(*) from inscricoes
        where escola_id = ${e} and eliminado_em is null and estado_inatro = 'pendente' and criado_em >= current_date) as pending_today,
      (select coalesce(sum(f.saldo_centavos),0) from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
        where f.escola_id = ${e} and i.estado_aluno = 'ativo') as open_balance,
      (select coalesce(sum(f.preco_total_centavos),0) from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
        where f.escola_id = ${e} and i.estado_aluno <> 'desistiu') as total_active,
      (select coalesce(sum(f.pago_centavos),0) from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
        where f.escola_id = ${e} and i.estado_aluno <> 'desistiu') as paid_active,
      (select count(*) from inscricoes where escola_id = ${e} and eliminado_em is null) as total_enrollments,
      (select count(*) from inscricoes where escola_id = ${e} and eliminado_em is null and estado_inatro = 'registado') as registered,
      (select count(*) from inscricoes where escola_id = ${e} and eliminado_em is null and estado_aluno = 'concluido') as completed
  `);
  const k = kpis.rows[0];

  const statusCounts = await db.execute<{ payment_status: string; total: Num }>(sql`
    select f.situacao_pagamento as payment_status, count(*) as total
    from inscricoes_financeiro f join inscricoes i on i.id = f.inscricao_id
    where f.escola_id = ${e} and i.estado_aluno <> 'desistiu'
    group by 1
  `);
  const byStatus = Object.fromEntries(statusCounts.rows.map((r) => [r.payment_status, n(r.total)]));

  const days = await db.execute<{ day: string; total: Num }>(sql`
    select d::date::text as day, coalesce(sum(p.valor_centavos), 0) as total
    from generate_series(current_date - 6, current_date, interval '1 day') d
    left join pagamentos p on p.escola_id = ${e} and p.anulado_em is null and p.pago_em::date = d::date
    group by d order by d
  `);

  const byCategory = await db.execute<{ name: string; students: Num; total: Num; paid: Num }>(sql`
    select c.nome as name, count(*) as students, sum(f.preco_total_centavos) as total, sum(f.pago_centavos) as paid
    from inscricoes i
    join categorias c on c.id = i.categoria_id
    join inscricoes_financeiro f on f.inscricao_id = i.id
    where i.escola_id = ${e} and i.eliminado_em is null and i.estado_aluno = 'ativo'
    group by c.nome order by count(*) desc limit 4
  `);

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a * 100) / b) : 0);
  const receivedThisMonth = n(k.received_month);
  const previous = n(k.received_prev_month);

  return {
    receivedThisMonth,
    receivedChange: previous > 0 ? Math.round(((receivedThisMonth - previous) * 100) / previous) : null,
    activeStudents: n(k.active_students),
    enrollmentsThisMonth: n(k.enrollments_month),
    pending: n(k.pending),
    pendingToday: n(k.pending_today),
    openBalance: n(k.open_balance),
    // Chaves = valores de `situacao_pagamento` na BD
    statusCounts: {
      paid: byStatus.pago ?? 0,
      partial: byStatus.parcial ?? 0,
      unpaid: byStatus.sem_pagamento ?? 0,
    },
    receipts7Days: days.rows.map((r) => n(r.total)),
    collectionRate: pct(n(k.paid_active), n(k.total_active)),
    registrationRate: pct(n(k.registered), n(k.total_enrollments)),
    completionRate: pct(n(k.completed), n(k.total_enrollments)),
    byCategory: byCategory.rows.map((r) => ({
      name: r.name,
      students: n(r.students),
      paidPct: pct(n(r.paid), n(r.total)),
    })),
  };
}
