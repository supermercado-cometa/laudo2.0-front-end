"use client";

import React from "react";
import { ChevronLeft, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubPageHeaderProps {
  title: string;
  icon: LucideIcon;
  type?: "checklists" | "templates";
  hideBack?: boolean;
}

export const SubPageHeader = ({ title, icon: Icon, hideBack = false }: SubPageHeaderProps) => {
  const router = useRouter();

  const gradientClass = "from-[#0E3D8A] to-[#1E5BB5]";

  return (
    <div className="lg:hidden flex flex-col">
      {/* HEADER MOBILE (Conforme especificações anteriores) */}
      <div className={`relative w-full min-h-[220px] bg-gradient-to-br ${gradientClass} p-8 flex flex-col justify-end overflow-hidden`}>
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>

        {/* Action Buttons */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          {!hideBack ? (
            <button 
              onClick={() => router.push("/admin")}
              className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <div className="w-10 h-10" /> // Espaçador para manter o alinhamento
          )}
          <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Title Content MOBILE: 28px 800 */}
        <div className="relative z-10 space-y-4">
          <h1 className="text-white text-[28px] font-[800] leading-[1.1] whitespace-pre-line tracking-tight">
            {title}
          </h1>
          <div className="w-10 h-[3px] bg-[#FECC00] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
