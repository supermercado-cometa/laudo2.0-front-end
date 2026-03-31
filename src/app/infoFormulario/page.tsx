"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import { LojaType } from "@/types/domain";
import GlpiPasswordModal from "@/components/glpi-password-modal";
import GlpiRelateModal, {
  GlpiRelacaoPayload,
} from "@/components/glpi-relate-modal";
// Tipos explícitos para evitar "any"
type EstadoEquipamento = "funcionando" | "nao_funcionando" | "";
type Necessidade = "substituido" | "enviar_conserto" | "descartado" | "";
// Tipos locais para listagem
type EquipamentoListItem = { id: number; nome: string };
type ModeloListItem = { id: number; nome: string; equipamentoId: number };
type SetorType = { id: number; nome: string };

export default function InfoFormularioPage() {
  const router = useRouter();
  const [glpiTicketId, setGlpiTicketId] = useState<number | null>(null);

  const [numeroChamado, setNumeroChamado] = useState("");
  const [nomeTecnico, setNomeTecnico] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [loja, setLoja] = useState("");
  const [tombo, setTombo] = useState("");
  const [modelo, setModelo] = useState("");
  const [setores, setSetores] = useState<SetorType[]>([]);
  const [setor, setSetor] = useState("");
  const [testesRealizados, setTestesRealizados] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  // Estados para listas e seleção
  type EquipamentoListItem = { id: number; nome: string };
  type ModeloListItem = { id: number; nome: string; equipamentoId: number };
  const [equipamentos, setEquipamentos] = useState<EquipamentoListItem[]>([]);
  const [equipamentoId, setEquipamentoId] = useState<number | null>(null);
  const [modelos, setModelos] = useState<ModeloListItem[]>([]);
  //   Tipar corretamente os estados (sem any)
  const [estadoEquipamento, setEstadoEquipamento] =
    useState<EstadoEquipamento>("");
  const [necessidade, setNecessidade] = useState<Necessidade>("");

  const handleEstadoEquipamentoChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value as EstadoEquipamento;
    setEstadoEquipamento(value);
  };
  const handleNecessidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Necessidade;
    setNecessidade(value);
  };

  const [dataAtual, setDataAtual] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

  // Remova a definição inline de LojaType; use o import acima
  const [lojas, setLojas] = useState<LojaType[]>([]);

  useEffect(() => {
    // valida sessão no backend ao entrar na página
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    const token = localStorage.getItem("token");
    fetch(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: token || "",
      },
    })
      .then(async (resp) => {
        if (!resp.ok) {
          router.replace("/");
          return;
        }
        const data = await resp.json();
        const name = String(
          data?.fullName || localStorage.getItem("fullName") || ""
        );
        setFullName(name);
        const tokens = name.trim().split(/\s+/);
        const firstTwo = tokens.slice(0, 2).join(" ");
        setNomeTecnico(firstTwo || name);
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${pad(d.getDate())}/${pad(
          d.getMonth() + 1
        )}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDataAtual(formatted);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [router]);

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreviewUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return file ? URL.createObjectURL(file) : "";
    });
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const saveSignature = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      // capturar assinatura como imagem base64
      const dataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");
      setAssinaturaDataUrl(dataUrl);
    } else {
      alert("Assine antes de salvar!");
    }
  };

  const clearSignature = () => {
    const pad = sigPadRef.current;
    if (pad) pad.clear();
  };

  const limpaImagemEquipamento = () => {
    setImageFile(null);
    setImagePreviewUrl("");
  };
  //lojas
  useEffect(() => {
    fetch(`${API_BASE_URL}/lojas`)
      .then((res) => res.json())
      .then((data: LojaType[]) => setLojas(data))
      .catch((err) => console.error("Erro ao carregar lojas:", err));
  }, []);

  useEffect(() => {
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    fetch(`${baseUrl}/setores`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error(`Falha ao carregar setores: ${res.status}`);
        return res.json();
      })
      .then((data: SetorType[]) => {
        setSetores(data);
        if (data.length > 0) {
          setSetor((prev) => prev || data[0].nome);
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar setores:", err);
      });
  }, []);

  // Carregar equipamentos (novo)
  useEffect(() => {
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    fetch(`${baseUrl}/equipamentos`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error(`Falha ao carregar equipamentos: ${res.status}`);
        return res.json();
      })
      .then((data: EquipamentoListItem[]) => setEquipamentos(data))
      .catch((err) => console.error("Erro ao buscar equipamentos:", err));
  }, []);

  // Carregar modelos quando equipamento muda (novo)
  useEffect(() => {
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    if (equipamentoId != null) {
      fetch(`${baseUrl}/modelos?equipamentoId=${equipamentoId}`)
        .then(async (res) => {
          if (!res.ok)
            throw new Error(`Falha ao carregar modelos: ${res.status}`);
          return res.json();
        })
        .then((data: ModeloListItem[]) => {
          setModelos(data);
          setModelo("");
        })
        .catch((err) => console.error("Erro ao buscar modelos:", err));
    } else {
      setModelos([]);
    }
  }, [equipamentoId]);

  const fileToDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  //=========================
  // Função para imprimir o PDF
  //=========================

  async function saveLaudoNoBanco() {
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    const equipamentoNome =
      equipamento ||
      equipamentos.find((eq) => eq.id === equipamentoId)?.nome ||
      "";

    const payload = {
      numeroChamado,
      tecnico: fullName,
      equipamento: equipamentoNome,
      modelo,
      loja,
      setor,
      tombo,
      data: dataAtual,
      testesRealizados,
      diagnostico,
      estadoEquipamento, // controller mapeia para enum
      necessidade, // controller mapeia para enum
    };

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const resp = await fetch(`${baseUrl}/info-laudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },

        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("Falha ao salvar laudo:", resp.status, txt);
      } else {
        const json = await resp.json().catch(() => null);
        console.log("Laudo salvo com sucesso:", json);
      }
    } catch (err) {
      console.error("Falha ao salvar laudo:", err);
    }
  }

  const [isGlpiModalOpen, setIsGlpiModalOpen] = useState(false);
  const [glpiPassword, setGlpiPassword] = useState("");
  const [isRelateDecisionOpen, setIsRelateDecisionOpen] = useState(false);
  const [isRelateFormOpen, setIsRelateFormOpen] = useState(false);
  const [glpiRelacaoForm, setGlpiRelacaoForm] =
    useState<GlpiRelacaoPayload | null>(null);
  const [pendingRelateAfterAuth, setPendingRelateAfterAuth] = useState(false);

  // Nova pergunta após "Sim, relacionar"
  const [isRelateFollowupAskOpen, setIsRelateFollowupAskOpen] = useState(false);
  const [doFollowupOnOriginal, setDoFollowupOnOriginal] = useState(false);

  const openGlpiDecision = () => setIsRelateDecisionOpen(true);
  const chooseRelateYes = () => {
    // Ao clicar "Sim, relacionar", perguntar se quer acompanhar o chamado original
    setIsRelateDecisionOpen(false);
    setIsRelateFollowupAskOpen(true);
  };
  const chooseRelateNo = () => {
    setIsRelateDecisionOpen(false);
    setGlpiRelacaoForm(null);
    setPendingRelateAfterAuth(false);
    setIsGlpiModalOpen(true);
  };

  // Handlers da nova pergunta
  const chooseRelateFollowupYes = () => {
    setDoFollowupOnOriginal(true);
    setIsRelateFollowupAskOpen(false);
    setPendingRelateAfterAuth(true);
    setIsGlpiModalOpen(true);
  };
  const chooseRelateFollowupNo = () => {
    setDoFollowupOnOriginal(false);
    setIsRelateFollowupAskOpen(false);
    setPendingRelateAfterAuth(true);
    setIsGlpiModalOpen(true);
  };

  const confirmRelacaoAndSend = async (data: GlpiRelacaoPayload) => {
    setIsRelateFormOpen(false);
    await criarChamadoERelacionar(glpiPassword, data);
    if (doFollowupOnOriginal) {
      // Após relacionar, faz acompanhamento no chamado original e atribui
      await registrarFollowupNoGLPI(glpiPassword);
      setDoFollowupOnOriginal(false);
    }
    setGlpiRelacaoForm(null);
  };

  const confirmGlpiPassword = async (pwd: string) => {
    setIsGlpiModalOpen(false);
    setGlpiPassword(pwd);

    // Se for fluxo de relacionamento, abre modal após obter a senha
    if (pendingRelateAfterAuth) {
      setIsRelateFormOpen(true);
      setPendingRelateAfterAuth(false);
      return;
    }

    // Caso contrário, envia acompanhamento normalmente
    await registrarFollowupNoGLPI(pwd);
  };

  async function criarChamadoERelacionar(
    pwd: string,
    relacao: GlpiRelacaoPayload
  ) {
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    const laudoPayload = {
      equipamento:
        equipamento ||
        equipamentos.find((eq) => eq.id === equipamentoId)?.nome ||
        "",
      modelo,
      tombo,
      setor,
      loja,
      testesRealizados,
      diagnostico,
      estadoEquipamento,
      necessidade,
    };

    const createResp = await fetch(`${baseUrl}/glpi/ticket/create`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "") },

      body: JSON.stringify({
        glpiPassword: pwd,
        laudo: laudoPayload,
        relacao: {
          titulo: relacao.titulo,
          categoriaId: relacao.categoriaId ?? null,
          localizacaoId: relacao.localizacaoId ?? null,
          grupoId: relacao.grupoId ?? null,
        },
      }),
    });
    if (!createResp.ok) {
      const txt = await createResp.text().catch(() => "");
      alert(`Falha ao criar Ticket: ${createResp.status} ${txt}`);
      return;
    }
    const createJson = await createResp.json();
    const createdId = Number(createJson?.ticketId);
    if (createdId && !Number.isNaN(createdId)) {
      setGlpiTicketId(createdId);
    }

    const targetId = Number(numeroChamado);
    if (
      !createdId ||
      Number.isNaN(createdId) ||
      !targetId ||
      Number.isNaN(targetId)
    ) {
      alert(
        createdId
          ? `Chamado criado: #${createdId}. Número do chamado alvo inválido para relacionar.`
          : "Chamado criado, mas ID não obtido."
      );
      return;
    }

    const linkResp = await fetch(`${baseUrl}/glpi/ticket/link`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Authorization: (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "") },

      body: JSON.stringify({
        glpiPassword: pwd,
        tickets_id_1: createdId,
        tickets_id_2: targetId,
        link: 1,
      }),
    });
    if (!linkResp.ok) {
      const txt = await linkResp.text().catch(() => "");
      alert(
        `Chamado criado #${createdId}, mas falhou ao relacionar com #${targetId}: ${linkResp.status} ${txt}`
      );
      return;
    }
    alert(`Chamado criado #${createdId} e relacionado com #${targetId}.`);
  }

  // Enviar acompanhamento ao GLPI (recebe a senha do modal)
  async function registrarFollowupNoGLPI(glpiPwd: string) {
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    const equipamentoNome =
      equipamento ||
      equipamentos.find((eq) => eq.id === equipamentoId)?.nome ||
      "";

    const payload = {
      numeroChamado: Number(numeroChamado),
      glpiPassword: glpiPwd,
      laudo: {
        equipamento: equipamentoNome,
        modelo,
        tombo,
        setor,
        loja,
        testesRealizados,
        diagnostico,
        estadoEquipamento,
        necessidade,
      },
    };

    try {
      const resp = await fetch(`${baseUrl}/glpi/followup`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Authorization: (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "") },

        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Falha ao enviar ao GLPI:", txt);
      } else {
        const json = await resp.json();
        console.log("Followup GLPI criado:", json);
      }

      // Atribuir ao chamado (type=2) após enviar acompanhamento
      const assignResp = await fetch(`${baseUrl}/glpi/ticket/assign`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Authorization: (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "") },

        body: JSON.stringify({
          glpiPassword: glpiPwd,
          tickets_id: Number(numeroChamado),
        }),
      });
      if (!assignResp.ok) {
        const txt = await assignResp.text().catch(() => "");
        console.warn(
          `Falha ao atribuir ao chamado ${numeroChamado}: ${assignResp.status} ${txt}`
        );
      } else {
        const assignJson = await assignResp.json();
        console.log("Atribuição registrada:", assignJson);
        alert("Chamado foi assentado.");
      }
    } catch (err) {
      console.error("Erro ao integrar GLPI:", err);
    }
  }

  // Abrir/fechar modal e confirmar envio
  const openGlpiModal = () => setIsGlpiModalOpen(true);
  const closeGlpiModal = () => setIsGlpiModalOpen(false);
  const confirmGlpiAndSend = async (pwd: string) => {
    closeGlpiModal();
    await registrarFollowupNoGLPI(pwd);
  };

  // Imprimir: apenas gerar o PDF (NÃO envia para GLPI e NÃO abre modal)
  //=========================
  // Função para imprimir o PDF e salvar no banco
  //=========================
  const handlePrint = async () => {
    // Primeiro salva o laudo no banco (mantido conforme sua lógica atual)
    await saveLaudoNoBanco();

    // Importa pdfmake dinamicamente
    const pdfMakeMod = await import("pdfmake/build/pdfmake");
    const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
    const pdfMake = pdfMakeMod.default || pdfMakeMod;
    const pdfFonts = pdfFontsMod.default || pdfFontsMod;
    //@ts-ignore
    pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

    // Dados formatados
    const equipamentoNome =
      equipamento ||
      equipamentos.find((eq) => eq.id === equipamentoId)?.nome ||
      "";
    const modeloNome = modelo || "";
    const estadoLabel =
      estadoEquipamento === "funcionando"
        ? "Funcionando"
        : estadoEquipamento === "nao_funcionando"
        ? "Não funcionando"
        : "-";
    const necessidadeLabel =
      necessidade === "substituido"
        ? "Ser substituído"
        : necessidade === "enviar_conserto"
        ? "Enviado p/ conserto"
        : necessidade === "descartado"
        ? "Ser descartado"
        : "-";

    let imagemEquipamentoDataUrl: string | undefined;
    if (imageFile) {
      try {
        imagemEquipamentoDataUrl = await fileToDataURL(imageFile);
      } catch {}
    }

    const assinaturaDataUrlLocal =
      assinaturaDataUrl ||
      (sigPadRef.current && !sigPadRef.current.isEmpty()
        ? sigPadRef.current.getCanvas().toDataURL("image/png")
        : undefined);

    // Helper de moldura idêntico ao admin (borda mais marcada e padding)

    const moldura = (conteudo: unknown, margin: number[] = [0, 0, 0, 10]) => ({
      table: {
        widths: ["*"],
        body: [[{ stack: Array.isArray(conteudo) ? conteudo : [conteudo] }]],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
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
      margin: [0, 0, 0, 3], // sem moldura, igual ao admin
    };

    // Removido: const emissaoBanner = {
    const emissaoBanner = {
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: `Emitido por: ${fullName || "Técnico"} em ${
                dataAtual || "-"
              }`,
              alignment: "center",
              margin: [4, 6, 4, 6],
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

    // Bloco de informações com layout idêntico ao admin
    const infoTable = {
      table: {
        widths: ["100%"],
        body: [
          [
            {
              text: `Número do Chamado: ${numeroChamado || "-"}`,
              bold: true,
              fillColor: "#f2f2f2",
              margin: [4, 4, 4, 4],
            },
          ],
          [{ text: `Técnico: ${fullName || "-"}`, margin: [4, 2, 4, 2] }],
          [{ text: `Data: ${dataAtual || "-"}`, margin: [4, 2, 4, 2] }],
          [{ text: `Loja: ${loja || "-"}`, margin: [4, 2, 4, 2] }],
          [{ text: `Setor: ${setor || "-"}`, margin: [4, 2, 4, 2] }],
          [
            {
              text: `Equipamento: ${
                modeloNome.trim()
                  ? `${equipamentoNome || "-"} - ${modeloNome}`
                  : equipamentoNome || "-"
              }`,
              margin: [4, 2, 4, 2],
            },
          ],
          [{ text: `Tombo: ${tombo || "-"}`, margin: [4, 2, 4, 2] }],
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

    const assinaturaContent = assinaturaDataUrlLocal
      ? {
          table: {
            widths: ["100%"],
            body: [
              [
                {
                  image: assinaturaDataUrlLocal,
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
      titulo,
      // Removido: moldura(emissaoBanner)
      moldura(infoTable),
      { text: "TESTES REALIZADOS", style: "subheader", margin: [0, 10, 0, 4] },
      { text: testesRealizados || "-", margin: [4, 0, 0, 8] },
      { text: "DIAGNÓSTICO", style: "subheader", margin: [0, 10, 0, 4] },
      { text: diagnostico || "-", margin: [4, 0, 0, 8] },
    ];

    // Imagem do equipamento com moldura (mantida e alinhada ao layout)
    if (imagemEquipamentoDataUrl) {
      content.push(
        moldura(
          [
            {
              text: "IMAGEM DO EQUIPAMENTO",
              style: "subheader",
              margin: [0, 0, 0, 5],
            },
            {
              image: imagemEquipamentoDataUrl,
              fit: [220, 160],
              alignment: "center",
              margin: [0, 5, 0, 5],
            },
          ],
          [0, 10, 0, 0]
        )
      );
    }

    // Assinatura com moldura (sempre espelha o admin)
    content.push(moldura([assinaturaHeader, assinaturaContent], [0, 10, 0, 0]));

    const docDefinition = {
      info: {
        title: `Laudo Técnico - ${numeroChamado || "sem_chamado"}`,
        author: fullName || "Técnico",
      },
      pageMargins: [40, 40, 40, 60],
      defaultStyle: { fontSize: 10, lineHeight: 1.3 },
      styles: {
        header: { fontSize: 18, bold: true, color: "#2c3e50" },
        subheader: { fontSize: 12, bold: true, color: "#000000" },
      },
      content,
    };
    //@ts-ignore
    pdfMake.createPdf(docDefinition).open();

    // Limpa todos os campos do formulário após imprimir
    const resetFormulario = () => {
      setNumeroChamado("");
      setEquipamento("");
      setEquipamentoId(null);
      setModelo("");
      setModelos([]);
      setLoja("");
      setSetor("");
      setTombo("");
      setEstadoEquipamento("");
      setNecessidade("");
      setTestesRealizados("");
      setDiagnostico("");

      // Imagem e assinatura
      setImageFile(null);
      setImagePreviewUrl("");
      setAssinaturaDataUrl("");
      if (sigPadRef.current) sigPadRef.current.clear();

      // Atualiza a data para o momento atual
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setDataAtual(
        `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}`
      );
    };

    // Após abrir o PDF, limpa o conteúdo do formulário
    resetFormulario();
  };

  // Handler para seleção de equipamento (novo)
  const handleEquipamentoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (!id) {
      setEquipamentoId(null);
      setEquipamento("");
      setModelos([]);
      setModelo("");
      return;
    }
    setEquipamentoId(id);
    const selected = equipamentos.find((eq) => eq.id === id);
    setEquipamento(selected?.nome ?? "");
  };

  return (
    <Card className="max-w-4xl mx-auto my-6">
      <CardHeader>
        <CardTitle>Informações do Laudo Técnico</CardTitle>
        <CardDescription>Preencha os dados</CardDescription>
        {glpiTicketId && (
          <div className="mt-2 text-sm">
            Chamado GLPI criado: <strong>#{glpiTicketId}</strong>
          </div>
        )}
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="numeroChamado">Número do Chamado</Label>
            <Input
              id="numeroChamado"
              value={numeroChamado}
              onChange={(e) => setNumeroChamado(onlyDigits(e.target.value))}
              inputMode="numeric"
              pattern="\d*"
              placeholder="Somente números"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nomeTecnico">Nome do Técnico</Label>
            <Input id="nomeTecnico" value={fullName} readOnly />
          </div>

          {/* Equipamento: trocar Input por Select (novo) */}
          <div className="grid gap-2">
            <Label htmlFor="equipamento">Equipamento</Label>
            <select
              id="equipamento"
              value={equipamentoId ?? ""}
              onChange={handleEquipamentoSelect}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {equipamentos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="loja">Loja</Label>
            <select
              id="loja"
              value={loja}
              onChange={(e) => setLoja(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.nome}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tombo">Tombo</Label>
            <Input
              id="tombo"
              value={tombo}
              onChange={(e) => setTombo(onlyDigits(e.target.value))}
              inputMode="numeric"
              pattern="\d*"
              placeholder="Somente números"
            />
          </div>

          {/* Modelo: depende do equipamento selecionado */}
          <div className="grid gap-2">
            <Label htmlFor="modelo">Modelo</Label>
            <select
              id="modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              disabled={equipamentoId == null}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.nome}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="setor">Setor</Label>
            <select
              id="setor"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {setores.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dataAtual">Data Atual do Sistema</Label>
            <Input id="dataAtual" value={dataAtual} disabled />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="imagemEquipamento">Imagem do Equipamento</Label>
          <input
            id="imagemEquipamento"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border rounded px-3 py-2"
          />
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Prévia da imagem do equipamento"
              className="mt-2 max-h-48 object-contain rounded border"
            />
          )}
          <Button
            type="button"
            onClick={limpaImagemEquipamento}
            className="mt-2 border rounded max-h-10 w-36"
          >
            Limpar Imagem
          </Button>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="testesRealizados">Testes realizados</Label>
          <textarea
            id="testesRealizados"
            value={testesRealizados}
            onChange={(e) => setTestesRealizados(e.target.value)}
            className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Descreva os testes executados"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="diagnostico">
            De acordo com os testes feitos, o diagnóstico do equipamento é
          </Label>
          <textarea
            id="diagnostico"
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Descreva o diagnóstico"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="estadoEquipamento">Estado do equipamento</Label>
            <select
              id="estadoEquipamento"
              value={estadoEquipamento}
              onChange={handleEstadoEquipamentoChange}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              <option value="funcionando">Funcionando</option>
              <option value="nao_funcionando">Não funcionando</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="necessidade">O equipamento necessita</Label>
            <select
              id="necessidade"
              value={necessidade}
              onChange={handleNecessidadeChange}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              <option value="substituido">Ser substituído</option>
              <option value="enviar_conserto">Enviado p/ conserto</option>
              <option value="descartado">Ser descartado</option>
            </select>
          </div>
        </div>

        {/* Campo de assinatura abaixo dos selects */}
        <div className="p-4 max-w-lg w-full">
          <Label htmlFor="assinatura">Assinatura</Label>

          <div className="rounded-md border bg-white p-2 mt-2">
            <SignatureCanvas
              ref={sigPadRef}
              penColor="#000000"
              backgroundColor="#ffffff"
              canvasProps={{ className: "w-full h-40 border rounded" }}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              className="bg-[#4288a8] text-white"
              onClick={clearSignature}
            >
              Limpar
            </Button>
            <Button type="button" onClick={saveSignature}>
              Salvar Assinatura
            </Button>
          </div>

          {assinaturaDataUrl && (
            <div className="mt-4">
              <p className="font-semibold">Prévia da Assinatura:</p>
              <img
                src={assinaturaDataUrl}
                alt="Assinatura"
                className="mt-2 border rounded max-h-40"
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button
          type="button"
          className="bg-[#4288a8] text-white"
          onClick={async () => {
            handlePrint();
          }}
        >
          Imprimir
        </Button>

        <Button variant="default" onClick={openGlpiDecision}>
          Enviar para o GLPI
        </Button>

        {/* Modal de decisão: relacionar? */}
        {isRelateDecisionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-md p-4 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                Deseja relacionar a um chamado existente?
              </h3>
              <p className="text-sm mb-4">
                Se preferir não relacionar, enviaremos o acompanhamento no
                chamado informado normalmente.
              </p>
              <div className="flex gap-2">
                <Button onClick={chooseRelateYes}>Sim, relacionar</Button>
                <Button variant="outline" onClick={chooseRelateNo}>
                  Não, enviar acompanhamento
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsRelateDecisionOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Nova pergunta: fazer acompanhamento no chamado original? */}
        {isRelateFollowupAskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-md p-4 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">
                Deseja fazer o acompanhamento no chamado original?
              </h3>
              <p className="text-sm mb-4">
                Se escolher sim, após relacionar criaremos um acompanhamento no
                chamado indicado e o atribuiremos a você.
              </p>
              <div className="flex gap-2">
                <Button onClick={chooseRelateFollowupYes}>
                  Sim, fazer acompanhamento
                </Button>
                <Button variant="outline" onClick={chooseRelateFollowupNo}>
                  Não, apenas relacionar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsRelateFollowupAskOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal com campos de relação */}
        <GlpiRelateModal
          open={isRelateFormOpen}
          apiBaseUrl={API_BASE_URL}
          defaultTecnico={
            fullName ||
            (typeof window !== "undefined"
              ? localStorage.getItem("username") || ""
              : "")
          }
          defaultRequerente={
            fullName ||
            (typeof window !== "undefined"
              ? localStorage.getItem("username") || ""
              : "")
          }
          onCancel={() => setIsRelateFormOpen(false)}
          onConfirm={confirmRelacaoAndSend}
        />

        {/* Modal de senha GLPI (já existente) */}
        <GlpiPasswordModal
          open={isGlpiModalOpen}
          onCancel={() => setIsGlpiModalOpen(false)}
          onConfirm={confirmGlpiPassword}
          title="Autenticar (senha GLPI/AD)"
          description="Informe sua senha para enviar ao GLPI e continuar."
        />

        <Button
          type="button"
          onClick={async () => {
            const baseUrl = API_BASE_URL || "http://localhost:4000";
            try {
              await fetch(`${baseUrl}/auth/logout`, {
                method: "POST",
                cache: "no-store",
              });
            } catch {}
            try {
              localStorage.removeItem("token");
              localStorage.removeItem("fullName");
              localStorage.removeItem("username");
              sessionStorage.clear();

              if (typeof window !== "undefined" && "caches" in window) {
                caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
              }

              const cookies = document.cookie.split("; ");
              for (const c of cookies) {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substring(0, eqPos) : c;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
              }
            } catch {}
            router.replace("/");
          }}
        >
          Sair
        </Button>
      </CardFooter>
    </Card>
  );
}
