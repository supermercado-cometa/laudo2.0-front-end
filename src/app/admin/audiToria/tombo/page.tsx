"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { InfoLaudo } from "@/types/domain";

export default function AdminAuditoriaTomboPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const [tomboQuery, setTomboQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [groups, setGroups] = useState<
    Array<{ tombo: string; chamados: string[] }>
  >([]);

  const pesquisar = async () => {
    const q = tomboQuery.trim();
    if (!q) {
      setGroups([]);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const url = new URL(`${API_BASE_URL}/info-laudos`);
      url.searchParams.set("tombo", q);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          ...(token ? { Authorization: token } : {}),
        },
      });
      if (!res.ok) {
        setGroups([]);
        setErrorMsg("Falha ao buscar laudos por tombo");
        return;
      }
      const data = (await res.json()) as InfoLaudo[];

      // Agrupa por tombo e coleta os chamados relacionados
      const map = new Map<string, Set<string>>();
      for (const l of data) {
        const t = (l.tombo || "").trim() || "N/D";
        if (!map.has(t)) map.set(t, new Set());
        map.get(t)!.add(l.numeroChamado);
      }

      const result = Array.from(map.entries()).map(([t, set]) => ({
        tombo: t,
        chamados: Array.from(set.values()).sort(),
      }));
      setGroups(result);
    } catch (err) {
      console.error("Erro ao pesquisar auditoria de tombo:", err);
      setErrorMsg("Erro interno ao pesquisar");
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const limpar = () => {
    setTomboQuery("");
    setGroups([]);
    setErrorMsg(null);
  };

  const GLPI_BASEPESQUISA_URL =
    process.env.GLPI_BASEPESQUISA_URL ||
    "https://suporte.cometasupermercados.com.br/front/ticket.form.php?id=";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoria de Tombo</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex gap-2 max-w-xl">
          <Input
            value={tomboQuery}
            onChange={(e) => setTomboQuery(e.target.value)}
            placeholder="Digite o tombo (exato ou parcial)"
          />
          <Button onClick={pesquisar} disabled={isLoading}>
            {isLoading ? "Pesquisando..." : "Pesquisar"}
          </Button>
          <Button variant="outline" onClick={limpar}>
            Limpar
          </Button>
        </div>

        {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

        {groups.length === 0 && !isLoading && !errorMsg && (
          <div className="text-sm text-muted-foreground">
            Nenhum resultado encontrado. Informe um tombo para pesquisar.
          </div>
        )}

        {/* Resultados: mostra apenas o tombo e seus chamados atrelados */}
        <div className="grid gap-3">
          {groups.map((g) => (
            <div key={g.tombo} className="rounded-md border p-4 space-y-2">
              <div className="font-semibold">Tombo: {g.tombo}</div>
              <div className="text-sm">Chamados atrelados:</div>
              <div className="flex flex-wrap gap-2">
                {g.chamados.map((c) => {
                  const href = `${GLPI_BASEPESQUISA_URL}${encodeURIComponent(
                    c
                  )}`;
                  return (
                    <a
                      key={c}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded bg-green-300 px-2 py-1 text-xs font-semibold hover:bg-green-400"
                      title={`Abrir chamado ${c} no GLPI`}
                    >
                      {c}
                    </a>
                  );
                })}
                {g.chamados.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhum chamado relacionado.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
