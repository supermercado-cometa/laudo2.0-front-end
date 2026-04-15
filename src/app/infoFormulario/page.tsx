"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardCheck, ChevronLeft, ShieldCheck, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { SubPageHeader } from "@/components/subpage-header";
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
  const [equipamentos, setEquipamentos] = useState<{id: number, nome: string, tipo?: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    setDataSistema(new Date().toLocaleString('pt-BR'));
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }
    
    // Verificar se é admin pelo auth/me (mais seguro que localStorage)
    fetch(`${API_BASE_URL}/auth/me`, {
       headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setIsAdmin(data?.user?.isAdmin === true))
    .catch(() => setIsAdmin(false));

    fetch(`${API_BASE_URL}/lojas`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setLojas(data);
        else setLojas([]);
      })
      .catch(() => setLojas([]));

    fetch(`${API_BASE_URL}/equipamentos`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setEquipamentos(data);
        else setEquipamentos([]);
      })
      .catch(() => setEquipamentos([]));
      
    const storedName = localStorage.getItem("fullName");
    if (storedName) setNomeTecnico(storedName);
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImagem(e.target.files[0]);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const signature = sigPadRef.current?.isEmpty() ? null : sigPadRef.current?.toDataURL();

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

      if (res.ok) setShowSuccess(true);
      else alert("Erro ao enviar. Verifique os campos.");
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
    sigPadRef.current?.clear(); setShowSuccess(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Laudo\nTécnico`} icon={ClipboardCheck} hideBack={!isAdmin} />

      {/* Lado Esquerdo (Hero) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        {isAdmin && (
          <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all">
            <ChevronLeft className="w-5 h-5" /> Voltar
          </button>
        )}
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl"><ShieldCheck className="text-white w-10 h-10" /></div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full" />
          <h1 className="text-white text-[48px] lg:font-medium font-[800] uppercase tracking-tight mb-8 leading-[1.1]">{`Laudo\nTécnico`}</h1>
          <p className="text-white/70 text-lg font-medium">Preenchimento obrigatório para conformidade técnica GLPI e histórico de ativos.</p>
        </div>
      </div>

      {/* Lado Direito (Formulário Integral) */}
      <div className="flex-1 lg:w-[65%] p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto pb-20">
          <AnimatePresence>
            {showSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/90 backdrop-blur-md p-6">
                 <div className="bg-white rounded-[32px] p-10 text-center shadow-2xl max-w-sm w-full">
                    <CheckCircle2 className="text-green-500 w-20 h-20 mx-auto mb-6" />
                    <h2 className="text-3xl lg:font-medium font-[800] text-[#1A1A2E] mb-2 uppercase tracking-tighter">Sucesso!</h2>
                    <p className="text-[#6B7280] font-medium mb-8">Todos os dados foram registrados no banco de dados.</p>
                    <Button className="w-full h-18 bg-[#003B99] rounded-2xl text-[15px] lg:font-medium font-[800] tracking-widest uppercase" onClick={resetFormulario}>Novo Laudo</Button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="bg-white rounded-[32px] shadow-sm border-none">
            <CardContent className="p-8 lg:p-12 space-y-12">
               
               {/* 1. SEÇÃO DE DADOS (CONFORME IMAGEM) */}
               <div className="space-y-10">
                  <div className="border-l-4 border-[#003B99] pl-4"><h3 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800] tracking-tighter uppercase leading-none">Informações do Laudo</h3></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Número do Chamado</Label>
                        <Input value={numeroChamado} onChange={e => setNumeroChamado(e.target.value)} placeholder="Somente números" className="h-16 rounded-2xl bg-gray-50 border-none font-medium text-gray-600" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Nome do Técnico</Label>
                        <Input value={nomeTecnico} onChange={e => setNomeTecnico(e.target.value)} className="h-16 rounded-2xl bg-gray-50 border-none font-medium text-gray-600" />
                     </div>
                      <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Equipamento</Label>
                        <select value={equipamento} onChange={e => setEquipamento(e.target.value)} className="w-full h-16 rounded-2xl bg-gray-50 border-none px-6 font-medium text-gray-600 appearance-none">
                           <option value="">Selecione...</option>
                           {equipamentos.map(e => (
                             <option key={e.id} value={e.nome}>{e.nome}{e.tipo ? ` - ${e.tipo}` : ''}</option>
                           ))}
                        </select>
                      </div>
                     <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Loja</Label>
                        <select value={loja} onChange={e => setLoja(e.target.value)} className="w-full h-16 rounded-2xl bg-gray-50 border-none px-6 font-medium text-gray-600 appearance-none">
                           <option value="">Selecione...</option>
                           {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Tombo</Label>
                        <Input value={tombo} onChange={e => setTombo(e.target.value)} placeholder="Somente números" className="h-16 rounded-2xl bg-gray-50 border-none font-medium text-gray-600" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Modelo</Label>
                        <select value={modelo} onChange={e => setModelo(e.target.value)} className="w-full h-16 rounded-2xl bg-gray-50 border-none px-6 font-medium text-gray-600 appearance-none">
                           <option value="">Selecione...</option>
                           <option value="Padrão">Padrão</option><option value="Específico">Específico</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Setor</Label>
                        <Input value={setor} onChange={e => setSetor(e.target.value)} className="h-16 rounded-2xl bg-gray-50 border-none font-medium text-gray-600" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Data Atual do Sistema</Label>
                        <Input value={dataSistema} disabled className="h-16 rounded-2xl bg-gray-100 border-none lg:sm:font-medium font-black text-gray-400" />
                     </div>
                  </div>
               </div>

               {/* 2. SEÇÃO IMAGEM (CONFORME IMAGEM) */}
               <div className="space-y-6 pt-10 border-t border-gray-100">
                  <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Imagem do Equipamento</Label>
                  <div className="flex flex-col md:flex-row items-center gap-6 p-8 rounded-[32px] bg-gray-100 border-2 border-dashed border-gray-200 relative group">
                     {imagem ? (
                        <div className="flex flex-col items-center gap-4">
                           <ImageIcon className="w-12 h-12 text-[#003B99]" />
                           <span className="text-gray-600 lg:font-medium font-black text-xs uppercase tracking-widest">{imagem.name}</span>
                           <Button variant="ghost" className="text-red-500 lg:font-medium font-black uppercase text-[10px]" onClick={() => setImagem(null)}><Trash2 className="w-4 h-4 mr-2" /> Limpar Imagem</Button>
                        </div>
                     ) : (
                        <>
                           <ImageIcon className="w-10 h-10 text-gray-300" />
                           <div className="text-center md:text-left"><p className="text-gray-500 font-bold">Escolher arquivo</p><span className="text-gray-400 text-xs italic">Nenhum arquivo escolhido</span></div>
                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                        </>
                     )}
                  </div>
               </div>

               {/* 3. TESTES E DIAGNÓSTICO (CONFORME IMAGEM) */}
               <div className="space-y-10 pt-10 border-t border-gray-100">
                  <div className="space-y-3">
                     <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Testes realizados</Label>
                     <textarea value={testesRealizados} onChange={e => setTestesRealizados(e.target.value)} className="w-full min-h-[140px] rounded-2xl bg-gray-50 border-none p-6 font-medium text-gray-600" placeholder="Descreva os testes executados" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Diagnóstico do equipamento</Label>
                     <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="w-full min-h-[140px] rounded-2xl bg-gray-50 border-none p-6 font-medium text-gray-600" placeholder="Descreva o diagnóstico" />
                  </div>
               </div>

               {/* 4. ESTADO E NECESSIDADE (CONFORME IMAGEM) */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-gray-100">
                  <div className="space-y-3">
                     <Label className="text-[#4B5563] text-[13px] font-medium uppercase">Estado do equipamento</Label>
                     <select value={estadoEquipamento} onChange={e => setEstadoEquipamento(e.target.value)} className="w-full h-16 rounded-2xl bg-gray-50 border-none px-6 font-medium text-gray-600 appearance-none">
                        <option value="">Selecione...</option>
                        <option value="Funcionando">Funcionando</option><option value="Não funcionando">Não funcionando</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[#4B5563] text-[13px] font-medium uppercase">O equipamento necessita</Label>
                     <select value={necessidade} onChange={e => setNecessidade(e.target.value)} className="w-full h-16 rounded-2xl bg-gray-50 border-none px-6 font-medium text-gray-600 appearance-none">
                        <option value="">Selecione...</option>
                        <option value="Ser substituído">Ser substituído</option><option value="Enviado p/ conserto">Enviado p/ conserto</option><option value="Ser descartado">Ser descartado</option>
                     </select>
                  </div>
               </div>

               {/* 5. ASSINATURA (CONFORME IMAGEM) */}
               <div className="space-y-8 pt-10 border-t border-gray-100">
                  <Label className="text-[#4B5563] text-[13px] font-medium uppercase text-center block">Assinatura</Label>
                  <div className="border border-dashed border-gray-300 rounded-[32px] overflow-hidden bg-gray-50"><SignatureCanvas ref={sigPadRef} canvasProps={{ className: "w-full h-64" }} /></div>
                  <button onClick={() => sigPadRef.current?.clear()} className="w-full text-xs lg:font-medium font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Limpar Assinatura</button>
               </div>

               {/* BOTÃO FINALIZAR */}
               <div className="pt-6">
                  <Button disabled={isSubmitting} className="w-full h-20 bg-[#003B99] text-white rounded-2xl text-[16px] lg:font-medium font-[800] tracking-widest uppercase shadow-xl hover:bg-[#0A2D66]" onClick={handleSubmit}>
                     {isSubmitting ? <Loader2 className="animate-spin" /> : "Finalizar e Enviar para GLPI"}
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
