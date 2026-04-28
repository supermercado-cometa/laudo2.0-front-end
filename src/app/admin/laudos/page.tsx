"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText, Search, ChevronLeft, Loader2, Printer, Calendar,
  Trash2, CheckCircle2, Circle, X, User, Monitor,
  MapPin, ClipboardCheck, Hash, Image as ImageIcon,
  Pencil, Save, XCircle
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
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      } else {
        reject(new Error("Não foi possível obter o contexto do canvas"));
      }
    };
    img.onerror = (err) => reject(err);
  });

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mt-0.5 shadow-sm border border-gray-100 flex-shrink-0">
        <Icon className="w-4 h-4 text-[#003B99]" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-[#1A1A2E] text-sm font-bold leading-tight">{value || "—"}</p>
      </div>
    </div>
  );
}

function PhotoGallery({ jsonPhotos }: { jsonPhotos: string }) {
  let photos: string[] = [];
  try {
    const parsed = JSON.parse(jsonPhotos);
    if (Array.isArray(parsed)) photos = parsed;
    else if (typeof parsed === "string") photos = [parsed];
  } catch { photos = [jsonPhotos]; }

  if (photos.length === 0)
    return <p className="text-gray-400 text-xs uppercase">Nenhuma foto anexada.</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map((p, i) => (
        <motion.a key={i} href={p} target="_blank" rel="noopener noreferrer"
          whileHover={{ scale: 1.04 }}
          className="aspect-square relative rounded-2xl overflow-hidden border border-gray-100 bg-white block"
        >
          <img src={p} alt={`Evidência ${i + 1}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow" />
          </div>
        </motion.a>
      ))}
    </div>
  );
}

// ─── Painel de Detalhes / Edição ──────────────────────────────────────────────
function DetailPanel({
  laudo, onClose, onDelete, onSave, allLaudos
}: {
  laudo: Laudo;
  onClose: () => void;
  onDelete: (id: number) => void;
  onSave: (updated: Laudo) => void;
  allLaudos: Laudo[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Laudo>({ ...laudo });
  const [normalizedSignature, setNormalizedSignature] = useState(laudo.signature);

  // Pega laudos que têm o mesmo número de chamado
  const related = laudo.numeroChamado 
    ? allLaudos.filter(l => l.numeroChamado === laudo.numeroChamado && l.id !== laudo.id)
    : [];

  useEffect(() => { 
    setForm({ ...laudo }); 
    setIsEditing(false); 
    
    // Normaliza a assinatura ao abrir/mudar de laudo
    if (laudo.signature) {
      compressImage(laudo.signature, 800, 0.9)
        .then(setNormalizedSignature)
        .catch(() => setNormalizedSignature(laudo.signature));
    } else {
      setNormalizedSignature(undefined);
    }
  }, [laudo]);

  const field = (key: keyof Laudo, label: string, type: "input" | "textarea" | "select" = "input", opts?: string[]) => (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{label}</label>
      {!isEditing ? (
        <p className="text-[#1A1A2E] text-sm font-bold">{String(form[key] || "—")}</p>
      ) : type === "textarea" ? (
        <textarea
          value={String(form[key] ?? "")}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full min-h-[80px] rounded-xl bg-gray-50 border-none p-4 text-[#1A1A2E] text-sm focus:ring-2 focus:ring-[#1A4CAB] shadow-inner"
        />
      ) : type === "select" && opts ? (
        <select
          value={String(form[key] ?? "")}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full h-10 rounded-xl bg-gray-50 border-none px-3 text-[#1A1A2E] text-sm appearance-none"
        >
          <option value="">—</option>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <Input
          value={String(form[key] ?? "")}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="h-10 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-[#1A4CAB]"
        />
      )}
    </div>
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/info-laudos/${laudo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        setIsEditing(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Erro ao salvar: ${err.error || "Erro no servidor"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[620px] bg-white z-50 shadow-2xl flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-8 pt-8 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#003B99]/5 rounded-xl flex items-center justify-center">
                <FileText className="text-[#003B99] w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[#1A1A2E] text-[20px] uppercase tracking-tighter font-black">Laudo #{laudo.id}</h3>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">{laudo.data}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003B99]/5 text-[#003B99] rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#003B99]/10 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              ) : (
                <>
                  <button onClick={() => { setIsEditing(false); setForm({ ...laudo }); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                    <XCircle className="w-3.5 h-3.5" /> Cancelar
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {isSaving ? "Salvando..." : "Salvar"}
                  </button>
                </>
              )}
              <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all ml-1">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
          {isEditing && (
            <div className="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-700 text-[11px] font-bold uppercase tracking-widest">✏ Modo de edição ativado — altere os campos e clique em Salvar</p>
            </div>
          )}
        </div>

        <div className="flex-1 px-8 py-8 space-y-10">
          {/* Seção: Informações Gerais */}
          <div className="space-y-6">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h4 className="text-[13px] uppercase text-[#1A1A2E] font-black tracking-widest">Informações Gerais</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl">
              {field("numeroChamado", "Chamado")}
              {field("tecnico", "Técnico")}
              {field("equipamento", "Equipamento")}
              {field("loja", "Loja")}
              {field("setor", "Setor")}
              {field("tombo", "Tombo")}
              {field("modelo", "Modelo")}
            </div>
          </div>

          {/* Seção: Diagnóstico */}
          <div className="space-y-6">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h4 className="text-[13px] uppercase text-[#1A1A2E] font-black tracking-widest">Diagnóstico Técnico</h4>
            </div>
            <div className="space-y-5">
              <div className={`p-6 rounded-3xl border ${isEditing ? "border-[#003B99]/20 bg-white" : "bg-white border-gray-100"} shadow-sm`}>
                {field("testesRealizados", "Testes Realizados", "textarea")}
              </div>
              <div className={`p-6 rounded-3xl border ${isEditing ? "border-[#003B99]/20 bg-white" : "bg-white border-gray-100"} shadow-sm`}>
                {field("diagnostico", "Diagnóstico Final", "textarea")}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 rounded-3xl">
                  {field("estadoEquipamento", "Estado", "select", ["FUNCIONANDO", "NAO_FUNCIONANDO"])}
                </div>
                <div className="p-6 bg-[#FECC00]/5 rounded-3xl border border-[#FECC00]/20">
                  {field("necessidade", "Ação Recomendada", "select", ["SUBSTITUIDO", "ENVIAR_CONSERTO", "DESCARTADO"])}
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Fotos */}
          {laudo.photos && (
            <div className="space-y-6">
              <div className="border-l-4 border-[#003B99] pl-4">
                <h4 className="text-[13px] uppercase text-[#1A1A2E] font-black tracking-widest">Evidências Fotográficas</h4>
              </div>
              <PhotoGallery jsonPhotos={laudo.photos} />
            </div>
          )}

          {/* Seção: Assinatura */}
          {laudo.signature && (
            <div className="space-y-6">
              <div className="border-l-4 border-[#003B99] pl-4">
                <h4 className="text-[13px] uppercase text-[#1A1A2E] font-black tracking-widest">Assinatura</h4>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-10 rounded-3xl border border-dashed border-gray-200">
                <img src={normalizedSignature} alt="Assinatura" className="max-h-24 mix-blend-multiply" />
                <div className="mt-4 w-32 h-[1px] bg-gray-300" />
                <p className="text-[10px] uppercase font-black text-gray-400 mt-2 tracking-widest">{laudo.tecnico}</p>
              </div>
            </div>
          )}

          {/* Seção: Histórico do Chamado (Relacionados) */}
          {related.length > 0 && (
            <div className="space-y-6">
              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="text-[13px] uppercase text-[#1A1A2E] font-black tracking-widest">Histórico do Chamado #{laudo.numeroChamado}</h4>
                <p className="text-[10px] text-gray-400 uppercase font-black">Outros laudos vinculados a este mesmo número</p>
              </div>
              <div className="space-y-3">
                {related.map(r => (
                  <div key={r.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between group hover:bg-blue-50 transition-all">
                    <div>
                      <p className="text-[11px] font-black text-[#003B99] uppercase tracking-tighter">Laudo #{r.id} — {r.equipamento}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{r.tecnico} · {r.data}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { const n = localStorage.getItem("fullName") || ""; gerarLaudoPDF(r, n); }}
                      className="h-8 rounded-lg text-[9px] uppercase font-black tracking-widest bg-white border border-blue-100 text-[#003B99]"
                    >
                      <Printer className="w-3 h-3 mr-1" /> PDF
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações do Rodapé */}
          <div className="flex gap-3 pt-4 pb-16">
            <Button
              onClick={() => { 
                const n = localStorage.getItem("fullName") || ""; 
                gerarLaudoPDF({ ...laudo, signature: normalizedSignature || laudo.signature }, n); 
              }}
              className="flex-1 h-14 bg-[#003B99] rounded-2xl text-[13px] font-black uppercase tracking-widest gap-2"
            >
              <Printer className="w-4 h-4" /> Exportar PDF
            </Button>
            <Button
              variant="ghost"
              onClick={() => { if (confirm(`Excluir laudo #${laudo.id}?`)) onDelete(laudo.id); }}
              className="w-14 h-14 rounded-2xl text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function LaudosGeradosPage() {
  const router = useRouter();
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingLaudo, setViewingLaudo] = useState<Laudo | null>(null);

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

      const res = await fetch(`${API_BASE_URL}/info-laudos?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        cache: "no-store"
      });
      if (res.ok) setLaudos(await res.json() || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [tecnicoFilter, chamadoFilter, dataInicio, dataFim, tomboFilter]);

  useEffect(() => { fetchLaudos(); }, [fetchLaudos]);

  const handleToggleSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/info-laudos/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setLaudos(p => p.filter(l => l.id !== id));
      setSelectedIds(p => p.filter(i => i !== id));
      if (viewingLaudo?.id === id) setViewingLaudo(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Excluir ${selectedIds.length} laudos?`)) return;
    const token = localStorage.getItem("token");
    await Promise.all(selectedIds.map(id =>
      fetch(`${API_BASE_URL}/info-laudos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
    ));
    fetchLaudos();
    setSelectedIds([]);
    setViewingLaudo(null);
  };

  const handleSaveEdit = (updated: Laudo) => {
    setLaudos(prev => prev.map(l => l.id === updated.id ? updated : l));
    setViewingLaudo(updated);
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9] relative">
      <SubPageHeader title={`Laudos\nGerados`} icon={FileText} />

      {/* Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center sticky top-0 h-screen shadow-2xl overflow-hidden">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <FileText className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full" />
          <h1 className="text-white text-[48px] leading-[1.1] uppercase tracking-tight mb-8">Histórico de Laudos</h1>
          <p className="text-white/70 text-lg">Consulte, filtre, edite e exporte todos os laudos técnicos emitidos pela equipe.</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto pb-20">
          <h2 className="text-[#1A1A2E] text-[32px] tracking-tighter mb-8 uppercase">Laudos Gerados</h2>

          {/* Filtros */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm rounded-[32px] p-8 shadow-xl space-y-8 mb-10 border border-gray-100 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-400">Técnico</Label>
                <Input value={tecnicoFilter} onChange={e => setTecnicoFilter(e.target.value)} placeholder="Nome do técnico" className="h-14 bg-gray-50 border-none rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-400">Chamado</Label>
                <Input value={chamadoFilter} onChange={e => setChamadoFilter(e.target.value)} placeholder="Número do chamado" className="h-14 bg-gray-50 border-none rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-400">Tombo</Label>
                <Input value={tomboFilter} onChange={e => setTomboFilter(e.target.value)} placeholder="Número do tombo" className="h-14 bg-gray-50 border-none rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-400">Data Inicial</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-14 bg-gray-50 border-none rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-400">Data Final</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-14 bg-gray-50 border-none rounded-xl" />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchLaudos} className="w-full h-14 bg-[#003B99] rounded-xl uppercase tracking-widest gap-2 shadow-lg shadow-[#003B99]/20 hover:bg-[#0A2D66]">
                  <Search className="w-5 h-5" /> Pesquisar
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSelectedIds(laudos.map(l => l.id))} className="h-12 rounded-xl text-xs uppercase tracking-widest border-gray-100">Marcar todos</Button>
              <Button variant="outline" onClick={() => setSelectedIds([])} className="h-12 rounded-xl text-xs uppercase tracking-widest border-gray-100">Desmarcar</Button>
              <Button onClick={handleDeleteSelected} disabled={!selectedIds.length} variant="destructive" className="h-12 rounded-xl text-xs uppercase tracking-widest gap-2">
                <Trash2 className="w-4 h-4" /> Excluir selecionados ({selectedIds.length})
              </Button>
            </div>
          </div>

          {/* Lista */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
              <p className="text-gray-400 uppercase text-xs tracking-widest">Carregando...</p>
            </div>
          ) : laudos.length === 0 ? (
            <div className="p-20 bg-white rounded-[32px] text-center border-2 border-dashed border-gray-200">
              <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 uppercase text-xs tracking-widest">Nenhum laudo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {laudos.map(item => (
                <div
                  key={item.id}
                  onClick={() => setViewingLaudo(item)}
                  className={`relative bg-white rounded-[32px] p-8 shadow-sm border-2 transition-all cursor-pointer group ${selectedIds.includes(item.id) ? "border-[#003B99]" : "border-transparent hover:border-gray-200 hover:shadow-xl hover:shadow-black/5"}`}
                >
                  <div className="absolute top-8 right-8" onClick={e => handleToggleSelect(e, item.id)}>
                    {selectedIds.includes(item.id)
                      ? <CheckCircle2 className="w-8 h-8 text-[#003B99]" />
                      : <Circle className="w-8 h-8 text-gray-100 group-hover:text-gray-200" />
                    }
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#003B99]" />
                        <p className="text-[#1A1A2E] text-[18px] uppercase tracking-tight font-bold">
                          {item.numeroChamado ? `Chamado: ${item.numeroChamado}` : "Sem chamado"}
                        </p>
                      </div>
                      <p className="text-gray-500 uppercase text-[10px] tracking-widest">Técnico: <span className="text-[#1A1A2E] font-medium">{item.tecnico}</span></p>
                      <p className="text-gray-500 uppercase text-[10px] tracking-widest">Equip.: <span className="text-[#1A1A2E] font-medium">{item.equipamento}{item.modelo !== "Sem Modelo" ? ` - ${item.modelo}` : ""}</span></p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-gray-500 uppercase text-[10px] tracking-widest">Loja: <span className="text-[#1A1A2E] font-medium">{item.loja}</span> · <span className="text-[#1A1A2E] font-medium">{item.setor}</span></p>
                      <p className="text-gray-500 uppercase text-[10px] tracking-widest">Tombo: <span className="text-[#1A1A2E] font-medium">{item.tombo}</span></p>
                      <div className="flex items-center gap-2 text-gray-400 uppercase text-[10px] tracking-widest">
                        <Calendar className="w-3.5 h-3.5" /> {item.data}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                    <span className="mr-auto text-[10px] text-[#003B99] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <Pencil className="w-3 h-3" /> Ver / Editar
                    </span>
                    <Button
                      onClick={e => { e.stopPropagation(); const n = localStorage.getItem("fullName") || ""; gerarLaudoPDF(item, n); }}
                      className="h-10 px-5 bg-[#003B99] hover:bg-[#0A2D66] rounded-lg uppercase tracking-wider text-[11px] gap-2"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={e => { e.stopPropagation(); if (confirm(`Excluir laudo #${item.id}?`)) handleDelete(item.id); }}
                      className="w-10 h-10 rounded-lg text-red-500 hover:bg-red-50 p-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel Lateral de Detalhes + Edição */}
      <AnimatePresence>
        {viewingLaudo && (
          <DetailPanel
            laudo={viewingLaudo}
            onClose={() => setViewingLaudo(null)}
            onDelete={handleDelete}
            onSave={handleSaveEdit}
            allLaudos={laudos}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
