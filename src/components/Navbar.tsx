import React, { useState, useRef, useEffect } from 'react';
import { Utilizador } from '../utils/nrHelpers';
import {
  FilePlus,
  FileSpreadsheet,
  BarChart3,
  Users,
  Database,
  KeyRound,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { AppLogo } from './AppLogo';

export type ActivePage =
  | 'registo'
  | 'meus_relatorios'
  | 'admin_relatorios'
  | 'admin_utilizadores'
  | 'editar_registo'
  | 'sucesso'
  | 'esquema_bd';

interface NavbarProps {
  currentUser: Utilizador;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onLogout: () => void;
  onChangePassword: (novaPass: string) => Promise<void>;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
  onChangePassword,
  isDark,
  onToggleTheme,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalPassOpen, setModalPassOpen] = useState(false);
  const [novaPassword, setNovaPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaPassword.trim() || novaPassword.trim().length < 4) return;
    setSubmitting(true);
    try {
      await onChangePassword(novaPassword);
      setNovaPassword('');
      setModalPassOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const nomeApresentacao = currentUser.nome_operador || currentUser.username;

  return (
    <>
      <nav
        className={`border-b transition-colors mb-6 ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40] text-[#e9ecef]'
            : 'bg-white border-[#dee2e6] text-[#212529]'
        } shadow-xs`}
      >
        <div className="max-w-[1140px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  currentUser.perfil === 'admin' ? 'admin_relatorios' : 'registo'
                )
              }
              className="text-left group cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <AppLogo size={34} className="drop-shadow-xs transition-transform group-hover:scale-105" />
                <span className="text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400 group-hover:opacity-90">
                  Intranet DDPCD
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Links & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('registo')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                activePage === 'registo'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : isDark
                  ? 'border-blue-500/60 text-blue-400 hover:bg-blue-500/15'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              Novo Registo
            </button>

            <button
              type="button"
              onClick={() => onNavigate('meus_relatorios')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                activePage === 'meus_relatorios'
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                  : isDark
                  ? 'border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/15'
                  : 'border-cyan-600 text-cyan-700 hover:bg-cyan-50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Os Meus Relatórios
            </button>

            {currentUser.perfil === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('admin_relatorios')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    activePage === 'admin_relatorios' ||
                    activePage === 'editar_registo'
                      ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900'
                      : isDark
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-400 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Relatórios Gerais
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('admin_utilizadores')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    activePage === 'admin_utilizadores'
                      ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900'
                      : isDark
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-400 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Utilizadores
                </button>

                {currentUser.username.toLowerCase() === 'admin' && (
                  <button
                    type="button"
                    onClick={() => onNavigate('esquema_bd')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      activePage === 'esquema_bd'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : isDark
                        ? 'border-emerald-600/50 text-emerald-400 hover:bg-emerald-500/15'
                        : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                    }`}
                    title="Gestão e Backup da Base de Dados SQLite (Exclusivo login admin)"
                  >
                    <Database className="w-3.5 h-3.5" />
                    Base de Dados
                  </button>
                )}
              </>
            )}

            {/* User Menu Dropdown (igual a _navbar.html) */}
            <div className="relative ml-1" ref={dropdownRef}>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs hidden md:inline ${
                    isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
                  }`}
                >
                  Olá,
                </span>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef] hover:bg-[#343a40]'
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <span>👤 {nomeApresentacao}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>

              {dropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl border z-50 py-1.5 ${
                    isDark
                      ? 'bg-[#1e2126] border-[#343a40] text-[#e9ecef]'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setModalPassOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                    🔑 Alterar Palavra-passe
                  </button>

                  <div className="border-t border-slate-200 dark:border-slate-700/70 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    🚪 Sair
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              id="themeToggleBtn"
              type="button"
              onClick={onToggleTheme}
              title="Alternar tema"
              aria-label="Alternar tema claro/escuro"
              className="w-[36px] h-[36px] rounded-[10px] bg-[#1b2332] border border-[#2c374a] inline-flex items-center justify-center cursor-pointer shadow-xs hover:bg-[#232d40] transition-transform hover:-translate-y-0.5"
            >
              {isDark ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f5b942"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="w-[18px] h-[18px]"
                >
                  <circle cx="12" cy="12" r="4.2"></circle>
                  <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9fb0c9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-[18px] h-[18px]"
                >
                  <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.7 6.7 0 0 0 10.5 10.5z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Modal Alterar A Minha Palavra-passe */}
      {modalPassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-md rounded-lg shadow-xl border overflow-hidden ${
              isDark
                ? 'bg-[#1e2126] border-[#343a40] text-[#e9ecef]'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <h5 className="font-semibold text-base">
                🔑 Alterar A Minha Palavra-passe
              </h5>
              <button
                type="button"
                onClick={() => setModalPassOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePassSubmit}>
              <div className="p-4">
                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1.5">
                    Nova Palavra-passe
                  </label>
                  <input
                    type="password"
                    value={novaPassword}
                    onChange={(e) => setNovaPassword(e.target.value)}
                    placeholder="Introduza a nova palavra-passe"
                    required
                    minLength={4}
                    autoFocus
                    className={`w-full px-3 py-2 rounded-md border text-sm ${
                      isDark
                        ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
              <div
                className={`px-4 py-3 border-t flex justify-end gap-2 ${
                  isDark ? 'border-[#343a40]' : 'border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setModalPassOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-medium bg-slate-500 hover:bg-slate-600 text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'A guardar...' : 'Guardar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
