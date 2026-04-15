"use client";

import React, { useEffect, useState } from "react";
import { Activity, RefreshCw, ChevronLeft, UserX, Users, Database, Zap, Clock, ShieldAlert, History, User, LucideIcon, CheckCircle2, LayoutGrid } from "lucide-react";
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

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

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
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <Activity className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] lg:font-medium font-[800] leading-[1.1] uppercase tracking-tight mb-8">
            Portal Integrado GLPI
          </h1>
          <p className="text-white/70 text-lg font-medium">Controle as sessões e acompanhe as métricas de integração dos laudos técnicos.</p>
        </div>
      </div>

      {/* Lado Direito (Rolável 65%) */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto pb-20">
          
          {/* Header e Ações Principais */}
          <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800] tracking-tighter uppercase">Monitoramento GLPI</h2>
            <div className="flex gap-3">
               <Button variant="outline" onClick={() => handleAction("/metrics/reset")} className="h-14 rounded-xl text-xs font-bold uppercase tracking-widest gap-2">
                  <History className="w-4 h-4" /> Resetar Métricas
               </Button>
               <Button onClick={fetchData} className="h-14 bg-[#003B99] rounded-xl uppercase tracking-widest lg:font-medium font-bold gap-2">
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
               </Button>
            </div>
          </div>

          {/* Seção de Gestão de Usuários */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm mb-10 border border-gray-100">
             <div className="flex flex-col lg:flex-row gap-8 items-end">
                <div className="flex-1 space-y-2 w-full">
                   <Label className="text-xs font-bold uppercase text-gray-400">username GLPI</Label>
                   <Input value={targetUser} onChange={e => setTargetUser(e.target.value)} placeholder="Ex: victor.peixoto" className="h-14 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="flex flex-wrap gap-3">
                   <Button variant="outline" onClick={() => handleAction("/session/clear", "POST", { username: targetUser })} disabled={!targetUser} className="h-14 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                      <Zap className="w-4 h-4 text-orange-500" /> Limpar cache
                   </Button>
                   <Button variant="outline" onClick={() => handleAction("/session/kill", "POST", { username: targetUser })} disabled={!targetUser} className="h-14 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                      <UserX className="w-4 h-4 text-red-500" /> Encerrar Sessão
                   </Button>
                   <Button variant="ghost" onClick={() => handleAction("/session/clear", "POST", { all: true })} className="h-14 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 text-gray-400 hover:text-red-500">
                      <Users className="w-4 h-4" /> Limpar todos
                   </Button>
                </div>
             </div>
          </div>

          {/* Grid de Métricas Principais */}
          {/* Grid de Métricas do Banco (Sincronização) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 border-b border-gray-100 pb-12">
             <MetricCard icon={CheckCircle2} label="Laudos no Banco" value={metrics?.db?.totalLaudos || 0} color="green" />
             <MetricCard icon={LayoutGrid} label="Lojas Ativas" value={metrics?.db?.totalLojas || 0} color="blue" />
             <MetricCard icon={Database} label="Setores Cadastrados" value={metrics?.db?.totalSetores || 0} color="gray" />
          </div>

          <h3 className="text-[#1A1A2E] text-xl lg:font-medium font-black uppercase mb-8">Performance da Integração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
             <MetricCard icon={User} label="Sessões iniciadas" value={metrics?.initSessions || 0} color="blue" />
             <MetricCard icon={Zap} label="Hits de cache" value={metrics?.sessionCacheHits || 0} color="green" />
             <MetricCard icon={ShieldAlert} label="Misses de cache" value={metrics?.sessionCacheMisses || 0} color="orange" />
             <MetricCard icon={Clock} label="Espera concorrente" value={metrics?.pendingInitWaits || 0} color="purple" />
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
          <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
             <h3 className="text-[#1A1A2E] text-xl lg:font-medium font-black uppercase mb-8 border-b border-gray-50 pb-6">Detalhamento de Atividade</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <OpDetail label="Followup" value={metrics?.operations?.createFollowup || 0} />
                <OpDetail label="Followup c/ cabeçalho" value={metrics?.operations?.createFollowupWithHeader || 0} />
                <OpDetail label="Criar Ticket" value={metrics?.operations?.createTicket || 0} />
                <OpDetail label="Relacionar Tickets" value={metrics?.operations?.linkTickets || 0} />
                <OpDetail label="Definir requerente" value={metrics?.operations?.setRequester || 0} />
                <OpDetail label="Atribuir usuário" value={metrics?.operations?.setAssigned || 0} />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: LucideIcon, label: string, value: number, color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-50 text-gray-600"
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 transition-all hover:shadow-md">
       <div className="flex items-center gap-4 mb-4">
         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}><Icon className="w-6 h-6" /></div>
         <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
       </div>
       <div className="text-[42px] font-[900] text-[#1A1A2E] leading-tight">{value}</div>
    </div>
  );
}

function OpDetail({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
       <span className="text-gray-500 font-bold uppercase text-[11px] tracking-widest">{label}</span>
       <span className="text-[#1A1A2E] font-[900] text-lg">{value}</span>
    </div>
  );
}
