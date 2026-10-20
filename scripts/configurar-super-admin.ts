import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as s from "../src/server/db/schema";

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const nome = process.env.SUPER_ADMIN_NAME?.trim() || "Super-Admin";
  if (!process.env.DATABASE_URL || !email || !password || password.length < 8) {
    throw new Error("Defina DATABASE_URL, SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD (mínimo 8 caracteres).");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const db = drizzle(pool, { schema: s });
    const passwordHash = await bcrypt.hash(password, 10);
    const [existente] = await db.select({ id: s.utilizadores.id }).from(s.utilizadores).where(eq(s.utilizadores.email, email)).limit(1);
    if (existente) {
      await db.update(s.utilizadores).set({ escolaId: null, nome, papel: "super_admin", passwordHash, ativo: true }).where(eq(s.utilizadores.id, existente.id));
    } else {
      await db.insert(s.utilizadores).values({ escolaId: null, nome, email, passwordHash, papel: "super_admin" });
    }
    console.log(`Conta Super-Admin configurada para ${email}.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha ao configurar Super-Admin.");
  process.exitCode = 1;
});
