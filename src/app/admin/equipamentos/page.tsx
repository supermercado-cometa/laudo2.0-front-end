"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Monitor, Search, Loader2, Trash2, Edit3, Plus, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { AdminPageLayout } from "@/components/admin-page-layout";

interface Equipamento {
  id: number;
  nome: string;
  tipo: string;
}

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para o Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: "", tipo: "" });

  const fetchEquipamentos = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/equipamentos`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        const data = await res.json();
        setEquipamentos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipamentos();
  }, [fetchEquipamentos]);

  const handleOpenModal = (item?: Equipamento) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ nome: item.nome, tipo: item.tipo });
    } else {
      setEditingId(null);
      setFormData({ nome: "", tipo: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.tipo) {
      alert("Por favor, preencha todos os campos (Nome e Tipo) antes de salvar.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_BASE_URL}/equipamentos/${editingId}` : `${API_BASE_URL}/equipamentos`;
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
        fetchEquipamentos();
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este equipamento?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/equipamentos/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) fetchEquipamentos();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const filtered = equipamentos.filter(e => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.tipo && e.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminPageLayout
      title={`Gestão de\nEquipamentos`}
      subtitle="Controle total do inventário. Adicione ou edite os equipamentos que estarão disponíveis para os laudos técnicos."
      icon={Monitor}
      backUrl="/admin"
    >
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] font-black uppercase tracking-tighter leading-none">
            Inventário Ativo
          </h2>
          <button 
            onClick={() => handleOpenModal()} 
            className="w-full sm:w-auto bg-[#003B99] text-white px-8 h-14 rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-[#0A2D66] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Novo Registro
          </button>
        </div>

        {/* Busca Premium */}
        <div className="relative mb-8 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 transition-colors group-focus-within:text-[#003B99]" />
          <input 
            type="text" 
            placeholder="Pesquisar equipamento ou categoria..." 
            className="w-full h-16 pl-16 pr-6 rounded-[20px] bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-[#003B99]/10 outline-none transition-all font-medium" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
            <p className="mt-4 text-gray-400 font-bold text-[10px] uppercase tracking-widest text-center">Consultando ativos em tempo real...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div key={item.id} className="w-full bg-white p-6 rounded-[24px] lg:rounded-[32px] flex items-center gap-6 shadow-sm group border border-transparent hover:border-[#003B99]/10 transition-all">
                <div className="flex-1 flex items-center gap-4 lg:gap-8">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#003B99] transition-all overflow-hidden shrink-0 shadow-inner">
                    <Monitor className="text-[#003B99] group-hover:text-white w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#1A1A2E] text-[16px] lg:text-[18px] font-black uppercase tracking-tight truncate leading-tight mb-1">{item.nome}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.15em] border-t border-gray-50 pt-1">Categoria: {item.tipo}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleOpenModal(item)} 
                    className="w-12 h-12 rounded-xl bg-blue-50 text-[#003B99] flex items-center justify-center hover:bg-[#003B99] hover:text-white transition-all shadow-sm active:scale-90"
                   >
                    <Edit3 className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={() => handleDelete(item.id)} 
                    className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white shadow-sm active:scale-90"
                   >
                    <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && !isLoading && (
              <div className="p-20 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[12px] tracking-widest">Nenhum equipamento encontrado na busca.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO PREMIUM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-6">
          <div className="bg-white rounded-[40px] p-8 lg:p-12 max-w-lg w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[#1A1A2E] text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                    {editingId ? 'Editar Ativo' : 'Novo Ativo'}
                  </h3>
                  <p className="text-gray-400 font-medium text-sm">Preencha as especificações do equipamento.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-6 h-6" /></button>
             </div>

             <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Nome Comercial / Técnico</label>
                  <input type="text" placeholder="Ex: Impressora HP LaserJet" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full h-18 rounded-2xl bg-gray-50 border border-transparent focus:border-[#003B99] focus:bg-white px-6 font-bold text-lg outline-none transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Tipo ou Categoria</label>
                  <input type="text" placeholder="Ex: Periférico" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full h-18 rounded-2xl bg-gray-50 border border-transparent focus:border-[#003B99] focus:bg-white px-6 font-bold text-lg outline-none transition-all" />
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={handleSave} 
                    className="w-full h-20 bg-[#003B99] text-white rounded-2xl text-[16px] font-black tracking-widest uppercase flex items-center justify-center gap-3 shadow-2xl hover:bg-[#0A2D66] active:scale-95 transition-all"
                  >
                    <Save className="w-6 h-6" /> {editingId ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
