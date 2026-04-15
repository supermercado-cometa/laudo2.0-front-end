"use client";

import React, { useState } from "react";
import { ShieldCheck, Search, ChevronRight, ChevronLeft, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";

export default function AuditoriaTomboPage() {
  const router = useRouter();
  const [tombo, setTombo] = useState("");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Auditoria\npor Tombo`} icon={ShieldCheck} type="checklists" />

      {/* Lado Esquerdo (Hero) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all group shadow-lg">
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          
          <h1 className="text-white text-[48px] lg:font-medium font-[800] leading-[1.1] uppercase whitespace-pre-line tracking-tight mb-8">
            {`Auditoria\npor Tombo`}
          </h1>
          <p className="text-white/70 text-lg font-medium mb-12">Consulte o histórico detalhado de conformidade e status técnico de um equipamento específico pelo seu número de tombo.</p>
          
          <ul className="space-y-8">
            <li className="flex items-center gap-5 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-[#FECC00] transition-all duration-300"><BarChart3 className="w-5 h-5 text-white group-hover:text-[#003B99]" /></div>
              <span className="text-white/90 lg:font-medium font-bold text-lg">Busca individualizada</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="mb-12 hidden lg:block">
            {/* Título de Seção (32px 800) */}
            <h2 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800] leading-[1.1] tracking-[-0.5px] mb-4">Consulta Individual</h2>
            <p className="text-[#6B7280] text-[16px] font-normal leading-relaxed">Insira o número de identificação (Tombo) para localizar o equipamento.</p>
          </div>

          <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100">
             <div className="relative group mb-8">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#003B99]">
                 <Search className="w-6 h-6 border-none" />
               </div>
               {/* Input (24px Black) - Mantendo impacto na busca */}
               <input 
                 type="text" 
                 placeholder="Digite o número do tombo..." 
                 className="w-full h-20 pl-16 pr-8 rounded-2xl bg-[#EDF1F7] border-none focus:ring-4 focus:ring-[#003B99]/5 transition-all lg:font-medium font-[800] text-[24px] text-[#1A1A2E] placeholder:text-gray-300"
                 value={tombo}
                 onChange={(e) => setTombo(e.target.value)}
               />
             </div>
             {/* Botão Principal (15px 800 tracking-1.0 UPPERCASE) */}
             <button className="w-full h-18 bg-[#003B99] text-white rounded-2xl text-[15px] lg:font-medium font-[800] tracking-[1.0px] uppercase shadow-xl hover:shadow-2xl hover:bg-[#0A2D66] transition-all active:scale-[0.98] flex items-center justify-center gap-4">
                Consultar Patrimônio
                <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
