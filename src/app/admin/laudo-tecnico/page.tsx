"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, ClipboardCheck, Image as ImageIcon, Trash2, Loader2,
  ExternalLink, Tag, MapPin, Users, RefreshCw, Zap, FileText, Printer,
  X, ChevronLeft, ChevronRight, ZoomIn
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { API_BASE_URL, GLPI_BASE_URL } from "@/lib/api-config";
import { gerarLaudoPDF } from "@/lib/pdf-template";
import GlpiPromoteModal, { GlpiPromotePayload } from "@/components/glpi-promote-modal";
import GlpiRelateModal, { GlpiRelacaoPayload } from "@/components/glpi-relate-modal";

interface GlpiItem { id: number; completename?: string; name?: string; }

// ─── Overlay + ModalCard ──────────────────────────────────────────────────────
function Overlay({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
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
  title: string; subtitle: string; icon: React.ElementType;
  children: React.ReactNode; wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
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
  icon: React.ElementType; label: string; items: GlpiItem[];
  value: number | null; onChange: (v: number | null) => void;
  displayKey: keyof GlpiItem; fallbackKey?: keyof GlpiItem;
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

// ─── Página Principal ─────────────────────────────────────────────────────────
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
  const [imagens, setImagens] = useState<{ file: File; preview: string }[]>([]);

  const [lojas, setLojas] = useState<LojaType[]>([]);
  const [equipamentos, setEquipamentos] = useState<{ id: number; nome: string }[]>([]);
  const [setores, setSetores] = useState<{ id: number; nome: string }[]>([]);
  const [modelos, setModelos] = useState<{ id: number; nome: string; equipamentoId?: number }[]>([]);

  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<"idle" | "saving" | "glpi" | "done">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [glpiTicketId, setGlpiTicketId] = useState<number | null>(null);
  const [savedPayload, setSavedPayload] = useState<Record<string, unknown> | null>(null);

  // Modal de confirmação antes de executar
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  // Modal de criação de chamado GLPI (sem chamado existente)
  const [isRelateModalOpen, setIsRelateModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [categories, setCategories] = useState<GlpiItem[]>([]);
  const [locations, setLocations] = useState<GlpiItem[]>([]);
  const [groups, setGroups] = useState<GlpiItem[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("Chamado aberto automaticamente através do sistema de Laudo Técnico.");
  const [assetInfo, setAssetInfo] = useState<{ id: number; name: string; itemtype: string } | null>(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);
  const [assetError, setAssetError] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [glpiPasswordManual, setGlpiPasswordManual] = useState("");
  const [showManualPass, setShowManualPass] = useState(false);
  
  // Visualizador de Imagens
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    console.log("🚀 [SSO_PROMO_V2] Frontend carregado!");
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }

    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { 
        if (d?.user?.signature) {
          setSavedSignature(d.user.signature);
          // Marca como não redisanhando para usar a salva
          setIsRedrawing(false);
        }
      })
      .catch(() => { });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const load = async (ep: string, set: (d: any[]) => void) => {
      try {
        const r = await fetch(`${API_BASE_URL}/${ep}`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) set(await r.json());
      } catch { /* silencioso */ }
    };

    load("lojas", setLojas);
    load("equipamentos", setEquipamentos);
    load("setores", setSetores);
    load("modelos", setModelos);

    const name = localStorage.getItem("fullName");
    if (name) setNomeTecnico(name);
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    console.log(`[DEBUG] ${e.target.files.length} imagens selecionadas`);
    
    const novasImagens = Array.from(e.target.files).map(file => ({ 
      file, 
      preview: URL.createObjectURL(file) 
    }));

    setImagens(prev => [...prev, ...novasImagens]);
    // Reseta o valor para permitir selecionar o mesmo arquivo/lote novamente
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImagens(prev => {
      const u = [...prev];
      URL.revokeObjectURL(u[idx].preview);
      u.splice(idx, 1);
      return u;
    });
  };

  const compressImage = (file: File | string, maxWidth = 1280, quality = 0.7): Promise<string> => 
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = typeof file === "string" ? file : URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Limpa e preenche com branco para garantir que não haja canal alfa
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (typeof file !== "string") URL.revokeObjectURL(img.src);
        resolve(dataUrl);
      };
      img.onerror = reject;
    });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.readAsDataURL(file);
      r.onload = () => res(r.result as string);
      r.onerror = rej;
    });

  const buildPayload = async () => {
    let signature = savedSignature;
    if (isRedrawing || !savedSignature) {
      const canvasSig = sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL() || null;
      if (canvasSig) {
        // Comprime a assinatura (canvas costuma ser grande)
        const compressedSig = await compressImage(canvasSig, 800, 0.6);
        signature = compressedSig;
        const token = localStorage.getItem("token");
        // Salva silenciosamente a assinatura no perfil do usuário
        fetch(`${API_BASE_URL}/auth/save-signature`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ signature: compressedSig })
        }).then(r => {
          if (r.ok) {
            setSavedSignature(compressedSig);
            setIsRedrawing(false);
          }
        }).catch(() => {});
      }
    }
    // Comprime todas as imagens carregadas para evitar erro 413
    const photos = await Promise.all(imagens.map(img => compressImage(img.file)));
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
      tecnico: nomeTecnico, // Replicado para compatibilidade legado
      signature,
      photos: JSON.stringify(photos),
    };
  };

  // ─── FLUXO UNIFICADO ───────────────────────────────────────────────────────
  // ─── Abre modal de confirmação ─────────────────────────────────────────────
  const handleClickFinalizar = () => {
    setShowConfirmModal(true);
  };

  // ─── Executa o fluxo completo após confirmação ────────────────────────────
  const handleFinalizar = async () => {
    // Validação de campos vitais antes de prosseguir
    if (!equipamento || !loja || !nomeTecnico) {
      alert("Por favor, preencha Equipamento, Loja e Técnico antes de finalizar.");
      return;
    }

    setShowConfirmModal(false);
    setIsSending(true);

    try {
      // ① Salvar no banco
      setStep("saving"); setStatusMsg("Salvando laudo...");
      const token = localStorage.getItem("token");
      const payload = await buildPayload();
      setSavedPayload(payload);

      const saveRes = await fetch(`${API_BASE_URL}/info-laudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        alert(`Erro ao salvar: ${err.error || "Erro no servidor."}`);
        return;
      }
      const savedLaudo = await saveRes.json();
      const laudoId = savedLaudo.id;

      // ② PDF removido do fluxo automático (separado a pedido do técnico)
      // O PDF será gerado manualmente ou ao final de tudo.

      // ③ Integração GLPI
      setStep("glpi"); setStatusMsg("Conectando ao GLPI...");

      const glpiInfo = {
        equipamento, modelo, tombo, loja, setor, testesRealizados, diagnostico,
        estadoEquipamento: estadoEquipamento.toLowerCase() === "funcionando" ? "funcionando" : "nao_funcionando",
        necessidade:
          necessidade === "Ser substituído" ? "substituido" :
          necessidade === "Enviado p/ conserto" ? "enviar_conserto" :
          necessidade === "Ser descartado" ? "descartado" : necessidade.toLowerCase(),
      };

      if (numeroChamado) {
        setStatusMsg("Redirecionando para Promoção de Chamado...");
        setIsPromoteModalOpen(true);
      } else {
        setStatusMsg("Abrindo opções GLPI...");
        await carregarLookups();
        setNewTicketTitle(`Laudo Técnico - ${equipamento || "Equipamento"} - ${loja || "Loja"}`);
        setIsRelateModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert("Erro inesperado. Tente novamente.");
    } finally {
      if (!isRelateModalOpen) {
        setIsSending(false);
        setStep("idle");
        setStatusMsg("");
      }
    }
  };

  const carregarLookups = useCallback(async () => {
    setIsLoadingLookups(true);
    const token = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${token}` };
    try {
      // Busca Asset se tiver tombo
      if (tombo) {
        setIsLoadingAsset(true);
        setAssetError("");
        fetch(`${API_BASE_URL}/glpi/lookup/asset/${tombo}`, { headers: h })
          .then(async (r) => {
            if (!r.ok) throw new Error("Não encontrado");
            return r.json();
          })
          .then(setAssetInfo)
          .catch(e => setAssetError(e.message))
          .finally(() => setIsLoadingAsset(false));
      }

      const [c, l, g] = await Promise.all([
        fetch(`${API_BASE_URL}/glpi/lookup/categories-db`, { headers: h }),
        fetch(`${API_BASE_URL}/glpi/lookup/locations-db`, { headers: h }),
        fetch(`${API_BASE_URL}/glpi/lookup/groups-db`, { headers: h }),
      ]);
      if (c.ok) setCategories(await c.json());
      if (l.ok) setLocations(await l.json());
      if (g.ok) setGroups(await g.json());
    } catch (e) { console.error(e); }
    finally { setIsLoadingLookups(false); }
  }, [tombo]);

  const handleCreateTicket = async () => {
    if (!newTicketTitle.trim()) { alert("Informe o título."); return; }
    setIsCreatingTicket(true);

    const token = localStorage.getItem("token");
    const payload = savedPayload!;
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
      const cRes = await fetch(`${API_BASE_URL}/glpi/ticket/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          glpiPassword: glpiPasswordManual,
          laudo: glpiInfo,
          relacao: {
            titulo: newTicketTitle,
            categoriaId: selectedCategory,
            localizacaoId: selectedLocation,
            grupoId: selectedGroup,
          },
          asset: assetInfo ? { id: assetInfo.id, itemtype: assetInfo.itemtype } : null,
          mensagemPai: newTicketMessage
        })
      });

      if (!cRes.ok) {
        const e = await cRes.json().catch(() => ({}));
        if (cRes.status === 401 && !glpiPasswordManual) {
          setShowManualPass(true);
          alert("Autenticação automática falhou. Por favor, digite sua senha do GLPI.");
        } else {
          alert(`Erro ao criar chamado: ${e.error || "Verifique as configurações GLPI."}`);
        }
        return;
      }
      const { ticketId } = await cRes.json();
      console.log("✅ Novo chamado GLPI criado com sucesso:", { ticketId });
      if (ticketId) {
        setGlpiTicketId(ticketId);
        if (numeroChamado) {
          await fetch(`${API_BASE_URL}/glpi/ticket/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ glpiPassword: glpiPasswordManual, tickets_id_1: Number(numeroChamado), tickets_id_2: ticketId, link: 1 })
          });
        }
        window.open(`${GLPI_BASE_URL}${ticketId}`, "_blank");
      }
      setIsRelateModalOpen(false);
      setShowSuccess(true);
    } catch (e) {
      console.error(e);
      alert("Erro de conexão ao criar chamado.");
    } finally {
      setIsCreatingTicket(false);
      setIsSending(false);
      setStep("idle"); setStatusMsg("");
    }
  };

  const handlePromoteTicket = async (data: GlpiPromotePayload) => {
    setIsCreatingTicket(true);
    setStatusMsg("Orquestrando promoção no GLPI...");
    
    try {
      const token = localStorage.getItem("token");
      const payload = savedPayload;
      
      if (!payload) {
        throw new Error("Dados do laudo não encontrados. Salve o laudo primeiro.");
      }

      // Usa os valores já convertidos do payload salvo para evitar capturar estado React desatualizado
      const glpiInfo = {
        equipamento: payload.equipamento as string,
        modelo: payload.modelo as string,
        tombo: payload.tombo as string,
        loja: payload.loja as string,
        setor: payload.setor as string,
        testesRealizados: payload.testesRealizados as string,
        diagnostico: payload.diagnostico as string,
        tecnico: payload.nomeTecnico as string,
        estadoEquipamento: payload.estadoEquipamento as string,
        necessidade: payload.necessidade as string,
      };

      const body = {
        parentTicketId: numeroChamado,
        glpiPassword: glpiPasswordManual,
        laudo: glpiInfo,
        titulo: data.titulo,
        categoriaId: data.categoriaId,
        asset: data.asset,
        managerId: data.managerIds[0] || null,
        managerIds: data.managerIds,
        mensagemPai: data.mensagemPai
      };

      console.log("🚀 [PROMOTE] Payload enviado:", body);

      const res = await fetch(`${API_BASE_URL}/glpi/ticket/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`  // Padrão correto, igual ao handleCreateTicket
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        if (res.status === 401 && !glpiPasswordManual) {
          setShowManualPass(true);
          alert("Autenticação automática falhou. Por favor, digite sua senha do GLPI.");
        } else {
          alert(`Erro na promoção: ${e.error || "Verifique o patrimônio e gerente."}`);
        }
        return;
      }

      const resData = await res.json();
      const sId = resData.subTicketId || resData.ticketId;
      
      if (sId) {
        setGlpiTicketId(sId);
        window.open(`${GLPI_BASE_URL}${sId}`, "_blank");
      }
      
      setIsPromoteModalOpen(false);
      setShowSuccess(true);
    } catch (e: any) {
      console.error("Erro na promoção:", e);
      alert(e.message || "Erro ao promover chamado.");
    } finally {
      setIsCreatingTicket(false);
      setIsSending(false);
      setStep("idle"); setStatusMsg("");
    }
  };

  const resetFormulario = () => {
    setNumeroChamado(""); setEquipamento(""); setLoja(""); setTombo("");
    setModelo(""); setSetor(""); setTestesRealizados(""); setDiagnostico("");
    setEstadoEquipamento(""); setNecessidade(""); setImagens([]);
    sigPadRef.current?.clear();
    setShowSuccess(false); setGlpiTicketId(null); setSavedPayload(null);
    setSelectedCategory(null); setSelectedLocation(null); setSelectedGroup(null);
    setStep("idle"); setStatusMsg("");
  };

  // ─── Indicador de progresso ───────────────────────────────────────────────
  const steps = [
    { key: "saving", label: "Salvando" },
    { key: "glpi", label: "GLPI" },
    { key: "done", label: "Concluído" },
  ];

  return (
    <AdminPageLayout
      title={`Laudo\nTécnico`}
      subtitle="Preencha os dados e finalize — o sistema salva, gera o PDF e sincroniza com o GLPI automaticamente."
      icon={ClipboardCheck}
      backUrl="/admin"
    >
      <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-12 shadow-sm border border-gray-100">
        <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] tracking-tighter uppercase leading-none mb-10">
          Informações do Equipamento
        </h2>

        <div className="space-y-12">
          {/* Dados Gerais */}
          <div className="space-y-8">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Dados Gerais</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número do Chamado (Opcional)</Label>
                <Input value={numeroChamado} onChange={e => setNumeroChamado(e.target.value)} placeholder="Ex: 154230 — deixe vazio para criar novo" className="h-12 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#1A4CAB]" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Nome do Técnico</Label>
                <Input value={nomeTecnico} disabled className="h-12 rounded-xl bg-gray-100 border-none text-gray-400" />
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
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Modelo</Label>
                <select 
                  value={modelo} 
                  onChange={e => setModelo(e.target.value)} 
                  className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]"
                >
                  <option value="">Selecione...</option>
                  {modelos
                    .filter(m => {
                      // Filtra os modelos pelo Equipamento selecionado
                      const selectedEq = equipamentos.find(e => e.nome === equipamento);
                      return selectedEq ? m.equipamentoId === selectedEq.id : true;
                    })
                    .map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)
                  }
                </select>
              </div>
            </div>
          </div>

          {/* Evidências */}
          <div className="space-y-6 pt-10 border-t border-gray-100">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Evidências do Ativo</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {imagens.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group cursor-pointer" onClick={() => setPreviewIndex(idx)}>
                  <img src={img.preview} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-[#003B99]/30 transition-all group">
                <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-[#003B99]" />
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Adicionar</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Diagnóstico */}
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

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Estado Atual</Label>
              <select value={estadoEquipamento} onChange={e => setEstadoEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E]">
                <option value="">Selecione...</option>
                <option>Funcionando</option>
                <option>Não funcionando</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Ação Recomendada</Label>
              <select value={necessidade} onChange={e => setNecessidade(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 text-[#1A1A2E]">
                <option value="">Selecione...</option>
                <option>Ser substituído</option>
                <option>Enviado p/ conserto</option>
                <option>Ser descartado</option>
              </select>
            </div>
          </div>

          {/* Assinatura */}
          <div className="pt-10 border-t border-gray-100">
            <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider block mb-4 underline">Assinatura do Técnico</Label>
            {savedSignature && !isRedrawing ? (
              <div className="flex flex-col items-center">
                <img src={savedSignature} alt="Assinatura" className="max-h-32 border border-dashed rounded-xl p-4 bg-white" />
                <Button variant="ghost" size="sm" onClick={() => setIsRedrawing(true)} className="mt-2 text-blue-600">Mudar Assinatura</Button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-[32px] p-2 border-2 border-dashed border-gray-200">
                <SignatureCanvas ref={sigPadRef} canvasProps={{ className: "w-full h-48 cursor-crosshair" }} />
                <button onClick={() => sigPadRef.current?.clear()} className="mt-2 text-[10px] uppercase text-red-500 font-bold px-4">Limpar</button>
              </div>
            )}
          </div>

          {/* Botão único */}
          <div className="pt-8">
            {isSending && step !== "idle" && (
              <div className="mb-6 space-y-3">
                <div className="flex gap-2 items-center justify-between mb-1">
                  {steps.map((s, i) => (
                    <React.Fragment key={s.key}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step === s.key ? "bg-[#003B99] text-white scale-110" : steps.findIndex(x => x.key === step) > i ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {steps.findIndex(x => x.key === step) > i ? "✓" : i + 1}
                        </div>
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">{s.label}</span>
                      </div>
                      {i < steps.length - 1 && <div className="flex-1 h-[2px] bg-gray-100 mx-1 rounded-full overflow-hidden"><div className={`h-full bg-[#003B99] transition-all ${steps.findIndex(x => x.key === step) > i ? "w-full" : "w-0"}`} /></div>}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-center text-[11px] uppercase font-bold text-gray-400 tracking-widest">{statusMsg}</p>
              </div>
            )}
          {/* Botões de Ação */}
          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              disabled={isSending}
              onClick={async () => {
                const payload = await buildPayload();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                gerarLaudoPDF(payload as any, nomeTecnico);
              }}
              className="h-16 rounded-[20px] text-[12px] font-black tracking-widest uppercase border-2 border-gray-100 text-gray-400 hover:border-[#003B99]/20 transition-all flex items-center justify-center gap-3"
            >
              <FileText className="w-5 h-5" /> Somente PDF
            </Button>

            <Button
              disabled={isSending}
              onClick={handleClickFinalizar}
              className="md:col-span-2 h-16 bg-[#003B99] text-white rounded-[20px] text-[14px] font-black tracking-widest uppercase shadow-xl hover:bg-[#0E3D8A] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSending ? <Loader2 className="animate-spin w-6 h-6" /> : <><Zap className="w-5 h-5" /> Finalizar Atendimento (Salvar + GLPI)</>}
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ MODAIS ═══════════════ */}
      <AnimatePresence>
        {/* Modal DE CONFIRMAÇÃO (Transparência total) */}
        {showConfirmModal && (
          <Overlay>
            <ModalCard title="Finalizar Atendimento" subtitle="Confirme os passos que o sistema executará automaticamente." icon={Zap}>
              <div className="space-y-6 mt-6">
                <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-[10px] font-bold">1</div>
                    <p className="text-xs text-[#1A1A2E] font-medium mt-0.5">Salvar laudo permanentemente no banco de dados.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-[10px] font-bold">2</div>
                    <p className="text-xs text-[#1A1A2E] font-medium mt-0.5">Gerar o arquivo PDF para exportação e histórico.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold">3</div>
                    <div className="space-y-1">
                      <p className="text-xs text-[#1A1A2E] font-bold mt-0.5 uppercase tracking-tight">Sincronização GLPI:</p>
                      {numeroChamado ? (
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          O sistema detectou o número <span className="text-[#003B99] font-black">#{numeroChamado}</span>. O laudo será anexado como um <span className="font-bold">Acompanhamento Público</span> (vísivel para o externo).
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Como não há número de chamado, o sistema abrirá a opção para <span className="font-bold">Criar um Novo Ticket</span> vinculado a este laudo.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => setShowManualPass(!showManualPass)}
                    className="text-[10px] uppercase font-bold text-blue-600 tracking-widest flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {showManualPass ? "✕ Cancelar senha manual" : "🔑 Usar minha senha individual do GLPI"}
                  </button>
                  
                  {showManualPass && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 font-black">Sua Senha do GLPI</Label>
                      <Input 
                        type="password" 
                        value={glpiPasswordManual} 
                        onChange={e => setGlpiPasswordManual(e.target.value)}
                        placeholder="Digite sua senha..."
                        className="h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                      <p className="text-[9px] text-gray-400 italic">Deixe vazio para usar a automação do sistema.</p>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setShowConfirmModal(false)} variant="ghost" className="h-14 rounded-2xl text-[11px] uppercase font-black tracking-widest text-gray-400">
                    Revisar
                  </Button>
                  <Button onClick={handleFinalizar} className="h-14 bg-[#003B99] rounded-2xl text-[11px] uppercase font-black tracking-widest text-white shadow-lg shadow-[#003B99]/20">
                    Confirmar e Enviar
                  </Button>
                </div>
              </div>
            </ModalCard>
          </Overlay>
        )}

        {/* Modal: criar novo ticket GLPI */}
        {isRelateModalOpen && (
          <Overlay>
            <ModalCard title="Novo Chamado GLPI" subtitle="Preencha os dados para registrar o chamado no sistema." icon={ExternalLink} wide>
              {isLoadingLookups ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <Loader2 className="w-10 h-10 text-[#003B99] animate-spin" />
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Carregando dados do GLPI...</p>
                </div>
              ) : (
                <div className="space-y-5 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Título do Chamado</label>
                      <Input value={newTicketTitle} onChange={e => setNewTicketTitle(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none" />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-black text-blue-600 tracking-widest font-black">Aviso / Descrição Adicional</label>
                       <textarea 
                         value={newTicketMessage} 
                         onChange={e => setNewTicketMessage(e.target.value)}
                         className="w-full h-20 p-4 rounded-xl bg-blue-50/30 border border-blue-100/50 text-xs text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                       />
                    </div>

                    {tombo && (
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Patrimônio Identificado ({tombo})</label>
                        {isLoadingAsset ? (
                          <p className="text-[11px] animate-pulse">Buscando no GLPI...</p>
                        ) : assetInfo ? (
                          <div>
                            <p className="text-xs font-bold text-green-700">{assetInfo.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase">{assetInfo.itemtype}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-600 italic">{assetError || "Nenhum ativo vinculado automaticamente."}</p>
                        )}
                      </div>
                    )}

                    <LookupSelect icon={Tag} label="Categoria" items={categories} value={selectedCategory} onChange={setSelectedCategory} displayKey="completename" />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <LookupSelect icon={MapPin} label="Localização" items={locations} value={selectedLocation} onChange={setSelectedLocation} displayKey="completename" />
                      <LookupSelect icon={Users} label="Grupo" items={groups} value={selectedGroup} onChange={setSelectedGroup} displayKey="completename" fallbackKey="name" />
                    </div>

                    {/* Status da Automação de Validação */}
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] text-blue-700 font-black uppercase tracking-wider">Envio Automático Ativo</span>
                      </div>
                      <p className="text-[10px] text-blue-600 leading-tight">
                        A validação será solicitada para <b>Felipe Fernandes</b> e <b>Alex Thalles</b> usando credenciais do sistema.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleCreateTicket} disabled={isCreatingTicket} className="flex-1 h-14 bg-[#003B99] rounded-2xl text-[13px] font-bold uppercase tracking-widest">
                      {isCreatingTicket ? <Loader2 className="animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" /> Criar e Abrir no GLPI</>}
                    </Button>
                    <Button variant="ghost" onClick={() => carregarLookups()} disabled={isLoadingLookups} className="w-14 h-14 rounded-2xl text-gray-400" title="Recarregar">
                      <RefreshCw className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => setShowManualPass(!showManualPass)}
                      className="text-[10px] uppercase font-bold text-[#003B99] tracking-widest flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {showManualPass ? "✕ Usar automação do sistema" : "🔑 Usar minha senha individual do GLPI"}
                    </button>
                    {showManualPass && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-400 font-black">Sua Senha do GLPI</Label>
                        <Input 
                          type="password" 
                          value={glpiPasswordManual} 
                          onChange={e => setGlpiPasswordManual(e.target.value)}
                          placeholder="Digite sua senha..."
                          className="h-12 rounded-xl bg-gray-50 border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => { setIsRelateModalOpen(false); setIsSending(false); setStep("idle"); setShowSuccess(true); }} className="w-full text-[10px] uppercase font-bold text-gray-400 tracking-widest py-2">
                    Pular — só salvar localmente
                  </button>
                </div>
              )}
            </ModalCard>
          </Overlay>
        )}

        {/* Modal: Promoção de Sub-chamado */}
        <GlpiPromoteModal 
          open={isPromoteModalOpen}
          isPromoting={isCreatingTicket}
          apiBaseUrl={API_BASE_URL}
          tomboDefault={tombo}
          onCancel={() => { setIsPromoteModalOpen(false); setIsSending(false); }}
          onConfirm={handlePromoteTicket}
          showManualPass={showManualPass}
          setShowManualPass={setShowManualPass}
          passwordManual={glpiPasswordManual}
          setPasswordManual={setGlpiPasswordManual}
        />

        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/90 backdrop-blur-md p-6">
            <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl max-w-sm w-full border-b-8 border-green-500">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-500 w-16 h-16" />
              </div>
              <h2 className="text-4xl font-bold text-[#1A1A2E] mb-3 uppercase tracking-tighter leading-none">Concluído!</h2>
              <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">
                Dados salvos com sucesso{glpiTicketId ? ` e sincronizados com o chamado #${glpiTicketId}` : ""}.
              </p>

              <div className="space-y-3">
                {glpiTicketId && (
                  <div className="flex items-center justify-center gap-2 mb-4 bg-green-50 text-green-700 py-2 rounded-xl border border-green-100 animate-bounce">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Enviado para o Externo</span>
                  </div>
                )}
                <Button
                  onClick={() => {
                    if (savedPayload) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      gerarLaudoPDF(savedPayload as any, nomeTecnico);
                    }
                  }}
                  className="w-full h-14 bg-white border-2 border-[#003B99] text-[#003B99] rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50"
                >
                  <Printer className="w-5 h-5" /> Gerar e Imprimir PDF
                </Button>

                {glpiTicketId && (
                  <button
                    onClick={() => window.open(`${GLPI_BASE_URL}${glpiTicketId}`, "_blank")}
                    className="flex items-center justify-center gap-2 w-full h-14 bg-[#003B99] text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-[#003B99]/20"
                  >
                    <ExternalLink className="w-4 h-4" /> Acessar GLPI
                  </button>
                )}

                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tighter">
                    Impressora de Rede: <span className="underline">10.1.15.238</span>
                  </p>
                </div>
              </div>
              <Button className="w-full h-14 bg-[#003B99] rounded-2xl text-[14px] font-bold uppercase tracking-widest" onClick={resetFormulario}>
                Novo Laudo
              </Button>
            </div>
          </motion.div>
        )}

        {/* Visualizador de Imagens (Lightbox) */}
        {previewIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-4 lg:p-10"
            onClick={() => { setPreviewIndex(null); setIsZoomed(false); }}
          >
            {/* Header / Controles Superiores */}
            <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-[160]">
              <span className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">
                Evidência {previewIndex + 1} de {imagens.length}
              </span>
              <div className="flex gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                  className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md"
                >
                  <ZoomIn className={`w-5 h-5 transition-transform ${isZoomed ? "scale-125 text-blue-400" : ""}`} />
                </button>
                <button 
                  onClick={() => { setPreviewIndex(null); setIsZoomed(false); }}
                  className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Imagem Principal */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <motion.img 
                key={previewIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                  scale: isZoomed ? 2.5 : 1, 
                  opacity: 1,
                  y: 0,
                  x: 0
                }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                src={imagens[previewIndex].preview} 
                alt="Preview"
                className={`max-w-full max-h-full object-contain select-none ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsZoomed(!isZoomed); 
                }}
                drag={isZoomed}
                dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              />
            </div>

            {/* Navegação Carrossel */}
            {imagens.length > 1 && !isZoomed && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setPreviewIndex(previewIndex === 0 ? imagens.length - 1 : previewIndex - 1);
                    setIsZoomed(false);
                  }}
                  className="w-14 h-14 bg-black/20 rounded-full flex items-center justify-center text-white backdrop-blur-md pointer-events-auto hover:bg-white/10 active:scale-90 transition-all"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setPreviewIndex(previewIndex === imagens.length - 1 ? 0 : previewIndex + 1);
                    setIsZoomed(false);
                  }}
                  className="w-14 h-14 bg-black/20 rounded-full flex items-center justify-center text-white backdrop-blur-md pointer-events-auto hover:bg-white/10 active:scale-90 transition-all"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageLayout>
  );
}
