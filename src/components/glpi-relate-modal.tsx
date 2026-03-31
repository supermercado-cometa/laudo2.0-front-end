import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type GlpiRelacaoPayload = {
  titulo: string;
  localizacao: string;
  tecnicoAtribuido: string;
  grupo: string;
  categoria: string;
  categoriaId?: number | null;
  requerente: string;
  localizacaoId?: number | null;
  grupoId?: number | null;
};

export default function GlpiRelateModal({
  open,
  apiBaseUrl,
  defaultTecnico,
  defaultRequerente,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  apiBaseUrl: string;
  defaultTecnico: string;
  defaultRequerente: string;
  onCancel: () => void;
  onConfirm: (data: GlpiRelacaoPayload) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [localizacaoId, setLocalizacaoId] = useState<number | null>(null);
  const [tecnicoAtribuido, setTecnicoAtribuido] = useState(
    defaultTecnico || ""
  );
  const [grupo, setGrupo] = useState("");
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [categoria, setCategoria] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [requerente, setRequerente] = useState(defaultRequerente || "");

  // ===== Tipos =====
  type GlpiLocation = { id: number; completename: string };
  type GlpiCategory = { id: number; completename: string };
  type GlpiGroup = { id: number; completename: string };

  // ===== Estados de listas =====
  const [localizacoesLista, setLocalizacoesLista] = useState<GlpiLocation[]>(
    []
  );
  const [categoriasLista, setCategoriasLista] = useState<GlpiCategory[]>([]);
  const [gruposLista, setGruposLista] = useState<GlpiGroup[]>([]);

  // ===== Estados de busca e dropdowns =====
  const [localizacaoQuery, setLocalizacaoQuery] = useState("");
  const [isLocalizacaoOpen, setIsLocalizacaoOpen] = useState(false);

  const [categoriaQuery, setCategoriaQuery] = useState("");
  const [isCategoriaOpen, setIsCategoriaOpen] = useState(false);

  const [grupoQuery, setGrupoQuery] = useState("");
  const [isGrupoOpen, setIsGrupoOpen] = useState(false);

  // ===== Inicialização =====
  useEffect(() => {
    if (open) {
      setTecnicoAtribuido(defaultTecnico || "");
      setRequerente(defaultRequerente || "");
    }
  }, [open, defaultTecnico, defaultRequerente]);

  // ===== Buscar Categorias =====
  useEffect(() => {
    if (!open) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    fetch(`${apiBaseUrl}/glpi/lookup/categories-db`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: token },
    })
      .then(async (resp) => {
        if (!resp.ok)
          throw new Error(`Falha ao listar categorias: ${resp.status}`);
        const data = await resp.json();
        setCategoriasLista(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erro ao obter categorias GLPI:", err));
  }, [open, apiBaseUrl]);

  const filteredCategorias = categoriasLista.filter((c) =>
    c.completename.toLowerCase().includes(categoriaQuery.toLowerCase())
  );

  const handleSelectCategoria = (item: GlpiCategory) => {
    setCategoriaId(item.id);
    setCategoria(item.completename);
    setCategoriaQuery(item.completename);
    setIsCategoriaOpen(false);
  };

  // ===== Buscar Localizações =====
  useEffect(() => {
    if (!open) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    fetch(`${apiBaseUrl}/glpi/lookup/locations-db`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: token },
    })
      .then(async (resp) => {
        if (!resp.ok)
          throw new Error(`Falha ao listar localizações: ${resp.status}`);
        const data = await resp.json();
        setLocalizacoesLista(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erro ao obter localizações GLPI:", err));
  }, [open, apiBaseUrl]);

  const filteredLocalizacoes = localizacoesLista.filter((l) =>
    l.completename.toLowerCase().includes(localizacaoQuery.toLowerCase())
  );

  const handleSelectLocalizacao = (item: GlpiLocation) => {
    setLocalizacaoId(item.id);
    setLocalizacao(item.completename);
    setLocalizacaoQuery(item.completename);
    setIsLocalizacaoOpen(false);
  };

  // ===== Buscar Grupos =====
  useEffect(() => {
    if (!open) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    fetch(`${apiBaseUrl}/glpi/lookup/groups-db`, {
      method: "GET",
      cache: "no-store",
      headers: { Authorization: token },
    })
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`Falha ao listar grupos: ${resp.status}`);
        const data = await resp.json();
        setGruposLista(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erro ao obter grupos GLPI:", err));
  }, [open, apiBaseUrl]);

  const filteredGrupos = gruposLista.filter((g) =>
    g.completename.toLowerCase().includes(grupoQuery.toLowerCase())
  );

  const handleSelectGrupo = (item: GlpiGroup) => {
    setGrupoId(item.id);
    setGrupo(item.completename);
    setGrupoQuery(item.completename);
    setIsGrupoOpen(false);
  };

  // ===== Render =====
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-md p-4 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-2">
          Relacionar a um chamado existente
        </h3>
        <div className="grid gap-3">
          {/* Título */}
          <div className="grid gap-2">
            <label>Título</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          {/* Técnico */}
          <div className="grid gap-2">
            <label>Técnico atribuído</label>
            <Input
              value={tecnicoAtribuido}
              onChange={(e) => setTecnicoAtribuido(e.target.value)}
            />
          </div>

          {/* Grupo */}
          <div className="grid gap-2">
            <label>Grupo</label>
            <div className="relative">
              <Input
                value={grupoQuery}
                placeholder="Digite para filtrar e selecione"
                onFocus={() => setIsGrupoOpen(true)}
                onChange={(e) => {
                  setGrupoQuery(e.target.value);
                  setIsGrupoOpen(true);
                }}
                onBlur={() => setTimeout(() => setIsGrupoOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const first = filteredGrupos[0];
                    if (first) handleSelectGrupo(first);
                  }
                }}
              />
              {isGrupoOpen && (
                <div className="absolute z-50 w-full max-h-56 overflow-y-auto rounded border bg-white shadow mt-1">
                  {filteredGrupos.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum grupo encontrado
                    </div>
                  ) : (
                    filteredGrupos.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="w-full text-left px-2 py-1 hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectGrupo(item)}
                      >
                        {item.completename}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div className="grid gap-2">
            <label>Categoria</label>
            <div className="relative">
              <Input
                value={categoriaQuery}
                placeholder="Digite para filtrar e selecione"
                onFocus={() => setIsCategoriaOpen(true)}
                onChange={(e) => {
                  setCategoriaQuery(e.target.value);
                  setIsCategoriaOpen(true);
                }}
                onBlur={() => setTimeout(() => setIsCategoriaOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const first = filteredCategorias[0];
                    if (first) handleSelectCategoria(first);
                  }
                }}
              />
              {isCategoriaOpen && (
                <div className="absolute z-50 w-full max-h-56 overflow-y-auto rounded border bg-white shadow mt-1">
                  {filteredCategorias.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhuma categoria encontrada
                    </div>
                  ) : (
                    filteredCategorias.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="w-full text-left px-2 py-1 hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectCategoria(item)}
                      >
                        {item.completename}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Requerente */}
          <div className="grid gap-2">
            <label>Requerente</label>
            <Input
              value={requerente}
              onChange={(e) => setRequerente(e.target.value)}
            />
          </div>

          {/* Localização */}
          <div className="grid gap-2">
            <label>Localização</label>
            <div className="relative">
              <Input
                value={localizacaoQuery}
                placeholder="Digite para filtrar e selecione"
                onFocus={() => setIsLocalizacaoOpen(true)}
                onChange={(e) => {
                  setLocalizacaoQuery(e.target.value);
                  setIsLocalizacaoOpen(true);
                }}
                onBlur={() =>
                  setTimeout(() => setIsLocalizacaoOpen(false), 150)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const first = filteredLocalizacoes[0];
                    if (first) handleSelectLocalizacao(first);
                  }
                }}
              />
              {isLocalizacaoOpen && (
                <div className="absolute z-50 w-full max-h-56 overflow-y-auto rounded border bg-white shadow mt-1">
                  {filteredLocalizacoes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhuma localização encontrada
                    </div>
                  ) : (
                    filteredLocalizacoes.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="w-full text-left px-2 py-1 hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectLocalizacao(item)}
                      >
                        {item.completename}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                titulo,
                localizacao,
                localizacaoId: localizacaoId ?? null,
                tecnicoAtribuido,
                grupo,
                grupoId: grupoId ?? null,
                categoria,
                categoriaId: categoriaId ?? null,
                requerente,
              })
            }
          >
            Confirmar e enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
