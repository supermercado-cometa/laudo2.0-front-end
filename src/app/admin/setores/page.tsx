"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Briefcase, Search, ChevronLeft, Loader2, Trash2, Edit3, Plus, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";
import { API_BASE_URL } from "@/lib/api-config";

interface Setor {
  id: number;
  nome: string;
}

export default function SetoresPage() {
  const router = useRouter();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: "" });

  const fetchSetores = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/setor`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        setSetores(await res.json());
      }
    } catch (error) {
      console.error("Erro ao carregar setores:", error);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchSetores();
  }, [fetchSetores]);

  const handleOpenModal = (item?: Setor) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ nome: item.nome });
    } else {
      setEditingId(null);
      setFormData({ nome: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      alert("Por favor, preencha o nome do setor antes de salvar.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_BASE_URL}/setor/${editingId}` : `${API_BASE_URL}/setor`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "" 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchSetores();
      }
    } catch (err) {
      console.error("Erro ao salvar setor:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este setor?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/setor/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) fetchSetores();
    } catch (err) {
      console.error("Erro:", err);
    }
  };

  const filtered = setores.filter(s => s.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Gestão de\nSetores`} icon={Briefcase} type="checklists" />

      {/* Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#009688] to-[#00796B] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen shadow-2xl">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <Briefcase className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full shadow-lg" />
          <h1 className="text-white text-[48px] lg:font-medium font-[800] leading-[1.1] uppercase tracking-tight mb-8">
            Gestão de Setores
          </h1>
          <p className="text-white/70 text-lg font-medium">Cadastre e organize os setores das lojas que serão auditados.</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[60%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800]">Setores Ativos</h2>
            <button onClick={() => handleOpenModal()} className="bg-[#009688] text-white px-8 py-4 rounded-xl text-[14px] lg:font-medium font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-[#00796B] transition-all">
              <Plus className="w-5 h-5" /> Novo Setor
            </button>
          </div>

          <div className="relative mb-8"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" /><input type="text" placeholder="Pesquisar setor..." className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#EDF1F7] border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

          {isLoading ? <div className="flex justify-center p-20 animate-spin"><Loader2 className="w-10 h-10 text-[#009688]" /></div> : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((item) => (
                <div key={item.id} className="w-full bg-white p-6 rounded-2xl flex items-center justify-between shadow-sm group border border-transparent hover:border-[#009688]/10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#009688]/5 flex items-center justify-center group-hover:bg-[#009688] transition-all">
                      <Briefcase className="text-[#009688] group-hover:text-white w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-[#1A1A2E] text-[16px] lg:font-medium font-[700] uppercase mb-1">{item.nome}</h3>
                      <p className="text-[#6B7280] text-[12px] font-medium uppercase tracking-widest">Loja Matriz • Ativo</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleDelete(item.id)} className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                     <button onClick={() => handleOpenModal(item)} className="w-10 h-10 rounded-lg bg-blue-50 text-[#009688] flex items-center justify-center"><Edit3 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-[#1A1A2E] text-2xl lg:font-medium font-black uppercase text-center">{editingId ? 'Editar Setor' : 'Novo Setor'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X /></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] lg:font-medium font-black uppercase text-gray-400">Nome do Setor</label>
                   <input type="text" value={formData.nome} onChange={e => setFormData({ nome: e.target.value })} className="w-full h-16 rounded-2xl bg-gray-50 border-none px-6 font-bold" />
                </div>
                
                <button onClick={handleSave} className="w-full h-18 bg-[#009688] text-white rounded-2xl text-[15px] lg:font-medium font-[800] tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl">
                   <Save className="w-5 h-5" /> Salvar Setor
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
