import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { students, categories, documents, enrollments, users } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { detectFormat, sanitizeFileName, type DocumentType } from "@/server/domain/documents";
import { BusinessError } from "@/server/errors";
import { storage, newStorageKey } from "@/server/storage";
import { logHistory } from "./history";

export type DocumentRow = Awaited<ReturnType<typeof listDocuments>>[number];

export async function listDocuments(ctx: Ctx, studentId: string) {
  return db
    .select({
      id: documents.id,
      type: documents.type,
      fileName: documents.fileName,
      mimeType: documents.mimeType,
      createdAt: documents.createdAt,
      enrollmentId: documents.enrollmentId,
      category: categories.name,
      uploadedBy: users.name,
    })
    .from(documents)
    .leftJoin(enrollments, eq(enrollments.id, documents.enrollmentId))
    .leftJoin(categories, eq(categories.id, enrollments.categoryId))
    .leftJoin(users, eq(users.id, documents.uploadedBy))
    .where(and(eq(documents.studentId, studentId), eq(documents.schoolId, ctx.schoolId)))
    .orderBy(desc(documents.createdAt));
}

export async function uploadDocument(
  ctx: Ctx,
  data: {
    studentId: string;
    enrollmentId: string | null;
    type: DocumentType;
    fileName: string;
    content: Uint8Array;
  },
) {
  const mime = detectFormat(data.content);
  if (!mime) throw new BusinessError("O ficheiro não é um PDF, JPG ou PNG válido.", "file");

  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, data.studentId), eq(students.schoolId, ctx.schoolId), isNull(students.deletedAt)))
    .limit(1);
  if (!student) throw new BusinessError("Aluno não encontrado.");

  if (data.enrollmentId) {
    const [enr] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.id, data.enrollmentId),
          eq(enrollments.studentId, data.studentId),
          eq(enrollments.schoolId, ctx.schoolId),
          isNull(enrollments.deletedAt),
        ),
      )
      .limit(1);
    if (!enr) throw new BusinessError("A inscrição escolhida não pertence a este aluno.", "enrollmentId");
  }

  // Primeiro o ficheiro: se a base de dados falhar fica só um ficheiro órfão, nunca um registo sem ficheiro.
  const storageKey = newStorageKey(ctx.schoolId);
  await storage.save(storageKey, data.content);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(documents)
      .values({
        schoolId: ctx.schoolId,
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        type: data.type,
        storageKey,
        fileName: sanitizeFileName(data.fileName, mime),
        mimeType: mime,
        uploadedBy: ctx.userId,
      })
      .returning({ id: documents.id });
    await logHistory(tx, ctx, "documento", created.id, "carregou", {
      type: data.type,
      studentId: data.studentId,
      enrollmentId: data.enrollmentId,
    });
    return created.id;
  });
}

/** Documento e conteúdo, apenas se pertencer à escola do utilizador. */
export async function getDocumentFile(ctx: Ctx, id: string) {
  const [doc] = await db
    .select({
      storageKey: documents.storageKey,
      fileName: documents.fileName,
      mimeType: documents.mimeType,
    })
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.schoolId, ctx.schoolId)))
    .limit(1);
  if (!doc) return null;
  const content = await storage.read(doc.storageKey);
  if (!content) return null;
  return { ...doc, content };
}
