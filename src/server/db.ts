import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senhaHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN','GESTOR','OPERADOR','VISUALIZADOR')),
      ativo INTEGER DEFAULT 1,
      ultimoLogin TEXT,
      tentativasLoginFalhas INTEGER DEFAULT 0,
      bloqueadoAte TEXT,
      criadoPor TEXT,
      criadoEm TEXT NOT NULL,
      avatar TEXT,
      departamento TEXT,
      cargo TEXT,
      deveTrocarSenha INTEGER DEFAULT 0,
      historicoSenhas TEXT DEFAULT '[]',
      senhaAlteradaEm TEXT,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS metas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      valorMetaCentavos INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      periodoInicio TEXT NOT NULL,
      periodoFim TEXT NOT NULL,
      indicadorMacro TEXT NOT NULL,
      periodicidadeAtualizacao TEXT NOT NULL CHECK(periodicidadeAtualizacao IN ('MENSAL','QUINZENAL','SEMANAL')),
      tipoCurva TEXT NOT NULL CHECK(tipoCurva IN ('LINEAR','PERSONALIZADA')),
      curvaPersonalizada TEXT,
      status TEXT NOT NULL CHECK(status IN ('ATIVA','CONCLUIDA','CANCELADA')),
      criadoPor TEXT NOT NULL,
      criadoEm TEXT NOT NULL,
      atualizadoEm TEXT NOT NULL,
      deletedAt TEXT,
      FOREIGN KEY (criadoPor) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projetos (
      id TEXT PRIMARY KEY,
      metaId TEXT NOT NULL,
      nome TEXT NOT NULL,
      contribuicaoEsperadaCentavos INTEGER NOT NULL,
      pesoAutomatico REAL NOT NULL,
      prazoInicio TEXT NOT NULL,
      prazoFim TEXT NOT NULL,
      responsavelPrincipal TEXT NOT NULL,
      responsaveis TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('NAO_INICIADO','EM_ANDAMENTO','CONCLUIDO','CANCELADO')),
      criadoPor TEXT NOT NULL,
      criadoEm TEXT NOT NULL,
      atualizadoEm TEXT NOT NULL,
      deletedAt TEXT,
      FOREIGN KEY (metaId) REFERENCES metas(id),
      FOREIGN KEY (responsavelPrincipal) REFERENCES users(id),
      FOREIGN KEY (criadoPor) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS indicadores (
      id TEXT PRIMARY KEY,
      projetoId TEXT NOT NULL,
      nome TEXT NOT NULL,
      metaIndicadorCentavos INTEGER NOT NULL,
      realizadoCentavos INTEGER NOT NULL DEFAULT 0,
      unidade TEXT NOT NULL,
      peso REAL NOT NULL,
      frequenciaAtualizacao TEXT NOT NULL CHECK(frequenciaAtualizacao IN ('MENSAL','QUINZENAL','SEMANAL')),
      responsavel TEXT NOT NULL,
      dataUltimaAtualizacao TEXT,
      statusAtualizacao TEXT DEFAULT 'PENDENTE' CHECK(statusAtualizacao IN ('ATUALIZADO','PENDENTE','ATRASADO')),
      criadoEm TEXT NOT NULL,
      atualizadoEm TEXT NOT NULL,
      deletedAt TEXT,
      FOREIGN KEY (projetoId) REFERENCES projetos(id),
      FOREIGN KEY (responsavel) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS historico_indicadores (
      id TEXT PRIMARY KEY,
      indicadorId TEXT NOT NULL,
      data TEXT NOT NULL,
      valorCentavos INTEGER NOT NULL,
      atualizadoPor TEXT NOT NULL,
      FOREIGN KEY (indicadorId) REFERENCES indicadores(id),
      FOREIGN KEY (atualizadoPor) REFERENCES users(id)
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

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_metas_status ON metas(status);
    CREATE INDEX IF NOT EXISTS idx_metas_ano ON metas(ano);
    CREATE INDEX IF NOT EXISTS idx_projetos_metaId ON projetos(metaId);
    CREATE INDEX IF NOT EXISTS idx_projetos_responsavel ON projetos(responsavelPrincipal);
    CREATE INDEX IF NOT EXISTS idx_projetos_status ON projetos(status);
    CREATE INDEX IF NOT EXISTS idx_indicadores_projetoId ON indicadores(projetoId);
    CREATE INDEX IF NOT EXISTS idx_indicadores_responsavel ON indicadores(responsavel);
    CREATE INDEX IF NOT EXISTS idx_historico_indicadorId ON historico_indicadores(indicadorId);
    CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_indicadores(data);
    CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria(timestamp);
    CREATE INDEX IF NOT EXISTS idx_auditoria_userId ON auditoria(userId);
    CREATE INDEX IF NOT EXISTS idx_auditoria_entidade ON auditoria(entidade, entidadeId);

    -- Audit immutability triggers
    CREATE TRIGGER IF NOT EXISTS prevent_audit_update
    BEFORE UPDATE ON auditoria
    BEGIN
      SELECT RAISE(ABORT, 'Registros de auditoria são imutáveis');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
    BEFORE DELETE ON auditoria
    BEGIN
      SELECT RAISE(ABORT, 'Registros de auditoria não podem ser excluídos');
    END;
  `);

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT 1 FROM users WHERE email = ?').get('admin@saritur.com.br');
  if (!adminExists) {
    const salt = bcrypt.genSaltSync(config.bcryptRounds);
    const hash = bcrypt.hashSync('Admin@1234', salt);
    db.prepare(`
      INSERT INTO users (id, nome, email, senhaHash, role, ativo, criadoEm, departamento, cargo, deveTrocarSenha, historicoSenhas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      'Administrador do Sistema',
      'admin@saritur.com.br',
      hash,
      'ADMIN',
      1,
      new Date().toISOString(),
      'TI',
      'Superintendente',
      1,
      JSON.stringify([hash])
    );
  }
}

initDb();
