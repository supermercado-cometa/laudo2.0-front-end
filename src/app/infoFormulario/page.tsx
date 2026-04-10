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
import {
  User,
  LogOut,
  CheckCircle2,
  XCircle
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { LojaType } from "@/types/domain";
import GlpiPasswordModal from "@/components/glpi-password-modal";
import GlpiRelateModal, {
  GlpiRelacaoPayload,
} from "@/components/glpi-relate-modal";
// Tipos explícitos para evitar "any"
type EstadoEquipamento = "funcionando" | "nao_funcionando" | "";
type Necessidade = "substituido" | "enviar_conserto" | "descartado" | "";
// Tipos locais para listagem
type SetorType = { id: number; nome: string };

export default function InfoFormularioPage() {
  const router = useRouter();
  const [glpiTicketId, setGlpiTicketId] = useState<number | null>(null);

  const [numeroChamado, setNumeroChamado] = useState("");
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showErrorPopup = (msg: string) => {
    setErrorMessage(msg);
    setShowError(true);
  };

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
  const [username, setUsername] = useState<string>("");
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string>("");
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // Remova a definição inline de LojaType; use o import acima
  const [lojas, setLojas] = useState<LojaType[]>([]);

  useEffect(() => {
    // valida sessão no backend ao entrar na página
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    const token = localStorage.getItem("token");

    // Redireciona se não houver token
    if (!token) {
      console.warn("No token found, redirecting to login");
      router.replace("/");
      return;
    }

    // Modo Demo: Não valida no backend
    if (token === "demo-token") {
      console.log("Demo session active");
      const name = localStorage.getItem("fullName") || "Usuário Demo";
      const tokens = name.trim().split(/\s+/);
      const firstTwo = tokens.slice(0, 2).join(" ");
      setFullName(firstTwo || name);

      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setDataAtual(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`);
      return;
    }

    fetch(`${baseUrl}/auth/me`, {
      cache: "no-store",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then(async (resp) => {
        if (!resp.ok) {
          console.warn(`Auth check failed: ${resp.status}`);
          // Se falhou mas temos os dados localmente, podemos tentar carregar 
          // ao invés de expulsar o usuário imediatamente (mais resiliente)
          const localName = localStorage.getItem("fullName");
          if (localName) {
            console.log("Using local session data instead");
            setFullName(localName.split(/\s+/).slice(0, 2).join(" "));
          } else {
            router.replace("/");
          }
          return;
        }
        const data = await resp.json();
        console.log("User data loaded:", data);
        const name = String(
          data?.user?.fullName || data?.fullName || localStorage.getItem("fullName") || ""
        );
        const tokens = name.trim().split(/\s+/);
        const firstTwo = tokens.slice(0, 2).join(" ");
        setFullName(firstTwo || name);
        const user = localStorage.getItem("username") || "";
        setUsername(user);

        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${pad(d.getDate())}/${pad(
          d.getMonth() + 1
        )}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDataAtual(formatted);
      })
      .catch((err) => {
        console.error("Auth fetch error:", err);
        // Em caso de erro de rede (Ex: backend offline), se temos o nome local, usamos ele
        const localName = localStorage.getItem("fullName");
        if (localName) {
          setFullName(localName.split(/\s+/).slice(0, 2).join(" "));
        } else {
          router.replace("/");
        }
      });
  }, [router, API_BASE_URL]);

  function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
  }


  const saveSignature = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      // capturar assinatura como imagem base64
      const dataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");
      setAssinaturaDataUrl(dataUrl);
    } else {
      showErrorPopup("Assine no campo antes de salvar a assinatura.");
    }
  };

  const clearSignature = () => {
    const pad = sigPadRef.current;
    if (pad) pad.clear();
  };

  const handleLogout = async () => {
    const baseUrl = API_BASE_URL || "http://localhost:4000";
    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        cache: "no-store",
      });
    } catch { }
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("fullName");
      localStorage.removeItem("username");
      sessionStorage.clear();
      document.cookie = `auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } catch { }
    router.replace("/");
  };

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
    setGlpiTicketId(null);
    setCurrentStep(1);

    // Imagem e assinatura
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

  //lojas
  useEffect(() => {
    fetch(`${API_BASE_URL}/lojas`)
      .then((res) => res.json())
      .then((data: LojaType[]) => setLojas(data))
      .catch((err) => console.error("Erro ao carregar lojas:", err));
  }, [API_BASE_URL]);

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
  }, [API_BASE_URL]);

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
  }, [API_BASE_URL]);

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
  }, [equipamentoId, API_BASE_URL]);


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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;


  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  const [glpiPassword, setGlpiPassword] = useState("");
  const [isRelateDecisionOpen, setIsRelateDecisionOpen] = useState(false);
  const [isRelateFormOpen, setIsRelateFormOpen] = useState(false);
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
    const ok = await criarChamadoERelacionar(glpiPassword, data);
    if (!ok) return; // Aborta se a criação do ticket falhou
    if (doFollowupOnOriginal) {
      // Após relacionar, faz acompanhamento no chamado original e atribui
      await registrarFollowupNoGLPI(glpiPassword);
      setDoFollowupOnOriginal(false);
    }
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
  ): Promise<boolean> {
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
      showErrorPopup(`Falha ao criar ticket no GLPI. Verifique sua senha e tente novamente.`);
      console.error(`Falha ao criar Ticket: ${createResp.status} ${txt}`);
      return false;
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
      showErrorPopup(
        createdId
          ? `Chamado #${createdId} criado, mas o número do chamado alvo é inválido para relacionar.`
          : "Chamado criado, mas não foi possível obter o ID."
      );
      return false;
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
      showErrorPopup(`Chamado #${createdId} criado, mas falhou ao relacionar com #${targetId}.`);
      console.error(`Link error: ${linkResp.status} ${txt}`);
      return false;
    }

    // Sucesso no relacionamento
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      resetFormulario();
    }, 3000);
    return true;
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
        console.error("Falha ao enviar followup ao GLPI:", txt);
        showErrorPopup("Falha ao registrar o acompanhamento no GLPI. Verifique sua senha e tente novamente.");
        return;
      }

      const json = await resp.json();
      console.log("Followup GLPI criado:", json);

      // Followup enviado com sucesso: exibe overlay imediatamente
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetFormulario();
      }, 3000);

      // Tenta atribuir o chamado em segundo plano (falha não bloqueia o sucesso)
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
        console.warn(`Falha ao atribuir chamado ${numeroChamado}: ${assignResp.status} ${txt}`);
      } else {
        const assignJson = await assignResp.json();
        console.log("Atribuição registrada:", assignJson);
      }
    } catch (err) {
      console.error("Erro ao integrar GLPI:", err);
    }
  }

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
    // @ts-expect-error - pdfmake types don't always match the build artifacts
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
              text: `Equipamento: ${modeloNome.trim()
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
    // @ts-expect-error - createPdf is present but types can be tricky with dynamic imports
    pdfMake.createPdf(docDefinition).open();

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
    <div className="min-h-screen bg-[#F5F7FA] md:py-8 md:px-6">
      {/* SUCCESS OVERLAY PREMIUM */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-[#0E3D8A]/90 backdrop-blur-md p-6 pb-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl w-full max-w-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-5 shadow-lg"
              >
                <CheckCircle2 className="text-white w-10 h-10" />
              </motion.div>

              <h2 className="text-[#1A1A2E] text-2xl font-black mb-1 tracking-tight">Laudo enviado com sucesso!</h2>
              <p className="text-slate-500 text-[15px] font-medium mb-6 leading-snug">
                O laudo foi registrado no GLPI. Você pode iniciar um novo cadastro.
              </p>

              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="bg-green-500 h-full"
                />
              </div>

              <Button
                className="w-full h-[52px] bg-[#0E3D8A] hover:bg-[#0A2D66] text-white rounded-[14px] font-black uppercase text-[12px] tracking-widest transition-all active:scale-95 shadow-lg mb-3"
                onClick={() => {
                  setShowSuccess(false);
                  resetFormulario();
                }}
              >
                Criar Novo Laudo
              </Button>

              <button
                onClick={handleLogout}
                className="text-slate-400 text-[12px] font-semibold hover:text-slate-600 transition-all py-2"
              >
                Sair do sistema
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR TOAST — minimalista */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-32px)] max-w-sm"
          >
            <div className="bg-white border-l-4 border-red-500 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
              <XCircle className="text-red-500 w-5 h-5 mt-0.5 shrink-0" />
              <p className="flex-1 text-[13px] font-semibold text-slate-800 leading-snug">{errorMessage}</p>
              <button
                onClick={() => setShowError(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none shrink-0"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* HEADER PREMIUM MOBILE (Avatar + Curve) */}
      <div className="md:hidden bg-[#0E3D8A] pb-12 rounded-mobile-header shadow-portal-mobile overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-1 bg-[#FECC00] opacity-50" />
        <div className="px-6 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-[60px] h-[60px] rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center p-1 overflow-hidden shadow-lg">
              <User className="text-white w-8 h-8 opacity-80" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Técnico</p>
              <h2 className="text-white font-black text-lg truncate max-w-[180px]">
                {fullName || username || "Usuário"}
              </h2>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-400/40 transition-all active:scale-90 hover:bg-red-500/40"
              title="Sair"
            >
              <LogOut className="text-red-300 w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="px-6 mt-6">
          <h1 className="text-white text-2xl font-black">Laudo Técnico</h1>
          <p className="text-white/70 text-sm font-medium">Passo {currentStep} de {totalSteps}</p>
        </div>
      </div>

      <Card className="max-w-[1100px] mx-auto bg-white md:rounded-[24px] rounded-none md:shadow-portal-web shadow-none border-none overflow-hidden relative md:mt-0 -mt-6">
        <CardHeader className="hidden md:block bg-[#0E3D8A] text-white p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-1 bg-[#FECC00] animate-in slide-in-from-right duration-700 delay-300" />
          <div className="relative z-10">
            <CardTitle className="text-3xl font-black tracking-tight mb-2">
              Informações do Laudo Técnico
            </CardTitle>
            <CardDescription className="text-white/80 text-lg font-medium">
              Preencha os dados de conformidade
            </CardDescription>
            {glpiTicketId && (
              <div className="mt-6 inline-flex items-center gap-2 bg-[#FECC00] text-[#1A1A2E] px-4 py-2 rounded-[4px] shadow-lg text-[13px] font-bold animate-bounce-subtle">
                Chamado GLPI criado: <strong>#{glpiTicketId}</strong>
              </div>
            )}
          </div>
          {/* Decorative elements for depth */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </CardHeader>

        {/* INDICADOR DE PASSOS (MOBILE ONLY) */}
        <div className="md:hidden flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${currentStep === s
                    ? "bg-[#0E3D8A] text-white shadow-lg scale-110"
                    : s < currentStep
                      ? "bg-[#FECC00] text-[#1A1A2E]"
                      : "bg-slate-100 text-slate-400"
                  }`}
              >
                {s < currentStep ? "✓" : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < currentStep ? "bg-[#FECC00]" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>

        <CardContent className="md:p-10 p-6 pb-36 md:pb-10 space-y-12 min-h-[400px] relative">
          <AnimatePresence mode="wait" initial={false}>
            {/* STEP 1: IDENTIFICAÇÃO */}
            {(currentStep === 1 || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
              <motion.div
                key={currentStep === 1 ? "step1" : "desktop1"}
                initial={currentStep === 1 ? { opacity: 0, y: 10 } : {}}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`${currentStep !== 1 ? "hidden md:block" : "block"} space-y-8`}
              >
                {/* GRID PRINCIPAL DE IDENTIFICAÇÃO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 reveal-stagger delay-1">
                  <div className="space-y-3">
                    <Label htmlFor="numeroChamado" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Número do Chamado</Label>
                    <Input
                      id="numeroChamado"
                      value={numeroChamado}
                      onChange={(e) => setNumeroChamado(onlyDigits(e.target.value))}
                      inputMode="numeric"
                      pattern="\d*"
                      placeholder="Somente números"
                      className="input-custom h-[52px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="tecnico" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Nome do Técnico</Label>
                    <Input id="tecnico" value={fullName || username || ""} disabled className="input-custom h-[52px] bg-slate-50" />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="equipamento" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Equipamento</Label>
                    <select
                      id="equipamento"
                      value={equipamentoId ?? ""}
                      onChange={handleEquipamentoSelect}
                      className="input-custom w-full h-[52px] appearance-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {equipamentos.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="loja" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Loja</Label>
                    <select
                      id="loja"
                      value={loja}
                      onChange={(e) => setLoja(e.target.value)}
                      className="input-custom w-full h-[52px] appearance-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {lojas.map((l) => (
                        <option key={l.id} value={l.nome}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="tombo" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Tombo</Label>
                    <Input
                      id="tombo"
                      value={tombo}
                      onChange={(e) => setTombo(onlyDigits(e.target.value))}
                      inputMode="numeric"
                      pattern="\d*"
                      placeholder="Somente números"
                      className="input-custom h-[52px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="modelo" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Modelo</Label>
                    <select
                      id="modelo"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      disabled={equipamentoId == null}
                      className="input-custom w-full h-[52px] appearance-none cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecione...</option>
                      {modelos.map((m) => (
                        <option key={m.id} value={m.nome}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="setor" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Setor</Label>
                    <select
                      id="setor"
                      value={setor}
                      onChange={(e) => setSetor(e.target.value)}
                      className="input-custom w-full h-[52px] appearance-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {setores.map((s) => (
                        <option key={s.id} value={s.nome}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="dataAtual" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Data Atual</Label>
                    <Input id="dataAtual" value={dataAtual} disabled className="input-custom h-[52px] bg-slate-50" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DIAGNÓSTICO */}
            {(currentStep === 2 || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
              <motion.div
                key={currentStep === 2 ? "step2" : "desktop2"}
                initial={currentStep === 2 ? { opacity: 0, y: 10 } : {}}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`${currentStep !== 2 ? "hidden md:block" : "block"} space-y-10`}
              >
                <div className="space-y-10 reveal-stagger delay-2">
                  <div className="space-y-3">
                    <Label htmlFor="testesRealizados" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Testes realizados</Label>
                    <textarea
                      id="testesRealizados"
                      value={testesRealizados}
                      onChange={(e) => setTestesRealizados(e.target.value)}
                      className="input-custom w-full min-h-[120px] py-4"
                      placeholder="Descreva os testes executados"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="diagnostico" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Diagnóstico do Equipamento</Label>
                    <textarea
                      id="diagnostico"
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                      className="input-custom w-full min-h-[120px] py-4"
                      placeholder="Descreva o diagnóstico final"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 reveal-stagger delay-3">
                  <div className="space-y-3">
                    <Label htmlFor="estadoEquipamento" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">Estado do equipamento</Label>
                    <select
                      id="estadoEquipamento"
                      value={estadoEquipamento}
                      onChange={handleEstadoEquipamentoChange}
                      className="input-custom w-full h-[52px] appearance-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      <option value="funcionando">Funcionando</option>
                      <option value="nao_funcionando">Não funcionando</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="necessidade" className="text-[14px] font-[700] text-[#1A1A2E] uppercase tracking-wider">O equipamento necessita</Label>
                    <select
                      id="necessidade"
                      value={necessidade}
                      onChange={handleNecessidadeChange}
                      className="input-custom w-full h-[52px] appearance-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      <option value="substituido">Ser substituído</option>
                      <option value="enviar_conserto">Enviado p/ conserto</option>
                      <option value="descartado">Ser descartado</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: ASSINATURA */}
            {(currentStep === 3 || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
              <motion.div
                key={currentStep === 3 ? "step3" : "desktop3"}
                initial={currentStep === 3 ? { opacity: 0, y: 10 } : {}}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`${currentStep !== 3 ? "hidden md:block" : "block"} space-y-8`}
              >
                <div className="bg-[#F8FAFC] md:p-10 p-6 rounded-[20px] border border-slate-200/60 max-w-3xl reveal-stagger delay-4 shadow-sm">
                  <Label htmlFor="assinatura" className="text-[13px] font-[800] text-[#1A1A2E] mb-6 block uppercase tracking-widest opacity-80">Assinatura do Técnico</Label>
                  <div className="rounded-2xl border-2 border-white bg-white shadow-sm overflow-hidden">
                    <SignatureCanvas
                      ref={sigPadRef}
                      penColor="#0E3D8A"
                      backgroundColor="#ffffff"
                      canvasProps={{ className: "w-full h-44 rounded-xl cursor-crosshair" }}
                    />
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 h-12 px-8 rounded-[4px] font-bold uppercase text-[11px] tracking-widest transition-all active:scale-95"
                      onClick={clearSignature}
                    >
                      Limpar
                    </Button>
                    <Button
                      type="button"
                      className="bg-[#1A1A2E] hover:bg-black text-white h-12 px-8 rounded-[4px] font-bold uppercase text-[11px] tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95"
                      onClick={saveSignature}
                    >
                      Salvar Assinatura
                    </Button>
                  </div>

                  {assinaturaDataUrl && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <p className="text-sm font-bold text-[#1A1A2E] mb-3">Prévia da Assinatura:</p>
                      <div className="bg-white p-2 border border-gray-100 rounded-xl inline-block shadow-sm">
                        <Image
                          src={assinaturaDataUrl}
                          alt="Assinatura"
                          width={320}
                          height={128}
                          className="max-h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* MOBILE NAVIGATION BAR (STICKY) */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex gap-4 pointer-events-none">
          <AnimatePresence>
            {currentStep > 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 pointer-events-auto"
              >
                <Button
                  className="w-full h-[56px] bg-white text-[#1A1A2E] border border-slate-200 shadow-portal-mobile rounded-[16px] font-black uppercase text-[11px] tracking-wider transition-all active:scale-95"
                  onClick={prevStep}
                >
                  Voltar
                </Button>
              </motion.div>
            )}
            <motion.div
              layout
              className="flex-[2] pointer-events-auto"
            >
              {currentStep < 3 ? (
                <Button
                  className="w-full h-[56px] bg-[#0E3D8A] text-white shadow-btn-floating rounded-[16px] font-black uppercase text-[11px] tracking-wider transition-all active:scale-95"
                  onClick={nextStep}
                >
                  Próximo Passo
                </Button>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    className="w-full h-[56px] bg-[#FECC00] text-[#1A1A2E] shadow-xl rounded-[16px] font-black uppercase text-[11px] tracking-widest transition-all active:scale-95"
                    onClick={openGlpiDecision}
                  >
                    Finalizar e Enviar
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-[40px] text-white/50 font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95"
                    onClick={handleLogout}
                  >
                    Sair Agora
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <CardFooter className="hidden md:flex bg-slate-50/80 p-10 flex-wrap justify-end gap-6 border-t border-slate-100">
          <Button
            type="button"
            className="bg-[#4288a8] hover:bg-[#366e88] text-white h-16 px-12 rounded-[4px] font-black uppercase tracking-tighter shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
            onClick={async () => {
              handlePrint();
            }}
          >
            Imprimir Laudo
          </Button>

          <Button
            className="bg-[#0E3D8A] hover:bg-[#0A2D66] text-white h-16 px-12 rounded-[4px] font-black uppercase tracking-tighter shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl"
            onClick={openGlpiDecision}
          >
            Enviar ao GLPI
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700 text-white h-16 px-12 rounded-[4px] font-black uppercase tracking-tighter shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            type="button"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </CardFooter>
      </Card>

      {/* MODALS MANTIDOS 1:1 COM A LÓGICA ORIGINAL */}

      {/* MODALS MANTIDOS 1:1 COM A LÓGICA ORIGINAL */}
      {isRelateDecisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">
              Deseja relacionar a um chamado existente?
            </h3>
            <p className="text-[#6B7280] text-sm mb-6">
              Se preferir não relacionar, enviaremos o acompanhamento no
              chamado informado normalmente.
            </p>
            <div className="flex flex-col gap-3">
              <Button className="w-full h-12 bg-[#0E3D8A] rounded-xl font-bold" onClick={chooseRelateYes}>Sim, relacionar</Button>
              <Button variant="outline" className="w-full h-12 border-gray-200 rounded-xl font-bold" onClick={chooseRelateNo}>
                Não, enviar acompanhamento
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 text-gray-400 hover:text-gray-600"
                onClick={() => setIsRelateDecisionOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {isRelateFollowupAskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">
              Deseja fazer o acompanhamento no chamado original?
            </h3>
            <p className="text-[#6B7280] text-sm mb-6">
              Se escolher sim, após relacionar criaremos um acompanhamento no
              chamado indicado e o atribuiremos a você.
            </p>
            <div className="flex flex-col gap-3">
              <Button className="w-full h-12 bg-[#0E3D8A] rounded-xl font-bold" onClick={chooseRelateFollowupYes}>
                Sim, fazer acompanhamento
              </Button>
              <Button variant="outline" className="w-full h-12 border-gray-200 rounded-xl font-bold" onClick={chooseRelateFollowupNo}>
                Não, apenas relacionar
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 text-gray-400 hover:text-gray-600"
                onClick={() => setIsRelateFollowupAskOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <GlpiRelateModal
        open={isRelateFormOpen}
        apiBaseUrl={API_BASE_URL}
        defaultTecnico={fullName}
        defaultRequerente={fullName}
        onCancel={() => setIsRelateFormOpen(false)}
        onConfirm={confirmRelacaoAndSend}
      />

      <GlpiPasswordModal
        open={isGlpiModalOpen}
        onCancel={() => setIsGlpiModalOpen(false)}
        onConfirm={confirmGlpiPassword}
        title="Autenticar (senha GLPI/AD)"
        description="Informe sua senha para enviar ao GLPI e continuar."
      />
    </div>
  );
}
