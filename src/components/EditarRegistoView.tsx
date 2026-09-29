import React, { useState } from 'react';
import {
  RegistoProducao,
  TIPOS_PEDIDO,
  TIPOS_TRABALHO,
  TIPOS_FONTE,
  formatarDataPt,
} from '../utils/nrHelpers';
import { Save, ArrowLeft } from 'lucide-react';

interface EditarRegistoViewProps {
  registo: RegistoProducao;
  onSave: (payload: {
    data_hora_captura: string;
    pedido: string;
    identificador_documento: string;
    tipo_pedido: string;
    tipo_trabalho: string;
    tipo_fonte: string;
    total_imagens: number;
  }) => Promise<boolean>;
  onCancel: () => void;
  isDark: boolean;
}

export const EditarRegistoView: React.FC<EditarRegistoViewProps> = ({
  registo,
  onSave,
  onCancel,
  isDark,
}) => {
  const [dataHoraCaptura, setDataHoraCaptura] = useState(
    formatarDataPt(registo.data_hora_captura)
  );
  const [pedido, setPedido] = useState(
    registo.pedido === '-' ? '' : registo.pedido || ''
  );
  const [identificadorDocumento, setIdentificadorDocumento] = useState(
    registo.identificador_documento || ''
  );
  const [tipoPedido, setTipoPedido] = useState(registo.tipo_pedido || '');
  const [tipoTrabalho, setTipoTrabalho] = useState(registo.tipo_trabalho || '');
  const [tipoFonte, setTipoFonte] = useState(registo.tipo_fonte || '');
  const [totalImagens, setTotalImagens] = useState(
    String(registo.total_imagens ?? 0)
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        data_hora_captura: dataHoraCaptura,
        pedido,
        identificador_documento: identificadorDocumento,
        tipo_pedido: tipoPedido,
        tipo_trabalho: tipoTrabalho,
        tipo_fonte: tipoFonte,
        total_imagens: parseInt(totalImagens, 10) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
      : 'bg-white border-[#dee2e6] text-[#212529]'
  }`;

  return (
    <div className="max-w-[600px] mx-auto px-4 mb-10">
      <div
        className={`rounded-lg shadow-md border overflow-hidden ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40] text-[#e9ecef]'
            : 'bg-white border-[#dee2e6] text-[#212529]'
        }`}
      >
        <div className="bg-blue-600 text-white px-5 py-3.5 flex items-center justify-between">
          <h4 className="font-bold text-base mb-0">
            Editar Registo de Produção
          </h4>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">
            ID #{registo.seq_id}
          </span>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <label className="block text-sm font-semibold mb-1">
                Data de Captura
              </label>
              <input
                type="text"
                name="data_hora_captura"
                value={dataHoraCaptura}
                onChange={(e) => setDataHoraCaptura(e.target.value)}
                placeholder="DD-MM-YYYY"
                required
                className={inputClass}
              />
            </div>

            <div className="mb-3.5">
              <label className="block text-sm font-medium mb-1">Pedido</label>
              <input
                type="text"
                name="pedido"
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mb-3.5">
              <label className="block text-sm font-medium mb-1">
                Identificador do Documento
              </label>
              <input
                type="text"
                name="identificador_documento"
                value={identificadorDocumento}
                onChange={(e) => setIdentificadorDocumento(e.target.value)}
                required
                className={`${inputClass} font-mono`}
              />
            </div>

            <div className="mb-3.5">
              <label className="block text-sm font-medium mb-1">
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
                {!TIPOS_PEDIDO.includes(tipoPedido as any) && tipoPedido && (
                  <option value={tipoPedido}>{tipoPedido}</option>
                )}
              </select>
            </div>

            <div className="mb-3.5">
              <label className="block text-sm font-medium mb-1">
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

            <div className="mb-3.5">
              <label className="block text-sm font-medium mb-1">
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
                {!TIPOS_FONTE.includes(tipoFonte as any) && tipoFonte && (
                  <option value={tipoFonte}>{tipoFonte}</option>
                )}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1">
                Total de Imagens
              </label>
              <input
                type="number"
                name="total_imagens"
                value={totalImagens}
                onChange={(e) => setTotalImagens(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-slate-500 hover:bg-slate-600 text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'A salvar...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
