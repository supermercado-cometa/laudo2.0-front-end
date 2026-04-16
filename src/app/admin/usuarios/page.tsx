"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, Loader2, Plus, Trash2, Edit3, X, Save, Search } from "lucide-react";
import { UsuarioType } from "@/types/domain";
import { API_BASE_URL } from "@/lib/api-config";
import { AdminPageLayout } from "@/components/admin-page-layout";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioType | null>(null);
  const [formData, setFormData] = useState({ username: "", canManageUsers: false });

  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/usuarios`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleOpenModal = (user?: UsuarioType) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, canManageUsers: user.canManageUsers ?? false });
    } else {
      setEditingUser(null);
      setFormData({ username: "", canManageUsers: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.username) {
      alert("Por favor, preencha o username.");
      return;
    }
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "" 
        },
        body: JSON.stringify({
          username: formData.username.trim().toLowerCase(),
          isAdmin: true,
          canManageUsers: formData.canManageUsers
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsuarios();
      } else {
        alert("Erro ao salvar usuário.");
      }
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remover os privilégios deste administrador?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) fetchUsuarios();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const filteredUsuarios = usuarios.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminPageLayout
      title={`Controle de\nUsuários`}
      subtitle="Gerencie quem tem permissão para acessar o painel administrativo e definir novos acessos."
      icon={UserCheck}
      backUrl="/admin"
    >
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <h2 className="text-[#1A1A2E] text-[24px] lg:text-[32px] uppercase tracking-tighter leading-none">
            Administradores
          </h2>
          <button 
            onClick={() => handleOpenModal()} 
            className="w-full sm:w-auto bg-[#1A4CAB] text-white px-8 h-12 rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-[#003B99]/10 flex items-center justify-center gap-2 hover:bg-[#003B99] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Adicionar Acesso
          </button>
        </div>

        {/* Busca Premium */}
        <div className="relative mb-8 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-[#1A4CAB]" />
          <input 
            type="text" 
            placeholder="Pesquisar por username (ex: joao.silva)..." 
            className="w-full h-12 pl-14 pr-6 rounded-xl bg-gray-50 border-none shadow-sm focus:ring-2 focus:ring-[#1A4CAB]/10 outline-none transition-all text-[#1A1A2E] placeholder:text-gray-300" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <Loader2 className="w-12 h-12 text-[#003B99] animate-spin" />
            <p className="mt-4 text-gray-400 text-[10px] uppercase tracking-widest text-center">Sincronizando banco de usuários...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsuarios.map((usuario) => (
              <div key={usuario.id} className="w-full bg-white p-6 rounded-[24px] lg:rounded-[32px] flex items-center gap-6 shadow-sm group border border-transparent hover:border-[#003B99]/10 transition-all">
                <div className="flex-1 text-left flex items-center gap-4 lg:gap-8">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#003B99] transition-all overflow-hidden shrink-0">
                    <Users className="text-[#003B99] group-hover:text-white w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[#1A1A2E] text-[16px] lg:text-[18px] mb-1 truncate">{usuario.username}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#6B7280] text-[10px] lg:text-[11px] uppercase tracking-widest pt-1 border-t border-gray-50 group-hover:border-[#003B99]/10 transition-colors">
                      <span className={usuario.isAdmin ? "text-[#003B99]" : ""}>Role: {usuario.isAdmin ? 'Admin' : 'Default'}</span>
                      <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300" />
                      <span className={usuario.canManageUsers ? "text-green-600" : ""}>Gestão: {usuario.canManageUsers ? 'AUTONOMIA TOTAL' : 'APENAS LEITURA'}</span>
                    </div>
                  </div>
                </div>
                 <div className="flex gap-2">
                    <button 
                     onClick={() => handleOpenModal(usuario)} 
                     className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A4CAB] flex items-center justify-center hover:bg-[#1A4CAB] hover:text-white transition-all shadow-sm active:scale-90"
                    >
                     <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                     onClick={() => handleDelete(usuario.id)} 
                     className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white shadow-sm active:scale-90"
                    >
                     <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE USUÁRIO PREMIUM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#003B99]/40 backdrop-blur-md p-6">
          <div className="bg-white rounded-[32px] p-8 lg:p-12 max-w-lg w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in duration-300">
             <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[#1A1A2E] text-3xl uppercase tracking-tighter leading-none mb-2">
                    {editingUser ? 'Ajustar Perfil' : 'Novo Acesso'}
                  </h3>
                  <p className="text-gray-400 text-sm">Defina as permissões deste administrador.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-6 h-6" /></button>
             </div>

             <div className="space-y-8">
                 <div className="space-y-3">
                   <label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider flex items-center gap-2">
                     Username da Rede (LDAP)
                     <span className="text-red-400">*</span>
                   </label>
                   <input 
                     type="text" 
                     placeholder="Ex: joao.silva" 
                     value={formData.username} 
                     disabled={!!editingUser} 
                     onChange={e => setFormData({...formData, username: e.target.value})} 
                     className="w-full h-12 rounded-xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-[#1A4CAB] px-6 text-lg outline-none transition-all disabled:opacity-50 text-[#1A1A2E] placeholder:text-gray-300" 
                   />
                 </div>
                                <div className="bg-[#1A4CAB]/5 p-6 rounded-[24px] border border-[#1A4CAB]/10">
                   <div className="flex items-start gap-4">
                     <div className="pt-1">
                       <input
                         id="canManageUsers"
                         type="checkbox"
                         checked={formData.canManageUsers}
                         onChange={(e) => setFormData({...formData, canManageUsers: e.target.checked})}
                         className="w-5 h-5 rounded-lg border-[#1A4CAB] text-[#1A4CAB] focus:ring-[#1A4CAB] cursor-pointer"
                       />
                     </div>
                     <div className="flex flex-col gap-1">
                       <label htmlFor="canManageUsers" className="text-[14px] text-[#1A1A2E] cursor-pointer leading-tight uppercase">
                         Autonomia de Gestão
                       </label>
                       <span className="text-[11px] text-[#6B7280] leading-relaxed uppercase">
                         Permite cadastrar administradores e alterar configurações.
                       </span>
                     </div>
                   </div>
                 </div>

                 <div className="pt-4">
                   <button 
                     onClick={handleSave} 
                     className="w-full h-12 bg-[#1A4CAB] text-white rounded-xl text-[11px] tracking-widest uppercase flex items-center justify-center gap-3 shadow-lg shadow-[#003B99]/10 hover:bg-[#003B99] active:scale-95 transition-all"
                   >
                     <Save className="w-5 h-5" /> {editingUser ? 'Atualizar Dados' : 'Autorizar Agora'}
                   </button>
                 </div>
             </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
