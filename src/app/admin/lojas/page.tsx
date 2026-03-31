"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LojaType } from "@/types/domain";

export default function AdminLojasPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const [lojas, setLojas] = useState<LojaType[]>([]);
  const [novoNome, setNovoNome] = useState("");

  // edição inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState("");

  const load = async () => {
    const res = await fetch(`${API_BASE_URL}/lojas`);
    const data = await res.json();
    setLojas(data);
  };

  useEffect(() => {
    load();
  }, []);

  const criar = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    const res = await fetch(`${API_BASE_URL}/lojas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      setNovoNome("");
      await load();
    } else {
      alert("Falha ao criar loja");
    }
  };

  // salvar edição
  const salvar = async (id: number) => {
    const nome = editingNome.trim();
    if (!nome) return;
    const res = await fetch(`${API_BASE_URL}/lojas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditingNome("");
      await load();
    } else {
      alert("Falha ao atualizar loja");
    }
  };

  // excluir
  const excluir = async (id: number) => {
    if (!confirm("Deseja excluir esta loja?")) return;
    const res = await fetch(`${API_BASE_URL}/lojas/${id}`, {
      method: "DELETE",
    });
    if (res.status === 204) {
      await load();
    } else {
      alert("Falha ao excluir loja");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lojas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 max-w-sm">
          <Label>Nova loja</Label>
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome da loja"
          />
          <Button onClick={criar}>Criar</Button>
        </div>

        <div className="grid gap-2">
          {lojas.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              {editingId === l.id ? (
                <>
                  <Input
                    className="max-w-sm"
                    value={editingNome}
                    onChange={(e) => setEditingNome(e.target.value)}
                  />
                  <Button onClick={() => salvar(l.id)}>Salvar</Button>
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
                  <span className="min-w-[200px]">{l.nome}</span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(l.id);
                      setEditingNome(l.nome);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant={"outline"} onClick={() => excluir(l.id)}>
                    Excluir
                  </Button>
                </>
              )}
            </div>
          ))}
          {lojas.length === 0 && <span>Nenhuma loja cadastrada.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
