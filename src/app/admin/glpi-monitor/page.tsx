"use client";

import React, { useEffect } from "react";
import { Activity, RefreshCw, ChevronLeft, AlertCircle, Clock, CheckCircle2, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";
import { API_BASE_URL } from "@/lib/api-config";

export default function GlpiMonitorPage() {
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/glpi/status`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        if (res.ok) {
          await res.json();
        }
      } catch (err) {
        console.error("Erro GLPI:", err);
      }
    };
    fetchData();
  }, []); // API_BASE_URL é constante, não precisa estar aqui

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Monitoramento\nGLPI`} icon={Activity} type="checklists" />

      {/* Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#FF5252] to-[#D32F2F] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
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
          <p className="text-white/70 text-lg font-medium">Acompanhe em tempo real a sincronização de chamados e status de ativos da rede Cometa.</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[60%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800]">Status de Integração</h2>
            <button className="bg-[#FF5252] text-white px-8 py-4 rounded-xl text-[14px] lg:font-medium font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-[#D32F2F] transition-all">
              <RefreshCw className="w-5 h-5" /> Atualizar agora
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600"><CheckCircle2 /></div>
                 <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Sincronizados</span>
               </div>
               <div className="text-[42px] font-[900] text-[#1A1A2E]">248</div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600"><Clock /></div>
                 <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Pendentes</span>
               </div>
               <div className="text-[42px] font-[900] text-[#1A1A2E]">12</div>
            </div>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><LayoutGrid /></div>
                 <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Total Ativos</span>
               </div>
               <div className="text-[42px] font-[900] text-[#1A1A2E]">1.420</div>
            </div>
          </div>

          <div className="bg-white/50 border border-dashed border-gray-300 rounded-[40px] p-20 flex flex-col items-center justify-center text-center">
             <AlertCircle className="w-16 h-16 text-gray-300 mb-6" />
             <h3 className="text-xl lg:font-medium font-bold text-gray-400 uppercase mb-2">Monitor detalhado indisponível</h3>
             <p className="text-gray-400 max-w-xs">A integração detalhada com o banco GLPI está sendo configurada para este ambiente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
