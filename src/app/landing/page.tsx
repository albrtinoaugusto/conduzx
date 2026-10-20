import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { ButtonLink, Donut, FinanceiroBadge, InatroBadge, Progress } from "@/components/ui";
import {
  IconArrowRight,
  IconCar,
  IconCheck,
  IconClipboard,
  IconClock,
  IconFile,
  IconHistory,
  IconShield,
  IconSteering,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "ConduzX — Gestão inteligente para escolas de condução",
  description:
    "Alunos, inscrições, pagamentos e pendências do INATRO num só lugar. Feito para escolas de condução em Moçambique.",
};

const nav = [
  { href: "#inicio", label: "Início" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#inatro", label: "INATRO" },
  { href: "#contacto", label: "Contacto" },
];

const funcionalidades = [
  { icon: IconUsers, title: "Alunos organizados", text: "Ficha completa com BI, telefone e histórico de inscrições. Sem duplicados." },
  { icon: IconClipboard, title: "Inscrições por categoria", text: "A, A1, B, C, D… O preço fica guardado no momento da inscrição." },
  { icon: IconWallet, title: "Pagamentos por parcelas", text: "Total pago, saldo e percentagem calculados automaticamente, em Meticais." },
  { icon: IconClock, title: "Pendências do INATRO", text: "Saiba exatamente quem falta registar quando o sistema oficial volta." },
  { icon: IconHistory, title: "Histórico completo", text: "Quem criou, alterou ou anulou — cada ação fica registada." },
  { icon: IconShield, title: "Pagamentos imutáveis", text: "Nada se apaga. Erros são anulados com motivo e responsável." },
];

const passos = [
  { n: "01", title: "Cadastrar aluno", text: "Nome, BI e contacto em menos de um minuto." },
  { n: "02", title: "Criar inscrição", text: "Escolha a categoria de carta e o preço é fixado." },
  { n: "03", title: "Registar pagamento", text: "Total ou parcial, em numerário, M-Pesa, e-Mola ou POS." },
  { n: "04", title: "Marcar no INATRO", text: "Pendente ou registado, com número de processo." },
];

/* ---------- Elementos decorativos (inspirados na referência) ---------- */

function Dots({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bg-dots [background-size:16px_16px] ${className ?? ""}`}
    />
  );
}

function RingDeco({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full border-[5px] border-brand ${className ?? ""}`}
    />
  );
}

/* ---------- Pré-visualização do produto dentro do hero ---------- */

function HeroPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-l-[999px] rounded-r-none border-[6px] border-r-0 border-brand bg-night-800 max-lg:rounded-[48px] max-lg:border-r-[6px]">
      {/* Estrada estilizada */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgb(var(--night-600))_0,transparent_60%)]" />
      <div className="absolute -bottom-10 left-1/2 h-[140%] w-40 -translate-x-1/2 rotate-[28deg] bg-night-950/70">
        <div className="mx-auto h-full w-2 bg-[repeating-linear-gradient(to_bottom,rgb(var(--brand-400))_0_28px,transparent_28px_56px)] opacity-80" />
      </div>

      <div className="relative flex h-full flex-col justify-center gap-4 py-10 pl-[22%] pr-6 max-lg:px-6 sm:pr-10">
        {/* Cartão inscrição */}
        <div className="w-full max-w-sm rounded-2xl bg-night-900/95 p-4 shadow-shell ring-1 ring-white/5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-brand-ink">
              AC
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">Ana Maria Cossa</p>
              <p className="text-[11px] text-subtle">Categoria B — Ligeiros</p>
            </div>
            <InatroBadge estado="pendente" />
          </div>
          <div className="mt-4 flex justify-between text-[11px]">
            <span className="text-muted">9.250 de 18.500 MT</span>
            <span className="font-bold text-ink">50%</span>
          </div>
          <Progress value={50} className="mt-1.5" />
        </div>

        {/* Linha com mini donut + toast */}
        <div className="flex w-full max-w-sm items-stretch gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-night-900/95 p-3 shadow-shell ring-1 ring-white/5">
            <Donut
              size={64}
              thickness={9}
              slices={[
                { label: "Pago", value: 38, color: "rgb(var(--brand-400))" },
                { label: "Parcial", value: 21, color: "rgb(var(--warning))" },
                { label: "Sem", value: 9, color: "rgb(var(--danger))" },
              ]}
            />
            <div>
              <p className="font-display text-lg font-bold leading-none text-ink">68</p>
              <p className="text-[10px] text-subtle">inscrições</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center rounded-2xl bg-brand p-3 text-brand-ink shadow-glow">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
              <IconCheck size={14} strokeWidth={3} /> Pagamento
            </span>
            <span className="font-display text-lg font-extrabold leading-tight">+9.250 MT</span>
            <span className="text-[10px] font-semibold opacity-70">M-Pesa · agora</span>
          </div>
        </div>

        <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl bg-night-900/95 p-3 shadow-shell ring-1 ring-white/5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-night-700 text-brand">
            <IconCar size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-ink">Carlos Mondlane</p>
            <p className="text-[10px] text-subtle">A — Motociclos</p>
          </div>
          <FinanceiroBadge estado="parcial" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {children ? <p className="mt-4 text-sm text-muted sm:text-base">{children}</p> : null}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-night-900 text-ink">
      {/* ================= HERO ================= */}
      <section id="inicio" className="relative min-h-[100svh] overflow-hidden">
        {/* Decoração */}
        <span aria-hidden="true" className="absolute left-0 top-[42%] hidden h-24 w-6 bg-[repeating-linear-gradient(to_bottom,rgb(var(--brand-400))_0_4px,transparent_4px_10px)] lg:block" />
        <RingDeco className="left-[-38px] top-24 h-20 w-20 max-sm:hidden" />
        <RingDeco className="left-[46%] top-28 h-6 w-6 border-[3px]" />
        <RingDeco className="bottom-28 left-[40%] h-9 w-9 border-[4px] max-lg:hidden" />
        <Dots className="bottom-10 left-6 h-20 w-36 opacity-90" />
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-[36%] h-0 w-0 border-x-[46px] border-b-[46px] border-x-transparent border-b-brand max-lg:hidden"
        />
        <span aria-hidden="true" className="absolute right-[38%] top-20 hidden h-56 w-56 rounded-full bg-stripes opacity-70 [mask-image:radial-gradient(circle,black_45%,transparent_70%)] lg:block" />

        {/* Navegação */}
        <header className="relative z-20 mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 sm:px-8">
          <Link
            href="/landing"
            className="flex flex-col items-center rounded-b-3xl bg-brand px-5 pb-4 pt-5 text-brand-ink shadow-glow"
          >
            <IconSteering size={30} strokeWidth={2.4} />
            <span className="mt-1 font-display text-sm font-extrabold tracking-tight">
              CONDUZX
            </span>
          </Link>

          <nav className="hidden items-center gap-9 pt-7 lg:flex" aria-label="Principal">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="text-sm font-semibold text-ink/90 transition hover:text-brand">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 pt-6">
            <Link href="/" className="hidden text-sm font-semibold text-ink hover:text-brand sm:block">
              Entrar
            </Link>
            <ButtonLink href="#contacto" variant="outline" size="sm" className="h-9">
              Pedir demonstração
            </ButtonLink>
          </div>
        </header>

        {/* Conteúdo */}
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-10 sm:px-8 lg:min-h-[calc(100svh-120px)] lg:grid-cols-[1fr_1.05fr] lg:pb-0 lg:pt-0">
          <div className="lg:pl-6">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-night-800 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand ring-1 ring-brand/30">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Feito para Moçambique
            </p>
            <h1 className="font-display text-[3.2rem] font-black uppercase leading-[0.92] tracking-tight text-brand sm:text-7xl xl:text-[5.6rem]">
              Escola de
              <br />
              Condução
            </h1>
            <p className="mt-5 font-display text-xl font-bold italic text-ink sm:text-2xl">
              Gerida sem papel. Mesmo quando o INATRO falha.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              O ConduzX é o sistema interno da sua secretaria: alunos,
              inscrições, pagamentos em Meticais e pendências do INATRO —
              tudo num só lugar, com histórico de cada ação.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <ButtonLink href="/" size="lg" className="rounded-md uppercase tracking-wide">
                Começar agora
              </ButtonLink>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-ink hover:text-brand"
              >
                Ver como funciona <IconArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="relative h-[460px] sm:h-[520px] lg:-mr-8 lg:h-[600px] xl:-mr-[calc((100vw-80rem)/2+2rem)]">
            <HeroPreview />
            {/* Selo circular — equivalente ao "DISC 10%" */}
            <div className="absolute -top-12 right-2 flex h-28 w-28 flex-col sm:-left-10 sm:bottom-10 sm:right-auto sm:top-auto items-center justify-center rounded-full bg-brand text-center text-brand-ink shadow-glow ring-[6px] ring-night-900 sm:h-36 sm:w-36">
              <span className="font-display text-3xl font-black leading-none sm:text-4xl">100%</span>
              <span className="font-display text-sm font-extrabold uppercase">Digital</span>
            </div>
            <RingDeco className="-left-14 top-16 h-8 w-8 border-[4px] max-sm:hidden" />
          </div>
        </div>
      </section>

      {/* ================= NÚMEROS ================= */}
      <section className="relative border-y border-white/5 bg-night-850">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-8 lg:grid-cols-4">
          {[
            ["3 min", "para inscrever um aluno"],
            ["0", "pagamentos perdidos"],
            ["100%", "das ações com histórico"],
            ["MZN", "valores exatos em centavos"],
          ].map(([v, l]) => (
            <div key={l} className="text-center lg:text-left">
              <p className="font-display text-3xl font-black text-brand sm:text-4xl">{v}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FUNCIONALIDADES ================= */}
      <section id="funcionalidades" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <RingDeco className="right-10 top-16 h-10 w-10 max-sm:hidden" />
        <SectionTitle kicker="Funcionalidades" title={<>Tudo o que a secretaria <span className="text-brand">precisa</span></>}>
          Pensado para o atendimento do dia a dia: formulários curtos, botões
          claros e poucos cliques.
        </SectionTitle>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {funcionalidades.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-3xl border border-white/5 bg-night-800 p-6 shadow-card transition hover:-translate-y-1 hover:border-brand/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-glow">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= COMO FUNCIONA ================= */}
      <section id="como-funciona" className="relative bg-night-850 py-24">
        <Dots className="right-6 top-10 h-16 w-28 opacity-60" />
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <SectionTitle kicker="Como funciona" title="Quatro passos. Zero papel." />
          <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {passos.map((p, i) => (
              <li key={p.n} className="relative rounded-3xl bg-night-900 p-6 ring-1 ring-white/5">
                <span className="font-display text-5xl font-black text-brand/90">{p.n}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.text}</p>
                {i < passos.length - 1 ? (
                  <span className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-brand-ink lg:flex">
                    <IconArrowRight size={16} strokeWidth={3} />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= INATRO ================= */}
      <section id="inatro" className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="relative grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[40px] bg-brand p-8 text-brand-ink sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <span aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[18px] border-night-950/10" />
          <div className="relative">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] opacity-70">O INATRO caiu?</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase leading-tight sm:text-5xl">
              A sua escola continua a funcionar.
            </h2>
            <p className="mt-4 max-w-lg text-sm font-medium leading-relaxed opacity-80 sm:text-base">
              O ConduzX não substitui o INATRO — é o espelho interno da sua
              escola. Inscreva, receba e marque como pendente. Quando o sistema
              oficial voltar, a lista de pendências diz exatamente o que falta.
            </p>
          </div>
          <ul className="relative flex flex-col gap-3">
            {[
              ["Não registado", "Ainda sem tentativa no INATRO"],
              ["Pendente", "Sistema lento ou indisponível"],
              ["Registado", "Com número de processo"],
            ].map(([t, d], i) => (
              <li key={t} className="flex items-center gap-4 rounded-2xl bg-night-950 p-4 text-ink">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-display font-black text-brand-ink">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-display font-bold">{t}</span>
                  <span className="block text-xs text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section id="contacto" className="relative overflow-hidden bg-night-850 py-24">
        <RingDeco className="left-[8%] top-12 h-14 w-14 max-sm:hidden" />
        <span aria-hidden="true" className="absolute bottom-0 right-[12%] h-0 w-0 border-x-[40px] border-b-[40px] border-x-transparent border-b-brand" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-8">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-night-700 text-brand shadow-raised">
            <IconFile size={28} />
          </span>
          <h2 className="font-display text-3xl font-black uppercase leading-tight sm:text-5xl">
            Pronto para deixar o <span className="text-brand">caderno</span>?
          </h2>
          <p className="mt-4 text-sm text-muted sm:text-base">
            Fale connosco e mostramos o ConduzX a funcionar com os dados da sua escola.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/" size="lg" className="rounded-md uppercase">
              Pedir demonstração
            </ButtonLink>
            <ButtonLink href="/" size="lg" variant="outline" className="rounded-md uppercase">
              Entrar no sistema
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-night-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-subtle sm:flex-row sm:px-8">
          <Logo />
          <p>© 2026 ConduzX · Gestão inteligente para escolas de condução</p>
          <p>Maputo, Moçambique</p>
        </div>
      </footer>
    </div>
  );
}
