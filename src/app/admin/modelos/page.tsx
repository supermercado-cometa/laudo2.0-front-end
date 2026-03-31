"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Equipamento, ModeloType } from "@/types/domain";

export default function AdminModelosPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [equipamentoId, setEquipamentoId] = useState<number | null>(null);
  const [modelos, setModelos] = useState<ModeloType[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState("");

  const loadEquipamentos = async () => {
    const res = await fetch(`${API_BASE_URL}/equipamentos`);
    const data = await res.json();
    setEquipamentos(data);
    if (data.length > 0 && equipamentoId == null) {
      setEquipamentoId(data[0].id);
    }
  };

  const loadModelos = async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/modelos?equipamentoId=${id}`);
    const data = await res.json();
    setModelos(data);
  };

  useEffect(() => {
    loadEquipamentos();
  }, []);

  useEffect(() => {
    if (equipamentoId != null) {
      loadModelos(equipamentoId);
    } else {
      setModelos([]);
    }
  }, [equipamentoId]);

  const criar = async () => {
    const nome = novoNome.trim();
    if (!nome || equipamentoId == null) return;
    const res = await fetch(`${API_BASE_URL}/modelos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, equipamentoId }),
    });
    if (res.ok && equipamentoId != null) {
      setNovoNome("");
      await loadModelos(equipamentoId);
    } else {
      alert("Falha ao criar modelo");
    }
  };

  const salvar = async (id: number) => {
    const nome = editingNome.trim();
    if (!nome) return;
    const res = await fetch(`${API_BASE_URL}/modelos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok && equipamentoId != null) {
      setEditingId(null);
      setEditingNome("");
      await loadModelos(equipamentoId);
    } else {
      alert("Falha ao atualizar modelo");
    }
  };

  const excluir = async (id: number) => {
    if (!confirm("Deseja excluir este modelo?")) return;
    const res = await fetch(`${API_BASE_URL}/modelos/${id}`, {
      method: "DELETE",
    });
    if (res.status === 204 && equipamentoId != null) {
      await loadModelos(equipamentoId);
    } else {
      alert("Falha ao excluir modelo");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 max-w-sm">
          <Label>Equipamento</Label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={equipamentoId ?? ""}
            onChange={(e) => setEquipamentoId(Number(e.target.value) || null)}
          >
            <option value="">Selecione...</option>
            {equipamentos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 max-w-sm">
          <Label>Novo modelo</Label>
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do modelo"
            disabled={equipamentoId == null}
          />
          <Button onClick={criar} disabled={equipamentoId == null}>
            Criar
          </Button>
        </div>

        <div className="grid gap-2">
          {modelos.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              {editingId === m.id ? (
                <>
                  <Input
                    className="max-w-sm"
                    value={editingNome}
                    onChange={(e) => setEditingNome(e.target.value)}
                  />
                  <Button onClick={() => salvar(m.id)}>Salvar</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEditingNome("");
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="min-w-[200px]">{m.nome}</span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(m.id);
                      setEditingNome(m.nome);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" onClick={() => excluir(m.id)}>
                    Excluir
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
