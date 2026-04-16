"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Store, Search, Loader2, Trash2, Edit3, Plus, X, Save } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { AdminPageLayout } from "@/components/admin-page-layout";

interface Loja {
  id: number;
  nome: string;
}

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: "" });

  const fetchLojas = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/lojas`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        setLojas(await res.json());
      }
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLojas();
  }, [fetchLojas]);

  const handleOpenModal = (item?: Loja) => {
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
      alert("Por favor, preencha o nome da loja.");
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
    if (!confirm("Remover esta loja?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/lojas/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) fetchLojas();
    } catch (err) {
      console.error("Erro:", err);
    }
  };

  const filtered = lojas.filter(l => l.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminPageLayout
      title={`Unidades e\nGestão de Lojas`}
      subtitle="Gerencie as unidades do Cometa Supermercados para vincular corretamente os laudos técnicos."
      icon={Store}
      backUrl="/admin"
    >
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] uppercase tracking-tighter leading-none">
            Lojas Ativas
          </h2>
          <button 
            onClick={() => handleOpenModal()} 
            className="w-full sm:w-auto bg-[#1A4CAB] text-white px-8 h-12 rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-[#003B99]/10 flex items-center justify-center gap-2 hover:bg-[#003B99] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Adicionar Loja
          </button>
        </div>

        {/* Busca Premium */}
        <div className="relative mb-8 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-[#1A4CAB]" />
          <input 
            type="text" 
            placeholder="Pesquisar loja (ex: Unidade 01)..." 
            className="w-full h-12 pl-14 pr-6 rounded-xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-[#1A4CAB]/10 outline-none transition-all text-[#1A1A2E] placeholder:text-gray-300" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
            <p className="mt-4 text-gray-400 text-[10px] uppercase tracking-widest text-center">Localizando unidades na rede...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="w-full bg-white p-6 rounded-[24px] lg:rounded-[32px] flex items-center justify-between gap-6 shadow-sm group border border-transparent hover:border-[#003B99]/10 transition-all">
                <div className="flex items-center gap-4 lg:gap-8 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#003B99] transition-all overflow-hidden shrink-0 shadow-inner">
                    <Store className="text-[#003B99] group-hover:text-white w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#1A1A2E] text-[16px] lg:text-[18px] uppercase tracking-tight truncate leading-tight mb-1">{item.nome}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-1">Status: Ativo</span>
                    </div>
                  </div>
                </div>
                 <div className="flex gap-2 shrink-0">
                    <button 
                     onClick={() => handleOpenModal(item)} 
                     className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A4CAB] flex items-center justify-center hover:bg-[#1A4CAB] hover:text-white transition-all shadow-sm active:scale-90"
                    >
                     <Edit3 className="w-4.5 h-4.5" />
                    </button>
                    <button 
                     onClick={() => handleDelete(item.id)} 
                     className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white shadow-sm active:scale-90"
                    >
                     <Trash2 className="w-4.5 h-4.5" />
                    </button>
                 </div>
              </div>
            ))}
            
            {filtered.length === 0 && !isLoading && (
               <div className="p-20 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-200">
                 <p className="text-[#9CA3AF] uppercase text-[12px] tracking-widest">Nenhuma loja identificada.</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE LOJA PREMIUM */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-6">
           <div className="bg-white rounded-[32px] p-8 lg:p-12 max-w-lg w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[#1A1A2E] text-3xl uppercase tracking-tighter leading-none mb-2">
                    {editingId ? 'Editar Loja' : 'Nova Loja'}
                  </h3>
                  <p className="text-gray-400 text-sm">Identifique a unidade para os relatórios.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-6 h-6" /></button>
             </div>

             <div className="space-y-8">
                 <div className="space-y-3">
                   <label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Nome da Unidade</label>
                   <input 
                     type="text" 
                     placeholder="Ex: Loja 01 - Matriz" 
                     value={formData.nome} 
                     onChange={e => setFormData({ nome: e.target.value })} 
                     className="w-full h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] px-6 text-lg outline-none transition-all text-[#1A1A2E] placeholder:text-gray-300" 
                   />
                 </div>
                                <div className="pt-4">
                   <button 
                     onClick={handleSave} 
                     className="w-full h-12 bg-[#1A4CAB] text-white rounded-xl text-[11px] tracking-widest uppercase flex items-center justify-center gap-3 shadow-lg shadow-[#003B99]/10 hover:bg-[#003B99] active:scale-95 transition-all"
                   >
                     <Save className="w-5 h-5" /> {editingId ? 'Salvar Edição' : 'Registrar Loja'}
                   </button>
                 </div>
             </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
