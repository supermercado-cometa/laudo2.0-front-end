"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Store, ChevronRight, Search, LayoutGrid, Loader2, Plus, Trash2, Edit3, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { LojaType } from "@/types/domain";
import { API_BASE_URL } from "@/lib/api-config";
import { AdminPageLayout } from "@/components/admin-page-layout";

export default function LojasPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<LojaType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: "", filial: "", cidade: "" });

  const fetchLojas = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/lojas`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        const data = await res.json();
        setLojas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLojas();
  }, [fetchLojas]);

  const handleOpenModal = (item?: LojaType) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ nome: item.nome, filial: item.filial || "", cidade: item.cidade || "" });
    } else {
      setEditingId(null);
      setFormData({ nome: "", filial: "", cidade: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) {
      alert("Por favor, preencha o nome da loja antes de salvar.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_BASE_URL}/lojas/${editingId}` : `${API_BASE_URL}/lojas`;
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
        fetchLojas();
      }
    } catch (err) {
      console.error("Erro ao salvar loja:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover esta loja permanentemente?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/lojas/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) fetchLojas();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const filteredLojas = lojas.filter(loja => 
    loja.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loja.filial && loja.filial.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminPageLayout
      title={`Gestão de\nUnidades`}
      subtitle="Administre as filiais da rede, mantendo os dados de localização e identificação atualizados para as auditorias."
      icon={LayoutGrid}
      backUrl="/admin"
    >
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] font-black uppercase tracking-tighter leading-none">
            Unidades de Rede
          </h2>
          <button 
            onClick={() => handleOpenModal()} 
            className="w-full sm:w-auto bg-[#003B99] text-white px-8 h-14 rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-[#0A2D66] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Cadastrar Loja
          </button>
        </div>

        {/* Busca Premium */}
        <div className="relative mb-8 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 transition-colors group-focus-within:text-[#003B99]" />
          <input 
            type="text" 
            placeholder="Buscar por nome, filial ou cidade..." 
            className="w-full h-16 pl-16 pr-6 rounded-[20px] bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-[#003B99]/10 outline-none transition-all font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
            <p className="mt-4 text-gray-400 font-bold text-[10px] uppercase tracking-widest text-center">Cruzando dados das filiais...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLojas.map((loja) => (
              <div key={loja.id} className="w-full bg-white p-6 rounded-[24px] lg:rounded-[32px] flex items-center gap-6 shadow-sm group border border-transparent hover:border-[#003B99]/10 transition-all">
                <button 
                  onClick={() => router.push(`/admin/lojas/${loja.id}`)} 
                  className="flex-1 text-left flex items-center gap-4 lg:gap-8 min-w-0"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#003B99] transition-all overflow-hidden shrink-0 shadow-inner">
                    <Store className="text-[#003B99] group-hover:text-white w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#1A1A2E] text-[16px] lg:text-[18px] font-black uppercase tracking-tight truncate leading-tight mb-1">{loja.nome}</h3>
                    <div className="flex items-center gap-2 text-[#6B7280] text-[10px] lg:text-[11px] font-black uppercase tracking-widest pt-1 border-t border-gray-50 group-hover:border-[#003B99]/10 transition-colors">
                      <span>{loja.filial || 'Filial 00'}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-200" />
                      <span>{loja.cidade || 'S/ Cidade'}</span>
                    </div>
                  </div>
                </button>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleOpenModal(loja)} 
                    className="w-11 h-11 rounded-xl bg-blue-50 text-[#003B99] flex items-center justify-center hover:bg-[#003B99] hover:text-white transition-all shadow-sm active:scale-90"
                   >
                    <Edit3 className="w-4.5 h-4.5" />
                   </button>
                   <button 
                    onClick={() => handleDelete(loja.id)} 
                    className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white shadow-sm active:scale-90"
                   >
                    <Trash2 className="w-4.5 h-4.5" />
                   </button>
                   <button 
                    onClick={() => router.push(`/admin/lojas/${loja.id}`)}
                    className="w-11 h-11 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-white hover:text-[#003B99] transition-all border border-transparent hover:border-blue-100"
                   >
                    <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))}
            
            {filteredLojas.length === 0 && !isLoading && (
              <div className="p-20 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[12px] tracking-widest">Nenhuma unidade corresponde aos filtros.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE LOJA PREMIUM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-6">
          <div className="bg-white rounded-[40px] p-8 lg:p-12 max-w-lg w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[#1A1A2E] text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                    {editingId ? 'Editar Loja' : 'Nova Loja'}
                  </h3>
                  <p className="text-gray-400 font-medium text-sm">Gere as informações básicas da unidade.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-6 h-6" /></button>
             </div>

             <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Identificação (Nome)</label>
                  <input type="text" placeholder="Ex: Cometa Supermercados" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full h-18 rounded-2xl bg-gray-50 border border-transparent focus:border-[#003B99] focus:bg-white px-6 font-bold text-lg outline-none transition-all" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Cód. Filial</label>
                    <input type="text" placeholder="Ex: 01" value={formData.filial} onChange={e => setFormData({...formData, filial: e.target.value})} className="w-full h-18 rounded-2xl bg-gray-50 border border-transparent focus:border-[#003B99] focus:bg-white px-6 font-bold text-lg outline-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Cidade</label>
                    <input type="text" placeholder="Ex: Fortaleza" value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full h-18 rounded-2xl bg-gray-50 border border-transparent focus:border-[#003B99] focus:bg-white px-6 font-bold text-lg outline-none transition-all" />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSave} 
                    className="w-full h-20 bg-[#003B99] text-white rounded-2xl text-[16px] font-black tracking-widest uppercase flex items-center justify-center gap-3 shadow-2xl hover:bg-[#0A2D66] active:scale-95 transition-all"
                  >
                    <Save className="w-6 h-6" /> {editingId ? 'Salvar Edição' : 'Cadastrar Unidade'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
