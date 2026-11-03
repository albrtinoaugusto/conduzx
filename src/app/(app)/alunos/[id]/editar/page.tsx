import { notFound } from "next/navigation";
import { requireContext } from "@/server/auth/session";
import { listDocuments } from "@/server/services/documents";
import { getStudent } from "@/server/services/students";
import { StudentForm } from "../../student-form";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const ctx = await requireContext("operate");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const data = await getStudent(ctx, params.id);
  if (!data) notFound();
  const documents = await listDocuments(ctx, data.student.id);
  // A lista vem do mais recente para o mais antigo: o primeiro de cada tipo é o válido
  const imageUrl = (type: string) => {
    const d = documents.find((x) => x.type === type);
    return d?.mimeType.startsWith("image/") ? `/documentos/${d.id}?inline=1` : undefined;
  };
  return (
    <StudentForm
      studentId={data.student.id}
      initialValues={data.student}
      enrollments={data.enrollments.map((i) => ({
        id: i.id,
        category: i.category,
        enrollmentDate: i.enrollmentDate,
        firstLessonDate: i.firstLessonDate,
      }))}
      photoUrl={imageUrl("foto")}
      idCardUrl={imageUrl("bi")}
    />
  );
}
