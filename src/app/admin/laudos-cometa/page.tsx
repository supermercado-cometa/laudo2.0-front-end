"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { FileText, Search, Loader2, Printer, Calendar, History } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout } from "@/components/admin-page-layout";

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
    fetchLaudos();
  }, [fetchLaudos, router]);

  return (
    <AdminPageLayout
      title={isMineOnly ? `Meus\nLaudos` : `Histórico\nDe Laudos`}
      subtitle={isMineOnly 
        ? "Consulte todos os laudos técnicos emitidos por você no sistema." 
        : "Visualize e filtre o histórico completo de laudos realizados na rede."}
      icon={isMineOnly ? FileText : History}
      backUrl="/admin"
    >
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] font-black tracking-tighter uppercase whitespace-pre-line leading-none">
            {isMineOnly ? "Meus Registros" : "Laudos Gerados"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/laudo-tecnico")} className="h-12 lg:h-14 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest border-[#003B99] text-[#003B99] hover:bg-[#003B99]/5">Novo Laudo</Button>
            <Button variant="outline" onClick={() => router.push(isMineOnly ? "/admin/laudos-cometa" : "/admin/laudos-cometa?view=meus")} className="h-12 lg:h-14 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest bg-[#003B99] text-white hover:bg-[#0A2D66] border-none shadow-lg">
              {isMineOnly ? "Ver Todos" : "Ver Meus"}
            </Button>
          </div>
        </div>

        {/* Painel de Filtros Premium */}
        <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 shadow-sm space-y-6 mb-12 border border-blue-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isMineOnly && (
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Técnico</Label>
                <Input value={tecnicoFilter} onChange={e => setTecnicoFilter(e.target.value)} placeholder="Nome do técnico" className="h-14 bg-gray-50 border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#003B99]/10" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Chamado</Label>
              <Input value={chamadoFilter} onChange={e => setChamadoFilter(e.target.value)} placeholder="Nº do Chamado" className="h-14 bg-gray-50 border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#003B99]/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Tombo</Label>
              <Input value={tomboFilter} onChange={e => setTomboFilter(e.target.value)} placeholder="Nº de Tombo" className="h-14 bg-gray-50 border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#003B99]/10" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={fetchLaudos} className="h-14 px-10 bg-[#003B99] rounded-xl uppercase tracking-widest font-black gap-2 text-[12px] shadow-lg hover:bg-[#0A2D66]">
              <Search className="w-4 h-4" /> Atualizar Busca
            </Button>
          </div>
        </div>

        {/* Lista de Laudos */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando laudos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {laudos.length === 0 ? (
              <div className="p-20 bg-white rounded-[24px] lg:rounded-[32px] text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
                <FileText className="w-16 h-16 text-gray-100 mb-6" />
                <p className="text-gray-400 font-bold uppercase text-[12px] tracking-widest">Nenhum registro encontrado.</p>
              </div>
            ) : (
              laudos.map((item) => (
                <div key={item.id} className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 shadow-sm border border-transparent hover:border-blue-100 transition-all group relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-[#FECC00] shadow-[0_0_10px_rgba(254,204,0,0.5)]" />
                        <p className="text-[#1A1A2E] text-[18px] lg:text-[20px] font-black uppercase leading-tight tracking-tighter">Chamado: {item.numeroChamado}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Especialista</span>
                          <span className="text-[#1A1A2E] text-[15px] font-bold">{item.tecnico}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Equipamento</span>
                          <span className="text-[#1A1A2E] text-[15px] font-bold truncate">{item.equipamento}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Loja / Setor</span>
                          <span className="text-[#6B7280] text-[14px] font-semibold">{item.loja} | {item.setor}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Identificação</span>
                          <span className="text-[#6B7280] text-[14px] font-semibold">{item.tombo} ({item.modelo})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] pt-4 border-t border-gray-50">
                        <Calendar className="w-3.5 h-3.5 text-[#003B99]" /> Emitido em: {item.data}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-end gap-3 shrink-0">
                      <Button className="h-12 px-8 bg-[#003B99] hover:bg-[#0A2D66] rounded-xl uppercase tracking-wider text-[11px] font-black gap-2 shadow-xl shadow-[#003B99]/10 active:scale-95 transition-all">
                        <Printer className="w-4 h-4" /> Imprimir PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}

export default function LaudosCometaPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-[#F3F6F9]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Iniciando Histórico...</p>
        </div>
      </div>
    }>
      <LaudosCometaContent />
    </Suspense>
  );
}
