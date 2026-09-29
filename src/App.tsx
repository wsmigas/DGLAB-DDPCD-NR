/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Utilizador, RegistoProducao } from './utils/nrHelpers';
import {
  loginSQLite,
  setAuthToken,
  getAuthToken,
  fetchUtilizadoresSQLite,
  fetchRegistosSQLite,
  criarUtilizadorDB,
  editarUtilizadorDB,
  eliminarUtilizadorDB,
  alterarMinhaPasswordDB,
  inserirRegistoDB,
  importarRegistosLoteDB,
  editarRegistoDB,
  eliminarRegistoDB,
  uploadDatabaseSQLite,
} from './services/dbService';
import { lerFicheiroExcelImportacao } from './utils/excelService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar, ActivePage } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { RegistoView } from './components/RegistoView';
import { MeusRelatoriosView } from './components/MeusRelatoriosView';
import { AdminRelatoriosView } from './components/AdminRelatoriosView';
import { EditarRegistoView } from './components/EditarRegistoView';
import { AdminUtilizadoresView } from './components/AdminUtilizadoresView';
import { EsquemaBdView } from './components/EsquemaBdView';
import { X } from 'lucide-react';

interface FlashMessage {
  text: string;
  category: 'success' | 'danger' | 'warning' | 'info';
}

const THEME_STORAGE_KEY = 'app_nr_theme';
const SESSION_USER_KEY = 'app_nr_session_user';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([]);
  const [registos, setRegistos] = useState<RegistoProducao[]>([]);
  const [currentUser, setCurrentUser] = useState<Utilizador | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_USER_KEY);
      const token = getAuthToken();
      if (saved && token) {
        return JSON.parse(saved) as Utilizador;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [activePage, setActivePage] = useState<ActivePage>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_USER_KEY);
      if (saved && getAuthToken()) {
        const u = JSON.parse(saved) as Utilizador;
        return u.perfil === 'admin' ? 'admin_relatorios' : 'registo';
      }
    } catch {
      // ignore
    }
    return 'registo';
  });
  const [registoEmEdicao, setRegistoEmEdicao] =
    useState<RegistoProducao | null>(null);
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  const showFlash = useCallback(
    (
      text: string,
      category: 'success' | 'danger' | 'warning' | 'info' = 'info'
    ) => {
      setFlash({ text, category });
    },
    []
  );

  const recarregarDadosSQLite = useCallback(async () => {
    if (!currentUser || !getAuthToken()) return;
    try {
      if (currentUser.perfil === 'admin') {
        const [usersList, regList] = await Promise.all([
          fetchUtilizadoresSQLite(),
          fetchRegistosSQLite(),
        ]);
        setUtilizadores(usersList);
        setRegistos(regList);
      } else {
        const regList = await fetchRegistosSQLite();
        setRegistos(regList);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        setAuthToken(null);
        sessionStorage.removeItem(SESSION_USER_KEY);
        setCurrentUser(null);
        showFlash(
          'A sua sessão expirou. Por favor inicie sessão novamente.',
          'warning'
        );
        return;
      }
      console.error('Erro ao carregar dados SQLite:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    recarregarDadosSQLite();
  }, [recarregarDadosSQLite]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleLoginCredentials = async (username: string, password: string) => {
    setFlash(null);
    try {
      const res = await loginSQLite(username, password);
      if (res.ok && res.user && res.token) {
        setAuthToken(res.token);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(res.user));
        setCurrentUser(res.user);
        setActivePage(
          res.user.perfil === 'admin' ? 'admin_relatorios' : 'registo'
        );
      } else {
        showFlash(
          res.message || 'Utilizador ou palavra-passe incorretos.',
          'danger'
        );
      }
    } catch {
      showFlash('Erro ao comunicar com o servidor.', 'danger');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setCurrentUser(null);
    setUtilizadores([]);
    setRegistos([]);
    setFlash(null);
  };

  const handleNavigate = (page: ActivePage) => {
    setFlash(null);
    if (
      currentUser?.perfil !== 'admin' &&
      (page === 'admin_relatorios' ||
        page === 'admin_utilizadores' ||
        page === 'editar_registo' ||
        page === 'esquema_bd')
    ) {
      showFlash('Acesso restrito a administradores.', 'danger');
      return;
    }
    setActivePage(page);
  };

  const handleChangeMyPassword = async (novaPass: string) => {
    if (!currentUser) return;
    const res = await alterarMinhaPasswordDB(currentUser, novaPass);
    showFlash(res.message, res.category);
  };

  const handleSubmitRegisto = async (payload: {
    data_hora_captura: string;
    nome_operador: string;
    pedido: string;
    identificador_documento: string;
    tipo_pedido: string;
    tipo_trabalho: string;
    tipo_fonte: string;
    total_imagens: number;
  }): Promise<boolean> => {
    const res = await inserirRegistoDB(payload);
    showFlash(res.message, res.category);
    if (res.ok) {
      await recarregarDadosSQLite();
    }
    return res.ok;
  };

  const handleImportExcel = async (file: File) => {
    if (!currentUser) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showFlash(
        'Formato de ficheiro inválido. Por favor envie um ficheiro Excel (.xlsx).',
        'danger'
      );
      return;
    }

    try {
      const operadorSessao =
        currentUser.nome_operador || currentUser.username;
      const linhas = await lerFicheiroExcelImportacao(
        file,
        currentUser.perfil,
        operadorSessao
      );

      if (linhas.length === 0) {
        showFlash('O ficheiro Excel enviado está vazio.', 'warning');
        return;
      }

      const { importados, duplicados } = await importarRegistosLoteDB(linhas);
      await recarregarDadosSQLite();

      if (importados > 0 && duplicados.length > 0) {
        let listaDup = duplicados.slice(0, 5).join(', ');
        if (duplicados.length > 5) {
          listaDup += ` e mais ${duplicados.length - 5} registo(s)...`;
        }
        showFlash(
          `Importação concluída: ${importados} registos adicionados. Atenção: ${duplicados.length} ignorado(s) por já existirem (${listaDup}).`,
          'warning'
        );
      } else if (importados > 0) {
        showFlash(
          `Importação concluída: ${importados} registos adicionados com sucesso.`,
          'success'
        );
      } else if (duplicados.length > 0) {
        let listaDup = duplicados.slice(0, 5).join(', ');
        if (duplicados.length > 5) {
          listaDup += ` e mais ${duplicados.length - 5} registo(s)...`;
        }
        showFlash(
          `Atenção: ${duplicados.length} registo(s) foram ignorados por já existirem na base de dados (${listaDup}).`,
          'warning'
        );
      } else {
        showFlash('Nenhum registo foi importado.', 'info');
      }
    } catch (err) {
      showFlash(
        `Erro ao ler o ficheiro Excel: ${
          err instanceof Error ? err.message : String(err)
        }`,
        'danger'
      );
    }
  };

  const handleStartEditRegisto = (reg: RegistoProducao) => {
    setFlash(null);
    setRegistoEmEdicao(reg);
    setActivePage('editar_registo');
  };

  const handleSaveEditedRegisto = async (payload: {
    data_hora_captura: string;
    pedido: string;
    identificador_documento: string;
    tipo_pedido: string;
    tipo_trabalho: string;
    tipo_fonte: string;
    total_imagens: number;
  }): Promise<boolean> => {
    if (!registoEmEdicao) return false;
    const res = await editarRegistoDB(registoEmEdicao, payload);
    showFlash(res.message, res.category);
    if (res.ok) {
      await recarregarDadosSQLite();
      setRegistoEmEdicao(null);
      setActivePage('admin_relatorios');
    }
    return res.ok;
  };

  const handleDeleteRegisto = async (id: string) => {
    await eliminarRegistoDB(id);
    await recarregarDadosSQLite();
    showFlash('Registo eliminado!', 'warning');
  };

  const handleCreateUser = async (
    username: string,
    nomeOperador: string,
    password: string,
    perfil: 'admin' | 'operador'
  ): Promise<boolean> => {
    const res = await criarUtilizadorDB(
      username,
      nomeOperador,
      password,
      perfil
    );
    showFlash(res.message, res.category);
    if (res.ok) {
      await recarregarDadosSQLite();
    }
    return res.ok;
  };

  const handleUpdateUser = async (
    userDoc: Utilizador,
    username: string,
    nomeOperador: string,
    password: string,
    perfil: 'admin' | 'operador'
  ): Promise<boolean> => {
    const res = await editarUtilizadorDB(
      userDoc,
      username,
      nomeOperador,
      password,
      perfil
    );
    showFlash(res.message, res.category);
    if (res.ok) {
      await recarregarDadosSQLite();
      if (currentUser && currentUser.seq_id === userDoc.seq_id) {
        const updatedUser: Utilizador = {
          ...currentUser,
          username,
          nome_operador: nomeOperador,
          perfil,
        };
        setCurrentUser(updatedUser);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      }
    }
    return res.ok;
  };

  const handleDeleteUser = async (id: string) => {
    await eliminarUtilizadorDB(id);
    await recarregarDadosSQLite();
    showFlash('Utilizador eliminado com sucesso!', 'warning');
  };

  const handleRestoreDatabase = async (file: File) => {
    const res = await uploadDatabaseSQLite(file);
    showFlash(res.message, res.category);
    if (res.ok) {
      await recarregarDadosSQLite();
    }
  };

  if (!currentUser) {
    return (
      <ErrorBoundary>
        <LoginView
          onLoginCredentials={handleLoginCredentials}
          flashMessage={flash}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen flex flex-col transition-colors ${
          isDark ? 'bg-[#15171a] text-[#e9ecef]' : 'bg-[#e9ecef] text-[#212529]'
        }`}
      >
        <Navbar
          currentUser={currentUser}
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onChangePassword={handleChangeMyPassword}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
        />

        {/* Flash Message Container */}
        {flash && (
          <div className="max-w-[1100px] w-full mx-auto px-4 mb-4">
            <div
              className={`px-4 py-3 rounded-lg border text-sm font-medium flex items-center justify-between shadow-xs ${
                flash.category === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                  : flash.category === 'danger'
                  ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60'
                  : flash.category === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                  : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
              }`}
              role="alert"
            >
              <span>{flash.text}</span>
              <button
                type="button"
                onClick={() => setFlash(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Active View */}
        <main className="flex-1">
          {activePage === 'registo' && (
            <RegistoView
              currentUser={currentUser}
              operadores={utilizadores}
              onSubmitRegisto={handleSubmitRegisto}
              isDark={isDark}
            />
          )}

          {activePage === 'meus_relatorios' && (
            <MeusRelatoriosView
              currentUser={currentUser}
              todosRegistos={registos}
              onImportExcel={handleImportExcel}
              isDark={isDark}
            />
          )}

          {activePage === 'admin_relatorios' &&
            currentUser.perfil === 'admin' && (
              <AdminRelatoriosView
                todosRegistos={registos}
                onEditRegisto={handleStartEditRegisto}
                onDeleteRegisto={handleDeleteRegisto}
                isDark={isDark}
              />
            )}

          {activePage === 'editar_registo' &&
            currentUser.perfil === 'admin' &&
            registoEmEdicao && (
              <EditarRegistoView
                registo={registoEmEdicao}
                onSave={handleSaveEditedRegisto}
                onCancel={() => {
                  setRegistoEmEdicao(null);
                  setActivePage('admin_relatorios');
                }}
                isDark={isDark}
              />
            )}

          {activePage === 'admin_utilizadores' &&
            currentUser.perfil === 'admin' && (
              <AdminUtilizadoresView
                utilizadores={utilizadores}
                onCreateUser={handleCreateUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                isDark={isDark}
              />
            )}

          {activePage === 'esquema_bd' && currentUser.perfil === 'admin' && (
            <EsquemaBdView
              utilizadores={utilizadores}
              registos={registos}
              onRestoreDatabase={handleRestoreDatabase}
              isDark={isDark}
            />
          )}
        </main>

        {/* Footer DGLAB */}
        <footer
          className={`text-center py-4 mt-auto text-xs ${
            isDark ? 'text-[#9aa0a6]' : 'text-[#6c757d]'
          }`}
        >
          <p className="mb-0">
            DGLAB - Direção-Geral do Livro, dos Arquivos e das Bibliotecas
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
