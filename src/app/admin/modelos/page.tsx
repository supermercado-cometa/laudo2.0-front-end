"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Search, Loader2, Trash2, Edit3, Plus, X, Save } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { AdminPageLayout } from "@/components/admin-page-layout";

interface Modelo {
  id: number;
  nome: string;
  equipamentoId: number;
  ativo: boolean;
}

export default function ModelosPage() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [equipamentos, setEquipamentos] = useState<{id: number, nome: string}[]>([]);
  const [filtroEquipamento, setFiltroEquipamento] = useState<string>("");

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: "", equipamentoId: "", ativo: true });

  const fetchModelos = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/modelos?includeInactive=true`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        setModelos(await res.json());
      }
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchEquipamentos = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/equipamentos`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) setEquipamentos(await res.json());
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
    }
  }, []);

  useEffect(() => {
    fetchModelos();
    fetchEquipamentos();
  }, [fetchModelos, fetchEquipamentos]);

  const handleOpenModal = (item?: Modelo) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ 
        nome: item.nome, 
        equipamentoId: String(item.equipamentoId || ""),
        ativo: item.ativo 
      });
    } else {
      setEditingId(null);
      setFormData({ nome: "", equipamentoId: "", ativo: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.equipamentoId) {
      alert("Por favor, preencha o nome do modelo e selecione o equipamento.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_BASE_URL}/modelos/${editingId}` : `${API_BASE_URL}/modelos`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "" 
        },
        body: JSON.stringify({
          nome: formData.nome,
          equipamentoId: Number(formData.equipamentoId),
          ativo: formData.ativo
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchModelos();
      }
    } catch (err) {
      console.error("Erro ao salvar modelo:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover este modelo de laudo?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/modelos/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) fetchModelos();
    } catch (err) {
      console.error("Erro:", err);
    }
  };

  const filtered = modelos.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEq = filtroEquipamento ? m.equipamentoId === Number(filtroEquipamento) : true;
    return matchesSearch && matchesEq;
  });

  return (
    <AdminPageLayout
      title={`Templates de\nModelos`}
      subtitle="Defina os modelos de checklists e auditoria que os técnicos utilizarão durante as inspeções em campo."
      icon={FileText}
      backUrl="/admin"
    >
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] uppercase tracking-tighter leading-none">
            Modelos Disponíveis
          </h2>
          <button 
            onClick={() => handleOpenModal()} 
            className="w-full sm:w-auto bg-[#1A4CAB] text-white px-8 h-12 rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-[#003B99]/10 flex items-center justify-center gap-2 hover:bg-[#003B99] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Adicionar Modelo
          </button>
        </div>

        {/* Busca e Filtro Premium */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-[#1A4CAB]" />
            <input 
              type="text" 
              placeholder="Pesquisar modelos de laudo..." 
              className="w-full h-12 pl-14 pr-6 rounded-xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-[#1A4CAB]/10 outline-none transition-all text-[#1A1A2E] placeholder:text-gray-300" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="md:w-64 shrink-0">
            <select 
              value={filtroEquipamento} 
              onChange={e => setFiltroEquipamento(e.target.value)} 
              className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]/10 shadow-sm transition-all"
            >
              <option value="">Todos os Equipamentos</option>
              {equipamentos.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
            <p className="mt-4 text-gray-400 text-[10px] uppercase tracking-widest text-center">Carregando modelos técnicos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="w-full bg-white p-6 rounded-[24px] lg:rounded-[32px] flex items-center justify-between gap-6 shadow-sm group border border-transparent hover:border-[#003B99]/10 transition-all">
                <div className="flex items-center gap-4 lg:gap-8 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#003B99] transition-all overflow-hidden shrink-0 shadow-inner">
                    <FileText className="text-[#003B99] group-hover:text-white w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#1A1A2E] text-[16px] lg:text-[18px] uppercase tracking-tight truncate leading-tight mb-1">{item.nome}</h3>
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] uppercase tracking-widest border-t border-gray-50 pt-1 font-bold ${item.ativo !== false ? 'text-green-500' : 'text-red-400'}`}>
                         Status: {item.ativo !== false ? 'Ativo' : 'Inativo'}
                       </span>
                       <span className="text-[10px] text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-1"> · Equipamento: {equipamentos.find(eq => eq.id === item.equipamentoId)?.nome || "N/A"}</span>
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
                 <p className="text-[#9CA3AF] uppercase text-[12px] tracking-widest">Nenhum modelo identificado.</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE MODELO PREMIUM */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-6">
           <div className="bg-white rounded-[32px] p-8 lg:p-12 max-w-lg w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[#1A1A2E] text-3xl uppercase tracking-tighter leading-none mb-2">
                    {editingId ? 'Editar Modelo' : 'Novo Modelo'}
                  </h3>
                  <p className="text-gray-400 text-sm">Defina o nome do modelo para os laudos.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-6 h-6" /></button>
             </div>

             <div className="space-y-8">
                 <div className="space-y-3">
                   <label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Identificação do Modelo</label>
                   <input 
                     type="text" 
                     placeholder="Ex: Checklist de Padronização" 
                     value={formData.nome} 
                     onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                     className="w-full h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] px-6 text-lg outline-none transition-all text-[#1A1A2E] placeholder:text-gray-300" 
                   />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Vincular a Equipamento</label>
                   <select 
                     value={formData.equipamentoId} 
                     onChange={e => setFormData({ ...formData, equipamentoId: e.target.value })} 
                     className="w-full h-12 rounded-xl bg-gray-50 border-none px-6 text-lg text-[#1A1A2E] appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A4CAB]"
                   >
                     <option value="">Selecione o equipamento...</option>
                     {equipamentos.map(eq => (
                       <option key={eq.id} value={eq.id}>{eq.nome}</option>
                     ))}
                   </select>
                 </div>
                  <div className="flex items-center gap-3 py-2">
                    <input 
                      type="checkbox" 
                      id="ativo"
                      checked={formData.ativo}
                      onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-[#1A4CAB] focus:ring-[#1A4CAB]"
                    />
                    <label htmlFor="ativo" className="text-gray-700 font-medium cursor-pointer">Modelo Ativo</label>
                  </div>
                  <div className="pt-4">
                   <button 
                     onClick={handleSave} 
                     className="w-full h-12 bg-[#1A4CAB] text-white rounded-xl text-[11px] tracking-widest uppercase flex items-center justify-center gap-3 shadow-lg shadow-[#003B99]/10 hover:bg-[#003B99] active:scale-95 transition-all"
                   >
                     <Save className="w-5 h-5" /> {editingId ? 'Salvar Edição' : 'Registrar Modelo'}
                   </button>
                 </div>
             </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
