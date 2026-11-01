import { NextResponse, type NextRequest } from "next/server";
import { isMobileRequest } from "@/lib/device";

// Verificação leve: só confirma a existência do cookie.
// A assinatura e o estado do utilizador são validados no servidor (sessao.ts).
// /entrar e /portal têm a sua própria autenticação (aluno).
const PUBLIC_PATHS = ["/login", "/landing", "/privacy", "/privary", "/terms-of-use", "/entrar", "/portal"];

const redirectTo = (req: NextRequest, pathname: string) => {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasStaffSession = req.cookies.has("conduzx_sessao");
  const mobile = isMobileRequest(req.headers.get("user-agent"), req.headers.get("sec-ch-ua-mobile"));

  // Telemóvel sem sessão de funcionário: entrada própria (Aluno / Escola).
  if (mobile && !hasStaffSession && (pathname === "/" || pathname === "/login")) {
    return redirectTo(req, req.cookies.has("conduzx_aluno") ? "/portal" : "/entrar");
  }
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (!hasStaffSession) return redirectTo(req, mobile ? "/entrar" : "/login");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
