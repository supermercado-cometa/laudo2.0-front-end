"use client";

import React, { useState, useEffect } from "react";
import { FileText, Search, ChevronLeft, Loader2, Printer, Calendar, Trash2, CheckCircle2, Circle, XCircle, Download } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function LaudosGeradosPage() {
  const router = useRouter();
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filtros
  const [tecnicoFilter, setTecnicoFilter] = useState("");
  const [chamadoFilter, setChamadoFilter] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tomboFilter, setTomboFilter] = useState("");

  const fetchLaudos = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams();
      if (tecnicoFilter) params.append("tecnico", tecnicoFilter);
      if (chamadoFilter) params.append("numeroChamado", chamadoFilter);
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      if (tomboFilter) params.append("tombo", tomboFilter);

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
  };

  useEffect(() => {
    fetchLaudos();
  }, []);

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(laudos.map(l => l.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleDeleteLaudo = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este laudo?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/info-laudos/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        fetchLaudos();
        setSelectedIds(prev => prev.filter(i => i !== id));
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} laudos selecionados?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      // Como a API não tem delete bulk por enquanto, vamos fazer um por um
      const deletePromises = selectedIds.map(id => 
        fetch(`${API_BASE_URL}/info-laudos/${id}`, {
          method: "DELETE",
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        })
      );
      await Promise.all(deletePromises);
      fetchLaudos();
      setSelectedIds([]);
    } catch (error) {
      console.error("Erro ao excluir massa:", error);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Laudos\nGerados`} icon={FileText} type="checklists" />

      {/* Lado Esquerdo (Fixo 35%) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <FileText className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] lg:font-medium font-[800] leading-[1.1] uppercase tracking-tight mb-8">
            Histórico de Laudos
          </h1>
          <p className="text-white/70 text-lg font-medium">Consulte, filtre e exporte todos os laudos técnicos emitidos pela equipe.</p>
        </div>
      </div>

      {/* Lado Direito (Rolável 65%) */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto pb-20">
          <div className="mb-12">
             <h2 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800] tracking-tighter mb-8 uppercase">Laudos Gerados</h2>
             
             {/* Painel de Filtros */}
             <div className="bg-white rounded-[32px] p-8 shadow-sm space-y-8 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-400">Técnico</Label>
                      <Input value={tecnicoFilter} onChange={e => setTecnicoFilter(e.target.value)} placeholder="Nome do técnico" className="h-14 bg-gray-50 border-none rounded-xl" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-400">Chamado</Label>
                      <Input value={chamadoFilter} onChange={e => setChamadoFilter(e.target.value)} placeholder="Número do chamado" className="h-14 bg-gray-50 border-none rounded-xl" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-400">Tombo</Label>
                      <Input value={tomboFilter} onChange={e => setTomboFilter(e.target.value)} placeholder="Número do tombo" className="h-14 bg-gray-50 border-none rounded-xl" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-400">Data Inicial</Label>
                      <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-14 bg-gray-50 border-none rounded-xl" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-400">Data Final</Label>
                      <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-14 bg-gray-50 border-none rounded-xl" />
                   </div>
                   <div className="flex items-end">
                      <Button onClick={fetchLaudos} className="w-full h-14 bg-[#003B99] rounded-xl uppercase tracking-widest lg:font-medium font-black gap-2">
                        <Search className="w-5 h-5" /> Pesquisar
                      </Button>
                   </div>
                </div>

                {/* Ações em Massa */}
                <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100">
                   <Button variant="outline" onClick={handleSelectAll} className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest">Marcar todos</Button>
                   <Button variant="outline" onClick={handleDeselectAll} className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest">Desmarcar</Button>
                   <Button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} variant="destructive" className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest gap-2">
                      <Trash2 className="w-4 h-4" /> Excluir selecionados ({selectedIds.length})
                   </Button>
                </div>
             </div>

             {/* Lista de Laudos */}
             {isLoading ? (
               <div className="flex flex-col items-center justify-center p-20 space-y-4">
                  <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
                  <p className="text-gray-400 font-medium uppercase text-xs tracking-widest">Carregando históricos...</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-6">
                  {laudos.length === 0 ? (
                    <div className="p-20 bg-white rounded-[32px] text-center border-2 border-dashed border-gray-200">
                       <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                       <p className="text-gray-400 font-medium">Nenhum laudo encontrado com estes filtros.</p>
                    </div>
                  ) : (
                    laudos.map((item) => (
                      <div key={item.id} onClick={() => handleToggleSelect(item.id)} className={`relative bg-white rounded-[32px] p-8 shadow-sm border-2 transition-all cursor-pointer group ${selectedIds.includes(item.id) ? 'border-[#003B99]' : 'border-transparent hover:border-gray-200'}`}>
                         {/* Checkmark Indicador */}
                         <div className="absolute top-8 right-8">
                            {selectedIds.includes(item.id) ? (
                              <CheckCircle2 className="w-8 h-8 text-[#003B99]" />
                            ) : (
                              <Circle className="w-8 h-8 text-gray-100 group-hover:text-gray-200" />
                            )}
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div className="space-y-4">
                               <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#003B99]" />
                                  <p className="text-[#1A1A2E] text-[18px] lg:font-medium font-black uppercase">Chamado: {item.numeroChamado}</p>
                               </div>
                               <p className="text-gray-500 font-medium uppercase text-xs tracking-widest">Técnico: <span className="text-[#1A1A2E]">{item.tecnico}</span></p>
                               <p className="text-gray-500 font-medium uppercase text-xs tracking-widest">Equipamento: <span className="text-[#1A1A2E]">{item.equipamento} {item.modelo !== "Sem Modelo" && `- ${item.modelo}`}</span></p>
                            </div>

                            <div className="space-y-4">
                               <p className="text-gray-500 font-medium uppercase text-xs tracking-widest">Loja: <span className="text-[#1A1A2E]">{item.loja}</span> | Setor: <span className="text-[#1A1A2E]">{item.setor}</span></p>
                               <p className="text-gray-500 font-medium uppercase text-xs tracking-widest">Tombo: <span className="text-[#1A1A2E]">{item.tombo}</span></p>
                               <div className="flex items-center gap-2 text-gray-400 font-medium uppercase text-[10px] tracking-tighter">
                                  <Calendar className="w-3.5 h-3.5" /> Data: {item.data}
                               </div>
                            </div>
                         </div>

                         {/* AÇÕES INDIVIDUAIS */}
                         <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-50">
                            <Button className="flex-1 h-14 bg-[#003B99] hover:bg-[#0A2D66] rounded-xl uppercase tracking-widest text-[11px] font-black gap-2 shadow-lg shadow-[#003B99]/20">
                               <Printer className="w-4 h-4" /> Imprimir
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={(e) => { e.stopPropagation(); handleDeleteLaudo(item.id); }}
                              className="w-14 h-14 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                               <Trash2 className="w-6 h-6" />
                            </Button>
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
