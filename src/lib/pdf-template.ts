/* eslint-disable @typescript-eslint/no-explicit-any */
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

const pdfOk = pdfMake as any;
const pdfFontsOk = pdfFonts as any;

if (pdfFontsOk && pdfFontsOk.pdfMake) {
  pdfOk.vfs = pdfFontsOk.pdfMake.vfs;
} else if (pdfFontsOk) {
  pdfOk.vfs = pdfFontsOk.vfs || pdfOk.vfs;
}

// Converts a public image URL to base64 for pdfmake embedding
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const BLUE = "#003B99";
const YELLOW = "#FECC00";
const LIGHT_GRAY = "#F7F8FC";
const BORDER_COLOR = "#E2E8F0";
const TEXT_DARK = "#1A1A2E";
const TEXT_MUTED = "#64748B";

const formatEstado = (estado?: string) => {
  if (!estado) return "—";
  if (estado === "NAO_FUNCIONANDO") return "Não funcionando";
  if (estado === "FUNCIONANDO") return "Funcionando";
  return estado;
};

const formatNecessidade = (nec?: string) => {
  if (!nec) return "—";
  if (nec === "ENVIAR_CONSERTO") return "Enviado p/ conserto";
  if (nec === "SUBSTITUIDO") return "Ser substituído";
  if (nec === "DESCARTADO") return "Ser descartado";
  return nec;
};

// Row helper: [Label, Value]
const infoRow = (label: string, value: string) => ({
  columns: [
    { text: label.toUpperCase(), style: "rowLabel", width: 140 },
    { text: value || "—", style: "rowValue" },
  ],
  columnGap: 10,
  margin: [0, 0, 0, 8],
});

// Section title helper
const sectionTitle = (title: string) => ({
  stack: [
    { text: title.toUpperCase(), style: "sectionTitle" },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: BORDER_COLOR }], margin: [0, 4, 0, 10] },
  ],
  margin: [0, 18, 0, 0],
});

export const gerarLaudoPDF = async (laudo: any, emitidoPor: string) => {
  // Format date without seconds and without the locale comma: "17/04/2026 09:25"
  const dtAtual = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", "");

  const logoBase64 = await imageUrlToBase64("/laudos_TI.png");

  // ── Header (clean, no background) ─────────────────────────────────────────
  const headerContent: any = {
    columns: [
      logoBase64
        ? { image: logoBase64, width: 120, margin: [0, 0, 0, 0] }
        : { text: "COMETA", bold: true, fontSize: 16, color: BLUE },
      {
        stack: [
          { text: "LAUDO TÉCNICO", style: "headerTitle" },
          { text: `Chamado Nº ${laudo.numeroChamado || "—"}`, style: "headerSub" },
        ],
        alignment: "right",
      },
    ],
    columnGap: 10,
    margin: [0, 0, 0, 6],
  };

  // Yellow accent bar
  const accentBar = {
    canvas: [{ type: "rect", x: 0, y: 0, w: 595, h: 5, color: YELLOW }],
    margin: [0, 0, 0, 20],
  };

  // ── Meta pill row ────────────────────────────────────────────────────────────
  const metaBar = {
    table: {
      widths: ["*", "*", "*"],
      body: [
        [
          { text: [`Emitido por\n`, { text: laudo.tecnico || emitidoPor, bold: true, color: TEXT_DARK }], style: "metaCell", border: [false, false, false, false] },
          { text: [`Data de Emissão\n`, { text: dtAtual, bold: true, color: TEXT_DARK }], style: "metaCell", border: [false, false, false, false] },
          { text: [`Loja / Setor\n`, { text: `${laudo.loja || "—"} · ${laudo.setor || "—"}`, bold: true, color: TEXT_DARK }], style: "metaCell", border: [false, false, false, false] },
        ],
      ],
    },
    layout: "noBorders",
    fillColor: LIGHT_GRAY,
    margin: [0, 0, 0, 4],
  };

  // ── Sections ─────────────────────────────────────────────────────────────────
  const equipSection = {
    margin: [0, 0, 0, 0],
    stack: [
      sectionTitle("Identificação do Equipamento"),
      infoRow("Equipamento", `${laudo.equipamento || "—"}${laudo.modelo && laudo.modelo !== "Sem Modelo" ? " — " + laudo.modelo : ""}`),
      infoRow("Número de Tombo", laudo.tombo || "—"),
      infoRow("Técnico Responsável", laudo.tecnico || "—"),
    ],
  };

  const diagSection = {
    stack: [
      sectionTitle("Diagnóstico Técnico"),
      infoRow("Estado do Equipamento", formatEstado(laudo.estadoEquipamento)),
      infoRow("Necessidade", formatNecessidade(laudo.necessidade)),
      { text: "TESTES REALIZADOS", style: "blockLabel", margin: [0, 10, 0, 4] },
      { text: laudo.testesRealizados || "Não preenchido.", style: "blockText" },
      { text: "DIAGNÓSTICO / CONCLUSÃO", style: "blockLabel", margin: [0, 12, 0, 4] },
      { text: laudo.diagnostico || "Não preenchido.", style: "blockText" },
    ],
  };

  // ── Signature block ───────────────────────────────────────────────────────────
  const signatureInner: any[] = [
    { text: "ASSINATURA DO TÉCNICO", style: "blockLabel", margin: [0, 0, 0, 12] },
  ];

  if (laudo.signature) {
    // Força fundo branco via tabela (seguro contra transparência/black backgrounds)
    signatureInner.push({
      table: {
        widths: ["*"],
        body: [[{
          image: laudo.signature,
          width: 180,
          alignment: "center",
          margin: [0, 5, 0, 5]
        }]]
      },
      layout: {
        fillColor: "#FFFFFF",
        defaultBorder: false
      },
      margin: [0, 0, 0, 8]
    });
  } else {
    signatureInner.push({
      canvas: [{ type: "line", x1: 100, y1: 40, x2: 415, y2: 40, lineWidth: 1, lineColor: "#CBD5E1" }],
      margin: [0, 0, 0, 4],
    });
  }

  signatureInner.push(
    { text: laudo.tecnico || emitidoPor, alignment: "center", fontSize: 10, bold: true, color: TEXT_DARK },
    { text: "Técnico Responsável", alignment: "center", fontSize: 8, color: TEXT_MUTED, margin: [0, 2, 0, 0] }
  );

  const signatureSection = {
    stack: [
      sectionTitle("Assinatura"),
      { stack: signatureInner, margin: [0, 8, 0, 0] },
    ],
  };

  // ── Footer ────────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const footer = (..._args: unknown[]) => ({
    columns: [
      { text: `Chamado #${laudo.numeroChamado || "—"} · ${laudo.loja || ""} · ${laudo.setor || ""}`, style: "footerLeft" },
      { text: `Emitido em ${dtAtual}`, style: "footerRight", alignment: "right" },
    ],
    margin: [40, 16, 40, 0],
  });

  // ── Doc Definition ────────────────────────────────────────────────────────────
  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 60],
    footer,
    content: [
      headerContent,
      accentBar,
      metaBar,
      equipSection,
      diagSection,
      signatureSection,
    ],
    styles: {
      headerTitle: {
        fontSize: 20,
        bold: true,
        color: BLUE,
        letterSpacing: 2,
      },
      headerSub: {
        fontSize: 10,
        color: TEXT_MUTED,
        bold: false,
        margin: [0, 2, 0, 0],
      },
      metaCell: {
        fontSize: 9,
        color: TEXT_MUTED,
        alignment: "center",
        margin: [0, 10, 0, 10],
      },
      sectionTitle: {
        fontSize: 11,
        bold: true,
        color: BLUE,
        letterSpacing: 1,
      },
      rowLabel: {
        fontSize: 9,
        color: TEXT_MUTED,
        bold: false,
      },
      rowValue: {
        fontSize: 10,
        color: TEXT_DARK,
        bold: true,
      },
      blockLabel: {
        fontSize: 9,
        bold: true,
        color: TEXT_MUTED,
        letterSpacing: 1,
      },
      blockText: {
        fontSize: 10,
        color: TEXT_DARK,
        lineHeight: 1.5,
      },
      footerLeft: {
        fontSize: 8,
        color: TEXT_MUTED,
      },
      footerRight: {
        fontSize: 8,
        color: TEXT_MUTED,
      },
    },
  };

  try {
    // Abre em nova aba de forma mais resiliente para evitar bloqueios de popup após o async
    const pdfDocGenerator = pdfOk.createPdf(docDefinition);
    pdfDocGenerator.open();
  } catch (e) {
    console.error("Erro ao abrir PDF, tentando download como fallback:", e);
    pdfOk.createPdf(docDefinition).download(`Laudo_${laudo.numeroChamado || "SemNumero"}.pdf`);
  }
};
