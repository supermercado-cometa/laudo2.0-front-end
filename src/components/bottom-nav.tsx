"use client";

import React, { useState } from "react";
import { 
  Home, 
  ListTodo, 
  FileText, 
  Rss, 
  Menu, 
  X, 
  Monitor, 
  Store, 
  Briefcase, 
  ShieldCheck, 
  ClipboardCheck 
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  action?: () => void;
}

export const BottomNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    // isAdmin is stored in localStorage at login time
    const stored = localStorage.getItem("isAdmin");
    setIsAdmin(stored === "true");
  }, []);
  const tabs: NavItem[] = [
    { id: "home", label: "Home", icon: Home, path: "/admin" },
    { id: "checklists", label: "Checklists", icon: ListTodo, path: "/admin/laudos" },
    { id: "templates", label: "Templates", icon: FileText, path: "/admin/modelos" },
    { id: "feed", label: "Feed", icon: Rss, path: "/admin/glpi-monitor" },
    { id: "menu", label: "Menu", icon: Menu, action: () => setIsMenuOpen(true) },
  ];

  const allMenus = [
    { title: "Equipamentos", icon: Monitor, path: "/admin/equipamentos", color: "text-blue-500", adminOnly: true },
    { title: "Lojas", icon: Store, path: "/admin/lojas", color: "text-green-500", adminOnly: true },
    { title: "Setores", icon: Briefcase, path: "/admin/setores", color: "text-teal-500", adminOnly: true },
    { title: "Auditoria", icon: ShieldCheck, path: "/admin/auditoria/tombo", color: "text-indigo-500", adminOnly: true },
    { title: "Laudo Técnico", icon: ClipboardCheck, path: "/admin/laudo-tecnico", color: "text-orange-500", adminOnly: false },
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
      {/* Overlay do Menu (Drawer) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--royal-blue)]">Menu Completo</h3>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full bg-gray-100 text-gray-500"
              >
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
                  className="flex flex-col items-center gap-2 group relative bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 overflow-hidden active:scale-95 transition-all"
                >
                  <div className={`p-4 rounded-2xl bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">
                    {item.title}
                  </span>
                  
                  {/* Linha Dourada Premium na Base */}
                  <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#FECC00] transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#FECC00]/30" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex justify-around items-center z-50 md:hidden">
        {tabs.map((tab) => {
          const isActive = !tab.action && (pathname === tab.path || (tab.id !== "home" && pathname.startsWith(tab.path as string)));
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center w-full h-full active:bg-gray-50 transition-colors"
            >
              <tab.icon 
                className={`w-6 h-6 ${isActive || (tab.id === 'menu' && isMenuOpen) ? 'text-[#003B99]' : 'text-[#9E9E9E]'}`} 
                strokeWidth={isActive ? 2.5 : 2}
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
