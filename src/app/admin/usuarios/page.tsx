"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, ChevronLeft, Search, UserCheck, Loader2, Plus, Trash2, Edit3, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubPageHeader } from "@/components/subpage-header";
import { UsuarioType } from "@/types/domain";
import { API_BASE_URL } from "@/lib/api-config";

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: "" });

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

  const handleOpenModal = () => {
    setFormData({ username: "" });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.username) {
      alert("Por favor, preencha o username.");
      return;
    }
    
    // Check se já existe e alertar (opcional) para não recriar
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
          isAdmin: true
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F3F6F9]">
      <SubPageHeader title={`Admin\nUsuários`} icon={Users} type="checklists" />

      {/* Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-b from-[#0E3D8A] to-[#1E5BB5] p-20 flex-col justify-center relative overflow-hidden sticky top-0 h-screen">
        <button onClick={() => router.push("/admin")} className="absolute top-10 left-12 flex items-center gap-2 px-6 py-3 rounded-[10px] bg-white/10 backdrop-blur-md border border-white/10 text-white lg:font-medium font-bold hover:bg-white/20 transition-all">
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <UserCheck className="text-white w-10 h-10" />
          </div>
          <div className="w-[80px] h-[4px] bg-[#FECC00] mb-8 rounded-full" />
          <h1 className="text-white text-[48px] lg:font-medium font-[800] leading-[1.1] uppercase tracking-tight mb-8">
            {`Admin\nUsuários`}
          </h1>
          <p className="text-white/70 text-lg font-medium">Controle de acesso. Cadastre quem terá permissão administrativa para acessar este painel.</p>
        </div>
      </div>

      {/* Lado Direito */}
      <div className="flex-1 lg:w-[60%] flex flex-col p-6 lg:p-24 overflow-y-auto">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-[#1A1A2E] text-[32px] lg:font-medium font-[800]">Administradores</h2>
            <button onClick={handleOpenModal} className="bg-[#0E3D8A] text-white px-8 py-4 rounded-xl text-[14px] lg:font-medium font-bold uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-[#0A2D66] transition-all">
              <Plus className="w-5 h-5" /> Novo Admin
            </button>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input type="text" placeholder="Pesquisar por username..." className="w-full h-16 pl-14 pr-6 rounded-2xl bg-[#EDF1F7] border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-20 animate-spin">
              <Loader2 className="w-10 h-10 text-[#0E3D8A]" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsuarios.map((usuario) => (
                <div key={usuario.id} className="w-full bg-white p-6 rounded-2xl flex items-center gap-6 shadow-sm group">
                  <div className="flex-1 text-left flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#0E3D8A]/5 flex items-center justify-center group-hover:bg-[#0E3D8A] transition-all">
                      <Users className="text-[#0E3D8A] group-hover:text-white w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-[#1A1A2E] text-[16px] lg:font-medium font-[700] mb-1">{usuario.username}</h3>
                      <div className="flex items-center gap-4 text-[#6B7280] text-[12px] font-medium uppercase tracking-widest">
                        <span>Acesso: {usuario.isAdmin ? 'Admin' : 'Restrito'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleDelete(usuario.id)} className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center transition-all hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE USUÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-[#1A1A2E] text-2xl lg:font-medium font-black uppercase">Adicionar Admin</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X /></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] lg:font-medium font-black uppercase text-gray-400">Username (LDAP)</label>
                  <input type="text" placeholder="Ex: victor.peixoto" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full h-16 rounded-2xl bg-gray-50 border-none px-6 font-bold text-lg" />
                </div>
                <button onClick={handleSave} className="w-full h-18 bg-[#0E3D8A] py-5 text-white rounded-2xl text-[15px] lg:font-medium font-[800] tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl">
                   <Save className="w-5 h-5" /> Autorizar Usuário
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
