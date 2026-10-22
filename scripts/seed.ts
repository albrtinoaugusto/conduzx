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

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

async function main() {
  await db.execute(
    `TRUNCATE historico, documentos, pagamentos, inscricoes, categorias, alunos, utilizadores, escolas RESTART IDENTITY CASCADE`,
  );

  const [school] = await db
    .insert(s.schools)
    .values({ name: "Escola de Condução Boa Estrada", phone: "21 300 400" })
    .returning();

  const hash = await bcrypt.hash(PASSWORD, 10);
  const [admin, gestor, atendente] = await db
    .insert(s.users)
    .values([
      { schoolId: school.id, name: "Ana Admin", email: "admin@conduzx.test", passwordHash: hash, role: "admin" },
      { schoolId: school.id, name: "Rui Gestor", email: "gestor@conduzx.test", passwordHash: hash, role: "gestor" },
      { schoolId: school.id, name: "Helena Macamo", email: "atendente@conduzx.test", passwordHash: hash, role: "atendente" },
    ])
    .returning();

  // Segunda escola - serve para confirmar que os dados não se misturam.
  const [otherSchool] = await db.insert(s.schools).values({ name: "Escola Rival (teste)" }).returning();
  await db.insert(s.users).values({
    schoolId: otherSchool.id,
    name: "Utilizador Outra Escola",
    email: "outra@conduzx.test",
    passwordHash: hash,
    role: "admin",
  });

  const cats = await db
    .insert(s.categories)
    .values([
      { schoolId: school.id, code: "A", name: "A - Motociclos", priceCents: 950_000 },
      { schoolId: school.id, code: "A1", name: "A1 - Motociclos leves", priceCents: 750_000 },
      { schoolId: school.id, code: "B", name: "B - Ligeiros", priceCents: 1_850_000 },
      { schoolId: school.id, code: "C", name: "C - Pesados", priceCents: 3_200_000 },
      { schoolId: school.id, code: "D", name: "D - Passageiros", priceCents: 3_800_000 },
    ])
    .returning();
  const cat = Object.fromEntries(cats.map((c) => [c.code, c]));

  type SeedCase = {
    name: string;
    birth: string;
    idNo?: string;
    tel: string;
    cat: string;
    days: number;
    payments?: Array<[number, s.PaymentMethod, number]>; // [% do total, método, dias atrás]
    voided?: [number, s.PaymentMethod, string];
    inatro?: s.InatroStatus;
    processNo?: string;
    note?: string;
    studentStatus?: s.StudentStatus;
  };

  const cases: SeedCase[] = [
    { name: "Albertino Mucavele", birth: "1999-04-12", idNo: "110100123456A", tel: "84 123 4567", cat: "B", days: 1, payments: [[30, "mpesa", 1]], inatro: "pendente", note: "INATRO indisponível às 10h." },
    { name: "Ana Maria Cossa", birth: "2001-08-02", idNo: "110100223344B", tel: "84 222 3344", cat: "B", days: 2, payments: [[50, "dinheiro", 2], [50, "transferencia", 1]], inatro: "registado", processNo: "MPT-2026-08812" },
    { name: "Carlos Alberto Mondlane", birth: "1995-01-20", idNo: "110200654321C", tel: "82 765 4321", cat: "A", days: 3, payments: [[40, "dinheiro", 3]], inatro: "pendente", note: "Sistema lento, submissão não concluída." },
    { name: "Fátima Nhantumbo", birth: "2003-11-15", tel: "86 222 1100", cat: "B", days: 4 },
    { name: "Joaquim Sitoe", birth: "1988-06-30", idNo: "110300998877D", tel: "84 909 8877", cat: "C", days: 6, payments: [[50, "emola", 6]], inatro: "pendente", note: "Falta atestado médico." },
    { name: "Luísa Macuácua", birth: "2000-02-10", idNo: "110400334455E", tel: "87 333 4455", cat: "B", days: 8, payments: [[100, "mpesa", 8]], inatro: "nao_registado" },
    { name: "Pedro Langa", birth: "1997-09-09", idNo: "110500556677F", tel: "84 555 6677", cat: "A1", days: 20, payments: [[100, "dinheiro", 20]], inatro: "registado", processNo: "MPT-2026-08790", studentStatus: "concluido" },
    { name: "Rosa Tembe", birth: "1993-12-01", idNo: "110600112233G", tel: "82 111 2233", cat: "B", days: 12, payments: [[50, "dinheiro", 12]], voided: [20, "emola", "Valor introduzido por engano"], inatro: "registado", processNo: "MPT-2026-08771" },
    { name: "Sérgio Chissano", birth: "1990-03-25", idNo: "110700440099H", tel: "85 444 0099", cat: "D", days: 25, payments: [[10, "dinheiro", 25]], studentStatus: "desistiu" },
    { name: "Teresa Uamusse", birth: "2002-07-18", tel: "84 777 8899", cat: "A", days: 0, inatro: "nao_registado" },
  ];

  for (const c of cases) {
    const creator = c.days % 2 === 0 ? atendente : gestor;
    const [student] = await db
      .insert(s.students)
      .values({
        schoolId: school.id,
        fullName: c.name,
        birthDate: c.birth,
        idNumber: c.idNo ?? null,
        phone: c.tel,
        createdBy: creator.id,
        createdAt: daysAgo(c.days),
      })
      .returning();
    const category = cat[c.cat];
    const [enr] = await db
      .insert(s.enrollments)
      .values({
        schoolId: school.id,
        studentId: student.id,
        categoryId: category.id,
        totalPriceCents: category.priceCents,
        studentStatus: c.studentStatus ?? "ativo",
        inatroStatus: c.inatro ?? "nao_registado",
        inatroProcessNumber: c.processNo ?? null,
        inatroNote: c.note ?? null,
        inatroLastAttempt: c.inatro === "pendente" ? daysAgo(c.days) : null,
        enrollmentDate: isoDate(daysAgo(c.days)),
        createdBy: creator.id,
        createdAt: daysAgo(c.days),
      })
      .returning();

    const historyRows: Array<typeof s.history.$inferInsert> = [
      { schoolId: school.id, userId: creator.id, entity: "aluno", entityId: student.id, action: "criou", data: { name: c.name }, createdAt: daysAgo(c.days) },
      { schoolId: school.id, userId: creator.id, entity: "inscricao", entityId: enr.id, action: "criou", data: { category: category.code, priceCents: category.priceCents, inatroStatus: enr.inatroStatus }, createdAt: daysAgo(c.days) },
    ];

    for (const [pct, method, days] of c.payments ?? []) {
      const amount = Math.round((category.priceCents * pct) / 100);
      const [p] = await db
        .insert(s.payments)
        .values({ schoolId: school.id, enrollmentId: enr.id, amountCents: amount, method, paidAt: daysAgo(days), recordedBy: atendente.id })
        .returning();
      historyRows.push({ schoolId: school.id, userId: atendente.id, entity: "pagamento", entityId: p.id, action: "registou", data: { enrollmentId: enr.id, amountCents: amount, method }, createdAt: daysAgo(days) });
    }

    if (c.voided) {
      const [pct, method, reason] = c.voided;
      const amount = Math.round((category.priceCents * pct) / 100);
      const [p] = await db
        .insert(s.payments)
        .values({ schoolId: school.id, enrollmentId: enr.id, amountCents: amount, method, paidAt: daysAgo(c.days), recordedBy: atendente.id, voidedAt: daysAgo(c.days - 1), voidedBy: gestor.id, voidReason: reason })
        .returning();
      historyRows.push(
        { schoolId: school.id, userId: atendente.id, entity: "pagamento", entityId: p.id, action: "registou", data: { enrollmentId: enr.id, amountCents: amount, method }, createdAt: daysAgo(c.days) },
        { schoolId: school.id, userId: gestor.id, entity: "pagamento", entityId: p.id, action: "anulou", data: { enrollmentId: enr.id, reason }, createdAt: daysAgo(c.days - 1) },
      );
    }

    await db.insert(s.history).values(historyRows);
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
