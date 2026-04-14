"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Search, ChevronLeft, Loader2, Download, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";

interface Laudo {
  id: number;
  loja: string;
  tecnico: string;
  data: string;
  status: string;
  pdfUrl?: string; // Caminho para o PDF gerado
}

export default function LaudosPage() {
  const router = useRouter();
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchLaudos = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/laudos`, {
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
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchLaudos();
  }, [fetchLaudos]);

  const handleDownload = (id: number) => {
    const token = localStorage.getItem("token");
    window.open(`${API_BASE_URL}/laudos/${id}/pdf?token=${token}`, '_blank');
  };

  const filtered = laudos.filter(l => 
    l.loja.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.tecnico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Laudos\nGerados`} icon={FileText} type="templates" />

      {/* Lado Esquerdo (Hero) */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#0E3D8A] to-[#1E5BB5] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold hover:bg-white/20 transition-all group shadow-lg">
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <History className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] font-[800] leading-[1.1] uppercase whitespace-pre-line tracking-tight mb-8">
            {`Laudos\nGerados`}
          </h1>
          <p className="text-white/70 text-lg font-medium">Histórico oficial de auditorias técnica. Acesse e exporte relatórios PDF em conformidade com as normas da rede.</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[60%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="mb-12 hidden lg:block">
            <h2 className="text-[#1A1A2E] text-[32px] font-[800] tracking-tighter">Acervo de Auditorias</h2>
            <p className="text-[#6B7280] text-[16px]">Filtre e baixe relatórios técnicos finalizados.</p>
          </div>

          <div className="relative mb-12 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input 
              type="text" 
              placeholder="Pesquisar por loja ou técnico..." 
              className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#EDF1F7] border-none text-[14px] font-[500]" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 text-[#0E3D8A] animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {filtered.map((laudo) => (
                <div key={laudo.id} className="w-full bg-white p-6 rounded-2xl flex items-center gap-8 shadow-sm group">
                  <div className="w-14 h-14 rounded-2xl bg-[#0E3D8A]/5 flex items-center justify-center group-hover:bg-[#0E3D8A] transition-all">
                    <FileText className="text-[#0E3D8A] group-hover:text-white w-7 h-7" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#1A1A2E] text-[16px] font-[700] uppercase mb-1">{laudo.loja}</h3>
                    <div className="flex items-center gap-4 text-[#6B7280] text-[12px] font-medium uppercase tracking-widest">
                      <span className="font-bold text-[#0E3D8A]">{laudo.tecnico}</span>
                      <span className="text-gray-300">|</span>
                      <span>{new Date(laudo.data).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownload(laudo.id)}
                    className="w-12 h-12 rounded-[14px] bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#0E3D8A] hover:text-white transition-all shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
