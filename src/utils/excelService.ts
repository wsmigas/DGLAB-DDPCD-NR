import * as XLSX from 'xlsx';
import { RegistoProducao, formatarDataPt, hojeIso, normalizarDataIso } from './nrHelpers';

export function descarregarTemplateExcel(): void {
  const colunas = [
    'Data Captura',
    'Pedido',
    'Documento',
    'Tipo de Pedido',
    'Tipo de Trabalho',
    'Tipo de Fonte',
    'Imagens',
  ];

  const ws = XLSX.utils.aoa_to_sheet([colunas]);
  // Ajustar largura das colunas para facilitar preenchimento
  ws['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Registo');
  XLSX.writeFile(wb, 'template_importacao_registos.xlsx');
}

export function exportarRegistosExcel(registos: RegistoProducao[]): void {
  const data = registos.map((r) => ({
    'Data Captura': formatarDataPt(r.data_hora_captura),
    Operador: r.nome_operador || '-',
    Pedido: r.pedido || '-',
    Documento: r.identificador_documento || '-',
    'Tipo de Pedido': r.tipo_pedido || '-',
    'Tipo de Trabalho': r.tipo_trabalho || '-',
    'Tipo de Fonte': r.tipo_fonte || '-',
    Imagens: r.total_imagens ?? 0,
  }));

  const ws =
    data.length > 0
      ? XLSX.utils.json_to_sheet(data)
      : XLSX.utils.aoa_to_sheet([
          [
            'Data Captura',
            'Operador',
            'Pedido',
            'Documento',
            'Tipo de Pedido',
            'Tipo de Trabalho',
            'Tipo de Fonte',
            'Imagens',
          ],
        ]);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 22 },
    { wch: 18 },
    { wch: 30 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registos');
  XLSX.writeFile(wb, 'registos_producao.xlsx');
}

export interface LinhaImportada {
  numLinha: number;
  data_hora_captura: string;
  nome_operador: string;
  pedido: string;
  identificador_documento: string;
  tipo_pedido: string;
  tipo_trabalho: string;
  tipo_fonte: string;
  total_imagens: number;
}

export async function lerFicheiroExcelImportacao(
  file: File,
  perfil: 'admin' | 'operador',
  operadorSessao: string
): Promise<LinhaImportada[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];

  const ws = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: '',
    raw: false,
  });

  const resultado: LinhaImportada[] = [];

  rows.forEach((row, index) => {
    const numLinha = index + 2;

    let doc = String(row['Documento'] ?? '').trim();
    if (!doc || doc.toLowerCase() === 'nan') {
      doc = `SEM-DOC-L${numLinha}`;
    }

    const rawData = String(row['Data Captura'] ?? '').trim();
    let dataCap = '';
    if (!rawData || rawData.toLowerCase() === 'nan') {
      dataCap = hojeIso();
    } else {
      dataCap = normalizarDataIso(rawData);
      if (!dataCap) dataCap = hojeIso();
    }

    let operador = operadorSessao;
    if (perfil === 'admin') {
      const opExcel = String(row['Operador'] ?? '').trim();
      if (opExcel && opExcel.toLowerCase() !== 'nan') {
        operador = opExcel;
      }
    }

    let pedido = String(row['Pedido'] ?? '').trim();
    if (!pedido || pedido.toLowerCase() === 'nan') pedido = '-';

    let tipoP = String(row['Tipo de Pedido'] ?? '').trim();
    if (!tipoP || tipoP.toLowerCase() === 'nan') tipoP = 'Outro';

    let tipoT = String(row['Tipo de Trabalho'] ?? '').trim();
    if (!tipoT || tipoT.toLowerCase() === 'nan') tipoT = 'Íntegra';

    let tipoF = String(row['Tipo de Fonte'] ?? '').trim();
    if (!tipoF || tipoF.toLowerCase() === 'nan') tipoF = 'Papel';

    const valImg = row['Imagens'];
    let totalImg = 0;
    if (valImg !== undefined && valImg !== null && String(valImg).trim() !== '') {
      const parsed = parseInt(String(valImg), 10);
      if (!isNaN(parsed) && parsed >= 0) {
        totalImg = parsed;
      }
    }

    resultado.push({
      numLinha,
      data_hora_captura: dataCap,
      nome_operador: operador,
      pedido,
      identificador_documento: doc,
      tipo_pedido: tipoP,
      tipo_trabalho: tipoT,
      tipo_fonte: tipoF,
      total_imagens: totalImg,
    });
  });

  return resultado;
}
