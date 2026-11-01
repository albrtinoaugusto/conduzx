/**
 * Carrega o banco de perguntas dos testes a partir de um ficheiro JSON.
 *   npm run db:questions -- caminho/perguntas.json [--replace]
 *
 * Formato: [{ "text": "...", "options": ["...", "..."], "correct": 0, "imageUrl": "/testes/x.svg" }]
 * `correct` é o índice da opção certa, a partir de 0 (A = 0). Volta a importar o mesmo
 * enunciado atualiza-o. Com --replace, as perguntas fora do ficheiro deixam de sair nos testes.
 */
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, notInArray } from "drizzle-orm";
import { Pool } from "pg";
import { z } from "zod";
import { practiceQuestions } from "../src/server/db/schema";

const questionSchema = z
  .object({
    text: z.string().trim().min(5),
    options: z.array(z.string().trim().min(1)).min(3).max(4),
    correct: z.number().int().min(0),
    imageUrl: z
      .string()
      .regex(/^(https:\/\/|\/)/, "imageUrl deve começar por https:// ou /")
      .nullish(),
  })
  .refine((q) => q.correct < q.options.length, "`correct` aponta para uma opção que não existe");

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) throw new Error("Indique o ficheiro: npm run db:questions -- perguntas.json [--replace]");
  const questions = z.array(questionSchema).min(1).parse(JSON.parse(readFileSync(file, "utf8")));

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  await db.transaction(async (tx) => {
    for (const q of questions) {
      const values = { text: q.text, options: q.options, correct: q.correct, imageUrl: q.imageUrl ?? null, active: true };
      await tx.insert(practiceQuestions).values(values).onConflictDoUpdate({ target: practiceQuestions.text, set: values });
    }
    if (args.includes("--replace")) {
      await tx
        .update(practiceQuestions)
        .set({ active: false })
        .where(notInArray(practiceQuestions.text, questions.map((q) => q.text)));
    }
  });
  const active = await db.select({ id: practiceQuestions.id }).from(practiceQuestions).where(eq(practiceQuestions.active, true));
  await pool.end();
  console.log(`${questions.length} perguntas importadas. Ativas no banco: ${active.length}.`);
  if (active.length < 25) console.log("Atenção: são precisas pelo menos 25 perguntas ativas para iniciar um teste.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
