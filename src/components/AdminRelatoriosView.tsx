import React, { useState, useMemo } from 'react';
import {
  RegistoProducao,
  obterRegistosFiltrados,
  calcularEstatisticas,
  formatarDataPt,
} from '../utils/nrHelpers';
import { exportarRegistosExcel } from '../utils/excelService';
import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface AdminRelatoriosViewProps {
  todosRegistos: RegistoProducao[];
  onEditRegisto: (registo: RegistoProducao) => void;
  onDeleteRegisto: (id: string) => Promise<void>;
  isDark: boolean;
}

export const AdminRelatoriosView: React.FC<AdminRelatoriosViewProps> = ({
  todosRegistos,
  onEditRegisto,
  onDeleteRegisto,
  isDark,
}) => {
  const [inputDataInicio, setInputDataInicio] = useState('');
  const [inputDataFim, setInputDataFim] = useState('');
  const [inputOperador, setInputOperador] = useState('');
  const [inputPedido, setInputPedido] = useState('');
  const [inputDocumento, setInputDocumento] = useState('');

  const [appliedFilters, setAppliedFilters] = useState<{
    dataInicio?: string;
    dataFim?: string;
    operador?: string;
    pedido?: string;
    documento?: string;
    ano?: number | null;
    mes?: number | null;
  }>({});

  const [confirmDeleteRegisto, setConfirmDeleteRegisto] =
    useState<RegistoProducao | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { registos, dataInicio, dataFim, infoMes } = useMemo(() => {
    return obterRegistosFiltrados(todosRegistos, appliedFilters, null);
  }, [todosRegistos, appliedFilters]);

  const { totalImagens, mediaImagensMes, totalRegistos } = useMemo(() => {
    return calcularEstatisticas(registos);
  }, [registos]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      dataInicio: inputDataInicio,
      dataFim: inputDataFim,
      operador: inputOperador,
      pedido: inputPedido,
      documento: inputDocumento,
      ano: null,
      mes: null,
    });
  };

  const handleClearFilters = () => {
    setInputDataInicio('');
    setInputDataFim('');
    setInputOperador('');
    setInputPedido('');
    setInputDocumento('');
    setAppliedFilters({});
  };

  const handleMonthChange = (ano: number, mes: number) => {
    setInputDataInicio('');
    setInputDataFim('');
    setAppliedFilters((prev) => ({
      ...prev,
      dataInicio: '',
      dataFim: '',
      ano,
      mes,
    }));
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteRegisto) return;
    setDeleting(true);
    try {
      await onDeleteRegisto(confirmDeleteRegisto.id);
      setConfirmDeleteRegisto(null);
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = `w-full px-2.5 py-1.5 rounded-md border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
      : 'bg-white border-[#dee2e6] text-[#212529]'
  }`;

  return (
    <div className="max-w-[1100px] mx-auto px-4 mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h4 className="text-xl font-bold">Relatórios Gerais de Produção</h4>
        <button
          type="button"
          onClick={() => exportarRegistosExcel(registos)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Exportar para Excel
        </button>
      </div>

      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div
          className={`rounded-lg shadow-xs border p-4 text-center ${
            isDark
              ? 'bg-[#1e2126] border-[#343a40]'
              : 'bg-white border-[#dee2e6]'
          }`}
        >
          <span
            className={`text-xs block mb-1 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Total de Imagens
          </span>
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalImagens.toLocaleString('pt-PT')}
          </h3>
        </div>

        <div
          className={`rounded-lg shadow-xs border p-4 text-center ${
            isDark
              ? 'bg-[#1e2126] border-[#343a40]'
              : 'bg-white border-[#dee2e6]'
          }`}
        >
          <span
            className={`text-xs block mb-1 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Total de Registos
          </span>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalRegistos.toLocaleString('pt-PT')}
          </h3>
        </div>

        <div
          className={`rounded-lg shadow-xs border p-4 text-center ${
            isDark
              ? 'bg-[#1e2126] border-[#343a40]'
              : 'bg-white border-[#dee2e6]'
          }`}
        >
          <span
            className={`text-xs block mb-1 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Média Mensal (Imagens)
          </span>
          <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {mediaImagensMes.toLocaleString('pt-PT')}
          </h3>
        </div>
      </div>

      {/* Navegação Mensal e Filtros */}
      <div
        className={`rounded-lg shadow-xs border p-4 mb-5 ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40]'
            : 'bg-white border-[#dee2e6]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={() =>
              handleMonthChange(infoMes.anterior.ano, infoMes.anterior.mes)
            }
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Mês Anterior
          </button>

          <h5 className="text-base font-bold text-center">{infoMes.nome}</h5>

          <button
            type="button"
            onClick={() =>
              handleMonthChange(infoMes.seguinte.ano, infoMes.seguinte.mes)
            }
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Mês Seguinte
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Data Início</label>
            <input
              type="date"
              name="data_inicio"
              value={inputDataInicio || dataInicio}
              onChange={(e) => setInputDataInicio(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Data Fim</label>
            <input
              type="date"
              name="data_fim"
              value={inputDataFim || dataFim}
              onChange={(e) => setInputDataFim(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Operador</label>
            <input
              type="text"
              name="operador"
              value={inputOperador}
              onChange={(e) => setInputOperador(e.target.value)}
              placeholder="Nome..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Pedido</label>
            <input
              type="text"
              name="pedido"
              value={inputPedido}
              onChange={(e) => setInputPedido(e.target.value)}
              placeholder="Ex: 2026PR..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Documento</label>
            <input
              type="text"
              name="documento"
              value={inputDocumento}
              onChange={(e) => setInputDocumento(e.target.value)}
              placeholder="Ex: PT-TT..."
              className={inputClass}
            />
          </div>

          <div className="flex gap-1.5">
            <button
              type="submit"
              className="w-full py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className={`py-1.5 px-2.5 rounded-md text-xs font-medium border transition-colors cursor-pointer inline-flex items-center justify-center gap-1 ${
                isDark
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Registos */}
      <div
        className={`rounded-lg shadow-xs border overflow-hidden ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40]'
            : 'bg-white border-[#dee2e6]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`text-xs uppercase tracking-wider border-b ${
                  isDark
                    ? 'bg-[#2b2f34] border-[#343a40] text-slate-200'
                    : 'bg-[#f8f9fa] border-[#dee2e6] text-slate-700'
                }`}
              >
                <th className="py-3 px-3 font-semibold">Data</th>
                <th className="py-3 px-3 font-semibold">Operador</th>
                <th className="py-3 px-3 font-semibold">Pedido</th>
                <th className="py-3 px-3 font-semibold">Documento</th>
                <th className="py-3 px-3 font-semibold">Tipo Pedido</th>
                <th className="py-3 px-3 font-semibold">Trabalho</th>
                <th className="py-3 px-3 font-semibold">Fonte</th>
                <th className="py-3 px-3 font-semibold text-right">Imagens</th>
                <th className="py-3 px-3 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {registos.length > 0 ? (
                registos.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs font-medium">
                      {formatarDataPt(r.data_hora_captura)}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-medium">
                      {r.nome_operador || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono">
                      {r.pedido || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-medium">
                      {r.identificador_documento}
                    </td>
                    <td className="py-2.5 px-3 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-600 text-white">
                        {r.tipo_pedido}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs">{r.tipo_trabalho}</td>
                    <td className="py-2.5 px-3 text-xs">{r.tipo_fonte}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold text-right">
                      {r.total_imagens}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditRegisto(r)}
                        title="Editar"
                        className="inline-flex items-center justify-center px-2 py-1 rounded border border-amber-500/70 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors mr-1.5 cursor-pointer text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRegisto(r)}
                        title="Eliminar"
                        className="inline-flex items-center justify-center px-2 py-1 rounded border border-red-500/70 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className={`text-center py-8 text-sm ${
                      isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
                    }`}
                  >
                    Nenhum registo encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Eliminação */}
      {confirmDeleteRegisto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-md rounded-lg shadow-xl border p-5 ${
              isDark
                ? 'bg-[#1e2126] border-[#343a40] text-[#e9ecef]'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-base">Eliminar Registo</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tem a certeza que deseja eliminar este registo?
                </p>
              </div>
            </div>

            <div
              className={`p-3 rounded-md text-xs mb-4 border font-mono ${
                isDark
                  ? 'bg-[#15171a] border-[#343a40]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <strong>Documento:</strong>{' '}
                {confirmDeleteRegisto.identificador_documento}
              </div>
              <div>
                <strong>Operador:</strong> {confirmDeleteRegisto.nome_operador}
              </div>
              <div>
                <strong>Data:</strong>{' '}
                {formatarDataPt(confirmDeleteRegisto.data_hora_captura)} (
                {confirmDeleteRegisto.total_imagens} imagens)
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteRegisto(null)}
                className="px-4 py-2 rounded-md text-xs font-medium bg-slate-500 hover:bg-slate-600 text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-md text-xs font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'A eliminar...' : 'Eliminar Registo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
