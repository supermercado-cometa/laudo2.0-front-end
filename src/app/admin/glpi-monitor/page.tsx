"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Metrics = {
  initSessions: number;
  sessionCacheHits: number;
  sessionCacheMisses: number;
  pendingInitWaits: number;
  retries401: {
    followup: number;
    followupHeader: number;
    createTicket: number;
    linkTickets: number;
    setTicketRequester: number;
    setTicketAssigned: number;
  };
  sessionCacheSize: number;
};

export default function AdminGlpiMonitorPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState("");

  const loadMetrics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${API_BASE_URL}/glpi/metrics`, {
        method: "GET",
        headers: { Authorization: token },
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt}`);
      }
      const data = (await res.json()) as Metrics;
      setMetrics(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao obter métricas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const resetMetrics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${API_BASE_URL}/glpi/metrics/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt}`);
      }
      await loadMetrics();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao resetar métricas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, loadMetrics]);

  const clearSession = React.useCallback(async (all: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${API_BASE_URL}/glpi/session/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        cache: "no-store",
        body: JSON.stringify({ username: username.trim(), all }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt}`);
      }
      await loadMetrics();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao limpar sessão";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, username, loadMetrics]);

  const killSession = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${API_BASE_URL}/glpi/session/kill`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        cache: "no-store",
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${res.status} ${txt}`);
      }
      await loadMetrics();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao encerrar sessão";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, username, loadMetrics]);

  React.useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoramento GLPI</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex gap-2">
          <Button onClick={loadMetrics} disabled={loading}>Atualizar</Button>
          <Button onClick={resetMetrics} variant="default" disabled={loading}>Resetar métricas</Button>
        </div>
        <div className="grid gap-2 md:grid-cols-3 items-end">
          <input
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="username GLPI"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button onClick={() => clearSession(false)} disabled={loading || !username.trim()}>Limpar cache do usuário</Button>
          <Button onClick={() => killSession()} variant="default" disabled={loading || !username.trim()}>Encerrar sessão no GLPI</Button>
          <Button onClick={() => clearSession(true)} variant="outline" disabled={loading}>Limpar cache de todos</Button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {!metrics && !error && (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        )}
        {metrics && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3">
              <div className="text-sm">Sessões iniciadas</div>
              <div className="text-2xl font-semibold">{metrics.initSessions}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm">Hits de cache</div>
              <div className="text-2xl font-semibold">{metrics.sessionCacheHits}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm">Misses de cache</div>
              <div className="text-2xl font-semibold">{metrics.sessionCacheMisses}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm">Espera por sessão concorrente</div>
              <div className="text-2xl font-semibold">{metrics.pendingInitWaits}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-sm">Tamanho do cache</div>
              <div className="text-2xl font-semibold">{metrics.sessionCacheSize}</div>
            </div>
          </div>
        )}
        {metrics && (
          <div className="grid gap-3">
            <div className="text-sm font-medium">Retries 401</div>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="rounded-md border p-3">
                <div className="text-xs">Followup</div>
                <div className="text-xl font-semibold">{metrics.retries401.followup}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs">Followup c/ cabeçalho</div>
                <div className="text-xl font-semibold">{metrics.retries401.followupHeader}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs">Criar Ticket</div>
                <div className="text-xl font-semibold">{metrics.retries401.createTicket}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs">Relacionar Tickets</div>
                <div className="text-xl font-semibold">{metrics.retries401.linkTickets}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs">Definir requerente</div>
                <div className="text-xl font-semibold">{metrics.retries401.setTicketRequester}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs">Atribuir usuário</div>
                <div className="text-xl font-semibold">{metrics.retries401.setTicketAssigned}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
