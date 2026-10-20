import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  FinanceiroBadge,
  InatroBadge,
  Input,
  Progress,
  Ring,
  SearchInput,
  Select,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { IconPlus, IconUsers, IconWallet } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";

const cores = [
  { nome: "brand-400", uso: "Ação principal, destaque", cls: "bg-brand-400" },
  { nome: "brand-300", uso: "Hover", cls: "bg-brand-300" },
  { nome: "brand-600", uso: "Pressionado", cls: "bg-brand-600" },
  { nome: "night-950", uso: "Fundo da página", cls: "bg-night-950" },
  { nome: "night-900", uso: "Contentor principal", cls: "bg-night-900" },
  { nome: "night-800", uso: "Cartões", cls: "bg-night-800" },
  { nome: "night-700", uso: "Inputs, elevados", cls: "bg-night-700" },
  { nome: "night-600", uso: "Hover de superfície", cls: "bg-night-600" },
  { nome: "success", uso: "Pago, válido", cls: "bg-success" },
  { nome: "warning", uso: "Parcial", cls: "bg-warning" },
  { nome: "danger", uso: "Sem pagamento, anulado", cls: "bg-danger" },
  { nome: "info", uso: "Registado INATRO", cls: "bg-info" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      {children}
    </Card>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl text-sm text-muted">
        Referência visual do ConduzX. Tokens em{" "}
        <code className="rounded bg-night-700 px-1.5 py-0.5 text-xs text-brand">
          src/app/globals.css
        </code>{" "}
        e componentes em{" "}
        <code className="rounded bg-night-700 px-1.5 py-0.5 text-xs text-brand">
          src/components/ui
        </code>
        .
      </p>

      <Section title="Cores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cores.map((c) => (
            <div key={c.nome} className="overflow-hidden rounded-xl bg-night-700/50">
              <div className={`h-16 border-b border-white/5 ${c.cls}`} />
              <div className="p-2.5">
                <p className="font-mono text-xs font-semibold text-ink">{c.nome}</p>
                <p className="text-[11px] text-subtle">{c.uso}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografia">
        <div className="space-y-3">
          <p className="font-display text-5xl font-black uppercase leading-none text-brand">
            Display 900
          </p>
          <p className="font-display text-3xl font-bold text-ink">Título de página — Poppins 700</p>
          <p className="font-display text-base font-bold text-ink">Título de cartão — Poppins 700</p>
          <p className="text-sm text-ink">Texto corrente — Inter 400, 14px</p>
          <p className="text-xs text-muted">Texto secundário — muted, 12px</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
            Rótulo de tabela — 11px uppercase
          </p>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Botões">
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={<IconPlus size={16} />}>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="danger">Anular</Button>
            <Button disabled>Desativado</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm">Pequeno</Button>
            <Button size="md">Médio</Button>
            <Button size="lg">Grande</Button>
          </div>
        </Section>

        <Section title="Badges de estado">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <FinanceiroBadge estado="sem_pagamento" />
              <FinanceiroBadge estado="parcial" />
              <FinanceiroBadge estado="pago" />
            </div>
            <div className="flex flex-wrap gap-2">
              <InatroBadge estado="nao_registado" />
              <InatroBadge estado="pendente" />
              <InatroBadge estado="registado" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Neutro</Badge>
              <Badge tone="brand">Marca</Badge>
              <Badge tone="info">Info</Badge>
            </div>
          </div>
        </Section>

        <Section title="Formulário">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nome completo" placeholder="Ex.: Ana Maria Cossa" />
            <Input label="Telefone" placeholder="84 000 0000" hint="Formato moçambicano" />
            <Select label="Categoria" defaultValue="B">
              <option value="A">A — Motociclos</option>
              <option value="B">B — Ligeiros</option>
              <option value="C">C — Pesados</option>
            </Select>
            <Input label="Valor (MT)" defaultValue="0,00" error="Indique um valor maior que zero." />
            <SearchInput placeholder="Pesquisa" className="sm:col-span-2" />
          </div>
        </Section>

        <Section title="Indicadores">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Alunos ativos" value="64" icon={<IconUsers size={18} />} trend={{ value: "+6", positive: true }} footer="Hoje" />
            <StatCard label="Recebido" value={formatMoneyMzn(14_850_000)} icon={<IconWallet size={18} />} trend={{ value: "-4%", positive: false }} />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Ring value={74} />
            <Ring value={45} color="rgb(var(--info))" />
            <div className="flex-1 space-y-2">
              <Progress value={80} />
              <Progress value={50} tone="warning" />
              <Progress value={20} tone="danger" />
            </div>
          </div>
        </Section>
      </div>

      <Section title="Tabela">
        <Table>
          <THead>
            <tr>
              <Th>Aluno</Th>
              <Th>Categoria</Th>
              <Th>Pagamento</Th>
              <Th align="right">Saldo</Th>
            </tr>
          </THead>
          <TBody>
            <Tr>
              <Td className="font-semibold">Ana Maria Cossa</Td>
              <Td className="text-muted">B — Ligeiros</Td>
              <Td><FinanceiroBadge estado="pago" /></Td>
              <Td align="right">{formatMoneyMzn(0)}</Td>
            </Tr>
            <Tr>
              <Td className="font-semibold">Carlos Mondlane</Td>
              <Td className="text-muted">A — Motociclos</Td>
              <Td><FinanceiroBadge estado="parcial" /></Td>
              <Td align="right">{formatMoneyMzn(550_000)}</Td>
            </Tr>
          </TBody>
        </Table>
      </Section>
    </div>
  );
}
