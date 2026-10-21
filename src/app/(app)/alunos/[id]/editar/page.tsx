import { notFound } from "next/navigation";
import { requireContext } from "@/server/auth/session";
import { getStudent } from "@/server/services/students";
import { StudentForm } from "../../student-form";

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const ctx = await requireContext("operate");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const data = await getStudent(ctx, params.id);
  if (!data) notFound();
  return <StudentForm studentId={data.student.id} initialValues={data.student} />;
}
