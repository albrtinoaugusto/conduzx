/**
 * Dados de exemplo: 1 escola, 3 utilizadores (um por papel), categorias,
 * ~10 alunos com inscrições e pagamentos que cobrem todos os casos.
 * Uso: npm run db:seed   (apaga e recria os dados de exemplo)
 */
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as s from "../src/server/db/schema";

const PASSWORD = "conduzx123";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: s });

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000);
const dataISO = (d: Date) => d.toISOString().slice(0, 10);

async function main() {
  await db.execute(
    `TRUNCATE historico, documentos, pagamentos, inscricoes, categorias, alunos, utilizadores, escolas RESTART IDENTITY CASCADE`,
  );

  const [escola] = await db
    .insert(s.escolas)
    .values({ nome: "Escola de Condução Boa Estrada", telefone: "21 300 400" })
    .returning();

  const hash = await bcrypt.hash(PASSWORD, 10);
  const [admin, gestor, atendente] = await db
    .insert(s.utilizadores)
    .values([
      { escolaId: escola.id, nome: "Ana Admin", email: "admin@conduzx.test", passwordHash: hash, papel: "admin" },
      { escolaId: escola.id, nome: "Rui Gestor", email: "gestor@conduzx.test", passwordHash: hash, papel: "gestor" },
      { escolaId: escola.id, nome: "Helena Macamo", email: "atendente@conduzx.test", passwordHash: hash, papel: "atendente" },
    ])
    .returning();

  // Segunda escola — serve para confirmar que os dados não se misturam.
  const [outra] = await db.insert(s.escolas).values({ nome: "Escola Rival (teste)" }).returning();
  await db.insert(s.utilizadores).values({
    escolaId: outra.id,
    nome: "Utilizador Outra Escola",
    email: "outra@conduzx.test",
    passwordHash: hash,
    papel: "admin",
  });

  const cats = await db
    .insert(s.categorias)
    .values([
      { escolaId: escola.id, codigo: "A", nome: "A — Motociclos", precoCentavos: 950_000 },
      { escolaId: escola.id, codigo: "A1", nome: "A1 — Motociclos leves", precoCentavos: 750_000 },
      { escolaId: escola.id, codigo: "B", nome: "B — Ligeiros", precoCentavos: 1_850_000 },
      { escolaId: escola.id, codigo: "C", nome: "C — Pesados", precoCentavos: 3_200_000 },
      { escolaId: escola.id, codigo: "D", nome: "D — Passageiros", precoCentavos: 3_800_000 },
    ])
    .returning();
  const cat = Object.fromEntries(cats.map((c) => [c.codigo, c]));

  type Caso = {
    nome: string;
    nasc: string;
    bi?: string;
    tel: string;
    cat: string;
    dias: number;
    pagamentos?: Array<[number, s.MetodoPagamento, number]>; // [% do total, método, dias atrás]
    anulado?: [number, s.MetodoPagamento, string];
    inatro?: s.EstadoInatro;
    processo?: string;
    nota?: string;
    estadoAluno?: s.EstadoAluno;
  };

  const casos: Caso[] = [
    { nome: "Albertino Mucavele", nasc: "1999-04-12", bi: "110100123456A", tel: "84 123 4567", cat: "B", dias: 1, pagamentos: [[30, "mpesa", 1]], inatro: "pendente", nota: "INATRO indisponível às 10h." },
    { nome: "Ana Maria Cossa", nasc: "2001-08-02", bi: "110100223344B", tel: "84 222 3344", cat: "B", dias: 2, pagamentos: [[50, "dinheiro", 2], [50, "transferencia", 1]], inatro: "registado", processo: "MPT-2026-08812" },
    { nome: "Carlos Alberto Mondlane", nasc: "1995-01-20", bi: "110200654321C", tel: "82 765 4321", cat: "A", dias: 3, pagamentos: [[40, "dinheiro", 3]], inatro: "pendente", nota: "Sistema lento, submissão não concluída." },
    { nome: "Fátima Nhantumbo", nasc: "2003-11-15", tel: "86 222 1100", cat: "B", dias: 4 },
    { nome: "Joaquim Sitoe", nasc: "1988-06-30", bi: "110300998877D", tel: "84 909 8877", cat: "C", dias: 6, pagamentos: [[50, "emola", 6]], inatro: "pendente", nota: "Falta atestado médico." },
    { nome: "Luísa Macuácua", nasc: "2000-02-10", bi: "110400334455E", tel: "87 333 4455", cat: "B", dias: 8, pagamentos: [[100, "mpesa", 8]], inatro: "nao_registado" },
    { nome: "Pedro Langa", nasc: "1997-09-09", bi: "110500556677F", tel: "84 555 6677", cat: "A1", dias: 20, pagamentos: [[100, "dinheiro", 20]], inatro: "registado", processo: "MPT-2026-08790", estadoAluno: "concluido" },
    { nome: "Rosa Tembe", nasc: "1993-12-01", bi: "110600112233G", tel: "82 111 2233", cat: "B", dias: 12, pagamentos: [[50, "dinheiro", 12]], anulado: [20, "emola", "Valor digitado errado"], inatro: "registado", processo: "MPT-2026-08771" },
    { nome: "Sérgio Chissano", nasc: "1990-03-25", bi: "110700440099H", tel: "85 444 0099", cat: "D", dias: 25, pagamentos: [[10, "dinheiro", 25]], estadoAluno: "desistiu" },
    { nome: "Teresa Uamusse", nasc: "2002-07-18", tel: "84 777 8899", cat: "A", dias: 0, inatro: "nao_registado" },
  ];

  for (const c of casos) {
    const criador = c.dias % 2 === 0 ? atendente : gestor;
    const [aluno] = await db
      .insert(s.alunos)
      .values({
        escolaId: escola.id,
        nomeCompleto: c.nome,
        dataNascimento: c.nasc,
        biNumero: c.bi ?? null,
        telefone: c.tel,
        criadoPor: criador.id,
        criadoEm: diasAtras(c.dias),
      })
      .returning();
    const categoria = cat[c.cat];
    const [insc] = await db
      .insert(s.inscricoes)
      .values({
        escolaId: escola.id,
        alunoId: aluno.id,
        categoriaId: categoria.id,
        precoTotalCentavos: categoria.precoCentavos,
        estadoAluno: c.estadoAluno ?? "ativo",
        estadoInatro: c.inatro ?? "nao_registado",
        inatroNumeroProcesso: c.processo ?? null,
        inatroNota: c.nota ?? null,
        inatroUltimaTentativa: c.inatro === "pendente" ? diasAtras(c.dias) : null,
        dataInscricao: dataISO(diasAtras(c.dias)),
        criadoPor: criador.id,
        criadoEm: diasAtras(c.dias),
      })
      .returning();

    const hist: Array<typeof s.historico.$inferInsert> = [
      { escolaId: escola.id, utilizadorId: criador.id, entidade: "aluno", entidadeId: aluno.id, acao: "criou", dados: { nome: c.nome }, criadoEm: diasAtras(c.dias) },
      { escolaId: escola.id, utilizadorId: criador.id, entidade: "inscricao", entidadeId: insc.id, acao: "criou", dados: { categoria: categoria.codigo, precoCentavos: categoria.precoCentavos, estadoInatro: insc.estadoInatro }, criadoEm: diasAtras(c.dias) },
    ];

    for (const [pct, metodo, dias] of c.pagamentos ?? []) {
      const valor = Math.round((categoria.precoCentavos * pct) / 100);
      const [p] = await db
        .insert(s.pagamentos)
        .values({ escolaId: escola.id, inscricaoId: insc.id, valorCentavos: valor, metodo, pagoEm: diasAtras(dias), registadoPor: atendente.id })
        .returning();
      hist.push({ escolaId: escola.id, utilizadorId: atendente.id, entidade: "pagamento", entidadeId: p.id, acao: "registou", dados: { inscricaoId: insc.id, valorCentavos: valor, metodo }, criadoEm: diasAtras(dias) });
    }

    if (c.anulado) {
      const [pct, metodo, motivo] = c.anulado;
      const valor = Math.round((categoria.precoCentavos * pct) / 100);
      const [p] = await db
        .insert(s.pagamentos)
        .values({ escolaId: escola.id, inscricaoId: insc.id, valorCentavos: valor, metodo, pagoEm: diasAtras(c.dias), registadoPor: atendente.id, anuladoEm: diasAtras(c.dias - 1), anuladoPor: gestor.id, motivoAnulacao: motivo })
        .returning();
      hist.push(
        { escolaId: escola.id, utilizadorId: atendente.id, entidade: "pagamento", entidadeId: p.id, acao: "registou", dados: { inscricaoId: insc.id, valorCentavos: valor, metodo }, criadoEm: diasAtras(c.dias) },
        { escolaId: escola.id, utilizadorId: gestor.id, entidade: "pagamento", entidadeId: p.id, acao: "anulou", dados: { inscricaoId: insc.id, motivo }, criadoEm: diasAtras(c.dias - 1) },
      );
    }

    await db.insert(s.historico).values(hist);
  }

  console.log(`Seed concluído. Utilizadores (palavra-passe "${PASSWORD}"):`);
  console.log("  admin@conduzx.test · gestor@conduzx.test · atendente@conduzx.test");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
