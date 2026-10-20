import {
  IconClipboard,
  IconClock,
  IconDashboard,
  IconHistory,
  IconTag,
  IconUserCog,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";

export type UtilizadorShell = {
  nome: string;
  papel: string;
  escola: string;
  verHistorico: boolean;
  admin: boolean;
  superAdmin: boolean;
};

export const navPrincipal = [
  { href: "/", label: "Painel", icon: IconDashboard },
  { href: "/alunos", label: "Alunos", icon: IconUsers },
  { href: "/inscricoes", label: "Inscrições", icon: IconClipboard },
  { href: "/pagamentos", label: "Pagamentos", icon: IconWallet },
  { href: "/pendencias", label: "Pendências", icon: IconClock },
];

export const navSuperAdmin = [
  { href: "/admin", label: "Visão geral", icon: IconDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: IconUsers },
  { href: "/admin/admins", label: "Administradores", icon: IconUserCog },
];

export function navGestao(u: UtilizadorShell) {
  return [
    ...(u.admin ? [{ href: "/categorias", label: "Categorias", icon: IconTag }] : []),
    ...(u.admin ? [{ href: "/utilizadores", label: "Utilizadores", icon: IconUserCog }] : []),
    ...(u.verHistorico ? [{ href: "/historico", label: "Histórico", icon: IconHistory }] : []),
  ];
}

export const pageTitles: Record<string, string> = {
  "/": "Painel",
  "/alunos/novo": "Novo aluno",
  "/alunos": "Alunos",
  "/inscricoes/nova": "Nova inscrição",
  "/inscricoes": "Inscrições",
  "/pagamentos": "Pagamentos",
  "/pendencias": "Pendências INATRO",
  "/categorias": "Categorias de carta",
  "/utilizadores": "Utilizadores",
  "/historico": "Histórico",
  "/admin": "Visão geral",
  "/admin/empresas": "Empresas",
  "/admin/admins": "Administradores",
  "/design-system": "Design System",
};
