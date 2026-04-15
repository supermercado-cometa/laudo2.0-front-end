"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { FileText, Search, ChevronLeft, Loader2, Printer, Calendar, History } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";
import { API_BASE_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Laudo {
  id: number;
  numeroChamado: string;
  tecnico: string;
  equipamento: string;
  modelo: string;
  loja: string;
  setor: string;
  tombo: string;
  data: string;
  createdAt: string;
}

function LaudosCometaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMineOnly = searchParams.get("view") === "meus";
  
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filtros
  const [tecnicoFilter, setTecnicoFilter] = useState("");
  const [chamadoFilter, setChamadoFilter] = useState("");
  const [tomboFilter, setTomboFilter] = useState("");

  const fetchLaudos = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams();
      if (tecnicoFilter) params.append("tecnico", tecnicoFilter);
      if (chamadoFilter) params.append("numeroChamado", chamadoFilter);
      if (tomboFilter) params.append("tombo", tomboFilter);
      if (isMineOnly) params.append("mine", "true");

      const res = await fetch(`${API_BASE_URL}/info-laudos?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLaudos(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar laudos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tecnicoFilter, chamadoFilter, tomboFilter, isMineOnly]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }
    
    fetch(`${API_BASE_URL}/auth/me`, {
       headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setIsAdmin(data?.user?.isAdmin === true))
    .catch(() => setIsAdmin(false));

    fetchLaudos();
  }, [fetchLaudos, router]);

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={isMineOnly ? `Meus\nLaudos` : `Todos os\nLaudos`} icon={FileText} hideBack={!isAdmin} />

      {/* Lado Esquerdo (Fixo 35%) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push(isAdmin ? "/admin" : "/infoFormulario")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <History className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[42px] font-black leading-[1.1] uppercase tracking-tight mb-8">
            {isMineOnly ? "Meus Laudos" : "Histórico Geral"}
          </h1>
          <p className="text-white/70 text-lg font-medium">
            {isMineOnly 
              ? "Veja todos os laudos técnicos emitidos por você no sistema." 
              : "Consulte o histórico completo de laudos realizados em toda a rede."}
          </p>
          
          <div className="mt-12 flex flex-col gap-3">
             <Button onClick={() => router.push("/infoFormulario")} className="h-14 bg-white text-[#003B99] rounded-xl uppercase font-bold tracking-widest hover:bg-white/90">Novo Laudo Técnico</Button>
             {!isMineOnly && <Button onClick={() => router.push("/laudos-cometa?view=meus")} variant="outline" className="h-14 border-white/20 text-white rounded-xl uppercase font-bold tracking-widest hover:bg-white/10">Ver Meus Laudos</Button>}
             {isMineOnly && <Button onClick={() => router.push("/laudos-cometa")} variant="outline" className="h-14 border-white/20 text-white rounded-xl uppercase font-bold tracking-widest hover:bg-white/10">Ver Todos Laudos</Button>}
          </div>
        </div>
      </div>

      {/* Lado Direito (Rolável 65%) */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[850px] w-full mx-auto pb-20">
          <div className="mb-12">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] font-black tracking-tighter uppercase whitespace-pre-line leading-none">
                   {isMineOnly ? "Meus Registros" : "Laudos Gerados"}
                </h2>
                <div className="flex gap-2">
                   <Button variant="outline" onClick={() => router.push("/infoFormulario")} className="h-12 lg:h-14 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest">Novo Laudo</Button>
                   <Button variant="outline" onClick={() => router.push(isMineOnly ? "/laudos-cometa" : "/laudos-cometa?view=meus")} className="h-12 lg:h-14 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest">{isMineOnly ? "Ver Todos" : "Ver Meus"}</Button>
                </div>
             </div>
             
             {/* Painel de Filtros */}
             <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 shadow-sm space-y-6 mb-10 border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   {!isMineOnly && (
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-gray-400">Técnico</Label>
                         <Input value={tecnicoFilter} onChange={e => setTecnicoFilter(e.target.value)} placeholder="Nome" className="h-12 bg-gray-50 border-none rounded-xl text-sm" />
                      </div>
                   )}
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Chamado</Label>
                      <Input value={chamadoFilter} onChange={e => setChamadoFilter(e.target.value)} placeholder="Número" className="h-12 bg-gray-50 border-none rounded-xl text-sm" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Tombo</Label>
                      <Input value={tomboFilter} onChange={e => setTomboFilter(e.target.value)} placeholder="Número" className="h-12 bg-gray-50 border-none rounded-xl text-sm" />
                   </div>
                   <div className="flex items-end">
                      <Button onClick={fetchLaudos} className="w-full h-12 bg-[#003B99] rounded-xl uppercase tracking-widest font-black gap-2 text-[11px]">
                        <Search className="w-4 h-4" /> Buscar
                      </Button>
                   </div>
                </div>
             </div>

             {/* Lista de Laudos */}
             {isLoading ? (
               <div className="flex flex-col items-center justify-center p-20 space-y-4">
                  <Loader2 className="w-10 h-10 text-[#003B99] animate-spin" />
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Carregando históricos...</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {laudos.length === 0 ? (
                    <div className="p-14 bg-white rounded-[24px] lg:rounded-[32px] text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
                       <FileText className="w-12 h-12 text-gray-100 mb-4" />
                       <p className="text-gray-400 font-bold uppercase text-[11px] tracking-wider">Nenhum laudo encontrado.</p>
                    </div>
                  ) : (
                    laudos.map((item) => (
                      <div key={item.id} className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 shadow-sm border border-transparent hover:border-gray-100 transition-all group">
                         <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-[#003B99]" />
                                  <p className="text-[#1A1A2E] text-[16px] lg:text-[18px] font-black uppercase leading-tight">Chamado: {item.numeroChamado}</p>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Técnico</span>
                                     <span className="text-[#6B7280] text-sm font-bold">{item.tecnico}</span>
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Equipamento</span>
                                     <span className="text-[#6B7280] text-sm font-bold truncate max-w-[200px]">{item.equipamento}</span>
                                  </div>
                                  <div className="flex flex-col pt-2">
                                     <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Loja / Setor</span>
                                     <span className="text-[#6B7280] text-sm font-bold">{item.loja} | {item.setor}</span>
                                  </div>
                                  <div className="flex flex-col pt-2">
                                     <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Tombo / Modelo</span>
                                     <span className="text-[#6B7280] text-sm font-bold">{item.tombo} ({item.modelo})</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-2 text-gray-400 font-black uppercase text-[9px] pt-2">
                                  <Calendar className="w-3 h-3" /> Data: {item.data}
                               </div>
                            </div>

                            <div className="flex flex-col justify-end gap-2 shrink-0">
                               <Button className="h-10 px-8 bg-[#003B99] hover:bg-[#0A2D66] rounded-xl uppercase tracking-wider text-[10px] font-black gap-2 shadow-lg shadow-[#003B99]/10">
                                  <Printer className="w-3.5 h-3.5" /> Imprimir
                               </Button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LaudosCometaPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-[#F3F6F9]">
         <Loader2 className="w-10 h-10 text-[#003B99] animate-spin" />
      </div>
    }>
      <LaudosCometaContent />
    </Suspense>
  );
}
