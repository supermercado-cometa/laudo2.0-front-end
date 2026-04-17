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
  Loader2
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

  const handleSubmitFinal = async () => {
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
        photos: JSON.stringify(photosArray)
      };

      const res = await fetch(`${API_BASE_URL}/info-laudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowSuccess(true);
        gerarLaudoPDF(payload as any, nomeTecnico);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Erro ao enviar: ${errorData.error || "Erro no servidor."}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
      subtitle="O laudo oficial agora é integrado diretamente ao GLPI de forma automática."
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
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número do Chamado (Opcional)</Label>
                <Input value={numeroChamado} onChange={e => setNumeroChamado(e.target.value)} placeholder="Ex: 154230 ou deixe vazio" className="h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] transition-all text-[#1A1A2E]" />
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

          <div className="pt-8">
            <Button 
              disabled={isSubmitting} 
              className="w-full h-16 bg-[#003B99] text-white rounded-[20px] text-[14px] font-bold tracking-[0.1em] uppercase shadow-xl hover:bg-[#0E3D8A] active:scale-95 transition-all flex items-center justify-center gap-3" 
              onClick={handleSubmitFinal}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Finalizar Laudo"}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/90 backdrop-blur-md p-6">
            <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl max-w-sm w-full border-b-8 border-green-500">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-green-500 w-16 h-16" />
              </div>
              <h2 className="text-4xl font-bold text-[#1A1A2E] mb-3 uppercase tracking-tighter leading-none">Concluído!</h2>
              <p className="text-[#6B7280] text-sm mb-10 leading-relaxed font-medium">Os dados foram registrados, o PDF foi gerado e o GLPI será sincronizado automaticamente pelo sistema.</p>
              <Button className="w-full h-16 bg-[#003B99] rounded-2xl text-[15px] font-bold tracking-widest uppercase shadow-lg shadow-[#003B99]/20" onClick={resetFormulario}>Novo Laudo</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageLayout>
  );
}
