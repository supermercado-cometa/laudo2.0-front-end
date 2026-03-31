"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Equipamento } from "@/types/domain";
type EquipamentoType = Equipamento;

export default function AdminEquipamentosPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState("");

  const load = async () => {
    const res = await fetch(`${API_BASE_URL}/equipamentos`);
    const data = await res.json();
    setEquipamentos(data);
  };

  useEffect(() => {
    load();
  }, []);

  const criar = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    const res = await fetch(`${API_BASE_URL}/equipamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      setNovoNome("");
      await load();
    } else {
      alert("Falha ao criar equipamento");
    }
  };

  const salvar = async (id: number) => {
    const nome = editingNome.trim();
    if (!nome) return;
    const res = await fetch(`${API_BASE_URL}/equipamentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditingNome("");
      await load();
    } else {
      alert("Falha ao atualizar equipamento");
    }
  };

  const excluir = async (id: number) => {
    if (!confirm("Deseja excluir este equipamento?")) return;
    const res = await fetch(`${API_BASE_URL}/equipamentos/${id}`, {
      method: "DELETE",
    });
    if (res.status === 204) {
      await load();
    } else {
      alert("Falha ao excluir equipamento");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipamentos</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 max-w-sm">
          <Label>Novo equipamento</Label>
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do equipamento"
          />
          <Button onClick={criar}>Criar</Button>
        </div>

        <div className="grid gap-2">
          {equipamentos.map((eq) => (
            <div key={eq.id} className="flex items-center gap-2">
              {editingId === eq.id ? (
                <>
                  <Input
                    className="max-w-sm"
                    value={editingNome}
                    onChange={(e) => setEditingNome(e.target.value)}
                  />
                  <Button onClick={() => salvar(eq.id)}>Salvar</Button>
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
                  <span className="min-w-[200px]">{eq.nome}</span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(eq.id);
                      setEditingNome(eq.nome);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="default" onClick={() => excluir(eq.id)}>
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
