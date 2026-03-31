"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SetorType } from "@/types/domain";

export default function AdminSetoresPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const [setores, setSetores] = useState<SetorType[]>([]);
  const [novoNome, setNovoNome] = useState("");

  // edição inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState("");

  const load = async () => {
    const res = await fetch(`${API_BASE_URL}/setores`);
    const data = await res.json();
    setSetores(data);
  };

  useEffect(() => {
    load();
  }, []);

  const criar = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    const res = await fetch(`${API_BASE_URL}/setores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      setNovoNome("");
      await load();
    } else {
      alert("Falha ao criar setor");
    }
  };

  // salvar edição
  const salvar = async (id: number) => {
    const nome = editingNome.trim();
    if (!nome) return;
    const res = await fetch(`${API_BASE_URL}/setores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditingNome("");
      await load();
    } else {
      alert("Falha ao atualizar setor");
    }
  };

  // excluir
  const excluir = async (id: number) => {
    if (!confirm("Deseja excluir este setor?")) return;
    const res = await fetch(`${API_BASE_URL}/setores/${id}`, {
      method: "DELETE",
    });
    if (res.status === 204) {
      await load();
    } else {
      alert("Falha ao excluir setor");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setores</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 max-w-sm">
          <Label>Novo setor</Label>
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do setor"
          />
          <Button onClick={criar}>Criar</Button>
        </div>

        <div className="grid gap-2">
          {setores.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              {editingId === s.id ? (
                <>
                  <Input
                    className="max-w-sm"
                    value={editingNome}
                    onChange={(e) => setEditingNome(e.target.value)}
                  />
                  <Button onClick={() => salvar(s.id)}>Salvar</Button>
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
                  <span className="min-w-[200px]">{s.nome}</span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(s.id);
                      setEditingNome(s.nome);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" onClick={() => excluir(s.id)}>
                    Excluir
                  </Button>
                </>
              )}
            </div>
          ))}
          {setores.length === 0 && <span>Nenhum setor cadastrado.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
