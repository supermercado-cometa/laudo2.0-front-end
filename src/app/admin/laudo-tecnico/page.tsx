"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, ClipboardCheck, Image as ImageIcon, Trash2, Loader2,
  Lock, ExternalLink, AlertCircle, Send, Tag, MapPin, Users, RefreshCw
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { API_BASE_URL } from "@/lib/api-config";
import { gerarLaudoPDF } from "@/lib/pdf-template";

const GLPI_BASEPESQUISA_URL = process.env.NEXT_PUBLIC_GLPI_BASEPESQUISA_URL || "http://192.168.7.181/front/ticket.form.php?id=";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface GlpiLookupItem { id: number; completename?: string; name?: string; }

// ─── Componente Principal ────────────────────────────────────────────────────
export default function InfoFormularioPage() {
  const router = useRouter();

  // Campos do formulário
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
  const [imagens, setImagens] = useState<{ file: File; preview: string }[]>([]);

  // Listas de seleção
  const [lojas, setLojas] = useState<LojaType[]>([]);
  const [equipamentos, setEquipamentos] = useState<{ id: number; nome: string }[]>([]);
  const [setores, setSetores] = useState<{ id: number; nome: string }[]>([]);

  // Estado geral
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastLaudoId, setLastLaudoId] = useState<number | null>(null);
  const [savedPayload, setSavedPayload] = useState<Record<string, unknown> | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  // ── Estados modais GLPI ───────────────────────────────────────────────────
  const [isGlpiPasswordOpen, setIsGlpiPasswordOpen] = useState(false);
  const [glpiPassword, setGlpiPassword] = useState("");
  const [isGlpiAuthLoading, setIsGlpiAuthLoading] = useState(false);
  const [glpiAuthError, setGlpiAuthError] = useState("");

  // Modal de decisão (followup vs novo chamado)
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [pendingPassword, setPendingPassword] = useState("");

  // Modal de criar/relacionar chamado
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false);
  const [categories, setCategories] = useState<GlpiLookupItem[]>([]);
  const [locations, setLocations] = useState<GlpiLookupItem[]>([]);
  const [groups, setGroups] = useState<GlpiLookupItem[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // ── Boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }

    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d?.user?.signature) setSavedSignature(d.user.signature); })
      .catch(() => {});

    const fetchData = async (endpoint: string, setter: (d: any[]) => void) => {
      try {
        const r = await fetch(`${API_BASE_URL}/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) setter(await r.json());
      } catch { /* silencioso */ }
    };

    fetchData("lojas", setLojas);
    fetchData("equipamentos", setEquipamentos);
    fetchData("setores", setSetores);

    const name = localStorage.getItem("fullName");
    if (name) setNomeTecnico(name);
  }, [router]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const attachments = Array.from(e.target.files).map(file => ({
      file, preview: URL.createObjectURL(file)
    }));
    setImagens(prev => [...prev, ...attachments]);
  };

  const removeImage = (idx: number) => {
    setImagens(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const buildPayload = async () => {
    let signature = savedSignature;
    if (isRedrawing || !savedSignature) {
      const canvasSig = sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL() || null;
      if (canvasSig) {
        signature = canvasSig;
        const token = localStorage.getItem("token");
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

    return {
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
      necessidade:
        necessidade === "Ser substituído" ? "SUBSTITUIDO" :
        necessidade === "Enviado p/ conserto" ? "ENVIAR_CONSERTO" :
        necessidade === "Ser descartado" ? "DESCARTADO" : necessidade,
      signature,
      photos: JSON.stringify(photosArray),
    };
  };

  // ── 1. Salvar laudo no banco local ─────────────────────────────────────────
  const handleSubmitFinal = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const payload = await buildPayload();

      const res = await fetch(`${API_BASE_URL}/info-laudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        setLastLaudoId(saved.id);
        setSavedPayload(payload);
        setShowSuccess(true);
        gerarLaudoPDF(payload as any, nomeTecnico);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Erro ao salvar: ${err.error || "Erro no servidor."}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 2. Abrir modal de senha para fluxo GLPI ───────────────────────────────
  const handleOpenGlpiFlow = () => {
    setGlpiPassword("");
    setGlpiAuthError("");
    setIsGlpiPasswordOpen(true);
  };

  // ── 3. Autenticar e decidir próximo passo ─────────────────────────────────
  const handleGlpiAuthenticate = async () => {
    if (!glpiPassword) { setGlpiAuthError("Informe sua senha de rede."); return; }
    setIsGlpiAuthLoading(true);
    setGlpiAuthError("");

    try {
      // Testa a autenticação criando uma sessão temporária via followup em ticket dummy
      // Na prática, o backend validará as credenciais quando executar a operação real.
      // Aqui apenas guardamos a senha e avançamos para a decisão.
      setPendingPassword(glpiPassword);
      setIsGlpiPasswordOpen(false);

      if (numeroChamado) {
        // Já temos um chamado → pergunta se quer só follow-up ou criar novo relacionado
        setIsDecisionOpen(true);
      } else {
        // Sem chamado → vai direto para criação de novo ticket
        await carregarLookups();
        setIsRelateModalOpen(true);
      }
    } finally {
      setIsGlpiAuthLoading(false);
    }
  };

  // ── 4. Registrar follow-up no chamado existente ───────────────────────────
  const handleFollowup = async () => {
    setIsDecisionOpen(false);
    setIsGlpiAuthLoading(true);

    const payload = savedPayload ?? await buildPayload();
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("fullName") ?? "";

    try {
      const glpiInfo = {
        equipamento: payload.equipamento as string,
        modelo: payload.modelo as string,
        tombo: payload.tombo as string,
        loja: payload.loja as string,
        setor: payload.setor as string,
        testesRealizados: payload.testesRealizados as string,
        diagnostico: payload.diagnostico as string,
        estadoEquipamento: estadoEquipamento.toLowerCase() === "funcionando" ? "funcionando" : "nao_funcionando",
        necessidade:
          necessidade === "Ser substituído" ? "substituido" :
          necessidade === "Enviado p/ conserto" ? "enviar_conserto" :
          necessidade === "Ser descartado" ? "descartado" : necessidade.toLowerCase(),
      };

      const res = await fetch(`${API_BASE_URL}/glpi/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          numeroChamado,
          glpiPassword: pendingPassword,
          laudo: glpiInfo,
          glpiUsername: username,
        })
      });

      if (res.ok) {
        const ticketNum = Number(numeroChamado);
        window.open(`${GLPI_BASEPESQUISA_URL}${ticketNum}`, "_blank");
        setShowSuccess(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Erro ao registrar no GLPI: ${err.error || "Verifique suas credenciais."}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com o servidor GLPI.");
    } finally {
      setIsGlpiAuthLoading(false);
    }
  };

  // ── 5. Abrir modal de criar novo chamado (com ou sem vinculação) ──────────
  const handleOpenRelate = async () => {
    setIsDecisionOpen(false);
    await carregarLookups();
    setNewTicketTitle(`Laudo Técnico - ${equipamento || "Equipamento"} - ${loja || "Loja"}`);
    setIsRelateModalOpen(true);
  };

  // ── 6. Carregar listas do GLPI para o modal de criação ───────────────────
  const carregarLookups = useCallback(async () => {
    setIsLoadingLookups(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [catRes, locRes, grpRes] = await Promise.all([
        fetch(`${API_BASE_URL}/glpi/lookup/categories-db`, { headers }),
        fetch(`${API_BASE_URL}/glpi/lookup/locations-db`, { headers }),
        fetch(`${API_BASE_URL}/glpi/lookup/groups-db`, { headers }),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (locRes.ok) setLocations(await locRes.json());
      if (grpRes.ok) setGroups(await grpRes.json());
    } catch (err) {
      console.error("Erro ao carregar lookups GLPI:", err);
    } finally {
      setIsLoadingLookups(false);
    }
  }, []);

  // ── 7. Criar novo ticket (+linkar ao existente se houver) ─────────────────
  const handleCreateTicket = async () => {
    if (!newTicketTitle.trim()) { alert("Informe o título do chamado."); return; }
    setIsCreatingTicket(true);

    const payload = savedPayload ?? await buildPayload();
    const token = localStorage.getItem("token");

    const glpiInfo = {
      equipamento: payload.equipamento as string,
      modelo: payload.modelo as string,
      tombo: payload.tombo as string,
      loja: payload.loja as string,
      setor: payload.setor as string,
      testesRealizados: payload.testesRealizados as string,
      diagnostico: payload.diagnostico as string,
      estadoEquipamento: estadoEquipamento.toLowerCase() === "funcionando" ? "funcionando" : "nao_funcionando",
      necessidade:
        necessidade === "Ser substituído" ? "substituido" :
        necessidade === "Enviado p/ conserto" ? "enviar_conserto" :
        necessidade === "Ser descartado" ? "descartado" : necessidade.toLowerCase(),
    };

    try {
      // Cria o ticket
      const createRes = await fetch(`${API_BASE_URL}/glpi/ticket/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          glpiPassword: pendingPassword,
          laudo: glpiInfo,
          relacao: {
            titulo: newTicketTitle,
            categoriaId: selectedCategory,
            localizacaoId: selectedLocation,
            grupoId: selectedGroup,
          },
        })
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        alert(`Erro ao criar chamado no GLPI: ${err.error || "Verifique suas credenciais."}`);
        return;
      }

      const { ticketId } = await createRes.json();

      // Se havia chamado original, vincula ao novo
      if (ticketId && numeroChamado) {
        await fetch(`${API_BASE_URL}/glpi/ticket/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            glpiPassword: pendingPassword,
            tickets_id_1: Number(numeroChamado),
            tickets_id_2: ticketId,
            link: 1,
          })
        });
      }

      setIsRelateModalOpen(false);
      if (ticketId) {
        window.open(`${GLPI_BASEPESQUISA_URL}${ticketId}`, "_blank");
      }
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao criar chamado.");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetFormulario = () => {
    setNumeroChamado(""); setEquipamento(""); setLoja(""); setTombo("");
    setModelo(""); setSetor(""); setTestesRealizados(""); setDiagnostico("");
    setEstadoEquipamento(""); setNecessidade(""); setImagens([]);
    sigPadRef.current?.clear();
    setShowSuccess(false); setLastLaudoId(null); setSavedPayload(null);
    setPendingPassword(""); setSelectedCategory(null); setSelectedLocation(null); setSelectedGroup(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminPageLayout
      title={`Laudo\nTécnico`}
      subtitle="Preencha os dados, salve o laudo e envie para o GLPI com um clique."
      icon={ClipboardCheck}
      backUrl="/admin"
    >
      <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-12 shadow-sm border border-gray-100">
        <div className="mb-10">
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
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número do Chamado (Opcional)</Label>
                <Input value={numeroChamado} onChange={e => setNumeroChamado(e.target.value)} placeholder="Ex: 154230 (deixe vazio para criar novo)" className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#1A4CAB]" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Nome do Técnico</Label>
                <Input value={nomeTecnico} disabled className="h-12 rounded-xl bg-gray-100 border-none text-gray-400 cursor-not-allowed" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Equipamento</Label>
                <select value={equipamento} onChange={e => setEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione...</option>
                  {equipamentos.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Loja</Label>
                <select value={loja} onChange={e => setLoja(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione...</option>
                  {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número de Tombo</Label>
                <Input value={tombo} onChange={e => setTombo(e.target.value)} placeholder="Patrimônio" className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#1A4CAB]" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Setor</Label>
                <select value={setor} onChange={e => setSetor(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E] appearance-none">
                  <option value="">Selecione...</option>
                  {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Evidências */}
          <div className="space-y-6 pt-10 border-t border-gray-100">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Evidências do Ativo</h3>
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
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Adicionar</span>
                <input type="file" multiple accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Seção 3: Diagnóstico */}
          <div className="space-y-8 pt-10 border-t border-gray-100">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Testes Realizados</Label>
              <textarea value={testesRealizados} onChange={e => setTestesRealizados(e.target.value)} className="w-full min-h-[120px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:bg-white transition-all shadow-inner" placeholder="Descreva os testes feitos..." />
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Diagnóstico Final</Label>
              <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="w-full min-h-[120px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:bg-white transition-all shadow-inner" placeholder="Sua conclusão técnica..." />
            </div>
          </div>

          {/* Seção 4: Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Estado Atual</Label>
              <select value={estadoEquipamento} onChange={e => setEstadoEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E]">
                <option value="">Selecione...</option>
                <option value="Funcionando">Funcionando</option>
                <option value="Não funcionando">Não funcionando</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Ação Recomendada</Label>
              <select value={necessidade} onChange={e => setNecessidade(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E]">
                <option value="">Selecione...</option>
                <option value="Ser substituído">Ser substituído</option>
                <option value="Enviado p/ conserto">Enviado p/ conserto</option>
                <option value="Ser descartado">Ser descartado</option>
              </select>
            </div>
          </div>

          {/* Seção 5: Assinatura */}
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

          {/* Botões de Ação */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              disabled={isSubmitting}
              onClick={handleSubmitFinal}
              className="h-16 bg-[#003B99] text-white rounded-[20px] text-[13px] font-bold tracking-widest uppercase shadow-xl hover:bg-[#0E3D8A] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><ClipboardCheck className="w-5 h-5" /> Salvar Laudo + PDF</>}
            </Button>
            <Button
              disabled={isGlpiAuthLoading}
              onClick={handleOpenGlpiFlow}
              className="h-16 bg-[#FECC00] text-[#1A1A2E] rounded-[20px] text-[13px] font-bold tracking-widest uppercase shadow-xl hover:bg-[#e6b800] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isGlpiAuthLoading ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5" /> Enviar para o GLPI</>}
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAIS
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>

        {/* ── Modal 1: Senha de Rede ── */}
        {isGlpiPasswordOpen && (
          <Overlay onClick={() => setIsGlpiPasswordOpen(false)}>
            <ModalCard title="Senha de Rede" subtitle="Informe sua senha do AD/GLPI para continuar." icon={Lock}>
              <div className="space-y-4 mt-6">
                <Input
                  type="password"
                  value={glpiPassword}
                  onChange={e => { setGlpiPassword(e.target.value); setGlpiAuthError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleGlpiAuthenticate()}
                  placeholder="••••••••"
                  className="h-14 rounded-2xl bg-gray-50 border-none text-lg"
                />
                {glpiAuthError && (
                  <p className="text-red-500 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" />{glpiAuthError}</p>
                )}
                <Button onClick={handleGlpiAuthenticate} disabled={isGlpiAuthLoading} className="w-full h-14 bg-[#003B99] rounded-2xl text-[14px] font-bold tracking-widest">
                  {isGlpiAuthLoading ? <Loader2 className="animate-spin" /> : "Continuar"}
                </Button>
                <button onClick={() => setIsGlpiPasswordOpen(false)} className="w-full text-[10px] uppercase font-bold text-gray-400 tracking-widest py-2">Cancelar</button>
              </div>
            </ModalCard>
          </Overlay>
        )}

        {/* ── Modal 2: Decisão (Follow-up vs Novo Chamado) ── */}
        {isDecisionOpen && (
          <Overlay onClick={() => setIsDecisionOpen(false)}>
            <ModalCard title="Chamado Encontrado" subtitle={`O laudo será vinculado ao chamado #${numeroChamado}. O que deseja fazer?`} icon={AlertCircle}>
              <div className="space-y-3 mt-6">
                <button
                  onClick={handleFollowup}
                  className="w-full p-5 rounded-2xl bg-[#003B99] text-white text-left hover:bg-[#0E3D8A] transition-all"
                >
                  <p className="font-black text-sm uppercase tracking-widest">Registrar Acompanhamento</p>
                  <p className="text-white/70 text-xs mt-1">Adiciona o laudo como follow-up no chamado #{numeroChamado} existente.</p>
                </button>
                <button
                  onClick={handleOpenRelate}
                  className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-gray-100 text-[#1A1A2E] text-left hover:border-[#003B99]/30 transition-all"
                >
                  <p className="font-black text-sm uppercase tracking-widest">Criar Novo Chamado Relacionado</p>
                  <p className="text-gray-500 text-xs mt-1">Cria um novo chamado no GLPI e vincula ao #{numeroChamado}.</p>
                </button>
                <button onClick={() => setIsDecisionOpen(false)} className="w-full text-[10px] uppercase font-bold text-gray-400 tracking-widest py-2">Cancelar</button>
              </div>
            </ModalCard>
          </Overlay>
        )}

        {/* ── Modal 3: Criar/Relacionar Chamado ── */}
        {isRelateModalOpen && (
          <Overlay onClick={() => !isCreatingTicket && setIsRelateModalOpen(false)}>
            <ModalCard title="Novo Chamado GLPI" subtitle="Preencha os dados para criar o chamado no sistema." icon={Send} wide>
              {isLoadingLookups ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <Loader2 className="w-10 h-10 text-[#003B99] animate-spin" />
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Carregando dados do GLPI...</p>
                </div>
              ) : (
                <div className="space-y-5 mt-6">
                  {/* Título */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Título do Chamado</label>
                    <Input value={newTicketTitle} onChange={e => setNewTicketTitle(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none" />
                  </div>

                  {/* Categoria */}
                  <LookupSelect
                    icon={Tag}
                    label="Categoria"
                    items={categories}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    displayKey="completename"
                  />

                  {/* Localização */}
                  <LookupSelect
                    icon={MapPin}
                    label="Localização"
                    items={locations}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    displayKey="completename"
                  />

                  {/* Grupo */}
                  <LookupSelect
                    icon={Users}
                    label="Grupo Atribuído"
                    items={groups}
                    value={selectedGroup}
                    onChange={setSelectedGroup}
                    displayKey="completename"
                    fallbackKey="name"
                  />

                  {numeroChamado && (
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700">
                      <strong>Vinculação automática:</strong> O novo chamado será relacionado ao #{numeroChamado}.
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleCreateTicket}
                      disabled={isCreatingTicket}
                      className="flex-1 h-14 bg-[#003B99] rounded-2xl text-[13px] font-bold tracking-widest uppercase"
                    >
                      {isCreatingTicket ? <Loader2 className="animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" /> Criar e Abrir no GLPI</>}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => carregarLookups()}
                      disabled={isLoadingLookups}
                      className="w-14 h-14 rounded-2xl text-gray-400"
                      title="Recarregar listas"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                  </div>
                  <button onClick={() => setIsRelateModalOpen(false)} className="w-full text-[10px] uppercase font-bold text-gray-400 tracking-widest py-2">Cancelar</button>
                </div>
              )}
            </ModalCard>
          </Overlay>
        )}

        {/* ── Modal Final: Sucesso ── */}
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/90 backdrop-blur-md p-6">
            <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl max-w-sm w-full border-b-8 border-green-500">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-500 w-16 h-16" />
              </div>
              <h2 className="text-4xl font-bold text-[#1A1A2E] mb-3 uppercase tracking-tighter leading-none">Concluído!</h2>
              <p className="text-[#6B7280] text-sm mb-10 leading-relaxed">
                {lastLaudoId ? `Laudo #${lastLaudoId} registrado.` : "Operação concluída."} PDF gerado e dados enviados ao GLPI.
              </p>
              <Button className="w-full h-16 bg-[#003B99] rounded-2xl text-[15px] font-bold tracking-widest uppercase" onClick={resetFormulario}>
                Novo Laudo
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </AdminPageLayout>
  );
}

// ─── Componentes de UI ────────────────────────────────────────────────────────
function Overlay({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClick}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </motion.div>
  );
}

function ModalCard({ title, subtitle, icon: Icon, children, wide }: {
  title: string; subtitle: string; icon: React.ElementType; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`bg-white rounded-[40px] p-10 shadow-2xl border-t-8 border-[#003B99] text-black ${wide ? "max-w-xl w-full" : "max-w-md w-full"}`}
    >
      <div className="flex items-start gap-4 mb-2">
        <div className="w-14 h-14 bg-[#003B99]/5 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-7 h-7 text-[#003B99]" />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A2E]">{title}</h3>
          <p className="text-gray-500 text-sm mt-1 leading-snug">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function LookupSelect({ icon: Icon, label, items, value, onChange, displayKey, fallbackKey }: {
  icon: React.ElementType; label: string; items: GlpiLookupItem[];
  value: number | null; onChange: (v: number | null) => void;
  displayKey: keyof GlpiLookupItem; fallbackKey?: keyof GlpiLookupItem;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <select
        value={value ?? ""}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]"
      >
        <option value="">— Selecione (opcional) —</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>
            {(item[displayKey] as string) || (fallbackKey ? item[fallbackKey] as string : "") || `ID ${item.id}`}
          </option>
        ))}
      </select>
    </div>
  );
}
