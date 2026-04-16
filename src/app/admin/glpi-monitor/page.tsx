"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw, ChevronLeft, UserX, Database, Zap, Clock, ShieldAlert, History, User, CheckCircle2, LayoutGrid, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";
import { API_BASE_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GlpiMetrics {
  initSessions: number;
  sessionCacheHits: number;
  sessionCacheMisses: number;
  pendingInitWaits: number;
  sessionCacheSize: number;
  retries401: {
    followup: number;
    followupHeader: number;
    createTicket: number;
    linkTickets: number;
    setTicketRequester: number;
    setTicketAssigned: number;
  };
  operations: {
    createFollowup: number;
    createFollowupWithHeader: number;
    createTicket: number;
    linkTickets: number;
    setRequester: number;
    setAssigned: number;
  };
  db: {
    totalLaudos: number;
    totalLojas: number;
    totalSetores: number;
  };
}

export default function GlpiMonitorPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<GlpiMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [targetUser, setTargetUser] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/glpi/metrics`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Erro GLPI metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAction = async (path: string, method: string = "POST", body?: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/glpi${path}`, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "" 
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (res.ok) {
        alert("Comando executado com sucesso!");
        fetchData();
      }
    } catch (err) {
      console.error("Erro na ação GLPI:", err);
      alert("Erro ao executar comando.");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Monitoramento\nGLPI`} icon={Activity} type="checklists" />

      {/* Lado Esquerdo (Fixo 35%) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <Server className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full" />
          <h1 className="text-white text-[48px] font-medium leading-[1.1] uppercase tracking-tight mb-8">
            Portal Integrado GLPI
          </h1>
          <p className="text-white/70 text-lg font-medium">Controle as sessões e acompanhe as métricas de integração dos laudos técnicos.</p>
        </div>
      </div>

      {/* Lado Direito (Rolável 65%) */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto pb-20">
          
          {/* Header e Ações Principais */}
          <div className="mb-8 lg:mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] font-black uppercase tracking-tight">Status do Sistema</h2>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => handleAction("/metrics/reset")} className="h-12 lg:h-14 rounded-xl text-[10px] lg:text-xs font-bold uppercase gap-2">
                  <History className="w-4 h-4" /> <span className="hidden sm:inline">Resetar</span>
               </Button>
               <Button onClick={fetchData} className="flex-1 sm:flex-none h-12 lg:h-14 bg-[#003B99] rounded-xl uppercase text-[10px] lg:text-xs font-bold gap-2">
                  <RefreshCw className={`w-4 h-4 lg:w-5 lg:h-5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
               </Button>
            </div>
          </div>

          {/* Grid de Métricas do Banco (Sincronização) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
             <MetricCard icon={CheckCircle2} label="Laudos Sinc" value={metrics?.db?.totalLaudos || 0} color="green" small />
             <MetricCard icon={LayoutGrid} label="Lojas Ativas" value={metrics?.db?.totalLojas || 0} color="blue" small />
             <MetricCard icon={Database} label="Setores" value={metrics?.db?.totalSetores || 0} color="gray" small />
          </div>

          {/* Seção de Gestão de Usuários */}
          <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 shadow-sm mb-8 lg:mb-10 border border-gray-100">
             <h4 className="text-[#1A1A2E] text-[12px] font-black uppercase mb-6 tracking-widest text-gray-400">Gestão de Sessões Active Directory</h4>
             <div className="flex flex-col gap-4">
                <div className="space-y-2">
                   <Label className="text-[11px] font-bold uppercase text-gray-400 ml-1">Username GLPI</Label>
                   <Input value={targetUser} onChange={e => setTargetUser(e.target.value)} placeholder="vendedor.loja" className="h-12 lg:h-14 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="grid grid-cols-2 lg:flex gap-2">
                   <Button variant="outline" onClick={() => handleAction("/session/clear", "POST", { username: targetUser })} disabled={!targetUser} className="h-12 lg:h-14 rounded-xl text-[9px] lg:text-[10px] font-black uppercase gap-1">
                      <Zap className="w-3 h-3 text-orange-500" /> Limpar cache
                   </Button>
                   <Button variant="outline" onClick={() => handleAction("/session/kill", "POST", { username: targetUser })} disabled={!targetUser} className="h-12 lg:h-14 rounded-xl text-[9px] lg:text-[10px] font-black uppercase gap-1">
                      <UserX className="w-3 h-3 text-red-500" /> Matar Sessão
                   </Button>
                </div>
             </div>
          </div>

          <h3 className="text-[#1A1A2E] text-[14px] lg:text-xl font-black uppercase mb-6 lg:mb-8">Performance Bridge GLPI</h3>
          
          {/* Grid de Métricas Técnicas */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 mb-8 lg:mb-12">
             <MetricCard icon={User} label="Sessões iniciadas" value={metrics?.initSessions || 0} color="blue" />
             <MetricCard icon={Zap} label="Hits de cache" value={metrics?.sessionCacheHits || 0} color="green" />
             <MetricCard icon={ShieldAlert} label="Misses de cache" value={metrics?.sessionCacheMisses || 0} color="orange" />
             <MetricCard icon={Clock} label="Espera por sessão concorrente" value={metrics?.pendingInitWaits || 0} color="purple" />
             <MetricCard icon={Database} label="Tamanho do cache" value={metrics?.sessionCacheSize || 0} color="gray" />
             <MetricCard 
                icon={ShieldAlert} 
                label="Retries 401" 
                value={
                  metrics?.retries401 
                  ? Object.values(metrics.retries401).reduce((a, b) => a + b, 0) 
                  : 0
                } 
                color="red" 
             />
          </div>

          {/* Detalhes de Operações */}
          <div className="bg-white rounded-[24px] lg:rounded-[40px] p-6 lg:p-10 shadow-sm border border-gray-100">
             <h3 className="text-[#1A1A2E] text-[14px] lg:text-xl font-black uppercase mb-6 lg:mb-8 border-b border-gray-50 pb-4">Detalhamento</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-x-12 lg:gap-y-6">
                <OpDetail label="Followup" value={metrics?.operations?.createFollowup || 0} />
                <OpDetail label="Followup c/ Cabeçalho" value={metrics?.operations?.createFollowupWithHeader || 0} />
                <OpDetail label="Criar Ticket" value={metrics?.operations?.createTicket || 0} />
                <OpDetail label="Relacionar Tickets" value={metrics?.operations?.linkTickets || 0} />
                <OpDetail label="Definir Requerente" value={metrics?.operations?.setRequester || 0} />
                <OpDetail label="Atribuir Usuário" value={metrics?.operations?.setAssigned || 0} />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, small }: { icon: React.ElementType, label: string, value: number, color: string, small?: boolean }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-50 text-gray-600"
  };

  return (
    <div className={`bg-white ${small ? 'p-4 lg:p-6' : 'p-6 lg:p-8'} rounded-[20px] lg:rounded-[32px] shadow-sm border border-gray-100 transition-all hover:shadow-md`}>
       <div className={`flex items-center gap-2 lg:gap-4 ${small ? 'mb-2' : 'mb-4'}`}>
         <div className={`${small ? 'w-8 h-8 rounded-xl' : 'w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl'} flex items-center justify-center ${colors[color]}`}>
            <Icon className={small ? 'w-4 h-4' : 'w-5 h-5 lg:w-6 lg:h-6'} />
         </div>
         <span className={`${small ? 'text-[9px]' : 'text-[10px] lg:text-[11px]'} font-bold text-gray-400 uppercase tracking-tight`}>{label}</span>
       </div>
       <div className={`${small ? 'text-[24px] lg:text-[32px]' : 'text-[28px] lg:text-[42px]'} font-[900] text-[#1A1A2E] leading-tight`}>{value}</div>
    </div>
  );
}

function OpDetail({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
       <span className="text-gray-500 font-bold uppercase text-[9px] lg:text-[11px] tracking-tight">{label}</span>
       <span className="text-[#1A1A2E] font-black text-sm lg:text-lg">{value}</span>
    </div>
  );
}
