"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  ClipboardCheck, 
  Image as ImageIcon, 
  Trash2, 
  Loader2,
  AlertCircle,
  Link,
  PlusCircle,
  X
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { API_BASE_URL } from "@/lib/api-config";
import { gerarLaudoPDF } from "@/lib/pdf-template";

export default function InfoFormularioPage() {
  const router = useRouter();
  const [numeroChamado, setNumeroChamado] = useState("");
  const [nomeTecnico, setNomeTecnico] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [loja, setLoja] = useState("");
  const [tombo, setTombo] = useState("");
  const [modelo, setModelo] = useState("");
  const [setor, setSetor] = useState("");
  const [testesRealizados, setTestesRealizados] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [estadoEquipamento, setEstadoEquipamento] = useState("");
  const [necessidade, setNecessidade] = useState("");
  const [imagens, setImagens] = useState<{file: File, preview: string}[]>([]);
  
  const [lojas, setLojas] = useState<LojaType[]>([]);
  const [equipamentos, setEquipamentos] = useState<{ id: number, nome: string }[]>([]);
  const [setores, setSetores] = useState<{ id: number, nome: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  // --- ESTADOS DE INTEGRAÇÃO GLPI (SUBCHAMADOS) ---
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  
  const [glpiCategories, setGlpiCategories] = useState<any[]>([]);
  const [glpiLocations, setGlpiLocations] = useState<any[]>([]);
  const [glpiGroups, setGlpiGroups] = useState<any[]>([]);
  
  // Seleções para novo chamado
  const [selCat, setSelCat] = useState("");
  const [selLoc, setSelLoc] = useState("");
  const [selGroup, setSelGroup] = useState("");
  const [newTicketTitle, setNewTicketTitle] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.user?.signature) setSavedSignature(data.user.signature);
      }).catch(() => {});

    const fetchData = async (endpoint: string, setter: (data: any[]) => void) => {
      try {
        const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setter(await res.json());
      } catch (err) {}
    };

    fetchData("lojas", setLojas);
    fetchData("equipamentos", setEquipamentos);
    fetchData("setores", setSetores);

    const storedName = localStorage.getItem("fullName");
    if (storedName) setNomeTecnico(storedName);
  }, [router]);

  useEffect(() => {
    if (ticketDetails && !newTicketTitle) {
      setNewTicketTitle(`Laudo Técnico - ${ticketDetails.name}`);
    }
  }, [ticketDetails, newTicketTitle]);

  const handleStartGlpiFlow = async () => {
    if (!numeroChamado) {
      handleFinalSubmitLocal();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/glpi/search-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ numeroChamado })
      });

      if (!res.ok) {
        if (res.status === 404) {
          if (confirm("Chamado não encontrado no GLPI. Deseja enviar o laudo apenas localmente?")) {
            handleFinalSubmitLocal();
          }
        } else {
          throw new Error("Erro ao buscar chamado");
        }
        return;
      }

      const data = await res.json();
      setTicketDetails(data);
      setIsDecisionModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNewTicketModal = async () => {
    setIsDecisionModalOpen(false);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const [cats, locs, groups] = await Promise.all([
        fetch(`${API_BASE_URL}/glpi/lookup/categories-db`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE_URL}/glpi/lookup/locations-db`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE_URL}/glpi/lookup/groups-db`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      setGlpiCategories(cats);
      setGlpiLocations(locs);
      setGlpiGroups(groups);
      setIsNewTicketModalOpen(true);
    } catch (err) {
      alert("Erro ao carregar dados do GLPI para o novo chamado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmitLocal = async () => {
    // Sobe apenas localmente como já configurado no backend (que tenta followup automático se houver numeroChamado)
    await executeSubmission({});
  };

  const handleRelateExisting = async () => {
    setIsDecisionModalOpen(false);
    await executeSubmission({
      glpiAction: "relacionar",
      relacao: {
        titulo: ticketDetails.name,
        localizacao: ticketDetails.location_name,
        tecnicoAtribuido: ticketDetails.tecnico_atribuido || nomeTecnico,
        grupo: ticketDetails.group_name,
        categoria: ticketDetails.category_name,
        requerente: ticketDetails.requerente_name
      }
    });
  };

  const handleCreateNewLinked = async () => {
    if (!selCat) { alert("Selecione uma categoria"); return; }
    setIsNewTicketModalOpen(false);
    await executeSubmission({
      glpiAction: "novo-relacionado",
      relacao: {
        titulo: newTicketTitle,
        categoriaId: Number(selCat),
        localizacaoId: selLoc ? Number(selLoc) : null,
        grupoId: selGroup ? Number(selGroup) : null
      }
    });
  };

  const executeSubmission = async (extra: { glpiAction?: string, relacao?: any }) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      
      let signature = savedSignature;
      if (isRedrawing || !savedSignature) {
        const canvasSig = sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL() || null;
        if (canvasSig) {
          signature = canvasSig;
          await fetch(`${API_BASE_URL}/auth/save-signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ signature: canvasSig })
          });
          setSavedSignature(canvasSig);
          setIsRedrawing(false);
        }
      }

      const photosArray = await Promise.all(imagens.map(img => fileToBase64(img.file)));

      const infoLaudo = {
        equipamento, modelo, tombo, setor, loja, testesRealizados, diagnostico,
        estadoEquipamento: estadoEquipamento === "Funcionando" ? "FUNCIONANDO" : "NAO_FUNCIONANDO",
        necessidade: necessidade === "Ser substituído" ? "SUBSTITUIDO" : 
                    necessidade === "Enviado p/ conserto" ? "ENVIAR_CONSERTO" : 
                    necessidade === "Ser descartado" ? "DESCARTADO" : necessidade,
      };

      // 1. Salva no Banco Local
      const localRes = await fetch(`${API_BASE_URL}/info-laudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...infoLaudo, numeroChamado, nomeTecnico, signature, photos: JSON.stringify(photosArray) })
      });

      if (!localRes.ok) throw new Error("Erro ao salvar laudo localmente");

      // 2. Ações GLPI (Opcionais se clicou em botões de relação)
      if (extra.glpiAction === "relacionar") {
        await fetch(`${API_BASE_URL}/glpi/relacionar`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ numeroChamado, glpiPassword: "", laudo: infoLaudo, relacao: extra.relacao })
        });
      } else if (extra.glpiAction === "novo-relacionado") {
        const resNew = await fetch(`${API_BASE_URL}/glpi/ticket/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ glpiPassword: "", laudo: infoLaudo, relacao: extra.relacao })
        });
        const dataNew = await resNew.json();
        if (dataNew.ticketId) {
          // Linka o novo chamado ao original
          await fetch(`${API_BASE_URL}/glpi/ticket/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ glpiPassword: "", tickets_id_1: Number(numeroChamado), tickets_id_2: dataNew.ticketId, link: 1 })
          });
        }
      }

      setShowSuccess(true);
      gerarLaudoPDF({ ...infoLaudo, numeroChamado, nomeTecnico, signature, photos: JSON.stringify(photosArray) } as any, nomeTecnico);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const resetFormulario = () => {
    setNumeroChamado(""); setEquipamento(""); setLoja(""); setTombo("");
    setModelo(""); setSetor(""); setTestesRealizados(""); setDiagnostico("");
    setEstadoEquipamento(""); setNecessidade(""); setImagens([]);
    sigPadRef.current?.clear(); 
    setShowSuccess(false);
    setIsRedrawing(false);
    setTicketDetails(null);
  };

  return (
    <AdminPageLayout
      title={`Laudo\nTécnico`}
      subtitle="O laudo oficial integrado ao GLPI com suporte a subchamados e automação."
      icon={ClipboardCheck}
      backUrl="/admin"
    >
      <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-12 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] tracking-tighter uppercase leading-none">
            Informações do Ativo
          </h2>
        </div>
        
        <div className="space-y-12">
          {/* Seção 1: Dados Gerais */}
          <div className="space-y-8">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Identificação</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número do Chamado (Pai)</Label>
                <div className="relative">
                   <Input value={numeroChamado} onChange={e => setNumeroChamado(e.target.value)} placeholder="Ex: 154230" className="h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] transition-all text-[#1A1A2E] font-bold" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Técnico Responsável</Label>
                <Input value={nomeTecnico} disabled className="h-12 rounded-xl bg-gray-100 border-none text-gray-400 cursor-not-allowed" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Equipamento</Label>
                <select value={equipamento} onChange={e => setEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione...</option>
                  {equipamentos.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Loja</Label>
                <select value={loja} onChange={e => setLoja(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione...</option>
                  {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Patrimônio / Tombo</Label>
                <Input value={tombo} onChange={e => setTombo(e.target.value)} placeholder="Ex: 99999" className="h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB]" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Setor</Label>
                <select value={setor} onChange={e => setSetor(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none">
                  <option value="">Selecione...</option>
                  {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-gray-100">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Evidências</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {imagens.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                  <img src={img.preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-[#003B99]/30 transition-all group">
                <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[#003B99]" />
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Adicionar</span>
                <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="space-y-8 pt-10 border-t border-gray-100">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Testes Realizados</Label>
              <textarea value={testesRealizados} onChange={e => setTestesRealizados(e.target.value)} className="w-full min-h-[120px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:bg-white transition-all shadow-inner" placeholder="O que foi testado?" />
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Conclusão / Diagnóstico</Label>
              <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="w-full min-h-[120px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:bg-white transition-all shadow-inner" placeholder="Qual o problema detectado?" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Estado do Ativo</Label>
              <select value={estadoEquipamento} onChange={e => setEstadoEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6">
                <option value="">Selecione...</option>
                <option value="Funcionando">Funcionando</option>
                <option value="Não funcionando">Não funcionando</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Sugestão Técnica</Label>
              <select value={necessidade} onChange={e => setNecessidade(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6">
                <option value="">Selecione...</option>
                <option value="Ser substituído">Ser substituído</option>
                <option value="Enviado p/ conserto">Enviado p/ conserto</option>
                <option value="Ser descartado">Ser descartado</option>
              </select>
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100">
            <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider block mb-4 underline">Assinatura</Label>
            {savedSignature && !isRedrawing ? (
              <div className="flex flex-col items-center">
                <img src={savedSignature} alt="Assinatura" className="max-h-32 border border-dashed rounded-xl p-4 bg-white" />
                <Button variant="ghost" size="sm" onClick={() => setIsRedrawing(true)} className="mt-2 text-blue-600">Refazer</Button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-[32px] p-2 border-2 border-dashed border-gray-200">
                <SignatureCanvas ref={sigPadRef} canvasProps={{ className: "w-full h-48 cursor-crosshair" }} />
                <button onClick={() => sigPadRef.current?.clear()} className="mt-2 text-[10px] uppercase text-red-500 font-black px-4">Limpar</button>
              </div>
            )}
          </div>

          <div className="pt-8">
            <Button 
              disabled={isSubmitting} 
              className="w-full h-16 bg-[#003B99] text-white rounded-[20px] text-[14px] font-bold tracking-widest uppercase shadow-xl hover:bg-[#0E3D8A] active:scale-95 transition-all flex items-center justify-center gap-3" 
              onClick={handleStartGlpiFlow}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Finalizar e Vincular GLPI"}
            </Button>
          </div>
        </div>
      </div>

      {/* --- MODAIS DE DECISÃO --- */}
      <AnimatePresence>
        {isDecisionModalOpen && ticketDetails && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-black">
            <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative border-t-8 border-[#003B99]">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-blue-50 p-4 rounded-2xl text-[#003B99]">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <button onClick={() => setIsDecisionModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5"/></button>
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-[#1A1A2E] mb-2">Chamado Encontrado</h3>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8">
                 <p className="text-sm font-bold text-[#1A1A2E]">#{ticketDetails.id} - {ticketDetails.name}</p>
                 <p className="text-[10px] uppercase font-black text-gray-400 mt-2 tracking-widest">{ticketDetails.location_name} · {ticketDetails.category_name}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <button onClick={handleRelateExisting} className="w-full group p-6 rounded-[32px] border-2 border-gray-100 hover:border-[#003B99] hover:bg-[#003B99] transition-all flex items-center gap-6 shadow-sm">
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-white/20">
                      <Link className="group-hover:text-white" />
                   </div>
                   <div className="text-left">
                      <span className="block font-black uppercase text-[12px] group-hover:text-white">Acompanhamento</span>
                      <span className="text-[10px] text-gray-400 font-bold group-hover:text-white/70">Vincular laudo no chamado atual</span>
                   </div>
                </button>

                <button onClick={handleOpenNewTicketModal} className="w-full group p-6 rounded-[32px] border-2 border-gray-100 hover:border-[#003B99] hover:bg-[#003B99] transition-all flex items-center gap-6 shadow-sm">
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-white/20">
                      <PlusCircle className="group-hover:text-white" />
                   </div>
                   <div className="text-left">
                      <span className="block font-black uppercase text-[12px] group-hover:text-white">Subchamado Relacionado</span>
                      <span className="text-[10px] text-gray-400 font-bold group-hover:text-white/70">Criar novo chamado vinculado ao pai</span>
                   </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isNewTicketModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-black">
            <div className="bg-white rounded-[40px] p-10 max-w-xl w-full shadow-2xl relative border-b-8 border-[#FECC00]">
               <h3 className="text-3xl font-black uppercase tracking-tighter text-[#1A1A2E] mb-8">Classificar Subchamado</h3>
               
               <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Título do Subchamado</Label>
                    <Input value={newTicketTitle} onChange={e => setNewTicketTitle(e.target.value)} className="h-14 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold" />
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Categoria ITIL</Label>
                    <select value={selCat} onChange={e => setSelCat(e.target.value)} className="w-full h-14 bg-gray-50 border-none rounded-2xl px-6 text-sm font-bold appearance-none">
                       <option value="">Selecione a categoria...</option>
                       {glpiCategories.map(c => <option key={c.id} value={c.id}>{c.completename}</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Local</Label>
                        <select value={selLoc} onChange={e => setSelLoc(e.target.value)} className="w-full h-14 bg-gray-50 border-none rounded-2xl px-6 text-[10px] font-bold">
                           <option value="">Opcional...</option>
                           {glpiLocations.map(l => <option key={l.id} value={l.id}>{l.completename}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Atribuir Grupo</Label>
                        <select value={selGroup} onChange={e => setSelGroup(e.target.value)} className="w-full h-14 bg-gray-50 border-none rounded-2xl px-6 text-[10px] font-bold">
                           <option value="">Opcional...</option>
                           {glpiGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                 </div>

                 <div className="pt-6 flex flex-col gap-3">
                    <Button onClick={handleCreateNewLinked} className="h-16 bg-[#003B99] rounded-2xl font-black uppercase tracking-widest">Criar e Relacionar</Button>
                    <button onClick={() => setIsNewTicketModalOpen(false)} className="text-[10px] uppercase font-black text-gray-400 tracking-widest py-2">Voltar</button>
                 </div>
               </div>
            </div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/90 backdrop-blur-md p-6">
            <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl max-w-sm w-full border-b-8 border-green-500">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-500 w-16 h-16" />
              </div>
              <h2 className="text-4xl font-black text-[#1A1A2E] mb-3 uppercase tracking-tighter leading-none">Vínculo OK!</h2>
              <p className="text-[#6B7280] text-[11px] mb-10 font-bold uppercase tracking-widest">O laudo foi salvo e os tickets foram relacionados com sucesso no GLPI.</p>
              <Button className="w-full h-16 bg-[#003B99] rounded-2xl text-[15px] font-black tracking-widest uppercase shadow-lg shadow-[#003B99]/20" onClick={resetFormulario}>Novo Início</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageLayout>
  );
}
