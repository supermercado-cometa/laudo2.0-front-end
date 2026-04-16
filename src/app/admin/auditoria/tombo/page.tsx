"use client";

import React, { useState } from "react";
import { ShieldCheck, Search, ChevronRight, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminPageLayout } from "@/components/admin-page-layout";

export default function AuditoriaTomboPage() {
  const router = useRouter();
  const [tombo, setTombo] = useState("");

  const handleSearch = () => {
    if (!tombo) {
      alert("Por favor, insira um número de tombo.");
      return;
    }
    // Lógica de busca futura aqui
    console.log("Consultando tombo:", tombo);
  };

  return (
    <AdminPageLayout
      title={`Auditoria\npor Tombo`}
      subtitle="Localize o histórico completo de auditorias e o status técnico de um equipamento individual através do seu número de série ou tombo."
      icon={ShieldCheck}
      backUrl="/admin"
    >
      <div className="max-w-[800px] w-full mx-auto">
        <div className="mb-12">
          <h2 className="text-[#1A1A2E] text-[28px] lg:text-[32px] font-black uppercase tracking-tighter leading-none mb-4">
            Consulta Patrimonial
          </h2>
          <p className="text-[#6B7280] text-[16px] font-semibold leading-relaxed">
            Insira o identificador único para rastrear o ativo em toda a rede.
          </p>
        </div>

        <div className="bg-white p-8 lg:p-12 rounded-[40px] shadow-sm border border-blue-50 relative overflow-hidden group">
          {/* Elemento decorativo sutil */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#003B99]/5 rounded-bl-[100px] pointer-events-none group-hover:bg-[#003B99]/10 transition-colors" />
          
          <div className="space-y-10">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#003B99]">
                <Search className="w-8 h-8" />
              </div>
              <input 
                type="text" 
                placeholder="Ex: 123456" 
                className="w-full h-24 pl-18 pr-8 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-[#003B99]/20 focus:bg-white transition-all font-black text-[32px] lg:text-[42px] text-[#1A1A2E] placeholder:text-gray-200 outline-none shadow-inner"
                value={tombo}
                onChange={(e) => setTombo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:block">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">Pressione Enter</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#003B99]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[#003B99] uppercase tracking-wider">Histórico</p>
                  <p className="text-[13px] font-bold text-gray-500">Rastreabilidade completa</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#FECC0010] border border-[#FECC0030]">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#FECC00]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[#6B5A00] uppercase tracking-wider">Conformidade</p>
                  <p className="text-[13px] font-bold text-gray-500">Status de auditoria</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSearch}
              className="w-full h-20 bg-[#003B99] text-white rounded-2xl text-[16px] font-black tracking-[0.1em] uppercase shadow-2xl hover:bg-[#0A2D66] transition-all active:scale-[0.97] flex items-center justify-center gap-4 group"
            >
              Iniciar Auditoria de Ativo
              <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-gray-50 border border-gray-100 flex items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
             <ShieldCheck className="w-6 h-6 text-[#003B99]" />
          </div>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Certifique-se de que o número de tombo esteja legível no ativo antes de realizar a consulta. Caso o identificador esteja danificado, utilize a busca por <button className="text-[#003B99] font-bold underline decoration-dotted underline-offset-4" onClick={() => router.push("/admin/equipamentos")}>Equipamentos</button>.
          </p>
        </div>
      </div>
    </AdminPageLayout>
  );
}
