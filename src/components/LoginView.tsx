import React, { useState } from 'react';
import { LogIn, KeyRound, User } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface LoginViewProps {
  onLoginCredentials: (username: string, password: string) => Promise<void>;
  flashMessage: {
    text: string;
    category: 'success' | 'danger' | 'warning' | 'info';
  } | null;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginCredentials,
  flashMessage,
  isDark,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLoginCredentials(username, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors ${
        isDark ? 'bg-[#15171a] text-[#e9ecef]' : 'bg-[#f0f2f5] text-[#212529]'
      }`}
    >
      {/* Floating Theme Toggle Button (igual a login.html) */}
      <button
        id="themeToggleBtn"
        type="button"
        onClick={onToggleTheme}
        title="Alternar tema"
        aria-label="Alternar tema claro/escuro"
        className="fixed top-3.5 right-3.5 z-50 w-[38px] h-[38px] rounded-[10px] bg-[#1b2332] border border-[#2c374a] inline-flex items-center justify-center cursor-pointer shadow-md hover:bg-[#232d40] transition-transform hover:-translate-y-0.5"
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

      <div className="container mx-auto px-4 flex justify-center">
        <div
          className={`w-full max-w-[420px] mt-20 rounded-[10px] shadow-md p-6 border ${
            isDark
              ? 'bg-[#1e2126] border-[#343a40]'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex justify-center mb-3">
            <AppLogo size={58} className="drop-shadow-sm" />
          </div>
          <h4 className="text-center text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            Intranet DDPCD
          </h4>
          <p
            className={`text-center text-xs mb-6 ${
              isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
            }`}
          >
            Registo de Produção de Captura
          </p>

          {flashMessage && (
            <div
              className={`mb-4 px-3.5 py-2.5 rounded-md text-xs font-medium border ${
                flashMessage.category === 'danger'
                  ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60'
                  : flashMessage.category === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
              }`}
              role="alert"
            >
              {flashMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-semibold mb-1.5"
              >
                Utilizador
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="Digite o seu utilizador"
                  className={`w-full pl-9 pr-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
                      : 'bg-white border-[#dee2e6] text-[#212529]'
                  }`}
                />
              </div>
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Digite a sua password"
                  className={`w-full pl-9 pr-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
                      : 'bg-white border-[#dee2e6] text-[#212529]'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>

      <footer
        className={`text-center mt-8 mb-4 text-xs ${
          isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
        }`}
      >
        <p className="mb-0">
          DGLAB - Direção-Geral do Livro, dos Arquivos e das Bibliotecas
        </p>
      </footer>
    </div>
  );
};
