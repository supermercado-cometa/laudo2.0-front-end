"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { BottomNav } from "@/components/bottom-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === "/admin";

  React.useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/");
          return;
        }

        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
            cache: 'no-store'
          });

          if (!res.ok) {
            router.replace("/");
            return;
          }

          const data = await res.json();
          if (!data?.user?.isAdmin) {
            router.replace("/infoFormulario");
            return;
          }

          setAuthorized(true);
        } catch {
          setAuthorized(true);
        }
      }
    };

    checkAuth();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E3D8A] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    /* 
       Ajuste de Centralização Absoluta (justify-center) 
       Garante que o conteúdo flutue no centro da tela em monitores grandes.
    */
    <div className={`min-h-screen bg-[#F5F7FB] flex flex-col items-center ${isHome ? 'lg:justify-center' : ''}`}>
      {isHome ? (
        /* LAYOUT CENTRALIZADO (HOME) - GUIA DESKTOP */
        <div className="w-full max-w-[1400px] px-0 lg:px-8 pt-0 pb-0 lg:pb-12 flex flex-col animate-in fade-in zoom-in-95 duration-700">
          <AdminHeader />
          <main className="w-full px-6 lg:px-0 flex flex-col items-start font-['Roboto']">
            {children}
          </main>
        </div>
      ) : (
        /* LAYOUT FULL SCREEN (SUBPÁGINAS) */
        <div className="w-full flex-1 flex flex-col">
          <AdminHeader />
          <main className="w-full flex-1">
            {children}
          </main>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
