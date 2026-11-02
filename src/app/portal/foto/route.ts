import { getStudentContext } from "@/server/auth/student-session";
import { getStudentPhoto } from "@/server/services/documents";

export const dynamic = "force-dynamic";

/** Foto do próprio aluno: não recebe identificador, por isso não dá acesso a fotos de outros. */
export async function GET() {
  const student = await getStudentContext();
  if (!student) return new Response(null, { status: 401 });
  if (student.blocked) return new Response(null, { status: 403 });
  const photo = await getStudentPhoto(student.schoolId, student.studentId);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(photo.content, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
