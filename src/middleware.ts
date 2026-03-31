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
      const protocol = host?.includes("localhost") ? "http" : "https";
      
      // Se não houver NEXT_PUBLIC_API_BASE_URL, tenta usar o host atual
      // Isso ajuda se o backend e frontend estiverem no mesmo domínio/proxy
      let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      if (!API_BASE_URL) {
        if (host?.includes("localhost")) {
          API_BASE_URL = "http://localhost:4000";
        } else {
          API_BASE_URL = `${protocol}://${host}`;
        }
      }
      
      console.log(`[Middleware] Checking admin access for ${pathname} via ${API_BASE_URL}/auth/me`);
      
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 
          Authorization: token || "",
          "Content-Type": "application/json"
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        console.warn(`[Middleware] Auth check failed with status: ${res.status} for ${API_BASE_URL}/auth/me`);
        // Se falhar a chamada ao backend, mas o token existe, talvez devêssemos permitir? 
        // Não, por segurança redirecionamos. Mas vamos garantir que a URL está correta.
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      
      const data = await res.json();
      if (!data?.user?.isAdmin) {
        console.warn(`[Middleware] User is not admin: ${data?.user?.username}`);
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error("[Middleware] Error in admin check:", err);
      // Se der erro de rede (ex: backend offline), redireciona para login
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/infoFormulario", "/admin/:path*"],
};
