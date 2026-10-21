import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice } from "@/components/layout/page-toolbar";
import { HistoryList } from "@/components/history-list";
import {
  StudentBadge,
  ButtonLink,
  Card,
  CardHeader,
  PaymentBadge,
  InatroBadge,
  Progress,
} from "@/components/ui";
import { IconArrowRight, IconPlus } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate, initials } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";
import { summarizeFinancials } from "@/server/domain/finance";
import { getStudent } from "@/server/services/students";
import { listDocuments } from "@/server/services/documents";
import { listHistory } from "@/server/services/history";
import { UploadDocument, DocumentList } from "./documents";

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; updated?: string };
}) {
  const ctx = await requireContext();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const data = await getStudent(ctx, params.id);
  if (!data) notFound();
  const { student, enrollments } = data;

  const documents = await listDocuments(ctx, student.id);
  const history = can(ctx.role, "view_history")
    ? await listHistory(ctx, {
        entityIds: [student.id, ...enrollments.map((i) => i.id), ...documents.map((d) => d.id)],
        limit: 15,
      })
    : [];

  const info: Array<[string, string | null]> = [
    ["Data de nascimento", formatDate(student.birthDate)],
    ["BI", student.idNumber],
    ["Telefone", student.phone],
    ["Email", student.email],
    ["Morada", student.address],
    ["Registado em", formatDate(student.createdAt)],
  ];

  return (
    <>
      {searchParams.created ? <Notice>Aluno registado com sucesso.</Notice> : null}
      {searchParams.updated ? <Notice>Dados do aluno atualizados.</Notice> : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand font-display text-lg font-bold text-brand-ink shadow-glow">
                {initials(student.fullName)}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-ink">{student.fullName}</h2>
                <p className="text-xs text-muted">{enrollments.length} inscrição(ões)</p>
              </div>
            </div>
            <dl className="mt-5 flex flex-col gap-3">
              {info.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line/60 pb-2 text-sm last:border-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v || <span className="text-subtle">—</span>}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href={`/alunos/${student.id}/editar`} variant="secondary" size="sm">
                Editar dados
              </ButtonLink>
              <ButtonLink href={`/inscricoes/nova?student=${student.id}`} size="sm" icon={<IconPlus size={14} />}>
                Nova inscrição
              </ButtonLink>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Documentos"
              description="BI, fotografia e comprovativos"
              action={
                can(ctx.role, "operate") ? (
                  <UploadDocument
                    studentId={student.id}
                    enrollments={enrollments.map((i) => ({ id: i.id, category: i.category, enrollmentDate: i.enrollmentDate }))}
                  />
                ) : null
              }
            />
            <DocumentList documents={documents} />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Inscrições" description="Cada inscrição tem o seu próprio preço e pagamentos" />
            {enrollments.length === 0 ? (
              <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Este aluno ainda não tem inscrições.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {enrollments.map((i) => {
                  const f = summarizeFinancials(i.total, i.paid);
                  return (
                    <li key={i.id}>
                      <Link
                        href={`/inscricoes/${i.id}`}
                        className="group flex flex-col gap-3 rounded-2xl bg-night-700/50 p-4 transition hover:bg-night-700 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-ink">{i.category}</span>
                            <StudentBadge status={i.studentStatus} />
                          </div>
                          <p className="mt-0.5 text-xs text-subtle">Inscrito em {formatDate(i.enrollmentDate)}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <Progress value={f.percentage} tone={f.paymentStatus === "pago" ? "success" : f.paymentStatus === "parcial" ? "warning" : "danger"} className="max-w-xs" />
                            <span className="whitespace-nowrap text-xs text-muted">
                              {formatMoneyMzn(f.paidCents)} / {formatMoneyMzn(f.totalCents)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PaymentBadge status={i.paymentStatus} />
                          <InatroBadge status={i.inatroStatus} />
                          <IconArrowRight size={16} className="text-subtle group-hover:text-brand" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {history.length ? (
            <Card>
              <CardHeader title="Histórico" description="Últimas ações sobre este aluno" />
              <HistoryList rows={history} />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
