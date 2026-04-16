import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Determina a URL base do backend (Garantindo homologação no servidor)
  let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL || API_BASE_URL.includes("undefined")) {
    API_BASE_URL = "https://homoapilaudos.cometasupermercados.com.br";
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000), // Mais tolerante: 10s
    });

    if (!res.ok) {
      console.warn(`[Middleware] Token rejeitado (${res.status}) em ${pathname}`);
      const response = NextResponse.redirect(new URL("/", req.url));
      response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
      return response;
    }

    // Rota /admin: qualquer logado pode entrar, o controle de cards é no client-side
    // Se quiser bloquear alguma sub-rota real (ex: /admin/usuarios) pode adicionar aqui.
    if (pathname.startsWith("/admin/usuarios") || pathname.startsWith("/admin/config")) {
      const data = await res.json();
      if (!data?.user?.isAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
  } catch (err) {
    // Se a API cair ou der timeout, não vamos expulsar o usuário imediatamente.
    // Deixamos ele passar para que a validação client-side das páginas decida.
    console.error("[Middleware] Timeout ou Erro de Rede na API:", err);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
