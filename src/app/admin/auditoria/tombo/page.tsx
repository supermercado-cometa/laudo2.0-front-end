"use client";

import React, { useState } from "react";
import { Loader2, ShieldCheck, Monitor, Store, Hash } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuditoriaResumo {
  tombo: string;
  equipamento: string;
  modelo: string;
  loja: string;
  setor: string;
  totalLaudos: number;
  chamadosAtrelados?: string[];
}

export default function AuditoriaTomboPage() {
  const [tombo, setTombo] = useState("");
  const [resultado, setResultado] = useState<AuditoriaResumo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!tombo) return;
    try {
      setIsLoading(true);
      setError("");
      setResultado(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auditoria/tombo/${tombo}`, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        cache: "no-store"
      });
      
      if (res.ok) {
        setResultado(await res.json());
      } else {
        setError("Equipamento não localizado na base de laudos.");
      }
    } catch {
      setError("Erro ao consultar base de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminPageLayout
      title={`Auditoria por\nNúmero de Tombo`}
      subtitle="Localize o histórico completo e a situação atual de qualquer ativo da rede através da etiqueta de patrimônio."
      icon={ShieldCheck}
      backUrl="/admin"
    >
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 lg:p-12 shadow-sm border border-blue-50">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 space-y-3 w-full">
              <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Patrimônio / Tombo</Label>
              <div className="relative group">
                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-[#1A4CAB] transition-colors" />
                <Input 
                  value={tombo} 
                  onChange={e => setTombo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ex: 123456" 
                  className="h-12 pl-14 bg-gray-50 border-none rounded-xl text-lg text-[#1A1A2E] focus:bg-white focus:ring-2 focus:ring-[#1A4CAB]/10 transition-all" 
                />
              </div>
            </div>
            <Button 
              onClick={handleSearch}
              className="h-12 px-10 bg-[#1A4CAB] text-white rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-[#003B99]/10 hover:bg-[#003B99] w-full md:w-auto active:scale-95 transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Consultar Patrimônio"}
            </Button>
          </div>

          {error && <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100/50 text-red-500 text-sm uppercase tracking-widest text-center">{error}</div>}

          {resultado && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Card Equipamento */}
                 <div className="bg-gray-50/50 rounded-[24px] p-8 border border-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-[#1A4CAB] flex items-center justify-center text-white"><Monitor className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Ativo Identificado</p>
                        <h4 className="text-[#1A1A2E] text-lg leading-tight">{resultado.equipamento}</h4>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-4">
                         <span className="text-gray-400 uppercase text-[10px] tracking-widest">Modelo</span>
                         <span className="text-[#1A1A2E]">{resultado.modelo}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-400 uppercase text-[10px] tracking-widest">Histórico</span>
                         <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] uppercase tracking-widest">{resultado.totalLaudos} Laudos Gerados</span>
                       </div>
                    </div>
                 </div>

                 {/* Card Localização */}
                 <div className="bg-gray-50/50 rounded-[24px] p-8 border border-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-[#FECC00] flex items-center justify-center text-[#1A1A2E]"><Store className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Localização Atual</p>
                        <h4 className="text-[#1A1A2E] text-lg leading-tight">{resultado.loja}</h4>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-4">
                         <span className="text-gray-400 uppercase text-[10px] tracking-widest">Setor / Área</span>
                         <span className="text-[#1A1A2E]">{resultado.setor}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-4">
                         <span className="text-gray-400 uppercase text-[10px] tracking-widest">Status de Auditoria</span>
                         <span className="text-[#003B99] text-[10px] uppercase tracking-widest">Mapeado via CRM</span>
                       </div>
                       <div className="flex justify-between items-start text-sm pt-2">
                         <span className="text-gray-400 uppercase text-[10px] tracking-widest">Chamados Atrelados</span>
                         <div className="flex flex-col gap-1 items-end">
                           {resultado.chamadosAtrelados && resultado.chamadosAtrelados.length > 0 ? (
                             resultado.chamadosAtrelados.map((num, i) => (
                               <span key={i} className="px-3 py-1 bg-blue-100 text-[#0066FF] rounded-md text-[10px] uppercase font-bold tracking-widest cursor-pointer hover:bg-blue-200 transition-colors">
                                 #GLPI-{num}
                               </span>
                             ))
                           ) : (
                             <span className="text-gray-300 text-[10px] uppercase tracking-widest">Nenhum</span>
                           )}
                         </div>
                       </div>
                    </div>
                 </div>
              </div>

               {/* Ações de Auditoria */}
               <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      if (!confirm("Deseja solicitar o recolhimento deste equipamento para despacho?")) return;
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${API_BASE_URL}/glpi/ticket/recollect`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
                          body: JSON.stringify({
                            tombo: resultado.tombo,
                            equipamento: resultado.equipamento,
                            loja: resultado.loja,
                            setor: resultado.setor
                          })
                        });
                        if (res.ok) {
                          const { ticketId } = await res.json();
                          alert(`Solicitação de recolhimento criada: Chamado #${ticketId}`);
                        } else {
                          alert("Falha ao criar solicitação no GLPI.");
                        }
                      } catch {
                        alert("Erro de conexão.");
                      }
                    }}
                    className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 h-10 text-[10px] uppercase font-bold tracking-widest"
                  >
                    Recolhimento de Despacho
                  </Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}
