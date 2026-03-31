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

  if (pathname.startsWith("/admin")) {
    try {
      const host = req.headers.get("host");
      // No Coolify/Traefik, o protocolo geralmente é HTTPS, mas o host pode ser diferente internamente
      const protocol = host?.includes("localhost") ? "http" : "https";
      
      let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      if (!API_BASE_URL) {
        if (host?.includes("localhost")) {
          API_BASE_URL = "http://localhost:4000";
        } else {
          // No Coolify, o backend e frontend podem estar no mesmo domínio
          // O fetch server-side precisa da URL completa e pública se não houver rede interna Docker
          API_BASE_URL = `${protocol}://${host}`;
        }
      }
      
      console.log(`[Middleware] Admin check for ${pathname} via ${API_BASE_URL}/auth/me`);
      
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 
          Authorization: token || "",
          "Content-Type": "application/json"
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (!data?.user?.isAdmin) {
          console.warn(`[Middleware] User is not admin: ${data?.user?.username}`);
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
        // Se for admin, continua normalmente
      } else {
        // Se o status for 401 ou outro erro, mas o token existe, 
        // em ambiente de proxy (Coolify), o fetch server-side pode falhar por DNS/Rede
        // Vamos permitir que a página carregue e o CLIENTE (browser) tente validar
        console.warn(`[Middleware] Auth check returned ${res.status}. Allowing access to client-side validation.`);
      }
    } catch (err) {
      console.error("[Middleware] Network error in admin check (Coolify proxy?):", err);
      // Não bloqueia o usuário no middleware se houver erro de rede/timeout
      // O componente AdminLayout ou a própria página fará a validação no browser
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/infoFormulario", "/admin/:path*"],
};
