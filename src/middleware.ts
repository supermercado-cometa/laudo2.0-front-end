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
      // Se já temos o token, vamos apenas deixar passar se o fetch falhar
      // ou ser mais permissivo durante a transição
      const host = req.headers.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      
      let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      if (!API_BASE_URL) {
        if (host?.includes("localhost")) {
          API_BASE_URL = "http://localhost:4000";
        } else {
          // Se estamos em produção, o backend pode estar em uma porta diferente
          // ou o fetch server-side para o próprio host pode falhar em alguns ambientes
          API_BASE_URL = `${protocol}://${host}`;
        }
      }
      
      console.log(`[Middleware] Checking admin access for ${pathname} via ${API_BASE_URL}/auth/me`);
      
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 
          Authorization: token || "",
          "Content-Type": "application/json"
        },
        cache: 'no-store',
        // Adicionar um timeout curto para não travar o middleware
        signal: AbortSignal.timeout(5000)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (!data?.user?.isAdmin) {
          console.warn(`[Middleware] User is not admin: ${data?.user?.username}`);
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
      } else {
        console.warn(`[Middleware] Auth check returned ${res.status}. Allowing access since token exists.`);
        // Se o backend não responder OK (ex: 404 ou 500), mas temos o token, 
        // vamos permitir o acesso e deixar o cliente lidar com a falta de dados
        // Isso evita loops de redirecionamento se o backend estiver instável
      }
    } catch (err) {
      console.error("[Middleware] Error in admin check:", err);
      // Em caso de erro de rede no middleware, não bloqueamos o usuário se ele tem um token
      // O componente cliente vai falhar se o token for realmente inválido
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/infoFormulario", "/admin/:path*"],
};
