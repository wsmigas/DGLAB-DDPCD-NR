export interface Utilizador {
  id: string; // Firestore document ID
  seq_id: number; // Numeric ID (1, 2, 3...) matching SQLite id
  username: string;
  password_hash: string;
  nome_operador: string;
  perfil: 'admin' | 'operador';
  created_at?: string;
}

export interface RegistoProducao {
  id: string; // Firestore document ID
  seq_id: number; // Numeric ID (1, 2, 3...) matching SQLite id
  data_hora_captura: string; // Stored as YYYY-MM-DD in DB
  nome_operador: string;
  pedido: string;
  identificador_documento: string;
  tipo_pedido: string;
  tipo_trabalho: string;
  tipo_fonte: string;
  total_imagens: number;
  created_at?: string;
}

export const TIPOS_PEDIDO = [
  'Pedido de reprodução',
  'Pedido interno',
  'Certidão',
] as const;

export const TIPOS_TRABALHO = [
  'Íntegra',
  'Pontual',
] as const;

export const TIPOS_FONTE = [
  'Papel',
  'Microfilme',
  'Fotografia',
  'Pergaminho',
  'Misto1 (Papel, Pergaminho)',
  'Misto2 (Papel, Fotografia)',
] as const;

export const MESES_PT = [
  '',
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function hojePt(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function hojeIso(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato PT (DD-MM-YYYY) igual ao formatar_data_pt em app.py
 */
export function formatarDataPt(dataStr?: string | null): string {
  if (!dataStr) return '-';
  const dataClean = String(dataStr).replace(' 00:00:00', '').trim().split(' ')[0];
  if (!dataClean) return '-';
  if (dataClean.includes('-')) {
    const partes = dataClean.split('-');
    if (partes.length === 3) {
      if (partes[0].length === 4) {
        return `${partes[2].padStart(2, '0')}-${partes[1].padStart(2, '0')}-${partes[0]}`;
      }
      if (partes[2].length === 4) {
        return `${partes[0].padStart(2, '0')}-${partes[1].padStart(2, '0')}-${partes[2]}`;
      }
    }
  }
  return dataClean;
}

/**
 * Converte qualquer entrada de data (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD) para ISO YYYY-MM-DD
 */
export function normalizarDataIso(dataStr?: string | null): string {
  if (!dataStr) return '';
  const d = String(dataStr).replace(' 00:00:00', '').trim().split(' ')[0];
  for (const sep of ['-', '/']) {
    if (d.includes(sep)) {
      const partes = d.split(sep);
      if (partes.length === 3) {
        if (partes[0].length === 4) {
          return `${partes[0]}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
        } else if (partes[2].length === 4) {
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
      }
    }
  }
  return d;
}

/**
 * Calcula estatísticas (total_imagens, media_imagens_mes) exatamente como calcular_estatisticas em app.py
 */
export function calcularEstatisticas(registos: RegistoProducao[]): {
  totalImagens: number;
  mediaImagensMes: number;
  totalRegistos: number;
} {
  let totalImagens = 0;
  const mesesAnos = new Set<string>();

  for (const r of registos) {
    const imgs = Number(r.total_imagens) || 0;
    totalImagens += imgs;

    const dStr = r.data_hora_captura || '';
    if (dStr && dStr !== '-') {
      const partes = dStr.split('-');
      if (partes.length === 3) {
        if (partes[0].length === 4) {
          // YYYY-MM-DD
          mesesAnos.add(`${partes[1]}-${partes[0]}`);
        } else if (partes[2].length === 4) {
          // DD-MM-YYYY
          mesesAnos.add(`${partes[1]}-${partes[2]}`);
        }
      }
    }
  }

  const numMeses = mesesAnos.size > 0 ? mesesAnos.size : 1;
  const mediaImagensMes = Math.round(totalImagens / numMeses);

  return {
    totalImagens,
    mediaImagensMes,
    totalRegistos: registos.length,
  };
}

export interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  pedido?: string;
  documento?: string;
  operador?: string;
  ano?: number | null;
  mes?: number | null;
}

export interface InfoMes {
  nome: string;
  ano: number;
  mes: number;
  anterior: { ano: number; mes: number };
  seguinte: { ano: number; mes: number };
}

/**
 * Replica a lógica de obter_registos_filtrados de app.py
 */
export function obterRegistosFiltrados(
  todosRegistos: RegistoProducao[],
  args: FiltrosRelatorio,
  apenasOperador?: string | null
): {
  registos: RegistoProducao[];
  dataInicio: string;
  dataFim: string;
  pedido: string;
  documento: string;
  operador: string;
  infoMes: InfoMes;
} {
  let dataInicioRaw = (args.dataInicio || '').trim();
  let dataFimRaw = (args.dataFim || '').trim();
  const pedidoFiltro = (args.pedido || '').trim();
  const docFiltro = (args.documento || '').trim();
  const operadorFiltro = (args.operador || '').trim();

  const hoje = new Date();
  let refYear = hoje.getFullYear();
  let refMonth = hoje.getMonth() + 1; // 1..12

  if (args.ano && args.mes) {
    refYear = args.ano;
    refMonth = args.mes;
  } else if (dataInicioRaw) {
    const iso = normalizarDataIso(dataInicioRaw);
    const partes = iso.split('-');
    if (partes.length === 3 && partes[0].length === 4) {
      const y = parseInt(partes[0], 10);
      const m = parseInt(partes[1], 10);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        refYear = y;
        refMonth = m;
      }
    }
  }

  const temPesquisaTexto = Boolean(docFiltro || pedidoFiltro || operadorFiltro);
  if (!dataInicioRaw && !dataFimRaw && !temPesquisaTexto) {
    const lastDay = new Date(refYear, refMonth, 0).getDate();
    dataInicioRaw = `${refYear}-${String(refMonth).padStart(2, '0')}-01`;
    dataFimRaw = `${refYear}-${String(refMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }

  const mesAnterior =
    refMonth === 1
      ? { ano: refYear - 1, mes: 12 }
      : { ano: refYear, mes: refMonth - 1 };

  const mesSeguinte =
    refMonth === 12
      ? { ano: refYear + 1, mes: 1 }
      : { ano: refYear, mes: refMonth + 1 };

  const nomeMesExtenso = `${MESES_PT[refMonth]} de ${refYear}`;

  const dtInicioIso = normalizarDataIso(dataInicioRaw);
  const dtFimIso = normalizarDataIso(dataFimRaw);

  // Ignora o filtro de datas apenas se o utilizador pesquisou por Documento ou Pedido (igual ao app.py)
  const temPesquisaGlobal = Boolean(docFiltro || pedidoFiltro);

  const filtrados = todosRegistos.filter((r) => {
    const rIso = normalizarDataIso(r.data_hora_captura);

    if (apenasOperador) {
      if ((r.nome_operador || '').toLowerCase() !== apenasOperador.toLowerCase()) {
        return false;
      }
    }

    if (dtInicioIso && !temPesquisaGlobal) {
      if (rIso < dtInicioIso) return false;
    }

    if (dtFimIso && !temPesquisaGlobal) {
      if (rIso > dtFimIso) return false;
    }

    if (pedidoFiltro) {
      if (!(r.pedido || '').toLowerCase().includes(pedidoFiltro.toLowerCase())) {
        return false;
      }
    }

    if (docFiltro) {
      if (
        !(r.identificador_documento || '')
          .toLowerCase()
          .includes(docFiltro.toLowerCase())
      ) {
        return false;
      }
    }

    if (operadorFiltro) {
      if (
        !(r.nome_operador || '')
          .toLowerCase()
          .includes(operadorFiltro.toLowerCase())
      ) {
        return false;
      }
    }

    return true;
  });

  // ORDER BY data_hora_captura DESC, seq_id DESC
  filtrados.sort((a, b) => {
    const isoA = normalizarDataIso(a.data_hora_captura);
    const isoB = normalizarDataIso(b.data_hora_captura);
    if (isoA !== isoB) {
      return isoB.localeCompare(isoA);
    }
    return (b.seq_id || 0) - (a.seq_id || 0);
  });

  return {
    registos: filtrados,
    dataInicio: dataInicioRaw,
    dataFim: dataFimRaw,
    pedido: pedidoFiltro,
    documento: docFiltro,
    operador: operadorFiltro,
    infoMes: {
      nome: nomeMesExtenso,
      ano: refYear,
      mes: refMonth,
      anterior: mesAnterior,
      seguinte: mesSeguinte,
    },
  };
}

/**
 * Hash de password usando Web Crypto SHA-256 (formato compatível na BD: pbkdf2:sha256:...)
 */
export async function generatePasswordHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`d3pcd_nr_salt_${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:sha256:600000$dglab$${hashHex}`;
}

export async function checkPasswordHash(
  pwhash: string,
  password: string
): Promise<boolean> {
  if (!pwhash || !password) return false;
  const computed = await generatePasswordHash(password);
  return pwhash === computed || pwhash === password;
}
