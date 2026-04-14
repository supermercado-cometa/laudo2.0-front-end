"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { SubPageHeader } from "@/components/subpage-header";
import { LojaType } from "@/types/domain";

interface Checklist {
  id: number;
  titulo: string;
  data: string;
  status: "Pendente" | "Finalizado" | "Em Progresso";
  tecnico: string;
}

export default function LojaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [lojaInfo, setLojaInfo] = useState<LojaType | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        
        // 1. Buscar Informações da Loja
        const resLoja = await fetch(`${API_BASE_URL}/lojas/${params.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        if (resLoja.ok) setLojaInfo(await resLoja.json());

        // 2. Buscar Checklists da Loja (Placeholder para funcionalidade real)
        // Nota: Adaptado para a fidelidade total de dados
        const resChecks = await fetch(`${API_BASE_URL}/laudos?lojaId=${params.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        if (resChecks.ok) setChecklists(await resChecks.json());

      } catch (error) {
        console.error("Erro ao carregar dados da loja:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id, API_BASE_URL]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Checklists\n${lojaInfo?.nome || 'Monitoramento'}`} icon={ClipboardList} type="checklists" />

      {/* Lado Esquerdo (Hero) */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#0E3D8A] to-[#1E5BB5] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin/lojas")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold hover:bg-white/20 transition-all group">
          <ChevronLeft className="w-5 h-5" />
          Voltar para Lojas
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <ClipboardList className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] font-[800] leading-[1.1] uppercase whitespace-pre-line tracking-tight mb-8">
            {lojaInfo?.nome || "Carregando..."}
          </h1>
          <p className="text-white/70 text-lg font-medium">{lojaInfo?.filial} - {lojaInfo?.cidade}</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[60%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="mb-12">
            <h2 className="text-[#1A1A2E] text-[32px] font-[800] tracking-tighter mb-4">Relatórios da Unidade</h2>
            <p className="text-[#6B7280] text-[16px]">Histórico de auditorias realizadas nesta filial.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 text-[#0E3D8A] animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {checklists.length > 0 ? (
                checklists.map((check) => (
                  <div key={check.id} className="w-full bg-white p-6 rounded-2xl flex items-center justify-between shadow-sm group border border-transparent hover:border-[#0E3D8A]/5">
                    <div className="flex items-center gap-6">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${check.status === 'Finalizado' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                          {check.status === 'Finalizado' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                       </div>
                       <div>
                          <h3 className="text-[#1A1A2E] text-[16px] font-[700] uppercase mb-1">{check.titulo}</h3>
                          <p className="text-[#6B7280] text-[12px] uppercase font-bold tracking-wider">{check.tecnico} • {new Date(check.data).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-[#0E3D8A] translate-x-0 group-hover:translate-x-2 transition-all" />
                  </div>
                ))
              ) : (
                <div className="text-center p-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                   <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-400 font-bold uppercase text-[12px] tracking-widest">Nenhuma auditoria encontrada para esta loja.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
