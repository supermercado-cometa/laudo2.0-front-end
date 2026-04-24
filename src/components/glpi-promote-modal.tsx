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
  mensagemPai: string;
};

export default function GlpiPromoteModal({
  open,
  apiBaseUrl,
  tomboDefault,
  onCancel,
  onConfirm,
  showManualPass,
  setShowManualPass,
  passwordManual,
  setPasswordManual,
  isPromoting,
}: {
  open: boolean;
  isPromoting?: boolean;
  apiBaseUrl: string;
  tomboDefault: string;
  onCancel: () => void;
  onConfirm: (data: GlpiPromotePayload) => void;
  showManualPass: boolean;
  setShowManualPass: (v: boolean) => void;
  passwordManual: string;
  setPasswordManual: (v: string) => void;
}) {
  const [titulo, setTitulo] = useState(`Sub-chamado: Promoção de Laudo - ${tomboDefault}`);
  const [mensagemPai, setMensagemPai] = useState("Um sub-chamado foi criado e encaminhado para validação da Liderança correspondente ao laudo emitido:");
  const [asset, setAsset] = useState<{ id: number; name: string; itemtype: string } | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [assetError, setAssetError] = useState("");

  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const [categoriasLista, setCategoriasLista] = useState<Array<{ id: number; completename: string }>>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [categoriaQuery, setCategoriaQuery] = useState("");
  const [isCategoriaOpen, setIsCategoriaOpen] = useState(false);

  // Estado editável do tombo (não busca automaticamente)
  const [tomboInput, setTomboInput] = useState(tomboDefault || "");

  const buscarAtivo = () => {
    if (!tomboInput.trim()) return;
    setLoadingAsset(true);
    setAssetError("");
    const token = localStorage.getItem("token") || "";
    fetch(`${apiBaseUrl}/glpi/lookup/asset/${tomboInput.trim()}`, {
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
  };

  // ===== Buscar Gerentes e Auto-selecionar Felipe/Alex =====
  useEffect(() => {
    if (open) {
      setLoadingManagers(true);
      const token = localStorage.getItem("token") || "";
      fetch(`${apiBaseUrl}/glpi/lookup/managers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((resp) => resp.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Filtra apenas Felipe Fernandes e Alex Thalles (robusto contra variações de acento/caixa)
            const targetManagers = data.filter(m => {
              const full = `${m.firstname || ""} ${m.realname || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              // Se encontrar o par (Nome + Sobrenome) ou se for um dos sobrenomes específicos (caso o nome esteja vazio)
              const matchesFelipe = (full.includes("felipe") && full.includes("fernandes")) || full.trim() === "fernandes";
              const matchesAlex   = (full.includes("alex") && full.includes("thalles"))     || full.trim() === "thalles";
              return matchesFelipe || matchesAlex;
            });
            console.log("👥 [DEBUG] Gerentes encontrados no filtro:", targetManagers.map(m => m.realname));
            if (targetManagers.length === 0) {
               console.warn("⚠️ [AVISO] Nenhum gestor (Felipe/Alex) foi encontrado na lista:", data.map(m => m.realname));
            }
            setSelectedManagerIds(targetManagers.map(m => m.id));
          }
        })
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
          {/* Título do Chamado Filho */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Título do Sub-chamado (Novo Ticket)</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          {/* Mensagem no Chamado Pai */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-blue-600 font-semibold">Aviso para o Chamado Pai (Página Principal)</label>
            <textarea 
              value={mensagemPai} 
              onChange={(e) => setMensagemPai(e.target.value)}
              className="w-full min-h-[80px] p-2 text-sm border rounded-md focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="Texto que aparecerá como acompanhamento no chamado original..."
            />
          </div>

          {/* Campo editável de Patrimônio (Tombo) */}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Patrimônio (Tombo)</label>
            <div className="flex gap-2">
              <Input
                value={tomboInput}
                onChange={(e) => {
                  setTomboInput(e.target.value);
                  setAsset(null); // Limpa o ativo se o usuário editar o campo
                  setAssetError("");
                }}
                placeholder="Digite o número do tombo..."
              />
              <button
                type="button"
                onClick={buscarAtivo}
                disabled={loadingAsset || !tomboInput.trim()}
                className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 border rounded-md whitespace-nowrap disabled:opacity-50"
              >
                {loadingAsset ? "Buscando..." : "🔍 Buscar"}
              </button>
            </div>
            {asset && (
              <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                <p className="font-bold text-green-700">{asset.name}</p>
                <p className="text-xs text-slate-600">Tipo: {asset.itemtype}</p>
              </div>
            )}
            {assetError && (
              <p className="text-xs text-red-500">{assetError} — o chamado será criado sem vínculo de ativo.</p>
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

          {/* Status da Automação de Validação */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Envio Automático Ativo</span>
            </div>
            <p className="text-[11px] text-blue-600 leading-relaxed">
              {selectedManagerIds.length > 0 
                ? `Sua senha foi carregada no login. A validação será solicitada para ${selectedManagerIds.length} gestor(es) usando suas credenciais salvas.`
                : "⚠️ Nenhum gestor (Felipe/Alex) foi localizado no GLPI de Homologação. A promoção não pode ser concluída sem gestores vinculados."
              }
            </p>
            
            <button 
              type="button"
              onClick={() => setShowManualPass(!showManualPass)}
              className="text-[10px] font-bold text-blue-800 underline hover:text-blue-900"
            >
              {showManualPass ? "✕ Usar automação do sistema" : "🔑 Usar outra senha do GLPI manualmente"}
            </button>

            {showManualPass && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                <label className="text-[9px] font-black text-blue-900 uppercase block mb-1">Senha Manual</label>
                <Input 
                  type="password"
                  value={passwordManual}
                  onChange={(e) => setPasswordManual(e.target.value)}
                  className="h-10 text-sm bg-white border-blue-200"
                  placeholder="Sua senha do GLPI..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onCancel}>Voltar</Button>
          <Button 
            disabled={!categoriaId || loadingManagers || isPromoting || selectedManagerIds.length === 0}
            onClick={() => onConfirm({
              titulo,
              categoriaId,
              localizacaoId: null,
              grupoId: null,
              asset: asset ? { id: asset.id, itemtype: asset.itemtype } : null,
              managerIds: selectedManagerIds,
              mensagemPai
            })}
          >
            {isPromoting ? "Processando..." : loadingManagers ? "Carregando..." : "Promover Chamado"}
          </Button>
        </div>
      </div>
    </div>
  );
}
