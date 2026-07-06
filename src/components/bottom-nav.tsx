"use client";

import React, { useState, useEffect } from "react";
import { Home, ListTodo, FileText, Rss, Menu, X, Monitor, Store, Briefcase, ShieldCheck, ClipboardCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  action?: () => void;
  adminOnly?: boolean;
}

export const BottomNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("isAdmin");
    setIsAdmin(stored === "true");
  }, []);

  // ABA FIXA (Filtrada por permissão)
  const allTabs: NavItem[] = [
    { id: "home", label: "Home", icon: Home, path: isAdmin ? "/admin" : "/admin/laudo-tecnico", adminOnly: false },
    { id: "checklists", label: "Histórico", icon: ListTodo, path: "/admin/laudos", adminOnly: true },
    { id: "feed", label: "Monitor", icon: Rss, path: "/admin/glpi-monitor", adminOnly: true },
    { id: "laudo", label: "Novo Laudo", icon: ClipboardCheck, path: "/admin/laudo-tecnico", adminOnly: !isAdmin }, // Técnico vê aqui
    { id: "menu", label: "Menu", icon: Menu, action: () => setIsMenuOpen(true), adminOnly: false },
  ];

  // Filtra as abas: Usuário comum vê HOME, NOVO LAUDO e MENU. Admin vê tudo.
  const visibleTabs = allTabs.filter(tab => isAdmin || !tab.adminOnly);

  const allMenus = [
    { title: "Equipamentos", icon: Monitor, path: "/admin/equipamentos", color: "text-blue-500", adminOnly: true },
    { title: "Lojas", icon: Store, path: "/admin/lojas", color: "text-green-500", adminOnly: true },
    { title: "Setores", icon: Briefcase, path: "/admin/setores", color: "text-teal-500", adminOnly: true },
    { title: "Auditoria", icon: ShieldCheck, path: "/admin/auditoria/tombo", color: "text-indigo-500", adminOnly: true },
    { title: "Laudo Técnico", icon: ClipboardCheck, path: "/admin/laudo-tecnico", color: "text-orange-500", adminOnly: false },
    { title: "Modelos", icon: FileText, path: "/admin/modelos", color: "text-blue-500", adminOnly: true },
  ];

  const visibleMenus = allMenus.filter(m => isAdmin || !m.adminOnly);

  const handleTabClick = (tab: NavItem) => {
    if (tab.action) {
      tab.action();
    } else if (tab.path) {
      router.push(tab.path);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full bg-white rounded-t-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#003B99]">Gestão Completa</h3>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-y-6 gap-x-4 pb-12">
                {visibleMenus.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      router.push(item.path);
                      setIsMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 group relative bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 overflow-hidden active:scale-95 transition-all text-black"
                  >
                    <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
                      <item.icon className={`w-7 h-7 ${item.color}`} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">
                      {item.title}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#FECC00] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex justify-around items-center z-50 md:hidden">
        {visibleTabs.map((tab) => {
          const isActive = !tab.action && (pathname === tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center w-full h-full active:bg-gray-50 transition-colors"
            >
              <tab.icon 
                className={`w-6 h-6 ${isActive || (tab.id === 'menu' && isMenuOpen) ? 'text-[#003B99]' : 'text-[#9E9E9E]'}`} 
              />
              <span className={`text-[10px] mt-1 font-medium ${isActive || (tab.id === 'menu' && isMenuOpen) ? 'text-[#003B99]' : 'text-[#9E9E9E]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
