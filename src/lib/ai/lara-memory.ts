/**
 * Lara Memory — Sistema de Memória Persistente
 *
 * Permite à Lara aprender com correções do usuário, lembrar do que já discutiu,
 * e dar continuidade natural às conversas sem parecer bot.
 *
 * Tabela: lara_learnings (criada automaticamente via ensureTable)
 */

import { Pool } from 'pg'

// Pool dedicado para operações de memória
let memoryPool: Pool | null = null

function getPool(): Pool {
    if (!memoryPool) {
        memoryPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 3, // Pool pequeno — operações leves
        })
    }
    return memoryPool
}

// ============================================================================
// SCHEMA — Auto-criação da tabela
// ============================================================================

let tableEnsured = false

async function ensureTable(): Promise<void> {
    if (tableEnsured) return
    const pool = getPool()
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lara_learnings (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL DEFAULT 'default',
                category VARCHAR(50) NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                source VARCHAR(20) DEFAULT 'chat',
                confidence FLOAT DEFAULT 1.0,
                times_referenced INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_lara_learnings_category 
                ON lara_learnings(category);
            CREATE INDEX IF NOT EXISTS idx_lara_learnings_key 
                ON lara_learnings(key);
            CREATE INDEX IF NOT EXISTS idx_lara_learnings_user_id 
                ON lara_learnings(user_id);
        `)
        tableEnsured = true
    } catch (err) {
        console.error('[Lara Memory] Erro ao criar tabela:', err)
    }
}

// ============================================================================
// TIPOS
// ============================================================================

export interface LaraLearning {
    id: number
    user_id: string
    category: 'correction' | 'preference' | 'context' | 'terminology' | 'history'
    key: string
    value: string
    source: 'chat' | 'system' | 'manual'
    confidence: number
    times_referenced: number
    created_at: Date
    updated_at: Date
}

// ============================================================================
// OPERAÇÕES CRUD
// ============================================================================

/**
 * Salva um aprendizado. Se a key já existe na mesma categoria,
 * atualiza o value e incrementa times_referenced.
 */
export async function saveLearning(
    userId: string,
    category: LaraLearning['category'],
    key: string,
    value: string,
    source: LaraLearning['source'] = 'chat'
): Promise<void> {
    await ensureTable()
    const pool = getPool()

    try {
        await pool.query(`
            INSERT INTO lara_learnings (user_id, category, key, value, source)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT ON CONSTRAINT lara_learnings_user_category_key_unique
            DO UPDATE SET
                value = EXCLUDED.value,
                times_referenced = lara_learnings.times_referenced + 1,
                updated_at = NOW(),
                confidence = LEAST(lara_learnings.confidence + 0.1, 1.0)
        `, [userId, category, key, value, source])
    } catch (err) {
        if ((err as { code?: string }).code === '42P01' || (err as { code?: string }).code === '42P10') {
            return
        }
        try {
            await pool.query(`
                INSERT INTO lara_learnings (user_id, category, key, value, source)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, category, key, value, source])
        } catch {
            console.error('[Lara Memory] Erro ao salvar learning:', err)
        }
    }
}

/**
 * Busca aprendizados relevantes para o contexto atual.
 * Retorna os mais referenciados e recentes.
 */
export async function getRelevantLearnings(
    userId: string,
    categories?: LaraLearning['category'][],
    limit = 15
): Promise<LaraLearning[]> {
    await ensureTable()
    const pool = getPool()

    try {
        let query = `
            SELECT * FROM lara_learnings WHERE user_id = $1
        `
        const params: (string | string[] | number)[] = [userId]

        if (categories && categories.length > 0) {
            query += ` AND category = ANY($2)`
            params.push(categories)
        }

        query += ` ORDER BY times_referenced DESC, updated_at DESC LIMIT $${params.length + 1}`
        params.push(limit)

        const result = await pool.query(query, params)
        return result.rows as LaraLearning[]
    } catch (err) {
        console.error('[Lara Memory] Erro ao buscar learnings:', err)
        return []
    }
}

/**
 * Gera um resumo compacto dos aprendizados para injetar no contexto.
 * Formatado como texto corrido para o LLM entender.
 */
export async function getLearningsSummary(userId: string): Promise<string> {
    const learnings = await getRelevantLearnings(userId, undefined, 20)

    if (learnings.length === 0) return ''

    const corrections = learnings.filter(l => l.category === 'correction' || l.category === 'terminology')
    const preferences = learnings.filter(l => l.category === 'preference')
    const history = learnings.filter(l => l.category === 'history')
    const context = learnings.filter(l => l.category === 'context')

    let summary = '\n═══ MEMÓRIA DA LARA ═══\n'

    if (corrections.length > 0) {
        summary += '\nTerminologia/Correções aprendidas:\n'
        corrections.forEach(c => {
            summary += `- ${c.key}: ${c.value}\n`
        })
    }

    if (preferences.length > 0) {
        summary += '\nPreferências do usuário:\n'
        preferences.forEach(p => {
            summary += `- ${p.key}: ${p.value}\n`
        })
    }

    if (history.length > 0) {
        summary += '\nÚltimos tópicos discutidos (para continuidade):\n'
        history.slice(0, 5).forEach(h => {
            summary += `- ${h.value}\n`
        })
    }

    if (context.length > 0) {
        summary += '\nContexto acumulado:\n'
        context.slice(0, 5).forEach(c => {
            summary += `- ${c.key}: ${c.value}\n`
        })
    }

    summary += '\nUse essas informações para dar continuidade natural, não repetir o que já foi dito, e aplicar as correções aprendidas.\n'

    return summary
}

/**
 * Salva um resumo da conversa mais recente como histórico.
 */
export async function saveConversationSummary(
    userId: string,
    pageContext: string,
    userMessage: string,
    laraResponse: string
): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0]
    const summary = `[${timestamp}] Usuário perguntou sobre "${userMessage.slice(0, 80)}..." → Lara respondeu sobre ${extractMainTopic(laraResponse)}`

    await saveLearning(userId, 'history', `conv_${timestamp}_${Date.now()}`, summary, 'system')
}

/**
 * Extrai correções automaticamente da mensagem do usuário.
 * Detecta padrões como "X significa Y", "X não é Y, é Z", "X = Y", etc.
 */
export async function extractLearnings(
    userId: string,
    userMessage: string,
    _laraResponse: string
): Promise<void> {
    const patterns = [
        // "RT significa Round Trip"
        /(\w+[\w\s]*)\s+(?:significa|quer dizer|é a sigla de|é sigla de)\s+(.+)/i,
        // "RT = Round Trip"
        /(\w+[\w\s]*)\s*=\s*(.+)/i,
        // "não é X, é Y" / "não é X mas sim Y"
        /(?:não é|nao é)\s+(.+?)(?:,\s*(?:é|mas sim|mas é|e sim)\s+)(.+)/i,
        // "X na verdade é Y"
        /(\w+[\w\s]*)\s+na verdade\s+(?:é|significa|quer dizer)\s+(.+)/i,
        // "quando falo X me refiro a Y"
        /quando (?:falo|digo|menciono)\s+(.+?)\s+(?:me refiro|quero dizer|estou falando)\s+(?:a\s+)?(.+)/i,
    ]

    for (const pattern of patterns) {
        const match = userMessage.match(pattern)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/[.!?]$/, '')
            await saveLearning(userId, 'terminology', key, value, 'chat')
            break // One learning per message
        }
    }
}

// Helper
function extractMainTopic(text: string): string {
    // Pega as primeiras palavras significativas
    const words = text.replace(/[📊🔍📈📉⚡🎯💡🔥⚠️👀😅💬🚀👏💪⏳]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 8)
        .join(' ')
    return words || 'dados gerais'
}

// ============================================================================
// SETUP — Criar constraint de unicidade se não existir
// ============================================================================

let constraintEnsured = false

export async function ensureConstraints(): Promise<void> {
    if (constraintEnsured) return
    await ensureTable()
    const pool = getPool()

    try {
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'lara_learnings_user_category_key_unique'
                ) THEN
                    ALTER TABLE lara_learnings 
                    ADD CONSTRAINT lara_learnings_user_category_key_unique 
                    UNIQUE (user_id, category, key);
                END IF;
            END
            $$;
        `)
        constraintEnsured = true
    } catch (err) {
        // 42P07 = relation already exists — safe to ignore
        if ((err as { code?: string }).code === '42P07') {
            constraintEnsured = true
            return
        }
        console.error('[Lara Memory] Erro ao criar constraints:', err)
    }
}
