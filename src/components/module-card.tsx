"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  title: string;
  icon: LucideIcon;
  colorClass: string;
  bgColorClass: string;
  onClick?: () => void;
}

export const ModuleCard = ({
  title,
  icon: Icon,
  colorClass,
  bgColorClass,
  onClick
}: ModuleCardProps) => {
  const hexColor = colorClass.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/)?.[0] || "#003B99";

  return (
    <button
      onClick={onClick}
      className={`
        w-full bg-white rounded-[24px] lg:rounded-[18px] shadow-[0_5px_15px_rgba(0,0,0,0.05)] lg:shadow-[0_6px_14px_rgba(0,0,0,0.03)]
        aspect-[1/1] lg:aspect-[1.3] flex flex-col items-center lg:items-start justify-center lg:justify-between
        px-6 py-6 lg:px-5 lg:py-[18px]
        hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden active:scale-95
      `}
      style={{
        '--hover-bg': `${hexColor}0A`
      } as React.CSSProperties}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
        style={{ backgroundColor: 'var(--hover-bg)' }}
      />

      {/* Ícone: Centralizado mobile / Topo-Esquerda desktop (28px no desktop) */}
      <div className={`p-4 rounded-full ${bgColorClass} relative z-10 transition-transform group-hover:scale-110 mb-4 lg:mb-0`}>
        <Icon className={`w-8 h-8 lg:w-7 lg:h-7 ${colorClass}`} />
      </div>

      {/* Nome: Centralizado mobile / Base-Esquerda desktop (16px Semi-bold - GUIA) */}
      <span className="text-[#1A1C1E] font-bold lg:font-medium text-base lg:text-[16px] relative z-10 group-hover:text-[#003B99] transition-colors w-full text-center lg:text-left">
        {title}
      </span>
    </button>
  );
};
