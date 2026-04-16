"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertTriangle, Clock, X } from "lucide-react";
import { SubPageHeader } from "@/components/subpage-header";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { API_BASE_URL } from "@/lib/api-config";

interface Checklist {
  id: number;
  titulo: string;
  data: string;
  status: "Pendente" | "Finalizado" | "Em Progresso";
  tecnico: string;
}

export default function LojaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [lojaInfo, setLojaInfo] = useState<LojaType | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        
        // 1. Buscar Informações da Loja
        const resLoja = await fetch(`${API_BASE_URL}/lojas/${params.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        
        if (resLoja.ok) {
          const lojaData = await resLoja.json();
          setLojaInfo(lojaData);

          // 2. Buscar Checklists da Loja filtrando pelo NOME da loja
          const resChecks = await fetch(`${API_BASE_URL}/info-laudos?loja=${encodeURIComponent(lojaData.nome)}`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" }
          });
          if (resChecks.ok) setChecklists(await resChecks.json());
        }

      } catch (error) {
        console.error("Erro ao carregar dados da loja:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id, API_BASE_URL]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUserClick = async (username: string) => {
    if (!username) return;
    try {
      setIsUserLoading(true);
      setIsUserModalOpen(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/user/${username}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        setSelectedUser(await res.json());
      } else {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error("Erro ao carregar especialista:", err);
      setSelectedUser(null);
    } finally {
      setIsUserLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Checklists\n${lojaInfo?.nome || 'Monitoramento'}`} icon={ClipboardList} type="checklists" />

      {/* Lado Esquerdo (Hero) */}
      <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-[#003B99] to-[#0066FF] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin/lojas")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all group">
          <ChevronLeft className="w-5 h-5" />
          Voltar para Lojas
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <ClipboardList className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] leading-[1.1] uppercase whitespace-pre-line tracking-tight mb-8">
            {lojaInfo?.nome || "Carregando..."}
          </h1>
          <p className="text-white/70 text-lg">{lojaInfo?.filial} - {lojaInfo?.cidade}</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[65%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="mb-12">
            <h2 className="text-[#1A1A2E] text-[32px] tracking-tighter mb-4">Relatórios da Unidade</h2>
            <p className="text-[#6B7280] text-[16px]">Histórico de auditorias realizadas nesta filial.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 text-[#003B99] animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {checklists.length > 0 ? (
                checklists.map((check: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div key={check.id} className="w-full bg-white p-6 rounded-2xl flex items-center justify-between shadow-sm group border border-transparent hover:border-[#003B99]/5">
                    <div className="flex items-center gap-6">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${check.status === 'Finalizado' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                          {check.status === 'Finalizado' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                       </div>
                       <div>
                          <h3 className="text-[#1A1A2E] text-[16px] uppercase mb-1">{check.titulo || `Laudo Técnica - ${check.equipamento}`}</h3>
                          <p className="text-[#6B7280] text-[12px] uppercase tracking-wider">
                            <span 
                              className={check.createdByUsername ? "cursor-pointer text-[#003B99] hover:underline" : ""} 
                              onClick={() => check.createdByUsername && handleUserClick(check.createdByUsername)}
                            >
                              {check.tecnico}
                            </span> • {new Date(check.data || check.createdAt).toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-[#003B99] translate-x-0 group-hover:translate-x-2 transition-all" />
                  </div>
                ))
              ) : (
                <div className="text-center p-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                   <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-400 uppercase text-[12px] tracking-widest">Nenhuma auditoria encontrada para esta loja.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal do Especialista */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-[32px] p-8 lg:p-12 max-w-lg w-full shadow-2xl"
             >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-2">Perfil do Especialista</h3>
                    <h2 className="text-[#1A1A2E] text-3xl uppercase tracking-tighter">
                      {isUserLoading ? "Carregando..." : selectedUser?.username || "Técnico"}
                    </h2>
                  </div>
                  <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                </div>

                {isUserLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 text-[#003B99] animate-spin" /></div>
                ) : selectedUser ? (
                  <div className="space-y-10">
                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                       <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Assinatura Digital Atribuída</span>
                       {selectedUser.signature ? (
                         /* eslint-disable-next-line @next/next/no-img-element */
                         <img src={selectedUser.signature} alt="Assinatura" className="max-h-[140px] grayscale hover:grayscale-0 transition-all" />
                       ) : (
                         <div className="p-10 text-gray-300 text-xs italic">Nenhuma assinatura cadastrada.</div>
                       )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-gray-50 rounded-2xl">
                          <span className="block text-[9px] text-gray-400 uppercase mb-1">Status</span>
                          <span className="text-[14px] text-green-600 uppercase">Ativo na Rede</span>
                       </div>
                       <div className="p-4 bg-gray-50 rounded-2xl">
                          <span className="block text-[9px] text-gray-400 uppercase mb-1">Membro desde</span>
                          <span className="text-[14px] text-[#1A1A2E]">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center p-10 text-gray-400">Usuário não possui dados dinâmicos vinculados.</p>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
