"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, Search, ChevronLeft, Loader2, Printer, Calendar, 
  Trash2, CheckCircle2, Circle, X, Info, User, Monitor, 
  MapPin, ClipboardCheck, AlertTriangle, PenTool, Hash, 
  Image as ImageIcon 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";
import { API_BASE_URL } from "@/lib/api-config";
import { gerarLaudoPDF } from "@/lib/pdf-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

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
  testesRealizados?: string;
  diagnostico?: string;
  estadoEquipamento?: string;
  necessidade?: string;
  signature?: string;
  photos?: string;
}

export default function LaudosGeradosPage() {
  const router = useRouter();
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingLaudo, setViewingLaudo] = useState<Laudo | null>(null);
  
  // Filtros
  const [tecnicoFilter, setTecnicoFilter] = useState("");
  const [chamadoFilter, setChamadoFilter] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tomboFilter, setTomboFilter] = useState("");

  const fetchLaudos = useCallback(async () => {
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
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        cache: "no-store"
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
  }, [tecnicoFilter, chamadoFilter, dataInicio, dataFim, tomboFilter]);

  useEffect(() => {
    fetchLaudos();
  }, [fetchLaudos]);

  const handleToggleSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
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
        if (viewingLaudo?.id === id) setViewingLaudo(null);
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
      const deletePromises = selectedIds.map(id => 
        fetch(`${API_BASE_URL}/info-laudos/${id}`, {
          method: "DELETE",
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        })
      );
      await Promise.all(deletePromises);
      fetchLaudos();
      setSelectedIds([]);
      setViewingLaudo(null);
    } catch (error) {
      console.error("Erro ao excluir massa:", error);
    }
  };

  const handleImprimir = async (e: React.MouseEvent, laudo: Laudo) => {
    e.stopPropagation();
    const nome = localStorage.getItem("fullName") || "Usuário não identificado";
    await gerarLaudoPDF(laudo, nome);
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9] font-['Roboto'] relative">
      <SubPageHeader title={`Laudos\nGerados`} icon={FileText} />

      {/* Lado Esquerdo (Fixo 35%) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <FileText className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] leading-[1.1] uppercase tracking-tight mb-8">
            Histórico de Laudos
          </h1>
          <p className="text-white/70 text-lg">Consulte, filtre e exporte todos os laudos técnicos emitidos pela equipe.</p>
        </div>
      </div>

      {/* Lado Direito (Rolável 65%) */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto pb-20">
          <div className="mb-12">
             <h2 className="text-[#1A1A2E] text-[32px] tracking-tighter mb-8 uppercase">Laudos Gerados</h2>
             
             {/* Painel de Filtros */}
             <div className="bg-white rounded-[32px] p-8 shadow-sm space-y-8 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Técnico</Label>
                      <Input value={tecnicoFilter} onChange={e => setTecnicoFilter(e.target.value)} placeholder="Nome do técnico" className="h-14 bg-gray-50 border-none rounded-xl shadow-none" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Chamado</Label>
                      <Input value={chamadoFilter} onChange={e => setChamadoFilter(e.target.value)} placeholder="Número do chamado" className="h-14 bg-gray-50 border-none rounded-xl shadow-none" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Tombo</Label>
                      <Input value={tomboFilter} onChange={e => setTomboFilter(e.target.value)} placeholder="Número do tombo" className="h-14 bg-gray-50 border-none rounded-xl shadow-none" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Data Inicial</Label>
                      <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-14 bg-gray-50 border-none rounded-xl shadow-none" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Data Final</Label>
                      <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-14 bg-gray-50 border-none rounded-xl shadow-none" />
                   </div>
                   <div className="flex items-end">
                      <Button onClick={fetchLaudos} className="w-full h-14 bg-[#003B99] rounded-xl uppercase tracking-widest gap-2 shadow-lg shadow-[#003B99]/20 hover:bg-[#0A2D66]">
                        <Search className="w-5 h-5" /> Pesquisar
                      </Button>
                   </div>
                </div>

                {/* Ações em Massa */}
                <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100">
                   <Button variant="outline" onClick={handleSelectAll} className="h-12 rounded-xl text-xs uppercase tracking-widest border-gray-100 hover:bg-gray-50">Marcar todos</Button>
                   <Button variant="outline" onClick={handleDeselectAll} className="h-12 rounded-xl text-xs uppercase tracking-widest border-gray-100 hover:bg-gray-50">Desmarcar</Button>
                   <Button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} variant="destructive" className="h-12 rounded-xl text-xs uppercase tracking-widest gap-2 shadow-lg shadow-red-500/10">
                      <Trash2 className="w-4 h-4" /> Excluir selecionados ({selectedIds.length})
                   </Button>
                </div>
             </div>

             {/* Lista de Laudos */}
             {isLoading ? (
               <div className="flex flex-col items-center justify-center p-20 space-y-4">
                  <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
                  <p className="text-gray-400 uppercase text-xs tracking-widest">Carregando históricos...</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-6">
                  {laudos.length === 0 ? (
                    <div className="p-20 bg-white rounded-[32px] text-center border-2 border-dashed border-gray-200">
                       <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                       <p className="text-gray-400 uppercase text-xs tracking-widest italic font-normal">Nenhum laudo encontrado com estes filtros.</p>
                    </div>
                  ) : (
                    laudos.map((item) => (
                      <div key={item.id} onClick={() => setViewingLaudo(item)} className={`relative bg-white rounded-[32px] p-8 shadow-sm border-2 transition-all cursor-pointer group ${selectedIds.includes(item.id) ? 'border-[#003B99]' : 'border-transparent hover:border-gray-200 shadow-xl shadow-black/5'}`}>
                         {/* Ícone Indicador para Seleção */}
                         <div className="absolute top-8 right-8" onClick={(e) => handleToggleSelect(e, item.id)}>
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
                                  <p className="text-[#1A1A2E] text-[18px] uppercase tracking-tight font-bold">Chamado: {item.numeroChamado || "Não informado"}</p>
                               </div>
                               <p className="text-gray-500 uppercase text-[10px] tracking-widest">Técnico: <span className="text-[#1A1A2E] font-medium">{item.tecnico}</span></p>
                               <p className="text-gray-500 uppercase text-[10px] tracking-widest">Equipamento: <span className="text-[#1A1A2E] font-medium">{item.equipamento} {item.modelo !== "Sem Modelo" && `- ${item.modelo}`}</span></p>
                            </div>

                            <div className="space-y-4">
                               <p className="text-gray-500 uppercase text-[10px] tracking-widest">Loja: <span className="text-[#1A1A2E] font-medium">{item.loja}</span> | Setor: <span className="text-[#1A1A2E] font-medium">{item.setor}</span></p>
                               <p className="text-gray-500 uppercase text-[10px] tracking-widest">Tombo: <span className="text-[#1A1A2E] font-medium">{item.tombo}</span></p>
                               <div className="flex items-center gap-2 text-gray-400 uppercase text-[10px] tracking-widest">
                                  <Calendar className="w-3.5 h-3.5" /> {item.data}
                               </div>
                            </div>
                         </div>

                         {/* AÇÕES INDIVIDUAIS */}
                         <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                            <div className="mr-auto text-[10px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Info className="w-3.5 h-3.5" /> Clique para ver detalhes
                            </div>
                            <Button 
                               onClick={(e) => handleImprimir(e, item)} 
                               className="h-10 px-6 bg-[#003B99] hover:bg-[#0A2D66] rounded-lg uppercase tracking-wider text-[11px] gap-2 shadow-md shadow-[#003B99]/10"
                            >
                               <Printer className="w-3.5 h-3.5" /> Imprimir
                            </Button>
                            <Button 
                               variant="ghost" 
                               onClick={(e) => { e.stopPropagation(); handleDeleteLaudo(item.id); } }
                               className="w-10 h-10 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all p-0"
                            >
                               <Trash2 className="w-5 h-5" />
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

      {/* PAINEL DE DETALHES (SHEET CUSTOM) */}
      <AnimatePresence>
        {viewingLaudo && (
          <>
            {/* Background Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setViewingLaudo(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            {/* Panel Content */}
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[600px] bg-white z-50 shadow-2xl flex flex-col p-8 lg:p-12 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#003B99]/5 rounded-xl flex items-center justify-center">
                    <FileText className="text-[#003B99] w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[#1A1A2E] text-[24px] uppercase tracking-tighter font-black">Detalhes do Laudo</h3>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mt-1">ID: #{viewingLaudo.id} · {viewingLaudo.data}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingLaudo(null)} 
                  className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-12">
                {/* SETOR GERAL */}
                <div className="space-y-6">
                  <div className="border-l-4 border-[#003B99] pl-4">
                    <h4 className="text-[14px] uppercase text-[#1A1A2E] font-black tracking-widest">Informações Gerais</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-3xl">
                    <DetailItem icon={Hash} label="Chamado" value={viewingLaudo.numeroChamado || "Não informado"} />
                    <DetailItem icon={User} label="Técnico" value={viewingLaudo.tecnico} />
                    <DetailItem icon={Monitor} label="Equipamento" value={`${viewingLaudo.equipamento} ${viewingLaudo.modelo !== "Sem Modelo" ? `- ${viewingLaudo.modelo}` : ""}`} />
                    <DetailItem icon={MapPin} label="Loja / Setor" value={`${viewingLaudo.loja} · ${viewingLaudo.setor}`} />
                    <DetailItem icon={ClipboardCheck} label="Tombo" value={viewingLaudo.tombo} />
                  </div>
                </div>

                {/* DIAGNÓSTICO */}
                <div className="space-y-6">
                  <div className="border-l-4 border-[#003B99] pl-4">
                    <h4 className="text-[14px] uppercase text-[#1A1A2E] font-black tracking-widest">Diagnóstico Técnico</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                       <p className="text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">Testes Realizados</p>
                       <p className="text-[#1A1A2E] text-sm leading-relaxed">{viewingLaudo.testesRealizados || "Nenhum teste registrado."}</p>
                    </div>
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                       <p className="text-[10px] uppercase font-black text-gray-400 mb-3 tracking-widest">Diagnóstico Final</p>
                       <p className="text-[#1A1A2E] text-sm leading-relaxed">{viewingLaudo.diagnostico || "Nenhum diagnóstico registrado."}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-6 bg-gray-50 rounded-3xl">
                         <p className="text-[10px] uppercase font-black text-gray-400 mb-2 tracking-widest">Estado</p>
                         <p className="text-[#1A1A2E] font-black uppercase text-xs">{viewingLaudo.estadoEquipamento || "-"}</p>
                      </div>
                      <div className="p-6 bg-[#FECC00]/5 rounded-3xl border border-[#FECC00]/20">
                         <p className="text-[10px] uppercase font-black text-[#856C00] mb-2 tracking-widest">Ação</p>
                         <p className="text-[#1A1A2E] font-black uppercase text-xs">{viewingLaudo.necessidade || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GALERIA DE FOTOS */}
                {viewingLaudo.photos && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-[#003B99] pl-4">
                      <h4 className="text-[14px] uppercase text-[#1A1A2E] font-black tracking-widest">Evidências Fotográficas</h4>
                    </div>
                    <PhotoGallery jsonPhotos={viewingLaudo.photos} />
                  </div>
                )}

                {/* ASSINATURA */}
                {viewingLaudo.signature && (
                  <div className="space-y-6">
                    <div className="border-l-4 border-[#003B99] pl-4">
                      <h4 className="text-[14px] uppercase text-[#1A1A2E] font-black tracking-widest">Validação Técnico</h4>
                    </div>
                    <div className="flex flex-col items-center bg-gray-50 p-10 rounded-3xl border border-dashed border-gray-200">
                      <img src={viewingLaudo.signature} alt="Assinatura" className="max-h-24 mix-blend-multiply" />
                      <div className="mt-4 w-32 h-[1px] bg-gray-300" />
                      <p className="text-[10px] uppercase font-black text-gray-400 mt-2 tracking-widest">{viewingLaudo.tecnico}</p>
                    </div>
                  </div>
                )}

                <div className="pt-10 pb-20">
                   <Button onClick={(e) => handleImprimir(e, viewingLaudo)} className="w-full h-16 bg-[#003B99] rounded-2xl text-[14px] font-black uppercase tracking-widest gap-3">
                      <Printer className="w-5 h-5" /> Exportar PDF Completo
                   </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mt-0.5 shadow-sm border border-gray-100 flex-shrink-0">
        <Icon className="w-4 h-4 text-[#003B99]" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-[#1A1A2E] text-sm font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function PhotoGallery({ jsonPhotos }: { jsonPhotos: string }) {
  let photos: string[] = [];
  try {
    const parsed = JSON.parse(jsonPhotos);
    if (Array.isArray(parsed)) photos = parsed;
    else if (typeof parsed === 'string') photos = [parsed];
  } catch {
    photos = [jsonPhotos];
  }

  if (photos.length === 0) return <p className="text-gray-400 text-xs uppercase">Nenhuma foto anexada.</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {photos.map((p, i) => (
        <motion.div 
          key={i} 
          whileHover={{ scale: 1.05 }}
          className="aspect-square relative rounded-2xl overflow-hidden border border-gray-100 bg-white"
        >
          <img src={p} alt={`Evidência ${i+1}`} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 opacity-0 hover:opacity-100 transition-opacity">
            <p className="text-[8px] text-white uppercase text-center font-bold">Foto {i+1}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
