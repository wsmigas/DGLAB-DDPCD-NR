import React, { useState, useMemo } from 'react';
import {
  Utilizador,
  TIPOS_PEDIDO,
  TIPOS_TRABALHO,
  TIPOS_FONTE,
  hojePt,
} from '../utils/nrHelpers';
import { CheckCircle2, Send } from 'lucide-react';

interface RegistoViewProps {
  currentUser: Utilizador;
  operadores: Utilizador[];
  onSubmitRegisto: (payload: {
    data_hora_captura: string;
    nome_operador: string;
    pedido: string;
    identificador_documento: string;
    tipo_pedido: string;
    tipo_trabalho: string;
    tipo_fonte: string;
    total_imagens: number;
  }) => Promise<boolean>;
  isDark: boolean;
}

export const RegistoView: React.FC<RegistoViewProps> = ({
  currentUser,
  operadores,
  onSubmitRegisto,
  isDark,
}) => {
  const operadoresOrdenados = useMemo(() => {
    return [...operadores].sort((a, b) => {
      const nA = (a.nome_operador || a.username).toLowerCase();
      const nB = (b.nome_operador || b.username).toLowerCase();
      if (nA !== nB) return nA.localeCompare(nB);
      return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
    });
  }, [operadores]);

  const [selectedOperadorId, setSelectedOperadorId] = useState<string>(
    currentUser.id
  );
  const [pedido, setPedido] = useState('');
  const [dataHoraCaptura, setDataHoraCaptura] = useState(hojePt());
  const [identificadorDocumento, setIdentificadorDocumento] = useState('');
  const [tipoPedido, setTipoPedido] = useState('');
  const [tipoTrabalho, setTipoTrabalho] = useState('');
  const [tipoFonte, setTipoFonte] = useState('');
  const [totalImagens, setTotalImagens] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ultimoSucesso, setUltimoSucesso] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUltimoSucesso(null);

    let nomeOperador = currentUser.nome_operador || currentUser.username;
    if (currentUser.perfil === 'admin' && selectedOperadorId) {
      const opRow = operadores.find((o) => o.id === selectedOperadorId);
      if (opRow) {
        nomeOperador = opRow.nome_operador || opRow.username;
      }
    }

    try {
      const ok = await onSubmitRegisto({
        data_hora_captura: dataHoraCaptura,
        nome_operador: nomeOperador,
        pedido,
        identificador_documento: identificadorDocumento,
        tipo_pedido: tipoPedido,
        tipo_trabalho: tipoTrabalho,
        tipo_fonte: tipoFonte,
        total_imagens: parseInt(totalImagens, 10) || 0,
      });

      if (ok) {
        setUltimoSucesso(identificadorDocumento);
        setPedido('');
        setIdentificadorDocumento('');
        setTipoPedido('');
        setTipoTrabalho('');
        setTipoFonte('');
        setTotalImagens('');
        setDataHoraCaptura(hojePt());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
      : 'bg-white border-[#dee2e6] text-[#212529]'
  }`;

  return (
    <div className="max-w-[700px] mx-auto px-4 mb-10">
      <h4 className="text-xl font-bold mb-4">Registo de Produção</h4>

      {ultimoSucesso && (
        <div
          className={`mb-4 p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
            isDark
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>
              Documento <strong className="font-mono">{ultimoSucesso}</strong> submetido para o Núcleo de Reprodução.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUltimoSucesso(null)}
            className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      <div
        className={`rounded-lg shadow-xs border p-5 ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40] text-[#e9ecef]'
            : 'bg-white border-[#dee2e6] text-[#212529]'
        }`}
      >
        <form onSubmit={handleFormSubmit}>
          {currentUser.perfil === 'admin' ? (
            <div
              className={`mb-4 p-3.5 rounded-md border ${
                isDark
                  ? 'bg-[#15171a] border-[#343a40]'
                  : 'bg-[#f8f9fa] border-[#dee2e6]'
              }`}
            >
              <label className="block text-sm font-bold text-blue-600 dark:text-blue-400 mb-1.5">
                Registar em nome do operador:
              </label>
              <select
                name="operador_id"
                value={selectedOperadorId}
                onChange={(e) => setSelectedOperadorId(e.target.value)}
                required
                className={inputClass}
              >
                {operadoresOrdenados.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nome_operador || op.username} ({op.username})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5">
                Nome do Operador
              </label>
              <input
                type="text"
                value={currentUser.nome_operador || currentUser.username}
                disabled
                className={`${inputClass} opacity-70 cursor-not-allowed`}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">
              Número do Pedido
            </label>
            <input
              type="text"
              name="pedido"
              value={pedido}
              onChange={(e) => setPedido(e.target.value)}
              placeholder="Ex: 2026PR12265"
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">
                Data de Captura
              </label>
              <button
                type="button"
                onClick={() => setDataHoraCaptura(hojePt())}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Preencher Hoje ({hojePt()})
              </button>
            </div>
            <input
              type="text"
              name="data_hora_captura"
              value={dataHoraCaptura}
              onChange={(e) => setDataHoraCaptura(e.target.value)}
              placeholder="DD-MM-YYYY"
              pattern="\d{2}-\d{2}-\d{4}"
              title="Formato exigido: DD-MM-YYYY"
              required
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">
              Identificador do Documento
            </label>
            <input
              type="text"
              name="identificador_documento"
              value={identificadorDocumento}
              onChange={(e) => setIdentificadorDocumento(e.target.value)}
              placeholder="Ex: PT-TT-AOS-123 / ca-PT-TT-AOS"
              required
              className={`${inputClass} font-mono`}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">
              Tipo de Pedido
            </label>
            <select
              name="tipo_pedido"
              value={tipoPedido}
              onChange={(e) => setTipoPedido(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Selecione o tipo de pedido...</option>
              {TIPOS_PEDIDO.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">
              Tipo de Trabalho
            </label>
            <select
              name="tipo_trabalho"
              value={tipoTrabalho}
              onChange={(e) => setTipoTrabalho(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Selecione o tipo de trabalho...</option>
              {TIPOS_TRABALHO.map((tt) => (
                <option key={tt} value={tt}>
                  {tt}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">
              Tipo de Fonte
            </label>
            <select
              name="tipo_fonte"
              value={tipoFonte}
              onChange={(e) => setTipoFonte(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Selecione o tipo de fonte...</option>
              {TIPOS_FONTE.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-1.5">
              Total de Imagens
            </label>
            <input
              type="number"
              name="total_imagens"
              value={totalImagens}
              onChange={(e) => setTotalImagens(e.target.value)}
              min={1}
              placeholder="Ex: 50"
              required
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-base transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'A submeter registo...' : 'Submeter Registo'}
          </button>
        </form>
      </div>
    </div>
  );
};
