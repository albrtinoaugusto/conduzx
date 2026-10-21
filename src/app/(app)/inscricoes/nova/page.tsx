import { EmptyState } from "@/components/layout/page-toolbar";
import { ButtonLink } from "@/components/ui";
import { requireContext } from "@/server/auth/session";
import { getStudent } from "@/server/services/students";
import { listCategories } from "@/server/services/categories";
import { NewEnrollmentForm } from "./new-enrollment-form";

export default async function NewEnrollmentPage({ searchParams }: { searchParams: { student?: string } }) {
  const ctx = await requireContext("operate");
  const categories = await listCategories(ctx, { activeOnly: true });

  const initialStudent =
    searchParams.student && /^[0-9a-f-]{36}$/i.test(searchParams.student)
      ? (await getStudent(ctx, searchParams.student))?.student ?? null
      : null;

  if (categories.length === 0) {
    return (
      <EmptyState title="Sem categorias ativas" text="É preciso pelo menos uma categoria de carta com preço para criar inscrições.">
        {ctx.role === "admin" ? <ButtonLink href="/categorias">Gerir categorias</ButtonLink> : null}
      </EmptyState>
    );
  }

  return (
    <NewEnrollmentForm
      categories={categories.map((c) => ({ id: c.id, name: c.name, priceCents: c.priceCents }))}
      initialStudent={
        initialStudent
          ? { id: initialStudent.id, fullName: initialStudent.fullName, idNumber: initialStudent.idNumber, phone: initialStudent.phone }
          : null
      }
    />
  );
}
