import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from './config.js';

const { Pool } = pg;

// ============================================================================
// POOL DE CONEXÕES — Otimizado para alto throughput
// ============================================================================
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,                       // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,      // Fechar conexão idle após 30s
  connectionTimeoutMillis: 5000, // Timeout de conexão 5s
  ssl: config.databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

// Log de conexão
pool.on('connect', () => {
  console.log('📦 Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool PostgreSQL:', err.message);
});

// ============================================================================
// HELPER: query simplificada
// ============================================================================
export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

// ============================================================================
// INICIALIZAÇÃO DO BANCO
// ============================================================================
export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Tabelas ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        cpf TEXT UNIQUE,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefone TEXT,
        "senhaHash" TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('ADMIN','GESTOR','OPERADOR','VISUALIZADOR')),
        ativo BOOLEAN DEFAULT true,
        "ultimoLogin" TIMESTAMPTZ,
        "tentativasLoginFalhas" INTEGER DEFAULT 0,
        "bloqueadoAte" TIMESTAMPTZ,
        "criadoPor" TEXT,
        "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        avatar TEXT,
        departamento TEXT,
        cargo TEXT,
        "deveTrocarSenha" BOOLEAN DEFAULT false,
        "historicoSenhas" JSONB DEFAULT '[]',
        "senhaAlteradaEm" TIMESTAMPTZ,
        "deletedAt" TIMESTAMPTZ,
        "googleId" TEXT UNIQUE,
        "loginProvider" TEXT DEFAULT 'local' CHECK("loginProvider" IN ('local','google'))
      );

      CREATE TABLE IF NOT EXISTS metas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        "valorMetaCentavos" BIGINT NOT NULL,
        "unidadeMeta" TEXT NOT NULL DEFAULT 'BRL' CHECK("unidadeMeta" IN ('BRL','PERCENTUAL','UNIDADE','KM')),
        ano INTEGER NOT NULL,
        "periodoInicio" DATE NOT NULL,
        "periodoFim" DATE NOT NULL,
        "indicadorMacro" TEXT,
        "periodicidadeAtualizacao" TEXT NOT NULL CHECK("periodicidadeAtualizacao" IN ('SEMANAL','QUINZENAL','MENSAL','TRIMESTRAL','QUADRIMESTRAL','SEMESTRAL')),
        "tipoCurva" TEXT NOT NULL CHECK("tipoCurva" IN ('LINEAR','PERSONALIZADA')),
        "curvaPersonalizada" JSONB,
        status TEXT NOT NULL CHECK(status IN ('ATIVA','CONCLUIDA','CANCELADA')),
        "criadoPor" TEXT NOT NULL REFERENCES users(id),
        "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS projetos (
        id TEXT PRIMARY KEY,
        "metaId" TEXT REFERENCES metas(id),
        nome TEXT NOT NULL,
        "contribuicaoEsperadaCentavos" BIGINT NOT NULL,
        "pesoAutomatico" DOUBLE PRECISION NOT NULL,
        "prazoInicio" DATE,
        "prazoFim" DATE,
        "responsavelPrincipal" TEXT REFERENCES users(id),
        responsaveis JSONB DEFAULT '[]',
        status TEXT NOT NULL CHECK(status IN ('NAO_INICIADO','EM_ANDAMENTO','CONCLUIDO','CANCELADO')),
        "criadoPor" TEXT NOT NULL REFERENCES users(id),
        "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS indicadores (
        id TEXT PRIMARY KEY,
        "projetoId" TEXT REFERENCES projetos(id),
        "metaId" TEXT REFERENCES metas(id),
        nome TEXT NOT NULL,
        "metaIndicadorCentavos" BIGINT NOT NULL,
        "realizadoCentavos" BIGINT NOT NULL DEFAULT 0,
        unidade TEXT NOT NULL,
        peso DOUBLE PRECISION NOT NULL,
        "frequenciaAtualizacao" TEXT NOT NULL CHECK("frequenciaAtualizacao" IN ('MENSAL','QUINZENAL','SEMANAL')),
        responsavel TEXT NOT NULL REFERENCES users(id),
        "dataUltimaAtualizacao" TIMESTAMPTZ,
        "statusAtualizacao" TEXT DEFAULT 'PENDENTE' CHECK("statusAtualizacao" IN ('ATUALIZADO','PENDENTE','ATRASADO')),
        "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS historico_indicadores (
        id TEXT PRIMARY KEY,
        "indicadorId" TEXT NOT NULL REFERENCES indicadores(id),
        data DATE NOT NULL,
        "valorCentavos" BIGINT NOT NULL,
        "atualizadoPor" TEXT NOT NULL REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS auditoria (
        id TEXT PRIMARY KEY,
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "userId" TEXT NOT NULL REFERENCES users(id),
        acao TEXT NOT NULL,
        entidade TEXT NOT NULL,
        "entidadeId" TEXT NOT NULL,
        "dadosAnteriores" JSONB,
        "dadosNovos" JSONB,
        ip TEXT,
        "userAgent" TEXT
      );
    `);

    // ── Indexes ──
    // Os indexes foram movidos para a linha 230 (após migrations) para garantir que colunas existam

    // ── Trigger: auditoria imutável ──
    await client.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_modification()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'Registros de auditoria são imutáveis';
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS prevent_audit_update ON auditoria;
      CREATE TRIGGER prevent_audit_update
        BEFORE UPDATE ON auditoria
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

      DROP TRIGGER IF EXISTS prevent_audit_delete ON auditoria;
      CREATE TRIGGER prevent_audit_delete
        BEFORE DELETE ON auditoria
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
    `);

    // ── Migrations para bancos existentes ──
    await client.query(`
      ALTER TABLE users ALTER COLUMN cpf DROP NOT NULL;

      -- Indicadores: projetoId agora é opcional
      ALTER TABLE indicadores ALTER COLUMN "projetoId" DROP NOT NULL;

      -- Novo campo: vínculo direto indicador → meta (sem projeto)
      DO $$ BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'indicadores' AND column_name = 'metaId'
          ) THEN
              ALTER TABLE indicadores ADD COLUMN "metaId" TEXT REFERENCES metas(id);
          END IF;
      END $$;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='metas' AND column_name='unidadeMeta') THEN
          ALTER TABLE metas ADD COLUMN "unidadeMeta" TEXT NOT NULL DEFAULT 'BRL';
        END IF;
      END $$;

      ALTER TABLE metas ALTER COLUMN "indicadorMacro" DROP NOT NULL;

      ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_periodicidadeAtualizacao_check;
      ALTER TABLE metas ADD CONSTRAINT metas_periodicidadeAtualizacao_check
        CHECK("periodicidadeAtualizacao" IN ('SEMANAL','QUINZENAL','MENSAL','TRIMESTRAL','QUADRIMESTRAL','SEMESTRAL'));

      ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_unidadeMeta_check;
      ALTER TABLE metas ADD CONSTRAINT metas_unidadeMeta_check
        CHECK("unidadeMeta" IN ('BRL','PERCENTUAL','UNIDADE','KM'));

      -- Projetos: prazo e responsável agora são opcionais
      ALTER TABLE projetos ALTER COLUMN "prazoInicio" DROP NOT NULL;
      ALTER TABLE projetos ALTER COLUMN "prazoFim" DROP NOT NULL;
      ALTER TABLE projetos ALTER COLUMN "responsavelPrincipal" DROP NOT NULL;
      ALTER TABLE projetos ALTER COLUMN responsaveis SET DEFAULT '[]';
      
      -- Fase 2: Projetos: metaId agora é opcional (Projetos Avulsos)
      ALTER TABLE projetos ALTER COLUMN "metaId" DROP NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Banco PostgreSQL inicializado com sucesso');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao inicializar banco:', err);
    throw err;
  } finally {
    client.release();
  }
}
