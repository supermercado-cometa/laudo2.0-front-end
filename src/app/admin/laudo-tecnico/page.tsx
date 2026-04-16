"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardCheck, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { API_BASE_URL } from "@/lib/api-config";

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
  const [imagem, setImagem] = useState<File | null>(null);
  const [testesRealizados, setTestesRealizados] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [estadoEquipamento, setEstadoEquipamento] = useState("");
  const [necessidade, setNecessidade] = useState("");

  const [lojas, setLojas] = useState<LojaType[]>([]);
  const [equipamentos, setEquipamentos] = useState<{ id: number, nome: string, tipo?: string }[]>([]);
  const [setores, setSetores] = useState<{ id: number, nome: string }[]>([]);
  const [modelos, setModelos] = useState<{ id: number, nome: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    setDataSistema(new Date().toLocaleString('pt-BR'));
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }

    // Buscar dados do usuário (incluindo assinatura salva)
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.user?.signature) {
          setSavedSignature(data.user.signature);
        }
      })
      .catch(() => {});

    // Buscar dados auxiliares
    const fetchData = async (endpoint: string, setter: (data: never[]) => void) => {
      try {
        const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setter(data);
        }
      } catch (err) {
        console.error(`Erro ao buscar ${endpoint}:`, err);
      }
    };

    fetchData("lojas", setLojas);
    fetchData("modelos", setModelos);
    fetchData("equipamentos", setEquipamentos);
    fetchData("setores", setSetores);

    const storedName = localStorage.getItem("fullName");
    if (storedName) {
      setNomeTecnico(storedName);
    }
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImagem(e.target.files[0]);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      
      let signature = savedSignature;
      
      // Se estiver redesenhando ou não tiver assinatura salva, tenta pegar do canvas
      if (isRedrawing || !savedSignature) {
        const canvasSignature = sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL() || null;
        if (canvasSignature) {
          signature = canvasSignature;
          // Salva a nova assinatura no perfil do usuário
          await fetch(`${API_BASE_URL}/auth/save-signature`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : ""
            },
            body: JSON.stringify({ signature: canvasSignature })
          });
          setSavedSignature(canvasSignature);
          setIsRedrawing(false);
        }
      }

      const payload = {
        numeroChamado, nomeTecnico, equipamento, loja, tombo, modelo, setor,
        testesRealizados, diagnostico, estadoEquipamento, necessidade, signature
      };

      const res = await fetch(`${API_BASE_URL}/info-laudos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowSuccess(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Erro ao enviar: ${errorData.error || "Verifique a conexão com o servidor."}`);
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
    setEstadoEquipamento(""); setNecessidade(""); setImagem(null);
    sigPadRef.current?.clear(); 
    setShowSuccess(false);
    setIsRedrawing(false);
  };

  return (
    <AdminPageLayout
      title={`Laudo\nTécnico`}
      subtitle="Preencha as informações do equipamento e realize a assinatura digital para gerar o laudo técnico."
      icon={ClipboardCheck}
      backUrl="/admin"
    >
      <div className="bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-12 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] tracking-tighter uppercase leading-none">
            Informações do Equipamento
          </h2>
        </div>
        
        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/90 backdrop-blur-md p-6">
              <div className="bg-white rounded-[32px] p-10 text-center shadow-2xl max-w-sm w-full">
                <CheckCircle2 className="text-green-500 w-20 h-20 mx-auto mb-6" />
                <h2 className="text-3xl text-[#1A1A2E] mb-2 uppercase tracking-tighter">Sucesso!</h2>
                <p className="text-[#6B7280] mb-8">Todos os dados foram registrados e o laudo foi gerado.</p>
                <Button className="w-full h-16 bg-[#003B99] rounded-2xl text-[15px] tracking-widest uppercase hover:bg-[#0E3D8A]" onClick={resetFormulario}>Novo Laudo</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-12">
          {/* Seção 1: Dados do Laudo */}
          <div className="space-y-8">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Dados Gerais</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número do Chamado</Label>
                <Input value={numeroChamado} onChange={e => setNumeroChamado(e.target.value)} placeholder="Somente números" className="h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] transition-all text-[#1A1A2E] placeholder:text-gray-300" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Nome do Técnico</Label>
                <Input value={nomeTecnico} onChange={e => setNomeTecnico(e.target.value)} className="h-12 rounded-xl bg-gray-100 border-none text-gray-400 cursor-not-allowed" disabled />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Equipamento</Label>
                <select value={equipamento} onChange={e => setEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione o equipamento...</option>
                  {equipamentos.map(e => (
                    <option key={e.id} value={e.nome}>{e.nome}{e.tipo ? ` - ${e.tipo}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Loja</Label>
                <select value={loja} onChange={e => setLoja(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione a loja...</option>
                  {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Número de Tombo</Label>
                <Input value={tombo} onChange={e => setTombo(e.target.value)} placeholder="Número de série/tombo" className="h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] transition-all text-[#1A1A2E] placeholder:text-gray-300" />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Modelo</Label>
                <select value={modelo} onChange={e => setModelo(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione o modelo...</option>
                  {modelos.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Setor</Label>
                <select value={setor} onChange={e => setSetor(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                  <option value="">Selecione o setor...</option>
                  {setores.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Data do Sistema</Label>
                <Input value={dataSistema} disabled className="h-12 rounded-xl bg-gray-100 border-none text-gray-400" />
              </div>
            </div>
          </div>

          {/* Seção 2: Imagem do Ativo */}
          <div className="space-y-6 pt-10 border-t border-gray-100">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Mídia do Ativo</h3>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 p-10 rounded-[32px] bg-gray-50 border-2 border-dashed border-gray-200 relative group transition-all hover:bg-white hover:border-[#003B99]/30">
              {imagem ? (
                <div className="flex flex-col items-center gap-4 w-full text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <span className="text-gray-700 text-sm uppercase">{imagem.name}</span>
                  <Button variant="ghost" className="text-red-500 hover:bg-red-50 uppercase text-[12px]" onClick={() => setImagem(null)}><Trash2 className="w-4 h-4 mr-2" /> Remover Imagem</Button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-[#003B99]/30" />
                  <div className="text-center md:text-left">
                    <p className="text-[#1A1A2E] text-lg">Anexar foto do equipamento</p>
                    <span className="text-gray-400 text-sm">Clique ou arraste o arquivo aqui</span>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                </>
              )}
            </div>
          </div>

          {/* Seção 3: Diagnóstico */}
          <div className="space-y-10 pt-10 border-t border-gray-100">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Diagnóstico Técnico</h3>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Testes Realizados</Label>
                <textarea value={testesRealizados} onChange={e => setTestesRealizados(e.target.value)} className="w-full min-h-[140px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1A4CAB] focus:bg-white transition-all placeholder:text-gray-300" placeholder="Descreva detalhadamente os testes executados..." />
              </div>
              <div className="space-y-3">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Diagnóstico Final</Label>
                <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="w-full min-h-[140px] rounded-xl bg-gray-50 border-none p-6 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#1A4CAB] focus:bg-white transition-all placeholder:text-gray-300" placeholder="Descreva a conclusão técnica sobre o estado do ativo..." />
              </div>
            </div>
          </div>

          {/* Seção 4: Estado e Ação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-gray-100">
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Estado do Equipamento</Label>
              <select value={estadoEquipamento} onChange={e => setEstadoEquipamento(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                <option value="">Selecione...</option>
                <option value="Funcionando">Funcionando</option>
                <option value="Não funcionando">Não funcionando</option>
              </select>
            </div>
            <div className="space-y-3">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">O Ativo Necessita</Label>
              <select value={necessidade} onChange={e => setNecessidade(e.target.value)} className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]">
                <option value="">Selecione a recomendação...</option>
                <option value="Ser substituído">Ser substituído</option>
                <option value="Enviado p/ conserto">Enviado p/ conserto</option>
                <option value="Ser descartado">Ser descartado</option>
              </select>
            </div>
          </div>

          {/* Seção 5: Assinatura Digital */}
          <div className="space-y-8 pt-10 border-t border-gray-100">
            <div className="border-l-4 border-[#003B99] pl-4">
              <h3 className="text-[#1A1A2E] text-[20px] tracking-tight uppercase">Assinatura Digital</h3>
            </div>
            
            {savedSignature && !isRedrawing ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="border border-dashed border-gray-300 rounded-[32px] overflow-hidden bg-white p-6 flex justify-center items-center w-full min-h-[200px] shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={savedSignature} alt="Assinatura Digital Salva" className="max-h-[160px] object-contain" />
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsRedrawing(true)} 
                  className="rounded-xl border-[#003B99] text-[#003B99] hover:bg-[#003B99]/5 uppercase"
                >
                  Substituir Assinatura
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-[32px] overflow-hidden bg-white shadow-inner">
                  <SignatureCanvas 
                    ref={sigPadRef} 
                    canvasProps={{ className: "w-full h-64 cursor-crosshair" }} 
                  />
                </div>
                <div className="flex justify-between items-center px-4">
                  <button onClick={() => sigPadRef.current?.clear()} className="text-[13px] uppercase text-red-400 hover:text-red-600 transition-colors">Limpar Tela</button>
                  {savedSignature && (
                    <button onClick={() => setIsRedrawing(false)} className="text-[13px] uppercase text-gray-400 hover:text-[#003B99] transition-colors">Usar Assinatura Salva</button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BOTÃO FINALIZAR */}
          <div className="pt-8 w-full">
            <Button 
              disabled={isSubmitting} 
              className="w-full h-12 bg-[#1A4CAB] text-white rounded-xl text-[11px] tracking-[0.2em] uppercase shadow-lg shadow-[#003B99]/10 hover:bg-[#003B99] active:scale-95 transition-all flex items-center justify-center gap-3" 
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span>Processando...</span>
                </div>
              ) : (
                "Finalizar e Registrar Laudo"
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
