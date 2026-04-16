"use client";

import React from "react";
import { ChevronLeft, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "./subpage-header";

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  backUrl?: string;
  children: React.ReactNode;
}

export const AdminPageLayout = ({
  title,
  subtitle,
  icon: Icon,
  backUrl = "/admin",
  children,
}: AdminPageLayoutProps) => {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      {/* Componente de Header Mobile (lg:hidden) */}
      <SubPageHeader 
        title={title.replace("\n", " ")} 
        icon={Icon} 
        backUrl={backUrl} 
      />

      {/* Lado Esquerdo (Sidebar/Hero) - Visível apenas em Desktop (lg:flex) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        {/* Elementos Decorativos (Círculos) */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-30px] w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-[20%] left-[10%] w-16 h-16 rounded-full bg-[#FECC00]/10 pointer-events-none" />
        
        {/* Botão Voltar Premium */}
        <button 
          onClick={() => router.push(backUrl)} 
          className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium hover:bg-white/20 transition-all z-20 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar
        </button>

        <div className="relative z-10 max-w-sm">
          {/* Ícone com Glassmorphism */}
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <Icon className="text-white w-10 h-10" />
          </div>
          
          {/* Traço Amarelo Cometa */}
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          
          {/* Título Principal Desktop (42px) */}
          <h1 className="text-white text-[42px] font-black leading-[1.1] uppercase tracking-tight mb-8 whitespace-pre-line">
            {title}
          </h1>
          
          {/* Subtítulo informativo */}
          {subtitle && (
            <p className="text-white/70 text-lg font-medium leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Lado Direito (Conteúdo) 65% em Desktop, 100% em Mobile */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-4 lg:p-20 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto pb-20">
          {children}
        </div>
      </div>
    </div>
  );
};
