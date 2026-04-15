"use client";

import React, { useState, useEffect } from "react";
import { FileText, Search, Download, ChevronLeft, Loader2, Eye, Printer, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";
import { API_BASE_URL } from "@/lib/api-config";

interface Laudo {
  id: number;
  lojaNome: string;
  tecnicoResponsavel?: string;
  username?: string;
  createdAt: string;
}

export default function LaudosGeradosPage() {
  const router = useRouter();
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"todos" | "meus">("todos");
  const [currentUsername, setCurrentUsername] = useState("");

  useEffect(() => {
    const fetchLaudos = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/info-laudos`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        if (res.ok) {
          const data = await res.json();
          setLaudos(data);
        }
      } catch (error) {
        console.error("Erro ao carregar laudos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const storedUser = localStorage.getItem("username");
    if (storedUser) setCurrentUsername(storedUser);

    fetchLaudos();
  }, []);

  const filtered = laudos.filter(l => {
    const matchSearch = l.lojaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.tecnicoResponsavel?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTab = activeTab === "todos" || (activeTab === "meus" && l.username === currentUsername);
    return matchSearch && matchTab;
  });

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Laudos\nGerados`} icon={FileText} type="checklists" />

      {/* Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <FileText className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] lg:font-medium font-[800] leading-[1.1] uppercase tracking-tight mb-8">
            Histórico de Laudos
          </h1>
          <p className="text-white/70 text-lg font-medium">Consulte e exporte todos os laudos técnicos emitidos pela equipe.</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[35%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[1000px] w-full mx-auto">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="text-[#1A1A2E] text-[28px] lg:text-[32px] lg:font-medium font-[800]">Laudos Emitidos</h2>
            <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
              <button onClick={() => setActiveTab("todos")} className={`px-4 sm:px-6 py-3 rounded-lg text-xs lg:font-medium font-bold uppercase tracking-widest transition-all ${activeTab === 'todos' ? 'bg-white shadow-sm text-[#003B99]' : 'text-gray-500 hover:text-gray-700'}`}>
                Todos
              </button>
              <button onClick={() => setActiveTab("meus")} className={`px-4 sm:px-6 py-3 rounded-lg text-xs lg:font-medium font-bold uppercase tracking-widest transition-all ${activeTab === 'meus' ? 'bg-white shadow-sm text-[#003B99]' : 'text-gray-500 hover:text-gray-700'}`}>
                Meus Laudos
              </button>
            </div>
          </div>

          <div className="relative mb-8"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" /><input type="text" placeholder="Pesquisar por loja, técnico ou usuário..." className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#EDF1F7] border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

          {isLoading ? <div className="flex justify-center p-20 animate-spin"><Loader2 className="w-10 h-10 text-[#003B99]" /></div> : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-[32px] border border-dashed border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhum laudo encontrado.</p>
                </div>
              ) : filtered.map((item) => (
                <div key={item.id} className="w-full bg-white p-6 lg:p-8 rounded-[32px] flex flex-col lg:flex-row lg:items-center justify-between shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#003B99]/10 gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#003B99]/5 flex items-center justify-center">
                      <FileText className="text-[#003B99] w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded block">Emitido</span>
                        <h3 className="text-[#1A1A2E] text-[18px] lg:font-medium font-[700] uppercase tracking-tight">{item.lojaNome}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[#6B7280] text-[12px] font-medium uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(item.createdAt).toLocaleDateString('pt-BR')}</div>
                        <div className="flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> ID: {item.id}</div>
                        <div className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Técnico: {item.tecnicoResponsavel || item.username}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button className="flex-1 lg:flex-none h-14 px-6 rounded-xl bg-[#003B99] text-white text-[13px] lg:font-medium font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#003B99]/20">
                        <Download className="w-4 h-4" /> PDF
                     </button>
                     <button className="w-14 h-14 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all">
                        <Eye className="w-5 h-5" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
