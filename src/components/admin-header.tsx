"use client";

import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Victor Peixoto");
  const [greeting, setGreeting] = useState("Bom dia");

  const isHome = pathname === "/admin";

  useEffect(() => {
    const name = localStorage.getItem("fullName") || "Victor Peixoto";
    setUserName(name);

    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else if (hour >= 18) setGreeting("Boa noite");
    else setGreeting("Bom dia");
  }, []);

  const handleLogout = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
      await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("fullName");
      router.replace("/");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("fullName");
      router.replace("/");
    }
  };

  if (!isHome) return null;

  return (
    <header className="w-full">
      {/* VERSÃO DESKTOP (CARD CENTRALIZADO 1400px - GUIA) */}
      <div className="hidden lg:flex w-full mb-8 bg-white rounded-[24px] px-8 py-6 items-center justify-between shadow-[0_8px_18px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-5">
          <div className="w-[64px] h-[64px] rounded-full bg-[#003B991F] flex items-center justify-center text-[#003B99] text-[26px] font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[#9E9E9E] text-[16px] font-[500] leading-none mb-1">{greeting}</p>
            <h1 className="text-[#1A1C1E] text-[24px] lg:font-[500] font-[700] tracking-tight">{userName}</h1>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#DC262612] border border-[#DC262633] text-red-600 lg:font-medium font-bold hover:bg-red-600 hover:text-white transition-all group"
        >
          Sair
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* VERSÃO MOBILE (BORDA A BORDA) */}
      <div className="flex lg:hidden w-full bg-white px-6 pt-12 pb-8 rounded-b-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.05)] items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[60px] h-[60px] rounded-full bg-[#003B991A] flex items-center justify-center">
            <span className="text-[#003B99] text-2xl font-bold">{userName.charAt(0).toUpperCase()}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-400 text-base font-medium">{greeting}</span>
            <h1 className="text-[#003B99] text-2xl font-bold leading-tight">{userName}</h1>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl bg-[#DC262614] flex items-center justify-center text-[#DC2626]"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
