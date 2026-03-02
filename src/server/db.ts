import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
export const db = new Database(dbPath);

// Initialize database schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senhaHash TEXT NOT NULL,
      role TEXT NOT NULL,
      ativo INTEGER DEFAULT 1,
      ultimoLogin TEXT,
      tentativasLoginFalhas INTEGER DEFAULT 0,
      bloqueadoAte TEXT,
      criadoPor TEXT,
      criadoEm TEXT NOT NULL,
      avatar TEXT,
      departamento TEXT,
      cargo TEXT
    );

    CREATE TABLE IF NOT EXISTS metas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      valorMeta REAL NOT NULL,
      ano INTEGER NOT NULL,
      periodoInicio TEXT NOT NULL,
      periodoFim TEXT NOT NULL,
      indicadorMacro TEXT NOT NULL,
      periodicidadeAtualizacao TEXT NOT NULL,
      tipoCurva TEXT NOT NULL,
      curvaPersonalizada TEXT, -- JSON array
      status TEXT NOT NULL,
      criadoPor TEXT NOT NULL,
      criadoEm TEXT NOT NULL,
      atualizadoEm TEXT NOT NULL,
      FOREIGN KEY (criadoPor) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projetos (
      id TEXT PRIMARY KEY,
      metaId TEXT NOT NULL,
      nome TEXT NOT NULL,
      contribuicaoEsperada REAL NOT NULL,
      pesoAutomatico REAL NOT NULL,
      prazoInicio TEXT NOT NULL,
      prazoFim TEXT NOT NULL,
      responsavelPrincipal TEXT NOT NULL,
      responsaveis TEXT NOT NULL, -- JSON array of user IDs
      status TEXT NOT NULL,
      criadoPor TEXT NOT NULL,
      criadoEm TEXT NOT NULL,
      atualizadoEm TEXT NOT NULL,
      FOREIGN KEY (metaId) REFERENCES metas(id),
      FOREIGN KEY (responsavelPrincipal) REFERENCES users(id),
      FOREIGN KEY (criadoPor) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS indicadores (
      id TEXT PRIMARY KEY,
      projetoId TEXT NOT NULL,
      nome TEXT NOT NULL,
      metaIndicador REAL NOT NULL,
      realizado REAL NOT NULL DEFAULT 0,
      unidade TEXT NOT NULL,
      peso REAL NOT NULL,
      frequenciaAtualizacao TEXT NOT NULL,
      responsavel TEXT NOT NULL,
      dataUltimaAtualizacao TEXT,
      statusAtualizacao TEXT,
      historicoRealizados TEXT DEFAULT '[]', -- JSON array
      FOREIGN KEY (projetoId) REFERENCES projetos(id),
      FOREIGN KEY (responsavel) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      userId TEXT NOT NULL,
      acao TEXT NOT NULL,
      entidade TEXT NOT NULL,
      entidadeId TEXT NOT NULL,
      dadosAnteriores TEXT,
      dadosNovos TEXT,
      ip TEXT,
      userAgent TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT 1 FROM users WHERE email = ?').get('admin@saritur.com.br');
  if (!adminExists) {
    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync('Admin@1234', salt);
    db.prepare(\`
      INSERT INTO users (id, nome, email, senhaHash, role, ativo, criadoEm, departamento, cargo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`).run(
      crypto.randomUUID(),
      'Administrador do Sistema',
      'admin@saritur.com.br',
      hash,
      'ADMIN',
      1,
      new Date().toISOString(),
      'TI',
      'Superintendente'
    );
  }
}

initDb();
