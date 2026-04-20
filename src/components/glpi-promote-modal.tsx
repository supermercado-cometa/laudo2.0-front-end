import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type GlpiPromotePayload = {
  titulo: string;
  categoriaId: number | null;
  localizacaoId: number | null;
  grupoId: number | null;
  asset: { id: number; itemtype: string } | null;
  managerIds: number[];
};

export default function GlpiPromoteModal({
  open,
  apiBaseUrl,
  tomboDefault,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  apiBaseUrl: string;
  tomboDefault: string;
  onCancel: () => void;
  onConfirm: (data: GlpiPromotePayload) => void;
}) {
  const [titulo, setTitulo] = useState(`Sub-chamado: Promoção de Laudo - ${tomboDefault}`);
  const [asset, setAsset] = useState<{ id: number; name: string; itemtype: string } | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [assetError, setAssetError] = useState("");

  const [managers, setManagers] = useState<Array<{ id: number; name: string; realname: string; firstname: string }>>([]);
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const [categoriasLista, setCategoriasLista] = useState<Array<{ id: number; completename: string }>>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categoriaQuery, setCategoriaQuery] = useState("");
  const [isCategoriaOpen, setIsCategoriaOpen] = useState(false);

  // ===== Inicialização / Busca de Ativo =====
  useEffect(() => {
    if (open && tomboDefault) {
      setLoadingAsset(true);
      setAssetError("");
      const token = localStorage.getItem("token") || "";
      fetch(`${apiBaseUrl}/glpi/lookup/asset/${tomboDefault}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (resp) => {
          if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error || "Patrimônio não encontrado");
          }
          return resp.json();
        })
        .then((data) => setAsset(data))
        .catch((err) => setAssetError(err.message))
        .finally(() => setLoadingAsset(false));
    }
  }, [open, tomboDefault, apiBaseUrl]);

  // ===== Buscar Gerentes =====
  useEffect(() => {
    if (open) {
      setLoadingManagers(true);
      const token = localStorage.getItem("token") || "";
      fetch(`${apiBaseUrl}/glpi/lookup/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((resp) => resp.json())
        .then((data) => setManagers(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Erro ao carregar gerentes:", err))
        .finally(() => setLoadingManagers(false));
    }
  }, [open, apiBaseUrl]);

  // ===== Buscar Categorias (Reutilizado do Relate) =====
  useEffect(() => {
    if (open) {
      const token = localStorage.getItem("token") || "";
      fetch(`${apiBaseUrl}/glpi/lookup/categories-db`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((resp) => resp.json())
        .then((data) => setCategoriasLista(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Erro ao carregar categorias:", err));
    }
  }, [open, apiBaseUrl]);

  const filteredCategorias = categoriasLista.filter((c) =>
    c.completename.toLowerCase().includes(categoriaQuery.toLowerCase())
  );

  // ===== Render =====
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-primary">Promover para Sub-chamado</h3>
        
        <div className="space-y-4">
          {/* Título */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Título do Sub-chamado</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          {/* Info do Ativo (Patrimônio) */}
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patrimônio (Tombo: {tomboDefault})</label>
            {loadingAsset ? (
              <p className="text-sm animate-pulse">Buscando ativo no GLPI...</p>
            ) : asset ? (
              <div className="mt-1">
                <p className="text-sm font-bold text-green-700">{asset.name}</p>
                <p className="text-xs text-slate-600">Tipo: {asset.itemtype}</p>
              </div>
            ) : (
              <p className="text-sm text-red-500">{assetError || "Ativo não vinculado"}</p>
            )}
          </div>

          {/* Seleção de Categoria */}
          <div className="grid gap-1.5 relative">
            <label className="text-sm font-medium">Categoria ITIL</label>
            <Input 
              value={categoriaQuery} 
              placeholder="Digite para filtrar..." 
              onFocus={() => setIsCategoriaOpen(true)}
              onChange={(e) => setCategoriaQuery(e.target.value)}
              onBlur={() => setTimeout(() => setIsCategoriaOpen(false), 200)}
            />
            {isCategoriaOpen && (
              <div className="absolute top-full left-0 w-full z-10 bg-white border rounded shadow-md mt-1 max-h-40 overflow-y-auto">
                {filteredCategorias.map(c => (
                  <button 
                    key={c.id} 
                    className="w-full text-left p-2 hover:bg-slate-100 text-sm"
                    onClick={() => {
                      setCategoriaId(c.id);
                      setCategoriaQuery(c.completename);
                      setIsCategoriaOpen(false);
                    }}
                  >
                    {c.completename}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seleção de Gerente para Validação (Múltipla) */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Gerentes Responsáveis (Validação)</label>
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2 bg-slate-50/50">
              {loadingManagers && <p className="text-xs text-slate-500 animate-pulse">Carregando gerentes...</p>}
              {managers.map(m => (
                <label key={m.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 accent-primary rounded shadow-sm"
                    checked={selectedManagerIds.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedManagerIds(prev => [...prev, m.id]);
                      } else {
                        setSelectedManagerIds(prev => prev.filter(id => id !== m.id));
                      }
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{m.realname} {m.firstname}</span>
                    <span className="text-[10px] text-slate-400 leading-none uppercase">{m.name}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 italic">Selecione um ou mais gerentes conforme a necessidade (ex: Felipe e Alex).</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button 
            disabled={loadingAsset || !asset || selectedManagerIds.length === 0 || !categoriaId}
            onClick={() => onConfirm({
              titulo,
              categoriaId,
              localizacaoId: null, // Pode ser herdado do pai se necessário
              grupoId: null,
              asset: asset ? { id: asset.id, itemtype: asset.itemtype } : null,
              managerIds: selectedManagerIds
            })}
          >
            Promover Chamado
          </Button>
        </div>
      </div>
    </div>
  );
}
