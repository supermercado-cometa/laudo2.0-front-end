"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, ChevronLeft, Loader2, AlertCircle, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";

interface GLPIMetrics {
  totalTickets: number;
  openTickets: number;
  assignedTickets: number;
  closedTickets: number;
  lastSync: string;
}

export default function GlpiMonitorPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<GLPIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchMetrics = useCallback(async () => {
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
    } catch (error) {
      console.error("Erro ao carregar métricas GLPI:", error);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchMetrics();
    // Refresh automático a cada 60 segundos
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Monitoramento\nGLPI`} icon={Activity} type="checklists" />      {/* Lado Esquerdo (Hero) */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#0E3D8A] to-[#1E5BB5] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all group shadow-lg">
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <Activity className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] lg:font-medium font-[800] leading-[1.1] uppercase whitespace-pre-line tracking-tight mb-8">
            {`Monitoramento\nGLPI`}
          </h1>
          <p className="text-white/70 text-lg font-medium">Dados em tempo real integrados ao Help Desk. Monitore a saúde do suporte técnico de toda a rede.</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[60%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800] tracking-tighter">Status do Suporte</h2>
            <button onClick={fetchMetrics} className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all text-[#0E3D8A]">
              <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading && !metrics ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 text-[#0E3D8A] animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card MÉTRICA 1: TOTAIS */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6"><Activity className="text-gray-400 w-8 h-8" /></div>
                 <span className="text-[48px] lg:font-medium font-[800] text-[#1A1A2E] leading-none mb-2">{metrics?.totalTickets || 0}</span>
                 <p className="text-[#6B7280] lg:font-medium font-bold uppercase text-[12px] tracking-widest text-center">Tickets Totais</p>
              </div>

              {/* Card MÉTRICA 2: ABERTOS */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-red-50 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6"><AlertCircle className="text-red-500 w-8 h-8" /></div>
                 <span className="text-[48px] lg:font-medium font-[800] text-red-600 leading-none mb-2">{metrics?.openTickets || 0}</span>
                 <p className="text-[#6B7280] lg:font-medium font-bold uppercase text-[12px] tracking-widest text-center">Aguardando Técnico</p>
              </div>

              {/* Card MÉTRICA 3: EM ATENDIMENTO */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-blue-50 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6"><Clock className="text-[#0E3D8A] w-8 h-8" /></div>
                 <span className="text-[48px] lg:font-medium font-[800] text-[#0E3D8A] leading-none mb-2">{metrics?.assignedTickets || 0}</span>
                 <p className="text-[#6B7280] lg:font-medium font-bold uppercase text-[12px] tracking-widest text-center">Em Atendimento</p>
              </div>

              {/* Card MÉTRICA 4: FINALIZADOS */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-green-50 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-6"><CheckCircle2 className="text-green-500 w-8 h-8" /></div>
                 <span className="text-[48px] lg:font-medium font-[800] text-green-600 leading-none mb-2">{metrics?.closedTickets || 0}</span>
                 <p className="text-[#6B7280] lg:font-medium font-bold uppercase text-[12px] tracking-widest text-center">Finalizados Hoje</p>
              </div>
            </div>
          )}

          <div className="mt-12 p-6 rounded-2xl bg-[#0E3D8A]/5 border border-[#0E3D8A]/10 text-center">
             <p className="text-[#0E3D8A] text-[14px] font-medium italic">
                Última atualização: {metrics?.lastSync ? new Date(metrics.lastSync).toLocaleString() : 'Nunca'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
