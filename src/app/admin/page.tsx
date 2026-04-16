"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Monitor, 
  Layout, 
  Store, 
  Briefcase, 
  FileText, 
  Activity, 
  ShieldCheck, 
  ClipboardCheck,
  Users,
  Loader2
} from "lucide-react";
import { ModuleCard } from "@/components/module-card";
import { API_BASE_URL } from "@/lib/api-config";

export default function AdminHomePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/"); return; }

    fetch(`${API_BASE_URL}/auth/me`, {
       headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setIsAdmin(data?.user?.isAdmin === true))
    .catch(() => setIsAdmin(false));
  }, [router]);

  const allModules = [
    {
      title: "Equipamentos",
      icon: Monitor,
      colorClass: "text-[#2196F3]",
      bgColorClass: "bg-[#2196F31F]",
      path: "/admin/equipamentos",
      adminOnly: true
    },
    {
      title: "Modelos",
      icon: Layout,
      colorClass: "text-[#FF9800]",
      bgColorClass: "bg-[#FF98001F]",
      path: "/admin/modelos",
      adminOnly: true
    },
    {
      title: "Lojas",
      icon: Store,
      colorClass: "text-[#4CAF50]",
      bgColorClass: "bg-[#4CAF501F]",
      path: "/admin/lojas",
      adminOnly: true
    },
    {
      title: "Setores",
      icon: Briefcase,
      colorClass: "text-[#009688]",
      bgColorClass: "bg-[#0096881F]",
      path: "/admin/setores",
      adminOnly: true
    },
    {
      title: "Laudos Gerados",
      icon: FileText,
      colorClass: "text-[#9C27B0]",
      bgColorClass: "bg-[#9C27B01F]",
      path: isAdmin ? "/admin/laudos" : "/admin/laudos-cometa?view=meus",
    },
    {
      title: "Monitoramento GLPI",
      icon: Activity,
      colorClass: "text-[#FF5252]",
      bgColorClass: "bg-[#FF52521F]",
      path: "/admin/glpi-monitor",
      adminOnly: true
    },
    {
      title: "Usuários (Admins)",
      icon: Users,
      colorClass: "text-[#E91E63]",
      bgColorClass: "bg-[#E91E631F]",
      path: "/admin/usuarios",
      adminOnly: true
    },
    {
      title: "Auditoria",
      icon: ShieldCheck,
      colorClass: "text-[#003B99]",
      bgColorClass: "bg-[#003B991F]",
      path: "/admin/auditoria/tombo",
      adminOnly: true
    },
    {
      title: "Laudo Técnico",
      icon: ClipboardCheck,
      colorClass: "text-[#003B99]",
      bgColorClass: "bg-[#003B991F]",
      path: "/admin/laudo-tecnico",
    },
  ];

  const visibleModules = isAdmin === null 
    ? [] 
    : allModules.filter(m => isAdmin || !m.adminOnly);

  if (isAdmin === null) {
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#003B99] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <h2 className="text-[20px] lg:text-[22px] text-[#1A1C1E] mb-4 tracking-tight">
        Acesso Rápido
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
        {visibleModules.map((module, index) => (
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

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400 text-xs uppercase tracking-widest">
        <span>Cometa Supermercados 2026</span>
        <span>Gestão de Auditoria Técnica</span>
      </div>
    </div>
  );
}
