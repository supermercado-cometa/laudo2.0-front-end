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

export const gerarLaudoPDF = (laudo: any, emitidoPor: string) => {
  const dtAtual = new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" }).substring(0, 16);

  const formatEstado = (estado?: string) => {
    if (!estado) return "";
    if (estado === "NAO_FUNCIONANDO") return "Não funcionando";
    if (estado === "FUNCIONANDO") return "Funcionando";
    return estado;
  };

  const formatNecessidade = (nec?: string) => {
    if (!nec) return "";
    if (nec === "ENVIAR_CONSERTO") return "Enviado p/ conserto";
    if (nec === "SUBSTITUIDO") return "Ser substituído";
    if (nec === "DESCARTADO") return "Ser descartado";
    return nec;
  };

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    background: function () {
      return {
        text: 'REIMPRESSÃO',
        color: '#ffcccc',
        opacity: 0.3,
        bold: true,
        italics: false,
        fontSize: 100,
        absolutePosition: { x: 50, y: 300 },
        angle: -45
      };
    },
    content: [
      {
        text: 'LAUDO TÉCNICO',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      // Box de Reimpressão
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: `${laudo.setor} - ${laudo.loja}`, color: '#c00000', bold: true, alignment: 'center', margin: [0, 5, 0, 5], fontSize: 12 },
                  { text: `Emitido por: ${emitidoPor} em ${dtAtual}`, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] }
                ],
                margin: [0, 5, 0, 0],
                borderColor: ['#dddddd', '#dddddd', '#dddddd', '#dddddd']
              }
            ]
          ]
        },
        margin: [0, 0, 0, 20]
      },
      // Tabela de Informações
      {
        table: {
          widths: ['*'],
          body: [
            [{ text: `Número do Chamado: ${laudo.numeroChamado || ''}`, style: 'tableCell', bold: true, fillColor: '#f2f2f2' }],
            [{ text: `Técnico: ${laudo.tecnico || ''}`, style: 'tableCell' }],
            [{ text: `Data: ${laudo.data || ''}`, style: 'tableCell' }],
            [{ text: `Loja: ${laudo.loja || ''}`, style: 'tableCell' }],
            [{ text: `Setor: ${laudo.setor || ''}`, style: 'tableCell' }],
            [{ text: `Equipamento: ${laudo.equipamento || ''}${laudo.modelo && laudo.modelo !== 'Sem Modelo' ? ' - ' + laudo.modelo : ''}`, style: 'tableCell' }],
            [{ text: `Tombo: ${laudo.tombo || ''}`, style: 'tableCell' }],
            [{ text: `Estado do Equipamento: ${formatEstado(laudo.estadoEquipamento)}`, style: 'tableCell' }],
            [{ text: `Necessidade: ${formatNecessidade(laudo.necessidade)}`, style: 'tableCell' }]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 20]
      },
      // Testes Realizados
      { text: 'TESTES REALIZADOS', style: 'sectionTitle', margin: [0, 10, 0, 5] },
      { text: laudo.testesRealizados || 'Não preenchido', margin: [0, 0, 0, 15], fontSize: 10 },

      // Diagnóstico
      { text: 'DIAGNÓSTICO', style: 'sectionTitle', margin: [0, 10, 0, 5] },
      { text: laudo.diagnostico || 'Não preenchido', margin: [0, 0, 0, 25], fontSize: 10 },

      // Assinatura do Técnico
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: 'ASSINATURA DO TÉCNICO', style: 'sectionTitle', margin: [0, 0, 0, 10], border: [false, false, false, false] },
                  laudo.signature ? { image: laudo.signature, width: 200, alignment: 'center', margin: [0, 10, 0, 10] } : { text: 'Nenhuma assinatura registrada.', alignment: 'center', margin: [0, 20, 0, 20], color: 'gray' }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 10,
          paddingBottom: () => 10,
        }
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#1e3a5f'
      },
      tableCell: {
        fontSize: 10,
        color: '#333333'
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#000000'
      }
    }
  };

  pdfOk.createPdf(docDefinition).open();
};
