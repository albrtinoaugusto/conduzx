import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db";
import { schools, students } from "@/server/db/schema";
import { STUDENT_COOKIE, STUDENT_SESSION_DURATION_S, createStudentToken, readStudentToken } from "./token";

/** Contexto do portal: o aluno só vê dados seus e da sua escola. */
export type StudentCtx = {
  studentId: string;
  schoolId: string;
  fullName: string;
  idNumber: string | null;
  schoolName: string;
  schoolPhone: string | null;
};

export function startStudentSession(studentId: string) {
  cookies().set(STUDENT_COOKIE, createStudentToken(studentId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STUDENT_SESSION_DURATION_S,
  });
}

export function endStudentSession() {
  cookies().delete(STUDENT_COOKIE);
}

export const getStudentContext = cache(async (): Promise<StudentCtx | null> => {
  const sid = readStudentToken(cookies().get(STUDENT_COOKIE)?.value);
  if (!sid) return null;
  const [row] = await db
    .select({
      studentId: students.id,
      schoolId: schools.id,
      fullName: students.fullName,
      idNumber: students.idNumber,
      schoolName: schools.name,
      schoolPhone: schools.phone,
    })
    .from(students)
    .innerJoin(schools, eq(schools.id, students.schoolId))
    .where(and(eq(students.id, sid), isNull(students.deletedAt)))
    .limit(1);
  return row ?? null;
});

export async function requireStudent(): Promise<StudentCtx> {
  const ctx = await getStudentContext();
  if (!ctx) redirect("/entrar");
  return ctx;
}
