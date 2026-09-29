import { Utilizador, RegistoProducao } from '../utils/nrHelpers';
import { LinhaImportada } from '../utils/excelService';

const SESSION_TOKEN_KEY = 'app_nr_session_token';

export function getAuthToken(): string {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
}

export function setAuthToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

function authHeaders(includeJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface DbStatusInfo {
  ok: boolean;
  dbPath?: string;
  sizeBytes?: number;
  lastModified?: string;
  totalUsers?: number;
  totalRegistos?: number;
}

export async function fetchDbStatusSQLite(): Promise<DbStatusInfo | null> {
  const res = await fetch('/api/db_status', {
    headers: authHeaders(false),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function loginSQLite(
  username: string,
  password: string
): Promise<{
  ok: boolean;
  token?: string;
  user?: Utilizador;
  message?: string;
}> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function fetchUtilizadoresSQLite(): Promise<Utilizador[]> {
  const res = await fetch('/api/utilizadores', {
    headers: authHeaders(false),
  });
  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRegistosSQLite(): Promise<RegistoProducao[]> {
  const res = await fetch('/api/registos', {
    headers: authHeaders(false),
  });
  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) return [];
  return res.json();
}

export async function criarUtilizadorDB(
  username: string,
  nomeOperador: string,
  password: string,
  perfil: 'admin' | 'operador'
): Promise<{
  ok: boolean;
  message: string;
  category: 'success' | 'danger' | 'warning';
}> {
  const res = await fetch('/api/utilizadores', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({
      username,
      nome_operador: nomeOperador,
      password,
      perfil,
    }),
  });
  return res.json();
}

export async function editarUtilizadorDB(
  userDoc: Utilizador,
  username: string,
  nomeOperador: string,
  password: string,
  perfil: 'admin' | 'operador'
): Promise<{
  ok: boolean;
  message: string;
  category: 'success' | 'danger' | 'warning';
}> {
  const res = await fetch(`/api/utilizadores/${userDoc.seq_id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify({
      username,
      nome_operador: nomeOperador,
      password,
      perfil,
    }),
  });
  return res.json();
}

export async function eliminarUtilizadorDB(id: string): Promise<void> {
  await fetch(`/api/utilizadores/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
}

export async function alterarMinhaPasswordDB(
  _userDoc: Utilizador,
  novaPassword: string
): Promise<{ ok: boolean; message: string; category: 'success' | 'warning' }> {
  const res = await fetch('/api/alterar_minha_password', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({
      nova_password: novaPassword,
    }),
  });
  return res.json();
}

export async function inserirRegistoDB(payload: {
  data_hora_captura: string;
  nome_operador: string;
  pedido: string;
  identificador_documento: string;
  tipo_pedido: string;
  tipo_trabalho: string;
  tipo_fonte: string;
  total_imagens: number;
}): Promise<{
  ok: boolean;
  message: string;
  category: 'success' | 'warning' | 'danger';
}> {
  const res = await fetch('/api/registos', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function importarRegistosLoteDB(
  linhas: LinhaImportada[]
): Promise<{ ok: boolean; importados: number; duplicados: string[] }> {
  const res = await fetch('/api/registos/lote', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ linhas }),
  });
  return res.json();
}

export async function editarRegistoDB(
  registoOriginal: RegistoProducao,
  payload: {
    data_hora_captura: string;
    pedido: string;
    identificador_documento: string;
    tipo_pedido: string;
    tipo_trabalho: string;
    tipo_fonte: string;
    total_imagens: number;
  }
): Promise<{
  ok: boolean;
  message: string;
  category: 'success' | 'warning' | 'danger';
}> {
  const res = await fetch(`/api/registos/${registoOriginal.seq_id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function eliminarRegistoDB(id: string): Promise<void> {
  await fetch(`/api/registos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
}

export async function uploadDatabaseSQLite(file: File): Promise<{
  ok: boolean;
  message: string;
  category: 'success' | 'danger' | 'warning';
}> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const fileBase64 = btoa(binary);

  const res = await fetch('/api/upload_db', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ fileBase64 }),
  });
  return res.json();
}
