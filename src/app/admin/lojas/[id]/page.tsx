"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X, FileText, Calendar, Package, MapPin, Wrench, ActivitySquare, User } from "lucide-react";
import { SubPageHeader } from "@/components/subpage-header";
import { motion, AnimatePresence } from "framer-motion";
import { LojaType } from "@/types/domain";
import { API_BASE_URL } from "@/lib/api-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LaudoItem = any;

export default function LojaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [lojaInfo, setLojaInfo] = useState<LojaType | null>(null);
  const [checklists, setChecklists] = useState<LaudoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal: Especialista / Técnico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);

  // Modal: Detalhes do Laudo
  const [selectedLaudo, setSelectedLaudo] = useState<LaudoItem>(null);
  const [isLaudoModalOpen, setIsLaudoModalOpen] = useState(false);

  const handleUserClick = useCallback(async (username: string) => {
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
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        const resLoja = await fetch(`${API_BASE_URL}/lojas/${params.id}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });

        if (resLoja.ok) {
          const lojaData = await resLoja.json();
          setLojaInfo(lojaData);

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
  }, [params.id, handleUserClick]);

  const formatEstado = (v?: string) => {
    if (!v) return "—";
    if (v === "NAO_FUNCIONANDO") return "Não funcionando";
    if (v === "FUNCIONANDO") return "Funcionando";
    return v;
  };

  const formatNecessidade = (v?: string) => {
    if (!v) return "—";
    if (v === "ENVIAR_CONSERTO") return "Enviado p/ conserto";
    if (v === "SUBSTITUIDO") return "Ser substituído";
    if (v === "DESCARTADO") return "Ser descartado";
    return v;
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
            <p className="text-[#6B7280] text-[16px]">Histórico de auditorias realizadas nesta filial. Clique em um laudo para ver os detalhes.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 text-[#003B99] animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {checklists.length > 0 ? (
                checklists.map((check: LaudoItem) => (
                  <button
                    key={check.id}
                    onClick={() => { setSelectedLaudo(check); setIsLaudoModalOpen(true); }}
                    className="w-full bg-white p-6 rounded-2xl flex items-center justify-between shadow-sm group border border-transparent hover:border-[#003B99]/20 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-[#003B99] shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-[#1A1A2E] text-[16px] uppercase mb-1">
                          Chamado #{check.numeroChamado} — {check.equipamento}
                        </h3>
                        <p className="text-[#6B7280] text-[12px] uppercase tracking-wider">
                          <span
                            className={check.createdByUsername ? "cursor-pointer text-[#003B99] hover:underline" : ""}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (check.createdByUsername) handleUserClick(check.createdByUsername); 
                            }}
                          >
                            {check.tecnico}
                          </span>
                          {" • "}
                          {check.data || new Date(check.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-[#003B99] translate-x-0 group-hover:translate-x-2 transition-all shrink-0" />
                  </button>
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

      {/* ── Modal: Detalhes do Laudo ───────────────────────────────────────── */}
      <AnimatePresence>
        {isLaudoModalOpen && selectedLaudo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 lg:p-12 max-w-2xl w-full shadow-2xl my-8"
            >
              {/* Header do Modal */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-2">Detalhes do Laudo</h3>
                  <h2 className="text-[#1A1A2E] text-2xl uppercase tracking-tighter">
                    Chamado #{selectedLaudo.numeroChamado}
                  </h2>
                </div>
                <button onClick={() => setIsLaudoModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações Gerais */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard icon={User} label="Técnico" value={selectedLaudo.tecnico} />
                  <InfoCard icon={Calendar} label="Data" value={selectedLaudo.data} />
                  <InfoCard icon={MapPin} label="Loja" value={selectedLaudo.loja} />
                  <InfoCard icon={MapPin} label="Setor" value={selectedLaudo.setor} />
                </div>

                {/* Equipamento */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard icon={Package} label="Equipamento" value={selectedLaudo.equipamento} />
                  <InfoCard icon={Package} label="Modelo" value={selectedLaudo.modelo || "—"} />
                  <InfoCard icon={ActivitySquare} label="Estado" value={formatEstado(selectedLaudo.estadoEquipamento)} />
                  <InfoCard icon={Wrench} label="Necessidade" value={formatNecessidade(selectedLaudo.necessidade)} />
                </div>

                {/* Tombo */}
                {selectedLaudo.tombo && (
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <span className="block text-[9px] text-gray-400 uppercase mb-1">Número de Tombo</span>
                    <span className="text-[14px] text-[#1A1A2E] font-semibold">{selectedLaudo.tombo}</span>
                  </div>
                )}

                {/* Testes */}
                {selectedLaudo.testesRealizados && (
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <span className="block text-[9px] text-gray-400 uppercase mb-2">Testes Realizados</span>
                    <p className="text-[13px] text-[#1A1A2E] leading-relaxed whitespace-pre-wrap">{selectedLaudo.testesRealizados}</p>
                  </div>
                )}

                {/* Diagnóstico */}
                {selectedLaudo.diagnostico && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="block text-[9px] text-[#003B99] uppercase mb-2">Diagnóstico / Conclusão</span>
                    <p className="text-[13px] text-[#1A1A2E] leading-relaxed whitespace-pre-wrap">{selectedLaudo.diagnostico}</p>
                  </div>
                )}

                {/* Assinatura */}
                {selectedLaudo.signature && (
                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center">
                    <span className="block text-[9px] text-gray-400 uppercase mb-3">Assinatura Digital</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedLaudo.signature} alt="Assinatura" className="max-h-[120px] object-contain" />
                    <span className="text-[11px] text-[#1A1A2E] mt-2 font-semibold">{selectedLaudo.tecnico}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Especialista ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-6">
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
                      <span className="block text-[9px] text-gray-400 uppercase mb-1">Perfil</span>
                      <span className={`text-[14px] uppercase font-semibold ${selectedUser.isAdmin ? "text-[#003B99]" : "text-gray-600"}`}>
                        {selectedUser.isAdmin ? "Administrador" : "Técnico"}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <span className="block text-[9px] text-gray-400 uppercase mb-1">Membro desde</span>
                      <span className="text-[14px] text-[#1A1A2E]">{new Date(selectedUser.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center p-10 text-gray-400">Usuário não possui dados vinculados.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-[14px] text-[#1A1A2E] font-semibold">{value || "—"}</span>
    </div>
  );
}
