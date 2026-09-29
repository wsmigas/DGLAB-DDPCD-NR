import React, { useState, useRef } from 'react';
import { Utilizador, RegistoProducao } from '../utils/nrHelpers';
import { getAuthToken } from '../services/dbService';
import { descarregarManualInstalacaoPDF } from '../utils/pdfManualService';
import { Database, Table, Download, Upload, Code2, FileText } from 'lucide-react';

interface EsquemaBdViewProps {
  utilizadores: Utilizador[];
  registos: RegistoProducao[];
  onRestoreDatabase: (file: File) => Promise<void>;
  isDark: boolean;
}

export const EsquemaBdView: React.FC<EsquemaBdViewProps> = ({
  utilizadores,
  registos,
  onRestoreDatabase,
  isDark,
}) => {
  const [selectedDbFile, setSelectedDbFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDbFile) return;
    setRestoring(true);
    try {
      await onRestoreDatabase(selectedDbFile);
      setSelectedDbFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setRestoring(false);
    }
  };

  const downloadUrl = `/api/download_db?token=${encodeURIComponent(
    getAuthToken()
  )}`;

  const sqlSchema = `-- Ficheiro SQLite local: ./base_dados_nr.db

CREATE TABLE IF NOT EXISTS utilizadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nome_operador TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'operador'
);

CREATE TABLE IF NOT EXISTS registos_producao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_hora_captura TEXT NOT NULL,
    nome_operador TEXT NOT NULL,
    pedido TEXT,
    identificador_documento TEXT NOT NULL UNIQUE,
    tipo_pedido TEXT NOT NULL,
    tipo_trabalho TEXT NOT NULL,
    tipo_fonte TEXT NOT NULL,
    total_imagens INTEGER NOT NULL DEFAULT 0
);`;

  return (
    <div className="max-w-[1100px] mx-auto px-4 mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h4 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Gestão da Base de Dados SQLite (base_dados_nr.db)
          </h4>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Cópia de segurança, restauro de ficheiro .db existente e estado das tabelas em produção.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={descarregarManualInstalacaoPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Descarregar Documento DGLAB ISO 27001 / NIS2 (PDF)
          </button>
          <a
            href={downloadUrl}
            download="base_dados_nr.db"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            Descarregar Cópia de Segurança (base_dados_nr.db)
          </a>
        </div>
      </div>

      {/* Secção de Restauro / Importação de base_dados_nr.db */}
      <div
        className={`rounded-lg border p-4 mb-5 shadow-xs ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40]'
            : 'bg-white border-[#dee2e6]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h5 className="font-bold text-sm mb-1">
              Restaurar / Importar Ficheiro SQLite (base_dados_nr.db)
            </h5>
            <p
              className={`text-xs ${
                isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
              }`}
            >
              Permite carregar uma base de dados SQLite existente (compatível com os hashes Werkzeug/Python originais).
            </p>
          </div>
          <form
            onSubmit={handleRestoreSubmit}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              required
              onChange={(e) =>
                setSelectedDbFile(e.target.files ? e.target.files[0] : null)
              }
              className={`text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/50 dark:file:text-blue-300 border rounded-md px-2 py-1 max-w-[260px] ${
                isDark
                  ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
                  : 'bg-white border-[#dee2e6] text-[#212529]'
              }`}
            />
            <button
              type="submit"
              disabled={restoring || !selectedDbFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {restoring ? 'A restaurar...' : 'Carregar Base de Dados'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Tabela utilizadores */}
        <div
          className={`rounded-lg border p-4 shadow-xs ${
            isDark
              ? 'bg-[#1e2126] border-[#343a40]'
              : 'bg-white border-[#dee2e6]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-bold text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Table className="w-4 h-4" />
              Tabela: <span className="font-mono">utilizadores</span>
            </h5>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {utilizadores.length} registos
            </span>
          </div>
          <ul className="space-y-1.5 text-xs font-mono">
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>id</span>
              <span className="text-slate-500">
                INTEGER PRIMARY KEY AUTOINCREMENT
              </span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>username</span>
              <span className="text-amber-600 dark:text-amber-400">
                TEXT UNIQUE NOT NULL
              </span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>password_hash</span>
              <span className="text-slate-500">TEXT NOT NULL (PBKDF2/Scrypt)</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>nome_operador</span>
              <span className="text-slate-500">TEXT NOT NULL</span>
            </li>
            <li className="flex justify-between py-1">
              <span>perfil</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                &apos;admin&apos; | &apos;operador&apos;
              </span>
            </li>
          </ul>
        </div>

        {/* Tabela registos_producao */}
        <div
          className={`rounded-lg border p-4 shadow-xs ${
            isDark
              ? 'bg-[#1e2126] border-[#343a40]'
              : 'bg-white border-[#dee2e6]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-bold text-sm flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Table className="w-4 h-4" />
              Tabela: <span className="font-mono">registos_producao</span>
            </h5>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {registos.length} registos
            </span>
          </div>
          <ul className="space-y-1.5 text-xs font-mono">
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>id</span>
              <span className="text-slate-500">
                INTEGER PRIMARY KEY AUTOINCREMENT
              </span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>data_hora_captura</span>
              <span className="text-slate-500">TEXT (ISO YYYY-MM-DD)</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>nome_operador</span>
              <span className="text-slate-500">TEXT NOT NULL</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>pedido</span>
              <span className="text-slate-500">TEXT (Ex: 2026PR12265)</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>identificador_documento</span>
              <span className="text-amber-600 dark:text-amber-400">
                TEXT UNIQUE NOT NULL
              </span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>tipo_pedido / tipo_trabalho / tipo_fonte</span>
              <span className="text-slate-500">TEXT NOT NULL</span>
            </li>
            <li className="flex justify-between py-1">
              <span>total_imagens</span>
              <span className="text-blue-600 dark:text-blue-400">
                INTEGER NOT NULL
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* DDL SQL */}
      <div
        className={`rounded-lg border overflow-hidden shadow-xs ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40]'
            : 'bg-white border-[#dee2e6]'
        }`}
      >
        <div
          className={`px-4 py-2.5 border-b text-xs font-semibold flex items-center gap-2 ${
            isDark
              ? 'bg-[#2b2f34] border-[#343a40]'
              : 'bg-[#f8f9fa] border-[#dee2e6]'
          }`}
        >
          <Code2 className="w-4 h-4 text-blue-500" />
          Estrutura SQLite Executada no Ficheiro base_dados_nr.db
        </div>
        <pre className="p-4 text-xs font-mono overflow-x-auto bg-[#15171a] text-slate-200 leading-relaxed m-0">
          {sqlSchema}
        </pre>
      </div>
    </div>
  );
};
