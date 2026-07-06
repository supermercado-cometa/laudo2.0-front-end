"use client";

import React, { useEffect, useState } from "react";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Store, 
  User, 
  Loader2, 
  Monitor,
  BarChart3
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

interface StatItem {
  loja?: string;
  equipamento?: string;
  modelo?: string;
  tecnico?: string;
  estadoEquipamento?: string;
  _count: { id: number };
}

interface DashboardStats {
  totalLaudos: number;
  maisLaudados: StatItem[];
  maisDanificados: StatItem[];
  porLoja: StatItem[];
  statusDistrib: StatItem[];
  porTecnico: StatItem[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/auditoria/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setStats(data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Erro ao carregar stats:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <AdminPageLayout title="Painel de\nGestão" icon={Activity}>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#003B99] animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Carregando métricas...</p>
        </div>
      </AdminPageLayout>
    );
  }

  if (!stats) {
    return (
      <AdminPageLayout title="Painel de\nGestão" icon={Activity}>
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100">
          <p>Não foi possível carregar as estatísticas. Verifique a conexão com o banco de dados.</p>
        </div>
      </AdminPageLayout>
    );
  }

  const maxLaudados = Math.max(...stats.maisLaudados.map(i => i._count.id), 1);
  const maxDanificados = Math.max(...stats.maisDanificados.map(i => i._count.id), 1);

  return (
    <AdminPageLayout 
      title="Painel de\nGestão" 
      subtitle="Visão estratégica sobre o estado do parque tecnológico e performance técnica."
      icon={Activity}
    >
      <div className="space-y-10">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-[#003B9914] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="text-[#003B99] w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 font-bold">Total de Laudos</p>
              <p className="text-3xl font-black text-[#1A1C1E]">{stats.totalLaudos}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-[#FF980014] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="text-[#FF9800] w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 font-bold">Criticidade Média</p>
              <p className="text-3xl font-black text-[#1A1C1E]">
                {((stats.statusDistrib.find(s => s.estadoEquipamento === 'NAO_FUNCIONANDO')?._count.id || 0) / (stats.totalLaudos || 1) * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-[#4CAF5014] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="text-[#4CAF50] w-8 h-8" />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 font-bold">Lojas Atendidas</p>
              <p className="text-3xl font-black text-[#1A1C1E]">{stats.porLoja.length}</p>
            </div>
          </div>
        </div>

        {/* Gráficos de Barras Customizados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Equipamentos Mais Laudados */}
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-[#003B991F] rounded-xl flex items-center justify-center">
                <Monitor className="text-[#003B99] w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1C1E]">Equipamentos mais Laudados</h3>
            </div>
            
            <div className="space-y-6">
              {stats.maisLaudados.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">{item.equipamento}</span>
                    <span className="text-[#003B99] font-black">{item._count.id}</span>
                  </div>
                  <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#003B99] to-[#0066FF] rounded-full transition-all duration-1000"
                      style={{ width: `${(item._count.id / maxLaudados) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {stats.maisLaudados.length === 0 && <p className="text-gray-400 text-center py-4">Nenhum dado disponível</p>}
            </div>
          </div>

          {/* Modelos com Mais Danos */}
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-[#FF52521F] rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-[#FF5252] w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1C1E]">Modelos com mais Danos</h3>
            </div>

            <div className="space-y-6">
              {stats.maisDanificados.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">{item.modelo}</span>
                    <span className="text-[#FF5252] font-black">{item._count.id}</span>
                  </div>
                  <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF5252] to-[#FF1744] rounded-full transition-all duration-1000"
                      style={{ width: `${(item._count.id / maxDanificados) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {stats.maisDanificados.length === 0 && <p className="text-gray-400 text-center py-4">Nenhum dado disponível</p>}
            </div>
          </div>

        </div>

        {/* Tabela de Top Lojas e Técnicos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-[#4CAF501F] rounded-xl flex items-center justify-center">
                  <Store className="text-[#4CAF50] w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1C1E]">Top Lojas (Volume)</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.porLoja.map((item, idx) => (
                  <div key={idx} className="py-4 flex justify-between items-center">
                    <span className="text-gray-600 font-medium">{item.loja}</span>
                    <span className="bg-gray-50 px-4 py-1 rounded-full text-sm font-bold text-gray-500">{item._count.id} laudos</span>
                  </div>
                ))}
              </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-[#9C27B01F] rounded-xl flex items-center justify-center">
                  <User className="text-[#9C27B0] w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1C1E]">Top Técnicos (Eficiência)</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.porTecnico.map((item, idx) => (
                  <div key={idx} className="py-4 flex justify-between items-center">
                    <span className="text-gray-600 font-medium">{item.tecnico}</span>
                    <span className="bg-gray-50 px-4 py-1 rounded-full text-sm font-bold text-gray-500">{item._count.id} emitidos</span>
                  </div>
                ))}
              </div>
          </div>
        </div>

      </div>
    </AdminPageLayout>
  );
}
