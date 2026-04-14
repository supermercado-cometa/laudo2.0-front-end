"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Monitor, 
  Layout, 
  Store, 
  Briefcase, 
  FileText, 
  Activity, 
  ShieldCheck, 
  ClipboardCheck 
} from "lucide-react";
import { ModuleCard } from "@/components/module-card";

export default function AdminHomePage() {
  const router = useRouter();

  const modules = [
    {
      title: "Equipamentos",
      icon: Monitor,
      colorClass: "text-[#2196F3]",
      bgColorClass: "bg-[#2196F31F]", // 12% Opacidade
      path: "/admin/equipamentos",
    },
    {
      title: "Modelos",
      icon: Layout,
      colorClass: "text-[#FF9800]",
      bgColorClass: "bg-[#FF98001F]", // 12% Opacidade
      path: "/admin/modelos",
    },
    {
      title: "Lojas",
      icon: Store,
      colorClass: "text-[#4CAF50]",
      bgColorClass: "bg-[#4CAF501F]", // 12% Opacidade
      path: "/admin/lojas",
    },
    {
      title: "Setores",
      icon: Briefcase,
      colorClass: "text-[#009688]",
      bgColorClass: "bg-[#0096881F]", // 12% Opacidade
      path: "/admin/setores",
    },
    {
      title: "Laudos Gerados",
      icon: FileText,
      colorClass: "text-[#9C27B0]",
      bgColorClass: "bg-[#9C27B01F]", // 12% Opacidade
      path: "/admin/laudos",
    },
    {
      title: "Monitoramento GLPI",
      icon: Activity,
      colorClass: "text-[#FF5252]",
      bgColorClass: "bg-[#FF52521F]", // 12% Opacidade
      path: "/admin/glpi-monitor",
    },
    {
      title: "Auditoria",
      icon: ShieldCheck,
      colorClass: "text-[#0E3D8A]",
      bgColorClass: "bg-[#0E3D8A1F]", // 12% Opacidade
      path: "/admin/auditoria/tombo",
    },
    {
      title: "Laudo Técnico",
      icon: ClipboardCheck,
      colorClass: "text-gray-600",
      bgColorClass: "bg-gray-100",
      path: "/infoFormulario",
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Título da Seção - GUIA DESKTOP */}
      <h2 className="text-[20px] lg:text-[22px] font-bold lg:font-medium text-[#1A1C1E] mb-4 tracking-tight">
        Acesso Rápido
      </h2>

      {/* Grid de Módulos (4 Colunas no Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
        {modules.map((module, index) => (
          <ModuleCard
            key={index}
            title={module.title}
            icon={module.icon}
            colorClass={module.colorClass}
            bgColorClass={module.bgColorClass}
            onClick={() => router.push(module.path)}
          />
        ))}
      </div>

      {/* Footer / Nota Sutil */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400 text-xs font-bold lg:font-medium uppercase tracking-widest">
        <span>Cometa Supermercados 2026</span>
        <span>Gestão de Auditoria Técnica</span>
      </div>
    </div>
  );
}
