import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DB_PATH = path.resolve(process.cwd(), 'base_dados_nr.db');
const SECRET_KEY =
  process.env.SECRET_KEY || 'd3pcd_nr_secret_key_prod_2026_dglab_secure_token';

// ============================================================================
// WERKZEUG / PYTHON COMPATIBLE PASSWORD HASHING (PBKDF2 & SCRYPT)
// ============================================================================
function generatePasswordHashServer(password: string): string {
  const salt = crypto.randomBytes(8).toString('hex');
  const iterations = 600000;
  const derived = crypto
    .pbkdf2Sync(password, salt, iterations, 32, 'sha256')
    .toString('hex');
  return `pbkdf2:sha256:${iterations}$${salt}$${derived}`;
}

function checkPasswordHashServer(pwhash: string, password: string): boolean {
  if (!pwhash || !password) return false;

  try {
    // Formato legado anterior: pbkdf2:sha256:600000$dglab$<sha256>
    if (pwhash.startsWith('pbkdf2:sha256:600000$dglab$')) {
      const legacyHash = crypto
        .createHash('sha256')
        .update(`d3pcd_nr_salt_${password}`)
        .digest('hex');
      if (pwhash === `pbkdf2:sha256:600000$dglab$${legacyHash}`) {
        return true;
      }
    }

    // Formato Werkzeug PBKDF2: pbkdf2:sha256:iterations$salt$hash
    if (pwhash.startsWith('pbkdf2:')) {
      const parts = pwhash.split('$');
      if (parts.length === 3) {
        const methodParts = parts[0].split(':');
        const digest = methodParts[1] || 'sha256';
        const iterations = parseInt(methodParts[2] || '260000', 10);
        const salt = parts[1];
        const storedHex = parts[2];
        const keylen = Buffer.from(storedHex, 'hex').length;
        const derived = crypto
          .pbkdf2Sync(password, salt, iterations, keylen, digest)
          .toString('hex');
        return crypto.timingSafeEqual(
          Buffer.from(storedHex, 'hex'),
          Buffer.from(derived, 'hex')
        );
      }
    }

    // Formato Werkzeug 3.x Scrypt: scrypt:32768:8:1$salt$hash
    if (pwhash.startsWith('scrypt:')) {
      const parts = pwhash.split('$');
      if (parts.length === 3) {
        const methodParts = parts[0].split(':');
        const n = parseInt(methodParts[1] || '32768', 10);
        const r = parseInt(methodParts[2] || '8', 10);
        const p = parseInt(methodParts[3] || '1', 10);
        const salt = parts[1];
        const storedHex = parts[2];
        const keylen = Buffer.from(storedHex, 'hex').length;
        const derived = crypto
          .scryptSync(password, salt, keylen, {
            N: n,
            r,
            p,
            maxmem: 128 * n * r * 2,
          })
          .toString('hex');
        return crypto.timingSafeEqual(
          Buffer.from(storedHex, 'hex'),
          Buffer.from(derived, 'hex')
        );
      }
    }
  } catch (err) {
    console.error('Erro ao verificar hash de password:', err);
  }

  return false;
}

// ============================================================================
// SIGNED SESSION TOKENS (HMAC-SHA256)
// ============================================================================
export interface SessionPayload {
  id: number;
  username: string;
  nome_operador: string;
  perfil: 'admin' | 'operador';
  exp: number;
}

function createSessionToken(user: Omit<SessionPayload, 'exp'>): string {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 horas
  };
  const dataB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataB64)
    .digest('base64url');
  return `${dataB64}.${sig}`;
}

function verifySessionToken(token?: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [dataB64, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataB64)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(dataB64, 'base64url').toString('utf-8')
    ) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (typeof req.query.token === 'string') {
    return req.query.token;
  }
  return undefined;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = verifySessionToken(extractToken(req));
  if (!session) {
    res.status(401).json({
      ok: false,
      message: 'Sessão inválida ou expirada. Por favor autentique-se novamente.',
    });
    return;
  }
  (req as any).sessionUser = session;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = verifySessionToken(extractToken(req));
  if (!session || session.perfil !== 'admin') {
    res.status(403).json({
      ok: false,
      message: 'Acesso restrito a administradores.',
    });
    return;
  }
  (req as any).sessionUser = session;
  next();
}

function normalizarDataIsoServer(dataStr?: string | null): string {
  if (!dataStr) return '';
  const d = String(dataStr).replace(' 00:00:00', '').trim().split(' ')[0];
  for (const sep of ['-', '/']) {
    if (d.includes(sep)) {
      const partes = d.split(sep);
      if (partes.length === 3) {
        if (partes[0].length === 4) {
          return `${partes[0]}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
        } else if (partes[2].length === 4) {
          return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
      }
    }
  }
  return d;
}

let SQLModule: SqlJsStatic;
let db: Database;

function saveDatabaseToDisk() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function queryAll<T = Record<string, any>>(
  sql: string,
  params: any[] = []
): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

function queryOne<T = Record<string, any>>(
  sql: string,
  params: any[] = []
): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function initDatabase() {
  SQLModule = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQLModule.Database(fileBuffer);
  } else {
    db = new SQLModule.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS utilizadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nome_operador TEXT NOT NULL,
      perfil TEXT NOT NULL DEFAULT 'operador'
    );
  `);

  db.run(`
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
    );
  `);

  // Limpar dados fictícios de demonstração anteriores caso existam
  const demoDocs = [
    'PT-TT-CC-1-12-34',
    'PT-TT-MF-2049',
    'PT-TT-AOS-123',
    'PT-TT-RGM-D-18',
    'PT-TT-DDPCD-0045',
    'PT-TT-EPN-FOT-089',
  ];
  for (const docId of demoDocs) {
    db.run(
      'DELETE FROM registos_producao WHERE identificador_documento = ?',
      [docId]
    );
  }

  const demoUsers = ['m.silva', 'j.santos', 'a.pereira'];
  for (const uName of demoUsers) {
    db.run('DELETE FROM utilizadores WHERE username = ?', [uName]);
  }

  // Garantir que existe pelo menos 1 utilizador administrador se a tabela estiver vazia
  const userCountRow = queryOne<{ total: number }>(
    'SELECT COUNT(*) as total FROM utilizadores'
  );
  if (!userCountRow || userCountRow.total === 0) {
    const adminHash = generatePasswordHashServer('admin123');
    db.run(
      'INSERT INTO utilizadores (username, password_hash, nome_operador, perfil) VALUES (?, ?, ?, ?)',
      ['admin', adminHash, 'Administrador', 'admin']
    );
  }

  saveDatabaseToDisk();
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // ============================================================================
  // API ROUTES (Produção - SQLite base_dados_nr.db)
  // ============================================================================

  // Login (/login)
  app.post('/api/login', (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();

    if (!username || !password) {
      res.status(400).json({
        ok: false,
        message: 'Introduza o utilizador e a palavra-passe.',
      });
      return;
    }

    const user = queryOne<{
      id: number;
      username: string;
      password_hash: string;
      nome_operador: string;
      perfil: 'admin' | 'operador';
    }>('SELECT * FROM utilizadores WHERE username = ?', [username]);

    if (user && checkPasswordHashServer(user.password_hash, password)) {
      const perfil = user.perfil === 'admin' ? 'admin' : 'operador';
      const nomeOperador = user.nome_operador || user.username;
      const token = createSessionToken({
        id: user.id,
        username: user.username,
        nome_operador: nomeOperador,
        perfil,
      });

      res.json({
        ok: true,
        token,
        user: {
          id: String(user.id),
          seq_id: user.id,
          username: user.username,
          nome_operador: nomeOperador,
          perfil,
        },
      });
    } else {
      res.status(401).json({
        ok: false,
        message: 'Utilizador ou palavra-passe incorretos.',
      });
    }
  });

  // Listar Utilizadores (Apenas Admin)
  app.get('/api/utilizadores', requireAdmin, (_req, res) => {
    const users = queryAll<{
      id: number;
      username: string;
      nome_operador: string;
      perfil: 'admin' | 'operador';
    }>(
      'SELECT id, username, nome_operador, perfil FROM utilizadores ORDER BY id DESC'
    );

    res.json(
      users.map((u) => ({
        id: String(u.id),
        seq_id: u.id,
        username: u.username,
        password_hash: '',
        nome_operador: u.nome_operador || u.username,
        perfil: u.perfil === 'admin' ? 'admin' : 'operador',
      }))
    );
  });

  // Criar Utilizador (Apenas Admin)
  app.post('/api/utilizadores', requireAdmin, (req, res) => {
    const username = String(req.body.username || '').trim();
    const nome_operador = String(req.body.nome_operador || '').trim();
    const password = String(req.body.password || '').trim();
    const perfil = req.body.perfil === 'admin' ? 'admin' : 'operador';

    if (!username || !password || !nome_operador) {
      res.status(400).json({
        ok: false,
        message: 'Preencha todos os campos obrigatórios.',
        category: 'warning',
      });
      return;
    }

    const existing = queryOne(
      'SELECT id FROM utilizadores WHERE LOWER(username) = LOWER(?)',
      [username]
    );
    if (existing) {
      res.status(409).json({
        ok: false,
        message: 'Erro: O nome de utilizador já existe.',
        category: 'danger',
      });
      return;
    }

    try {
      const passHash = generatePasswordHashServer(password);
      db.run(
        'INSERT INTO utilizadores (username, password_hash, nome_operador, perfil) VALUES (?, ?, ?, ?)',
        [username, passHash, nome_operador, perfil]
      );
      saveDatabaseToDisk();
      res.json({
        ok: true,
        message: 'Utilizador criado com sucesso!',
        category: 'success',
      });
    } catch {
      res.status(400).json({
        ok: false,
        message: 'Erro: O nome de utilizador já existe.',
        category: 'danger',
      });
    }
  });

  // Editar Utilizador (Apenas Admin)
  app.put('/api/utilizadores/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const username = String(req.body.username || '').trim();
    const nome_operador = String(req.body.nome_operador || '').trim();
    const password = String(req.body.password || '').trim();
    const perfil = req.body.perfil === 'admin' ? 'admin' : 'operador';

    const dup = queryOne(
      'SELECT id FROM utilizadores WHERE LOWER(username) = LOWER(?) AND id != ?',
      [username, id]
    );
    if (dup) {
      res.status(409).json({
        ok: false,
        message: 'Erro: O nome de utilizador já existe.',
        category: 'danger',
      });
      return;
    }

    if (password) {
      const passHash = generatePasswordHashServer(password);
      db.run(
        'UPDATE utilizadores SET username = ?, nome_operador = ?, password_hash = ?, perfil = ? WHERE id = ?',
        [username, nome_operador, passHash, perfil, id]
      );
    } else {
      db.run(
        'UPDATE utilizadores SET username = ?, nome_operador = ?, perfil = ? WHERE id = ?',
        [username, nome_operador, perfil, id]
      );
    }
    saveDatabaseToDisk();
    res.json({
      ok: true,
      message: 'Utilizador atualizado com sucesso!',
      category: 'success',
    });
  });

  // Eliminar Utilizador (Apenas Admin)
  app.delete('/api/utilizadores/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    db.run('DELETE FROM utilizadores WHERE id = ?', [id]);
    saveDatabaseToDisk();
    res.json({
      ok: true,
      message: 'Utilizador eliminado com sucesso!',
      category: 'warning',
    });
  });

  // Alterar Minha Password (Utilizador Autenticado)
  app.post('/api/alterar_minha_password', requireAuth, (req, res) => {
    const sessionUser: SessionPayload = (req as any).sessionUser;
    const novaPass = String(req.body.nova_password || '').trim();

    if (!novaPass) {
      res.status(400).json({
        ok: false,
        message: 'A nova palavra-passe não pode estar em branco.',
        category: 'warning',
      });
      return;
    }

    const passHash = generatePasswordHashServer(novaPass);
    db.run('UPDATE utilizadores SET password_hash = ? WHERE id = ?', [
      passHash,
      sessionUser.id,
    ]);
    saveDatabaseToDisk();
    res.json({
      ok: true,
      message: 'Palavra-passe alterada com sucesso!',
      category: 'success',
    });
  });

  // Listar Registos de Produção (Autenticado: Admin vê todos, Operador vê os seus)
  app.get('/api/registos', requireAuth, (req, res) => {
    const sessionUser: SessionPayload = (req as any).sessionUser;

    let rows: {
      id: number;
      data_hora_captura: string;
      nome_operador: string;
      pedido: string;
      identificador_documento: string;
      tipo_pedido: string;
      tipo_trabalho: string;
      tipo_fonte: string;
      total_imagens: number;
    }[];

    if (sessionUser.perfil === 'admin') {
      rows = queryAll(
        'SELECT * FROM registos_producao ORDER BY data_hora_captura DESC, id DESC'
      );
    } else {
      rows = queryAll(
        'SELECT * FROM registos_producao WHERE nome_operador = ? ORDER BY data_hora_captura DESC, id DESC',
        [sessionUser.nome_operador]
      );
    }

    res.json(
      rows.map((r) => ({
        id: String(r.id),
        seq_id: r.id,
        data_hora_captura: r.data_hora_captura,
        nome_operador: r.nome_operador || '-',
        pedido: r.pedido || '-',
        identificador_documento: r.identificador_documento,
        tipo_pedido: r.tipo_pedido,
        tipo_trabalho: r.tipo_trabalho,
        tipo_fonte: r.tipo_fonte,
        total_imagens: Number(r.total_imagens) || 0,
      }))
    );
  });

  // Inserir Registo (/registo)
  app.post('/api/registos', requireAuth, (req, res) => {
    const sessionUser: SessionPayload = (req as any).sessionUser;

    const data_cap =
      normalizarDataIsoServer(req.body.data_hora_captura) ||
      new Date().toISOString().slice(0, 10);
    const nome_operador =
      sessionUser.perfil === 'admin'
        ? String(req.body.nome_operador || sessionUser.nome_operador).trim()
        : sessionUser.nome_operador;
    const pedido = String(req.body.pedido || '').trim();
    const doc = String(req.body.identificador_documento || '').trim();
    const tipo_p = String(req.body.tipo_pedido || '').trim();
    const tipo_t = String(req.body.tipo_trabalho || '').trim();
    const tipo_f = String(req.body.tipo_fonte || '').trim();
    const total_img = Math.max(
      0,
      parseInt(String(req.body.total_imagens || 0), 10) || 0
    );

    if (!doc) {
      res.status(400).json({
        ok: false,
        message: 'O identificador do documento é obrigatório.',
        category: 'danger',
      });
      return;
    }

    const existe = queryOne(
      'SELECT id FROM registos_producao WHERE LOWER(identificador_documento) = LOWER(?)',
      [doc]
    );
    if (existe) {
      res.status(409).json({
        ok: false,
        message: 'O documento já se encontra registado!',
        category: 'warning',
      });
      return;
    }

    try {
      db.run(
        'INSERT INTO registos_producao (data_hora_captura, nome_operador, pedido, identificador_documento, tipo_pedido, tipo_trabalho, tipo_fonte, total_imagens) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [data_cap, nome_operador, pedido, doc, tipo_p, tipo_t, tipo_f, total_img]
      );
      saveDatabaseToDisk();
      res.json({
        ok: true,
        message: 'Registo inserido com sucesso!',
        category: 'success',
      });
    } catch {
      res.status(409).json({
        ok: false,
        message: 'O documento já se encontra registado!',
        category: 'warning',
      });
    }
  });

  // Importar lote Excel (/importar_excel)
  app.post('/api/registos/lote', requireAuth, (req, res) => {
    const sessionUser: SessionPayload = (req as any).sessionUser;
    const linhas = Array.isArray(req.body.linhas) ? req.body.linhas : [];
    let importados = 0;
    const duplicados: string[] = [];

    for (const linha of linhas) {
      const numLinha = linha.numLinha || '?';
      const doc = String(linha.identificador_documento || '').trim();
      const data_cap =
        normalizarDataIsoServer(linha.data_hora_captura) ||
        new Date().toISOString().slice(0, 10);
      const operador =
        sessionUser.perfil === 'admin'
          ? String(linha.nome_operador || sessionUser.nome_operador).trim()
          : sessionUser.nome_operador;
      const pedido = String(linha.pedido || '-').trim();
      const tipo_p = String(linha.tipo_pedido || 'Outro').trim();
      const tipo_t = String(linha.tipo_trabalho || 'Íntegra').trim();
      const tipo_f = String(linha.tipo_fonte || 'Papel').trim();
      const total_img = Math.max(
        0,
        parseInt(String(linha.total_imagens || 0), 10) || 0
      );

      const existe = queryOne(
        'SELECT id FROM registos_producao WHERE LOWER(identificador_documento) = LOWER(?)',
        [doc]
      );
      if (existe) {
        duplicados.push(`Linha ${numLinha}: '${doc}'`);
        continue;
      }

      try {
        db.run(
          'INSERT INTO registos_producao (data_hora_captura, nome_operador, pedido, identificador_documento, tipo_pedido, tipo_trabalho, tipo_fonte, total_imagens) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [data_cap, operador, pedido, doc, tipo_p, tipo_t, tipo_f, total_img]
        );
        importados += 1;
      } catch {
        duplicados.push(`Linha ${numLinha}: '${doc}'`);
      }
    }

    if (importados > 0) {
      saveDatabaseToDisk();
    }

    res.json({
      ok: true,
      importados,
      duplicados,
    });
  });

  // Editar Registo (Apenas Admin)
  app.put('/api/registos/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const data_cap =
      normalizarDataIsoServer(req.body.data_hora_captura) ||
      new Date().toISOString().slice(0, 10);
    const pedido = String(req.body.pedido || '').trim();
    const doc = String(req.body.identificador_documento || '').trim();
    const tipo_p = String(req.body.tipo_pedido || '').trim();
    const tipo_t = String(req.body.tipo_trabalho || '').trim();
    const tipo_f = String(req.body.tipo_fonte || '').trim();
    const total_img = Math.max(
      0,
      parseInt(String(req.body.total_imagens || 0), 10) || 0
    );

    const dup = queryOne(
      'SELECT id FROM registos_producao WHERE LOWER(identificador_documento) = LOWER(?) AND id != ?',
      [doc, id]
    );
    if (dup) {
      res.status(409).json({
        ok: false,
        message: 'O documento já se encontra registado noutro registo!',
        category: 'warning',
      });
      return;
    }

    db.run(
      'UPDATE registos_producao SET data_hora_captura=?, pedido=?, identificador_documento=?, tipo_pedido=?, tipo_trabalho=?, tipo_fonte=?, total_imagens=? WHERE id=?',
      [data_cap, pedido, doc, tipo_p, tipo_t, tipo_f, total_img, id]
    );
    saveDatabaseToDisk();
    res.json({
      ok: true,
      message: 'Registo atualizado com sucesso!',
      category: 'success',
    });
  });

  // Eliminar Registo (Apenas Admin)
  app.delete('/api/registos/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    db.run('DELETE FROM registos_producao WHERE id=?', [id]);
    saveDatabaseToDisk();
    res.json({
      ok: true,
      message: 'Registo eliminado!',
      category: 'warning',
    });
  });

  // Descarregar ficheiro SQLite base_dados_nr.db (Apenas Admin)
  app.get('/api/download_db', requireAdmin, (_req, res) => {
    saveDatabaseToDisk();
    res.download(DB_PATH, 'base_dados_nr.db');
  });

  // Importar / Restaurar ficheiro SQLite base_dados_nr.db (Apenas Admin)
  app.post('/api/upload_db', requireAdmin, (req, res) => {
    const base64Data = String(req.body.fileBase64 || '').trim();
    if (!base64Data) {
      res.status(400).json({
        ok: false,
        message: 'Nenhum ficheiro recebido.',
        category: 'danger',
      });
      return;
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const tempDb = new SQLModule.Database(buffer);

      // Validar que o ficheiro SQLite contém as tabelas esperadas
      const tablesStmt = tempDb.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('utilizadores', 'registos_producao')"
      );
      const foundTables: string[] = [];
      while (tablesStmt.step()) {
        const row = tablesStmt.getAsObject() as { name: string };
        foundTables.push(row.name);
      }
      tablesStmt.free();

      if (
        !foundTables.includes('utilizadores') ||
        !foundTables.includes('registos_producao')
      ) {
        tempDb.close();
        res.status(400).json({
          ok: false,
          message:
            'Ficheiro SQLite inválido: não contém as tabelas "utilizadores" e "registos_producao".',
          category: 'danger',
        });
        return;
      }

      db.close();
      db = tempDb;
      saveDatabaseToDisk();

      res.json({
        ok: true,
        message: 'Base de dados base_dados_nr.db restaurada com sucesso!',
        category: 'success',
      });
    } catch (err) {
      res.status(400).json({
        ok: false,
        message: `Erro ao ler o ficheiro SQLite: ${
          err instanceof Error ? err.message : String(err)
        }`,
        category: 'danger',
      });
    }
  });

  // ============================================================================
  // VITE MIDDLEWARE (Dev) / STATIC ASSETS (Prod)
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Servidor Intranet DDPCD (Produção SQLite) ativo em http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
