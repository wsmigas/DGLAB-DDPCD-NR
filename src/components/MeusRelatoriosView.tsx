import React, { useState, useMemo, useRef } from 'react';
import {
  Utilizador,
  RegistoProducao,
  obterRegistosFiltrados,
  calcularEstatisticas,
  formatarDataPt,
} from '../utils/nrHelpers';
import { descarregarTemplateExcel } from '../utils/excelService';
import { Download, Upload, Search, RotateCcw } from 'lucide-react';

interface MeusRelatoriosViewProps {
  currentUser: Utilizador;
  todosRegistos: RegistoProducao[];
  onImportExcel: (file: File) => Promise<void>;
  isDark: boolean;
}

export const MeusRelatoriosView: React.FC<MeusRelatoriosViewProps> = ({
  currentUser,
  todosRegistos,
  onImportExcel,
  isDark,
}) => {
  const operador = currentUser.nome_operador || currentUser.username;

  const [inputDataInicio, setInputDataInicio] = useState('');
  const [inputDataFim, setInputDataFim] = useState('');
  const [inputPedido, setInputPedido] = useState('');
  const [inputDocumento, setInputDocumento] = useState('');

  const [appliedFilters, setAppliedFilters] = useState<{
    dataInicio?: string;
    dataFim?: string;
    pedido?: string;
    documento?: string;
  }>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { registos, dataInicio, dataFim } = useMemo(() => {
    return obterRegistosFiltrados(todosRegistos, appliedFilters, operador);
  }, [todosRegistos, appliedFilters, operador]);

  const { totalImagens, mediaImagensMes, totalRegistos } = useMemo(() => {
    return calcularEstatisticas(registos);
  }, [registos]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({
      dataInicio: inputDataInicio,
      dataFim: inputDataFim,
      pedido: inputPedido,
      documento: inputDocumento,
    });
  };

  const handleClearFilters = () => {
    setInputDataInicio('');
    setInputDataFim('');
    setInputPedido('');
    setInputDocumento('');
    setAppliedFilters({});
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImporting(true);
    try {
      await onImportExcel(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setImporting(false);
    }
  };

  const inputClass = `w-full px-3 py-1.5 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
      : 'bg-white border-[#dee2e6] text-[#212529]'
  }`;

  return (
    <div className="max-w-[1100px] mx-auto px-4 mb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h4 className="text-xl font-bold">Os Meus Relatórios de Produção</h4>
        <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 font-medium">
          Operador: <strong>{operador}</strong>
        </span>
      </div>

      {/* Quadros de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-5">
        <div
          className={`rounded-lg shadow-xs border border-blue-500/70 p-4 ${
            isDark ? 'bg-[#1e2126]' : 'bg-white'
          }`}
        >
          <h6
            className={`text-xs font-medium mb-1 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Total de Imagens
          </h6>
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalImagens.toLocaleString('pt-PT')}
          </h3>
        </div>

        <div
          className={`rounded-lg shadow-xs border border-emerald-500/70 p-4 ${
            isDark ? 'bg-[#1e2126]' : 'bg-white'
          }`}
        >
          <h6
            className={`text-xs font-medium mb-1 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Total de Registos
          </h6>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalRegistos.toLocaleString('pt-PT')}
          </h3>
        </div>

        <div
          className={`rounded-lg shadow-xs border border-cyan-500/70 p-4 ${
            isDark ? 'bg-[#1e2126]' : 'bg-white'
          }`}
        >
          <h6
            className={`text-xs font-medium mb-1 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Média Imagens / Mês
          </h6>
          <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {mediaImagensMes.toLocaleString('pt-PT')}
          </h3>
        </div>
      </div>

      {/* Filtros de Pesquisa e Importação Excel */}
      <div
        className={`rounded-lg shadow-xs border p-4 mb-5 ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40]'
            : 'bg-white border-[#dee2e6]'
        }`}
      >
        <form
          onSubmit={handleFilterSubmit}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4"
        >
          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1">Data Início</label>
            <input
              type="date"
              name="data_inicio"
              value={inputDataInicio || dataInicio}
              onChange={(e) => setInputDataInicio(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium mb-1">Data Fim</label>
            <input
              type="date"
              name="data_fim"
              value={inputDataFim || dataFim}
              onChange={(e) => setInputDataFim(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Pedido</label>
            <input
              type="text"
              name="pedido"
              value={inputPedido}
              onChange={(e) => setInputPedido(e.target.value)}
              placeholder="Nº Pedido"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Documento</label>
            <input
              type="text"
              name="documento"
              value={inputDocumento}
              onChange={(e) => setInputDocumento(e.target.value)}
              placeholder="Identificador"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2 flex items-end gap-1.5">
            <button
              type="submit"
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full py-1.5 px-3 bg-slate-500 hover:bg-slate-600 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </form>

        <hr
          className={`my-3 ${
            isDark ? 'border-[#343a40]' : 'border-[#dee2e6]'
          }`}
        />

        {/* Secção de Importação de Excel e Template */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span
              className={`text-xs block mb-1 ${
                isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
              }`}
            >
              Importar lote de registos através de folha Excel (.xlsx):
            </span>
            <button
              type="button"
              onClick={descarregarTemplateExcel}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              📥 Descarregar Template de Exemplo
            </button>
          </div>

          <form
            onSubmit={handleImportSubmit}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              name="ficheiro_excel"
              accept=".xlsx, .xls"
              required
              onChange={(e) =>
                setSelectedFile(e.target.files ? e.target.files[0] : null)
              }
              className={`text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/50 dark:file:text-blue-300 border rounded-md px-2 py-1 max-w-[260px] ${
                isDark
                  ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
                  : 'bg-white border-[#dee2e6] text-[#212529]'
              }`}
            />
            <button
              type="submit"
              disabled={importing || !selectedFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? 'A importar...' : 'Importar Excel'}
            </button>
          </form>
        </div>
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
              <tr className="bg-[#212529] text-white text-xs uppercase tracking-wider">
                <th className="py-3 px-3 font-semibold">Data Captura</th>
                <th className="py-3 px-3 font-semibold">Pedido</th>
                <th className="py-3 px-3 font-semibold">Documento</th>
                <th className="py-3 px-3 font-semibold">Tipo Pedido</th>
                <th className="py-3 px-3 font-semibold">Trabalho</th>
                <th className="py-3 px-3 font-semibold">Fonte</th>
                <th className="py-3 px-3 font-semibold text-right">Imagens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
              {registos.length > 0 ? (
                registos.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      idx % 2 === 1
                        ? isDark
                          ? 'bg-white/[0.02]'
                          : 'bg-slate-50/70'
                        : ''
                    } hover:bg-blue-50/40 dark:hover:bg-blue-950/20`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs font-medium">
                      {formatarDataPt(r.data_hora_captura)}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono">
                      {r.pedido || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-medium">
                      {r.identificador_documento}
                    </td>
                    <td className="py-2.5 px-3 text-xs">{r.tipo_pedido}</td>
                    <td className="py-2.5 px-3 text-xs">{r.tipo_trabalho}</td>
                    <td className="py-2.5 px-3 text-xs">{r.tipo_fonte}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold text-right">
                      {r.total_imagens}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className={`text-center py-8 text-sm ${
                      isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
                    }`}
                  >
                    Nenhum registo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
