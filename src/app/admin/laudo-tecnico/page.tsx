"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Search 
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { API_BASE_URL } from "@/lib/api-config";
import { gerarLaudoPDF } from "@/lib/pdf-template";

// Interface para busca de tickets
interface GlpiTicket {
  id: string;
  name: string;
  date: string;
  statusNome: string;
}

export default function InfoFormularioPage() {
  const router = useRouter();
  const [numeroChamado, setNumeroChamado] = useState("");
  const [nomeTecnico, setNomeTecnico] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [loja, setLoja] = useState("");
  const [tombo, setTombo] = useState("");
  const [modelo, setModelo] = useState("");
  const [setor, setSetor] = useState("");
  const [dataSistema, setDataSistema] = useState("");
  const [testesRealizados, setTestesRealizados] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [estadoEquipamento, setEstadoEquipamento] = useState("");
  const [necessidade, setNecessidade] = useState("");
  const [imagens, setImagens] = useState<{file: File, preview: string}[]>([]);
  
  const [lojas, setLojas] = useState<LojaType[]>([]);
  const [equipamentos, setEquipamentos] = useState<{ id: number, nome: string, tipo?: string }[]>([]);
  const [setores, setSetores] = useState<{ id: number, nome: string }[]>([]);
  const [modelos, setModelos] = useState<{ id: number, nome: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  // --- ESTADOS GLPI ---
  const [isGlpiModalOpen, setIsGlpiModalOpen] = useState(false);
  const [glpiUser, setGlpiUser] = useState("");
  const [glpiPass, setGlpiPass] = useState("");
  const [isGlpiAuthLoading, setIsGlpiAuthLoading] = useState(false);
  const [glpiTickets, setGlpiTickets] = useState<GlpiTicket[]>([]);
  const [isSearchingTickets, setIsSearchingTickets] = useState(false);
  const [isRelateDecisionOpen, setIsRelateDecisionOpen] = useState(false);

  useEffect(() => {
    setDataSistema(new Date().toLocaleString('pt-BR'));
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }

    // Buscar dados do usuário
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.user?.signature) setSavedSignature(data.user.signature);
      }).catch(() => {});

    // Buscar dados auxiliares
    const fetchData = async (endpoint: string, setter: (data: any[]) => void) => {
      try {
        const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setter(await res.json());
      } catch (err) {}
    };

    fetchData("lojas", setLojas);
    fetchData("modelos", setModelos);
    fetchData("equipamentos", setEquipamentos);
    fetchData("setores", setSetores);

    const storedName = localStorage.getItem("fullName");
    if (storedName) setNomeTecnico(storedName);
    
    const savedGlpiUser = localStorage.getItem("glpiUser");
    if (savedGlpiUser) setGlpiUser(savedGlpiUser);
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newAttachments = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImagens(prev => [...prev, ...newAttachments]);
    }
  };

  const removeImage = (index: number) => {
    setImagens(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // --- LÓGICA DE INTEGRAÇÃO GLPI ---
  const handleStartGlpiFlow = () => {
    if (!numeroChamado) {
      alert("Por favor, informe o número do chamado (SST/GLPI) para continuar.");
      return;
    }
    setIsGlpiModalOpen(true);
  };

  const handleGlpiAuth = async () => {
    if (!glpiUser || !glpiPass) return;
    setIsGlpiAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/glpi/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: glpiUser, pass: glpiPass })
      });
      if (!res.ok) throw new Error("Falha na autenticação AD");
      
      const { session_token } = await res.json();
      localStorage.setItem("glpi_token", session_token);
      localStorage.setItem("glpiUser", glpiUser);
      setIsGlpiModalOpen(false);
      setGlpiPass("");

      // Buscar chamados relacionados
      setIsSearchingTickets(true);
      const rTickets = await fetch(`${API_BASE_URL}/glpi/search-tickets?query=${numeroChamado}`, {
        headers: { "X-Glpi-Token": session_token }
      });
      const tickets = await rTickets.json();
      setGlpiTickets(tickets);
      setIsSearchingTickets(false);

      if (tickets.length > 0) {
        setIsRelateDecisionOpen(true);
      } else {
        handleSubmitFinal(false); // Cria novo sem vincular
      }
    } catch (err) {
      alert("Erro na autenticação de rede. Verifique seu login e senha do computador.");
    } finally {
      setIsGlpiAuthLoading(false);
    }
  };

  const handleSubmitFinal = async (relateToTicketId: string | false) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const glpiToken = localStorage.getItem("glpi_token");
      
      let signature = savedSignature;
      if (isRedrawing || !savedSignature) {
        const canvasSig = sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL() || null;
        if (canvasSig) {
          signature = canvasSig;
          // Salva assinatura no perfil
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

      const payload = {
        numeroChamado, 
        nomeTecnico, 
        equipamento, 
        loja, 
        tombo, 
        modelo: modelo || "Sem Modelo", 
        setor,
        testesRealizados, 
        diagnostico, 
        estadoEquipamento: estadoEquipamento === "Funcionando" ? "FUNCIONANDO" : "NAO_FUNCIONANDO", 
        necessidade: necessidade === "Ser substituído" ? "SUBSTITUIDO" : 
                    necessidade === "Enviado p/ conserto" ? "ENVIAR_CONSERTO" : 
                    necessidade === "Ser descartado" ? "DESCARTADO" : necessidade, 
        signature,
        photos: JSON.stringify(photosArray),
        glpiToken,
        relateToTicketId: relateToTicketId || undefined
      };

      const res = await fetch(`${API_BASE_URL}/info-laudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowSuccess(true);
        // Gerar e abrir o PDF conforme a regra de "produção"
        gerarLaudoPDF(payload as any, nomeTecnico);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Erro ao enviar: ${errorData.error || "Erro no servidor."}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsRelateDecisionOpen(false);
    }
  };

  const resetFormulario = () => {
    setNumeroChamado(""); setEquipamento(""); setLoja(""); setTombo("");
    setModelo(""); setSetor(""); setTestesRealizados(""); setDiagnostico("");
    setEstadoEquipamento(""); setNecessidade(""); setImagens([]);
    sigPadRef.current?.clear(); 
    setShowSuccess(false);
    setIsRedrawing(false);
  };

  return (
    <AdminPageLayout
      title={`Laudo\nTécnico`}
      subtitle="O laudo oficial agora é integrado diretamente ao GLPI. Preencha os dados e valide com sua senha AD."
      icon={ClipboardCheck}
      backUrl="/admin"
    >
      <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-12 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] tracking-tighter uppercase leading-none">
            Informações do Equipamento
          </h2>
        </div>
        
        <div className="space-y-12">
          {/* Seção 1: Dados Gerais */}
          <div className="space-y-8">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Dados Gerais</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número do Chamado (Padrão GLPI)</Label>
                <Input value={numeroChamado} onChange={e => setNumeroChamado(e.target.value)} placeholder="Ex: 154230" className="h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] transition-all text-[#1A1A2E]" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Nome do Técnico</Label>
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
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número de Tombo</Label>
                <Input value={tombo} onChange={e => setTombo(e.target.value)} placeholder="Patrimônio" className="h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB]" />
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

          {/* Seção 2: Fotos (LAYOUT ORIGINAL PRESERVADO) */}
          <div className="space-y-6 pt-10 border-t border-gray-100">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Evidências do Ativo</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {imagens.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-[#003B99]/30 transition-all group">
                <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[#003B99]" />
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Adicionar</span>
                <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Seção 3: Diagnóstico */}
          <div className="space-y-8 pt-10 border-t border-gray-100">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Testes Realizados</Label>
              <textarea value={testesRealizados} onChange={e => setTestesRealizados(e.target.value)} className="w-full min-h-[120px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:bg-white transition-all shadow-inner" placeholder="Pode descrever aqui os testes feitos..." />
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Diagnóstico Final</Label>
              <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="w-full min-h-[120px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:bg-white transition-all shadow-inner" placeholder="Sua conclusão técnica..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Estado Atual</Label>
              <select value={estadoEquipamento} onChange={e => setEstadoEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6">
                <option value="">Selecione...</option>
                <option value="Funcionando">Funcionando</option>
                <option value="Não funcionando">Não funcionando</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Ação Recomendada</Label>
              <select value={necessidade} onChange={e => setNecessidade(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6">
                <option value="">Selecione...</option>
                <option value="Ser substituído">Ser substituído</option>
                <option value="Enviado p/ conserto">Enviado p/ conserto</option>
                <option value="Ser descartado">Ser descartado</option>
              </select>
            </div>
          </div>

          {/* Seção Assinatura */}
          <div className="pt-10 border-t border-gray-100">
            <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider block mb-4 underline">Assinatura do Técnico</Label>
            {savedSignature && !isRedrawing ? (
              <div className="flex flex-col items-center">
                <img src={savedSignature} alt="Assinatura Salva" className="max-h-32 border border-dashed rounded-xl p-4 bg-white" />
                <Button variant="ghost" size="sm" onClick={() => setIsRedrawing(true)} className="mt-2 text-blue-600">Mudar Assinatura</Button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-[32px] p-2 border-2 border-dashed border-gray-200">
                <SignatureCanvas ref={sigPadRef} canvasProps={{ className: "w-full h-48 cursor-crosshair" }} />
                <button onClick={() => sigPadRef.current?.clear()} className="mt-2 text-[10px] uppercase text-red-500 font-bold px-4">Limpar Tela</button>
              </div>
            )}
          </div>

          {/* BOTÃO FINALIZAR (INICIA FLUXO GLPI) */}
          <div className="pt-8">
            <Button 
              disabled={isSubmitting} 
              className="w-full h-16 bg-[#003B99] text-white rounded-[20px] text-[14px] font-bold tracking-[0.1em] uppercase shadow-xl hover:bg-[#0E3D8A] active:scale-95 transition-all flex items-center justify-center gap-3" 
              onClick={handleStartGlpiFlow}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Finalizar e Sincronizar GLPI"}
            </Button>
          </div>
        </div>
      </div>

      {/* --- MODAIS DE INTEGRAÇÃO (OVERLAYS) --- */}
      <AnimatePresence>
        {isGlpiModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-black">
            <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl overflow-hidden relative border-t-8 border-[#003B99]">
              <div className="text-center mb-8">
                <AlertCircle className="w-16 h-16 text-[#003B99] mx-auto mb-4" />
                <h3 className="text-3xl font-bold uppercase tracking-tighter text-[#1A1A2E]">Senha de Rede</h3>
                <p className="text-[#6B7280] text-sm mt-2">Confirme sua identidade AD para vincular no GLPI.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-2">Usuário AD</Label>
                  <Input value={glpiUser} onChange={e => setGlpiUser(e.target.value)} placeholder="Ex: victor.peixoto" className="h-14 rounded-2xl bg-gray-50 border-none text-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-2">Senha do Computador</Label>
                  <Input type="password" value={glpiPass} onChange={e => setGlpiPass(e.target.value)} placeholder="••••••••" className="h-14 rounded-2xl bg-gray-50 border-none text-lg" />
                </div>
                <Button className="w-full h-16 bg-[#003B99] rounded-2xl text-[15px] font-bold tracking-widest mt-4" onClick={handleGlpiAuth} disabled={isGlpiAuthLoading}>
                  {isGlpiAuthLoading ? <Loader2 className="animate-spin" /> : "AUTENTICAR E ENVIAR"}
                </Button>
                <button onClick={() => setIsGlpiModalOpen(false)} className="w-full text-[10px] uppercase font-bold text-gray-400 tracking-widest py-2">Cancelar</button>
              </div>
            </div>
          </motion.div>
        )}

        {isRelateDecisionOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-black">
            <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative border-t-8 border-[#003B99]">
              <h3 className="text-3xl font-bold uppercase tracking-tighter mb-4 text-[#1A1A2E]">Chamados Encontrados</h3>
              <p className="text-gray-500 mb-8">Foram localizados chamados vinculados ao número <strong>#{numeroChamado}</strong>. Selecione um para registrar este laudo como acompanhamento ou crie um novo relacionado.</p>
              
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2 mb-8 custom-scrollbar">
                {glpiTickets.map(t => (
                  <button key={t.id} onClick={() => handleSubmitFinal(t.id)} className="w-full text-left p-6 rounded-[28px] border border-gray-100 bg-gray-50 hover:bg-[#003B99] hover:text-white transition-all group flex justify-between items-center shadow-sm">
                    <div>
                      <span className="block font-bold text-lg mb-1 group-hover:text-white">#{t.id} - {t.name}</span>
                      <span className="text-[11px] opacity-60 uppercase">{t.date}</span>
                    </div>
                    <span className="px-3 py-1 bg-white/20 text-[10px] font-bold rounded-full group-hover:bg-white/30 truncate">{t.statusNome}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <Button variant="outline" className="h-14 rounded-2xl border-2 border-[#003B99] text-[#003B99] font-bold" onClick={() => handleSubmitFinal(false)}>Não vincular, criar novo chamado</Button>
                <button onClick={() => setIsRelateDecisionOpen(false)} className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Voltar</button>
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
              <h2 className="text-4xl font-bold text-[#1A1A2E] mb-3 uppercase tracking-tighter leading-none">Concluído!</h2>
              <p className="text-[#6B7280] text-sm mb-10 leading-relaxed font-medium">Os dados foram registrados, o PDF foi gerado e as evidências já estão no GLPI.</p>
              <Button className="w-full h-16 bg-[#003B99] rounded-2xl text-[15px] font-bold tracking-widest uppercase shadow-lg shadow-[#003B99]/20" onClick={resetFormulario}>Novo Laudo</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageLayout>
  );
}
