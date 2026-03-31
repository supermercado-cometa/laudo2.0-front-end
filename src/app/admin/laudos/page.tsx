"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import type { InfoLaudo } from "@/types/domain";

export default function AdminLaudosGeradosPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const [laudos, setLaudos] = useState<InfoLaudo[]>([]);
  const [tecnico, setTecnico] = useState("");
  const [numeroChamado, setNumeroChamado] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tombo, setTombo] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // --- NOVOS ESTADOS PARA ASSINATURA ---
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [laudoToPrint, setLaudoToPrint] = useState<InfoLaudo | null>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // --- Funções da assinatura ---
  function openSignatureAndPrint(l: InfoLaudo) {
    setLaudoToPrint(l);
    setSignatureDataUrl(null);
    setIsSignatureOpen(true);
  }

  function clearSignatureCanvas() {
    const pad = sigPadRef.current;
    if (pad) pad.clear();
    setSignatureDataUrl(null);
  }

  function confirmSignatureAndPrint() {
    const pad = sigPadRef.current;
    let dataUrl = signatureDataUrl;
    if (pad && !pad.isEmpty()) {
      dataUrl = pad.getCanvas().toDataURL("image/png");
    }
    if (laudoToPrint) {
      imprimirLaudo(laudoToPrint, dataUrl || undefined);
    }
    setIsSignatureOpen(false);
    setLaudoToPrint(null);
  }

  function printWithoutSignature() {
    if (laudoToPrint) imprimirLaudo(laudoToPrint, undefined);
    setIsSignatureOpen(false);
    setLaudoToPrint(null);
  }

  // --- Função de exclusão ---
  async function excluirLaudo(id: number) {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE_URL}/info-laudos/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: token } : {}),
        },
      });
      if (res.status === 204 || res.status === 200) {
        setLaudos((prev) => prev.filter((x) => x.id !== id));
      } else {
        alert("Falha ao excluir o laudo.");
      }
    } catch (err) {
      console.error("Erro ao excluir laudo:", err);
      alert("Erro ao excluir o laudo.");
    }
  }

  // --- Carrega laudos ---
  const load = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const url = new URL(`${API_BASE_URL}/info-laudos`);
      if (tecnico.trim()) url.searchParams.set("tecnico", tecnico.trim());
      if (numeroChamado.trim())
        url.searchParams.set("numeroChamado", numeroChamado.trim());
      if (tombo.trim()) url.searchParams.set("tombo", tombo.trim());
      if (dataInicio.trim())
        url.searchParams.set("dataInicio", dataInicio.trim());
      if (dataFim.trim()) url.searchParams.set("dataFim", dataFim.trim());

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          ...(token ? { Authorization: token } : {}),
        },
      });
      console.log(res);
      if (!res.ok) {
        setLaudos([]);
        return;
      }
      const dataJson = (await res.json()) as InfoLaudo[];
      setLaudos(dataJson);
    } catch (err) {
      console.error("Erro ao buscar laudos:", err);
      setLaudos([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // --- Seleção de laudos ---
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(laudos.map((l) => l.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const excluirSelecionados = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`${API_BASE_URL}/info-laudos/${id}`, {
            method: "DELETE",
            headers: {
              ...(token ? { Authorization: token } : {}),
            },
          });
          if (!res.ok && res.status !== 204) {
            console.error(`Falha ao excluir laudo ${id}:`, res.status);
          }
        })
      );

      setLaudos((prev) => prev.filter((l) => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Erro ao excluir selecionados:", err);
    }
  };

  // --- Função para imprimir com ou sem assinatura ---
  async function imprimirLaudo(l: InfoLaudo, assinatura?: string) {
    const adminName =
      typeof window !== "undefined"
        ? localStorage.getItem("fullName") ||
          localStorage.getItem("username") ||
          "Administrador"
        : "Administrador";

    const nowBr = () => {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const HH = String(d.getHours()).padStart(2, "0");
      const MM = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} ${HH}:${MM}`;
    };

    // @ts-expect-error: pdfmake lacks type definitions in this import context
    const pdfMakeMod = await import("pdfmake/build/pdfmake");
    // @ts-expect-error: vfs_fonts module has no TypeScript types
    const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
    const pdfMake = pdfMakeMod.default || pdfMakeMod;
    const pdfFonts = pdfFontsMod.default || pdfFontsMod;
    // @ts-expect-error: pdfMake.vfs assignment requires any-typed module fields
    pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

    const estadoLabel =
      l.estadoEquipamento === "FUNCIONANDO"
        ? "Funcionando"
        : l.estadoEquipamento === "NAO_FUNCIONANDO"
        ? "Não funcionando"
        : "-";

    const necessidadeLabel =
      l.necessidade === "SUBSTITUIDO"
        ? "Ser substituído"
        : l.necessidade === "ENVIAR_CONSERTO"
        ? "Enviado p/ conserto"
        : l.necessidade === "DESCARTADO"
        ? "Ser descartado"
        : "-";

    const equipamentoModelo =
      l.modelo && l.modelo.trim()
        ? `${l.equipamento} - ${l.modelo}`
        : l.equipamento;

    // Helper para aplicar moldura sem alterar estrutura interna
    const moldura = (conteudo: unknown, margin: number[] = [0, 0, 0, 10]) => ({
      table: {
        widths: ["*"],
        body: [[{ stack: Array.isArray(conteudo) ? conteudo : [conteudo] }]],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => "#d1d5db",
        vLineColor: () => "#d1d5db",
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
      margin,
    });

    const titulo = {
      text: "LAUDO TÉCNICO",
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 10], // ajustado para manter o espaçamento sem moldura
    };

    const reprintBanner = {
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: "REIMPRESSÃO — Painel Administrativo",
              bold: true,
              color: "#b91c1c",
              alignment: "center",
              margin: [4, 6, 4, 2],
            },
          ],
          [
            {
              text: `Emitido por: ${adminName} em ${nowBr()}`,
              alignment: "center",
              margin: [4, 0, 4, 6],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#e5e7eb",
        vLineColor: () => "#e5e7eb",
      },
      margin: [0, 0, 0, 0],
    };

    const infoTable = {
      table: {
        widths: ["100%"],
        body: [
          [
            {
              text: `Número do Chamado: ${l.numeroChamado || "-"}`,
              bold: true,
              fillColor: "#f2f2f2",
              margin: [4, 4, 4, 4],
            },
          ],
          [
            {
              text: `Técnico: ${l.tecnico || l.createdByUsername || "-"}`,
              margin: [4, 2, 4, 2],
            },
          ],
          [{ text: `Data: ${l.data || "-"}`, margin: [4, 2, 4, 2] }],
          [{ text: `Loja: ${l.loja || "-"}`, margin: [4, 2, 4, 2] }],
          [{ text: `Setor: ${l.setor || "-"}`, margin: [4, 2, 4, 2] }],
          [
            {
              text: `Equipamento: ${
                l.modelo?.trim()
                  ? `${l.equipamento} - ${l.modelo}`
                  : l.equipamento || "-"
              }`,
              margin: [4, 2, 4, 2],
            },
          ],
          [{ text: `Tombo: ${l.tombo || "-"}`, margin: [4, 2, 4, 2] }],
          [
            {
              text: `Estado do Equipamento: ${estadoLabel}`,
              margin: [4, 2, 4, 2],
            },
          ],
          [{ text: `Necessidade: ${necessidadeLabel}`, margin: [4, 2, 4, 2] }],
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#cccccc",
        vLineColor: () => "#cccccc",
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
      margin: [0, 0, 0, 0],
    };

    const assinaturaHeader = {
      text: "ASSINATURA DO TÉCNICO",
      style: "subheader",
      margin: [0, 0, 0, 8],
    };
    const assinaturaContent = assinatura
      ? {
          table: {
            widths: ["100%"],
            body: [
              [
                {
                  image: assinatura,
                  width: 160,
                  alignment: "center",
                  margin: [0, 5, 0, 5],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#cccccc",
            vLineColor: () => "#cccccc",
          },
        }
      : {
          stack: [
            { text: "Assine aqui:", margin: [4, 0, 0, 6] },
            {
              canvas: [
                { type: "line", x1: 0, y1: 0, x2: 480, y2: 0, lineWidth: 1 },
              ],
              margin: [40, 20, 40, 0],
            },
          ],
        };

    const content: unknown[] = [
      titulo, // removida a moldura do título
      moldura(reprintBanner),
      moldura(infoTable),
      { text: "TESTES REALIZADOS", style: "subheader", margin: [0, 10, 0, 4] },
      { text: l.testesRealizados || "-", margin: [4, 0, 0, 8] },
      { text: "DIAGNÓSTICO", style: "subheader", margin: [0, 10, 0, 4] },
      { text: l.diagnostico || "-", margin: [4, 0, 0, 8] },
      moldura([assinaturaHeader, assinaturaContent], [0, 10, 0, 0]),
    ];

    const docDefinition: unknown = {
      info: {
        title: `Laudo Técnico - Reimpressão - ${
          l.numeroChamado || "sem_chamado"
        }`,
        author: adminName,
      },
      pageMargins: [40, 40, 40, 60],
      defaultStyle: { fontSize: 10, lineHeight: 1.3 },
      styles: {
        header: { fontSize: 18, bold: true, color: "#2c3e50" },
        subheader: { fontSize: 12, bold: true, color: "#000000" },
      },
      background: () => ({
        text: "REIMPRESSÃO",
        color: "#b91c1c",
        opacity: 0.08,
        bold: true,
        fontSize: 60,
        alignment: "center",
        margin: [0, 300, 0, 0],
      }),
      content,
    };

    pdfMake.createPdf(docDefinition).open();
  }

  // --- Renderização ---
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laudos Gerados</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        {/* --- Modal de Assinatura --- */}
        {isSignatureOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-md p-4 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-2">Assinatura</h3>
              <div className="rounded-md border bg-white p-2">
                <SignatureCanvas
                  ref={sigPadRef}
                  penColor="#000000"
                  backgroundColor="#ffffff"
                  canvasProps={{ className: "w-full h-40 border rounded" }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" onClick={clearSignatureCanvas}>
                  Limpar
                </Button>
                <Button onClick={confirmSignatureAndPrint}>
                  Usar assinatura e imprimir
                </Button>
                <Button variant="ghost" onClick={printWithoutSignature}>
                  Imprimir sem assinatura
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSignatureOpen(false);
                    setLaudoToPrint(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- Filtros e Ações --- */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={load}>Pesquisar</Button>
          <Button variant="outline" onClick={selectAll}>
            Marcar todos
          </Button>
          <Button variant="outline" onClick={clearSelection}>
            Desmarcar
          </Button>
          <Button
            variant="outline"
            onClick={excluirSelecionados}
            disabled={selectedIds.size === 0}
          >
            Excluir selecionados
          </Button>
        </div>

        {/* --- Filtros --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Técnico</Label>
            <Input
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              placeholder="Digite o nome do técnico"
            />
            <Label>Número do Chamado</Label>
            <Input
              value={numeroChamado}
              onChange={(e) => setNumeroChamado(e.target.value)}
              placeholder="Digite o número do chamado"
            />
          </div>

          <div className="grid gap-2">
            <Label>Data Inicial</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <Label>Data Final</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
            <Label>Tombo</Label>
            <Input
              value={tombo}
              onChange={(e) => setTombo(e.target.value)}
              placeholder="Digite o tombo (número)"
            />
          </div>
        </div>

        {/* --- Lista de laudos --- */}
        <div className="grid gap-3">
          {laudos.map((l) => (
            <div key={l.id} className="rounded-md border p-4 space-y-2">
              <div className="grid">
                <span className="font-semibold">
                  Chamado: {l.numeroChamado}
                </span>
                <span>Técnico: {l.tecnico}</span>
                <span>
                  Equipamento: {l.equipamento} {l.modelo ? `- ${l.modelo}` : ""}
                </span>
                <span>
                  Loja: {l.loja} | Setor: {l.setor}
                </span>
                <span>Tombo: {l.tombo}</span>
                <span>Data: {l.data}</span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button onClick={() => openSignatureAndPrint(l)}>
                  Imprimir
                </Button>
                <Button variant="ghost" onClick={() => excluirLaudo(l.id)}>
                  Excluir
                </Button>
                <input
                  type="checkbox"
                  checked={selectedIds.has(l.id)}
                  onChange={() => toggleSelect(l.id)}
                />
              </div>
            </div>
          ))}
          {laudos.length === 0 && <span>Nenhum laudo encontrado.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
