"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { clearBrowserCachesAndCookies } from "@/lib/browser-cleanup";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [displayName, setDisplayName] = React.useState("Usuário");
  const [isAuditoriaOpen, setIsAuditoriaOpen] = React.useState(true);
  const [showNotice, setShowNotice] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const fullName = localStorage.getItem("fullName");
      const username = localStorage.getItem("username");
      setDisplayName(fullName || username || "Usuário");
    }
  }, []);

  return (
    <div className="min-h-screen flex">
      {showNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="rounded-md bg-green-600 text-white px-4 py-2 shadow">
            Aplicação atualizada - cache limpo
          </div>
        </div>
      )}
      <aside className="w-64 bg-gray-50 border-r flex flex-col">
        <div className="p-4 border-b">
          <p className="text-sm font-medium">Bem-vindo, {displayName}</p>
          <p className="text-xs text-muted-foreground">
            Ao painel administrador
          </p>
        </div>

        <nav className="p-2 space-y-1">
          {/* Links principais */}
          <Link href="/admin">
            <Button variant="ghost" className="justify-start w-full">
              Início
            </Button>
          </Link>
          <Link href="/admin/equipamentos">
            <Button variant="ghost" className="justify-start w-full">
              Equipamentos
            </Button>
          </Link>
          <Link href="/admin/modelos">
            <Button variant="ghost" className="justify-start w-full">
              Modelos
            </Button>
          </Link>
          <Link href="/admin/lojas">
            <Button variant="ghost" className="justify-start w-full">
              Lojas
            </Button>
          </Link>
          <Link href="/admin/setores">
            <Button variant="ghost" className="justify-start w-full">
              Setores
            </Button>
          </Link>
          <Link href="/admin/laudos">
            <Button variant="ghost" className="justify-start w-full">
              Laudos Gerados
            </Button>
          </Link>
          <Link href="/admin/glpi-monitor">
            <Button variant="ghost" className="justify-start w-full">
              Monitoramento GLPI
            </Button>
          </Link>
          <Link href="/infoFormulario">
            <Button variant="ghost" className="justify-start w-full">
              Laudo Técnico
            </Button>
          </Link>

          {/* Grupo: Auditoria (colapsável) */}
          <div className="mt-2">
            <Button
              variant="ghost"
              className="justify-start w-full"
              onClick={() => setIsAuditoriaOpen((v) => !v)}
            >
              Auditoria
            </Button>
            {isAuditoriaOpen && (
              <div className="ml-4 space-y-1">
                {/* Removido: link “Visão geral” */}
                <Link href="/admin/audiToria/tombo">
                  <Button variant="ghost" className="justify-start w-full">
                    Tombo
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sair */}
          <div className="mt-4 p-2 border-t">
            <Button
              variant="default"
              className="w-full"
              onClick={async () => {
                try {
                  const API_BASE_URL =
                    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
                  await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: "POST",
                    cache: "no-store",
                  });
                } catch {}
                try {
                  clearBrowserCachesAndCookies();
                } catch {}
                if (typeof window !== "undefined") {
                  window.location.replace("/");
                }
              }}
            >
              Sair
            </Button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
