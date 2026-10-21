import { NextResponse, type NextRequest } from "next/server";

// Verificação leve: só confirma a existência do cookie.
// A assinatura e o estado do utilizador são validados no servidor (sessao.ts).
const PUBLIC_PATHS = ["/login", "/landing", "/privacy", "/privary", "/terms-of-use"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (!req.cookies.has("conduzx_sessao")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
