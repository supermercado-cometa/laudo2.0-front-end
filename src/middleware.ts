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

  // Determina a URL base do backend
  const host = req.headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    API_BASE_URL = host?.includes("localhost")
      ? "http://localhost:4000"
      : `${protocol}://${host}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      // Token inválido ou expirado: força novo login
      console.warn(`[Middleware] Token rejeitado (${res.status}) em ${pathname}`);
      const response = NextResponse.redirect(new URL("/", req.url));
      response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
      return response;
    }

    // Rota /admin: verifica se é admin
    if (pathname.startsWith("/admin")) {
      const data = await res.json();
      if (!data?.user?.isAdmin) {
        console.warn(`[Middleware] Acesso admin negado: ${data?.user?.username}`);
        return NextResponse.redirect(new URL("/infoFormulario", req.url));
      }
    }
  } catch (err) {
    // Erro de rede ou servidor: em rotas sensíveis, é melhor bloquear do que permitir
    console.error("[Middleware] Falha crítica na verificação:", err);
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/infoFormulario", "/admin", "/admin/:path*"],
};
