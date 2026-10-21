import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as s from "../src/server/db/schema";

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super-Admin";
  if (!process.env.DATABASE_URL || !email || !password || password.length < 8) {
    throw new Error("Defina DATABASE_URL, SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD (mínimo 8 caracteres).");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const db = drizzle(pool, { schema: s });
    const passwordHash = await bcrypt.hash(password, 10);
    const [existing] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email)).limit(1);
    if (existing) {
      await db.update(s.users).set({ schoolId: null, name, role: "super_admin", passwordHash, active: true }).where(eq(s.users.id, existing.id));
    } else {
      await db.insert(s.users).values({ schoolId: null, name, email, passwordHash, role: "super_admin" });
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
