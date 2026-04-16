/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

const pdfOk = pdfMake as any;
const fonts = pdfFonts as any;
if (fonts && fonts.pdfMake) {
  pdfOk.vfs = fonts.pdfMake.vfs;
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
                  { text: `Emitido por: ${laudo.tecnico || laudo.createdByUsername || 'Sistema'} em ${dtAtual}`, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 5] }
                ],
                margin: [0, 5, 0, 0],
                borderColor: ['#dddddd', '#dddddd', '#dddddd', '#dddddd']
              }
            ]
          ]
        },
        margin: [0, 0, 0, 20]
      },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: `Nº do Chamado:\n${laudo.numeroChamado || ''}`, style: 'tableCell', fillColor: '#f1f5f9', bold: true, margin: [5, 5, 5, 5] },
              { text: `Data de Emissão:\n${laudo.data || ''}`, style: 'tableCell', fillColor: '#f1f5f9', bold: true, margin: [5, 5, 5, 5], alignment: 'right' }
            ],
            [
              { text: `Especialista Responsável:\n${laudo.tecnico || ''}`, style: 'tableCell', margin: [5, 5, 5, 5] },
              { text: `Loja / Setor:\n${laudo.loja || ''} - ${laudo.setor || ''}`, style: 'tableCell', margin: [5, 5, 5, 5], alignment: 'right' }
            ],
            [
              { text: `Equipamento Analisado:\n${laudo.equipamento || ''}`, style: 'tableCell', fillColor: '#f8fafc', margin: [5, 5, 5, 5] },
              { text: `Modelo Identificado:\n${laudo.modelo && laudo.modelo !== 'Sem Modelo' ? laudo.modelo : 'Não especificado'}`, style: 'tableCell', fillColor: '#f8fafc', margin: [5, 5, 5, 5], alignment: 'right' }
            ],
            [
              { text: `Número de Tombo / Patrimônio:\n${laudo.tombo || ''}`, style: 'tableCell', margin: [5, 5, 5, 5], colSpan: 2 },
              {}
            ],
            [
              { text: `Status Atual:\n${formatEstado(laudo.estadoEquipamento)}`, style: 'tableCell', bold: true, fillColor: '#eff6ff', color: '#1e3a8a', margin: [5, 5, 5, 5] },
              { text: `Recomendação Técnica:\n${formatNecessidade(laudo.necessidade)}`, style: 'tableCell', bold: true, fillColor: '#eff6ff', color: '#1e3a8a', margin: [5, 5, 5, 5], alignment: 'right' }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
        margin: [0, 0, 0, 25]
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
