"use client";

import React, { useState, useEffect } from "react";
import { 
  Loader2, ShieldCheck, Monitor, Store, Hash, 
  Search, Calendar, User, Briefcase, Layout,
  Activity, TrendingUp, AlertTriangle, UserCheck
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import { AdminPageLayout } from "@/components/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

interface Stats {
  totalLaudos: number;
  maisLaudados: { equipamento: string; _count: { id: number } }[];
  maisDanificados: { modelo: string; _count: { id: number } }[];
  porLoja: { loja: string; _count: { id: number } }[];
  statusDistrib: { estadoEquipamento: string; _count: { id: number } }[];
  porTecnico: { tecnico: string; _count: { id: number } }[];
}

interface LaudoResult {
  id: number;
  numeroChamado: string;
  tecnico: string;
  equipamento: string;
  modelo: string;
  loja: string;
  setor: string;
  tombo: string;
  data: string;
  estadoEquipamento: string;
}

export default function AuditoriaDashboardPage() {
  const [filters, setFilters] = useState({
    tombo: "",
    numeroChamado: "",
    loja: "",
    setor: "",
    tecnico: "",
    equipamento: "",
    modelo: "",
    dataInicio: "",
    dataFim: ""
  });

  const [stats, setStats] = useState<Stats | null>(null);
  const [results, setResults] = useState<LaudoResult[]>([]);
  const [tomboSummary, setTomboSummary] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auditoria/stats`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setError("");
      setResults([]);
      setTomboSummary(null);
      const token = localStorage.getItem("token");

      // Se apenas o tombo estiver preenchido, usamos a busca de resumo de auditoria
      const onlyTombo = filters.tombo && !Object.entries(filters).some(([k, v]) => k !== 'tombo' && v);
      
      if (onlyTombo) {
        const res = await fetch(`${API_BASE_URL}/auditoria/tombo/${filters.tombo}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" }
        });
        if (res.ok) {
          setTomboSummary(await res.json());
          return;
        } else {
          setError("Equipamento não localizado na base de laudos.");
          return;
        }
      }

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });

      const res = await fetch(`${API_BASE_URL}/auditoria/search?${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (res.ok) setResults(await res.json());
      else setResults([]);
    } catch (err) {
      console.error("Erro na busca:", err);
      setError("Erro ao consultar base de dados.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AdminPageLayout
      title={`AUDITORIA POR\nNÚMERO DE TOMBO`}
      subtitle="Localize o histórico completo e a situação atual de qualquer ativo da rede através da etiqueta de patrimônio."
      icon={ShieldCheck}
      backUrl="/admin"
    >
      <div className="space-y-12">
        {/* Card de Busca Principal (Visual Idêntico à Imagem) */}
        <div className="bg-white rounded-[24px] lg:rounded-[32px] p-8 lg:p-12 shadow-sm border border-blue-50">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 space-y-3 w-full">
                <Label className="text-[#9CA3AF] text-[10px] uppercase tracking-wider">Patrimônio / Tombo</Label>
                <div className="relative group">
                  <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-[#1A4CAB] transition-colors" />
                  <Input 
                    value={filters.tombo} 
                    onChange={e => setFilters({...filters, tombo: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Ex: 123456" 
                    className="h-12 pl-14 bg-gray-50 border-none rounded-xl text-lg text-[#1A1A2E] focus:bg-white focus:ring-2 focus:ring-[#1A4CAB]/10 transition-all" 
                  />
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-12 px-6 rounded-xl text-[10px] uppercase font-bold tracking-widest text-gray-400 hover:text-[#1A4CAB] transition-all`}
                >
                  {showFilters ? "Menos filtros" : "Mais filtros"}
                </Button>
                <Button 
                  onClick={handleSearch}
                  className="h-12 px-10 bg-[#1A4CAB] text-white rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-[#003B99]/10 hover:bg-[#003B99] flex-1 md:flex-none active:scale-95 transition-all"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Consultar Patrimônio"}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase text-gray-400 font-bold">Chamado</Label>
                      <Input value={filters.numeroChamado} onChange={e => setFilters({...filters, numeroChamado: e.target.value})} className="bg-gray-50 border-none h-10 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase text-gray-400 font-bold">Loja</Label>
                      <Input value={filters.loja} onChange={e => setFilters({...filters, loja: e.target.value})} className="bg-gray-50 border-none h-10 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase text-gray-400 font-bold">Equipamento</Label>
                      <Input value={filters.equipamento} onChange={e => setFilters({...filters, equipamento: e.target.value})} className="bg-gray-50 border-none h-10 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase text-gray-400 font-bold">Técnico</Label>
                      <Input value={filters.tecnico} onChange={e => setFilters({...filters, tecnico: e.target.value})} className="bg-gray-50 border-none h-10 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase text-gray-400 font-bold">Data Início</Label>
                      <Input type="date" value={filters.dataInicio} onChange={e => setFilters({...filters, dataInicio: e.target.value})} className="bg-gray-50 border-none h-10 rounded-lg text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase text-gray-400 font-bold">Data Fim</Label>
                      <Input type="date" value={filters.dataFim} onChange={e => setFilters({...filters, dataFim: e.target.value})} className="bg-gray-50 border-none h-10 rounded-lg text-sm" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {error && <div className="p-6 bg-red-50 rounded-2xl border border-red-100/50 text-red-500 text-sm uppercase tracking-widest text-center">{error}</div>}

        {/* Resumo por Tombo (Cards Idênticos aos anteriores) */}
        {tomboSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1A4CAB] flex items-center justify-center text-white"><Monitor className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Ativo Identificado</p>
                    <h4 className="text-[#1A1A2E] text-lg leading-tight font-bold">{tomboSummary.equipamento}</h4>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-4">
                     <span className="text-gray-400 uppercase text-[10px] tracking-widest">Modelo</span>
                     <span className="text-[#1A1A2E] font-bold">{tomboSummary.modelo}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-400 uppercase text-[10px] tracking-widest">Histórico</span>
                     <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] uppercase tracking-widest font-bold">{tomboSummary.totalLaudos} Laudos Gerados</span>
                   </div>
                </div>
             </div>
             <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#FECC00] flex items-center justify-center text-[#1A1A2E]"><Store className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Localização Atual</p>
                    <h4 className="text-[#1A1A2E] text-lg leading-tight font-bold">{tomboSummary.loja}</h4>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-4">
                     <span className="text-gray-400 uppercase text-[10px] tracking-widest">Setor / Área</span>
                     <span className="text-[#1A1A2E] font-bold">{tomboSummary.setor}</span>
                   </div>
                   <div className="flex justify-between items-start text-sm pt-2">
                     <span className="text-gray-400 uppercase text-[10px] tracking-widest">Chamados</span>
                     <div className="flex flex-col gap-1 items-end">
                       {tomboSummary.chamadosAtrelados?.map((num: string, i: number) => (
                         <span key={i} className="px-2 py-0.5 bg-blue-50 text-[#0066FF] rounded text-[9px] uppercase font-black tracking-widest">#GLPI-{num}</span>
                       ))}
                     </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Dashboard Section */}
        {!isSearching && results.length === 0 && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Row 1: Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="Total de Laudos" 
                value={stats?.totalLaudos ?? 0} 
                icon={TrendingUp} 
                color="blue"
                isLoading={isLoadingStats}
              />
              <MetricCard 
                title="Equip. mais Laudado" 
                value={stats?.maisLaudados?.[0]?.equipamento ?? "—"} 
                subValue={`${stats?.maisLaudados?.[0]?._count?.id ?? 0} registros`}
                icon={Monitor} 
                color="yellow"
                isLoading={isLoadingStats}
              />
              <MetricCard 
                title="Modelo mais Crítico" 
                value={stats?.maisDanificados?.[0]?.modelo ?? "—"} 
                subValue="Maior taxa de danos"
                icon={AlertTriangle} 
                color="red"
                isLoading={isLoadingStats}
              />
              <MetricCard 
                title="Top Técnico" 
                value={stats?.porTecnico?.[0]?.tecnico ?? "—"} 
                subValue="Maior volume emitido"
                icon={UserCheck} 
                color="green"
                isLoading={isLoadingStats}
              />
            </div>

            {/* Row 2: Charts/Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mais Laudados */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                  <Monitor className="w-5 h-5 text-[#1A4CAB]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A2E]">Equipamentos mais Laudados</h3>
                </div>
                <div className="space-y-4">
                  {stats?.maisLaudados.map((item, i) => (
                    <StatBar 
                      key={i} 
                      label={item.equipamento} 
                      value={item._count.id} 
                      total={stats.totalLaudos} 
                      color="bg-[#1A4CAB]"
                    />
                  ))}
                  {isLoadingStats && <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-50 animate-pulse rounded-lg" />)}</div>}
                </div>
              </div>

              {/* Mais Danificados */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A2E]">Modelos Críticos (Não Func.)</h3>
                </div>
                <div className="space-y-4">
                  {stats?.maisDanificados.map((item, i) => (
                    <StatBar 
                      key={i} 
                      label={item.modelo} 
                      value={item._count.id} 
                      total={stats.maisDanificados[0]?._count?.id || 1} 
                      color="bg-red-500"
                    />
                  ))}
                  {isLoadingStats && <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-50 animate-pulse rounded-lg" />)}</div>}
                </div>
              </div>
            </div>

            {/* Row 3: Distribuição por Loja */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <Store className="w-5 h-5 text-[#FECC00]" />
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A2E]">Volume por Unidade (Loja)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats?.porLoja.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-xs font-bold uppercase text-[#1A1A2E]">{item.loja}</span>
                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-[#1A4CAB]">{item._count.id} laudos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {(isSearching || results.length > 0) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A2E]">Resultados da Busca ({results.length})</h3>
              <Button variant="ghost" onClick={() => setResults([])} className="text-[10px] uppercase font-bold text-gray-400">Limpar</Button>
            </div>
            {isSearching ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-[#1A4CAB] animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map(res => (
                  <div key={res.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-100 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] uppercase font-black text-[#1A4CAB] mb-1">#{res.tombo}</p>
                        <h4 className="font-bold text-[#1A1A2E] text-sm">{res.equipamento}</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{res.modelo}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${res.estadoEquipamento === 'FUNCIONANDO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {res.estadoEquipamento}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase">Loja / Técnico</span>
                        <span className="text-[11px] font-bold text-gray-600 uppercase">{res.loja} · {res.tecnico}</span>
                      </div>
                      <span className="text-[9px] text-gray-300 uppercase font-bold">{res.data}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}

function MetricCard({ title, value, subValue, icon: Icon, color, isLoading }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-[#1A4CAB]",
    yellow: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600"
  };

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex flex-col justify-between h-[160px] relative overflow-hidden group">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">{title}</p>
        {isLoading ? (
          <div className="h-6 w-20 bg-gray-50 animate-pulse rounded" />
        ) : (
          <>
            <h3 className="text-2xl font-black text-[#1A1A2E] leading-none">{value}</h3>
            {subValue && <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{subValue}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, value, total, color }: any) {
  const percentage = (value / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight text-gray-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
