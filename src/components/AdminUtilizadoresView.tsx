import React, { useState } from 'react';
import { Utilizador } from '../utils/nrHelpers';
import { UserPlus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

interface AdminUtilizadoresViewProps {
  utilizadores: Utilizador[];
  onCreateUser: (
    username: string,
    nomeOperador: string,
    password: string,
    perfil: 'admin' | 'operador'
  ) => Promise<boolean>;
  onUpdateUser: (
    userDoc: Utilizador,
    username: string,
    nomeOperador: string,
    password: string,
    perfil: 'admin' | 'operador'
  ) => Promise<boolean>;
  onDeleteUser: (id: string) => Promise<void>;
  isDark: boolean;
}

export const AdminUtilizadoresView: React.FC<AdminUtilizadoresViewProps> = ({
  utilizadores,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  isDark,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newNomeOperador, setNewNomeOperador] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPerfil, setNewPerfil] = useState<'operador' | 'admin'>('operador');
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<Utilizador | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editNomeOperador, setEditNomeOperador] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPerfil, setEditPerfil] = useState<'operador' | 'admin'>('operador');
  const [updating, setUpdating] = useState(false);

  const [confirmDeleteUser, setConfirmDeleteUser] = useState<Utilizador | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const ok = await onCreateUser(
        newUsername,
        newNomeOperador,
        newPassword,
        newPerfil
      );
      if (ok) {
        setNewUsername('');
        setNewNomeOperador('');
        setNewPassword('');
        setNewPerfil('operador');
      }
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (u: Utilizador) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditNomeOperador(u.nome_operador);
    setEditPassword('');
    setEditPerfil(u.perfil);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    try {
      const ok = await onUpdateUser(
        editingUser,
        editUsername,
        editNomeOperador,
        editPassword,
        editPerfil
      );
      if (ok) {
        setEditingUser(null);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteUser) return;
    setDeleting(true);
    try {
      await onDeleteUser(confirmDeleteUser.id);
      setConfirmDeleteUser(null);
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-[#2b2f34] border-[#343a40] text-[#e9ecef]'
      : 'bg-white border-[#dee2e6] text-[#212529]'
  }`;

  return (
    <div className="max-w-[1100px] mx-auto px-4 mb-10">
      <h2 className="text-xl font-bold mb-4">Gestão de Utilizadores</h2>

      {/* Card Adicionar Utilizador */}
      <div
        className={`rounded-lg shadow-xs border mb-6 overflow-hidden ${
          isDark
            ? 'bg-[#1e2126] border-[#343a40]'
            : 'bg-white border-[#dee2e6]'
        }`}
      >
        <div
          className={`px-4 py-2.5 border-b font-semibold text-sm flex items-center gap-2 ${
            isDark
              ? 'bg-[#2b2f34] border-[#343a40]'
              : 'bg-[#f8f9fa] border-[#dee2e6]'
          }`}
        >
          <UserPlus className="w-4 h-4 text-blue-500" />
          Adicionar Utilizador
        </div>

        <div className="p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="grid grid-cols-1 md:grid-cols-12 gap-3"
          >
            <div className="md:col-span-3">
              <input
                type="text"
                name="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
                required
                className={inputClass}
              />
            </div>

            <div className="md:col-span-3">
              <input
                type="text"
                name="nome_operador"
                value={newNomeOperador}
                onChange={(e) => setNewNomeOperador(e.target.value)}
                placeholder="Nome Operador"
                required
                className={inputClass}
              />
            </div>

            <div className="md:col-span-3">
              <input
                type="password"
                name="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Palavra-passe"
                required
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <select
                name="perfil"
                value={newPerfil}
                onChange={(e) =>
                  setNewPerfil(e.target.value as 'operador' | 'admin')
                }
                className={inputClass}
              >
                <option value="operador">Operador</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={creating}
                className="w-full h-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {creating ? '...' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabela de Utilizadores */}
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
                <th className="py-3 px-4 w-[70px] font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Username</th>
                <th className="py-3 px-4 font-semibold">Nome Operador</th>
                <th className="py-3 px-4 font-semibold">Perfil</th>
                <th className="py-3 px-4 w-[180px] text-center font-semibold">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
              {utilizadores.map((user, idx) => (
                <tr
                  key={user.id}
                  className={
                    idx % 2 === 1
                      ? isDark
                        ? 'bg-white/[0.02]'
                        : 'bg-slate-50/70'
                      : ''
                  }
                >
                  <td className="py-3 px-4 font-mono text-xs">{user.seq_id}</td>
                  <td className="py-3 px-4 font-mono text-xs font-medium">
                    {user.username}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {user.nome_operador}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                        user.perfil === 'admin'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {user.perfil}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 mr-1.5 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUser(user)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Utilizador */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-md rounded-lg shadow-xl border overflow-hidden ${
              isDark
                ? 'bg-[#1e2126] border-[#343a40] text-[#e9ecef]'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                isDark ? 'border-[#343a40]' : 'border-slate-200'
              }`}
            >
              <h5 className="font-bold text-base">
                Editar Utilizador: {editingUser.username}
              </h5>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Nome Operador
                  </label>
                  <input
                    type="text"
                    value={editNomeOperador}
                    onChange={(e) => setEditNomeOperador(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Palavra-passe (deixe em branco se não quiser alterar)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Nova palavra-passe"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Perfil
                  </label>
                  <select
                    value={editPerfil}
                    onChange={(e) =>
                      setEditPerfil(e.target.value as 'operador' | 'admin')
                    }
                    className={inputClass}
                  >
                    <option value="operador">Operador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div
                className={`px-4 py-3 border-t flex justify-end gap-2 ${
                  isDark ? 'border-[#343a40]' : 'border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-md text-xs font-medium bg-slate-500 hover:bg-slate-600 text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'A guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminação de Utilizador */}
      {confirmDeleteUser && (
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
                <h5 className="font-bold text-base">Eliminar Utilizador</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tem a certeza que deseja eliminar o utilizador{' '}
                  <strong>{confirmDeleteUser.username}</strong>?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
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
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
