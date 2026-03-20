/**
 * Gemini AI Service - Saritur CX
 * 
 * Integração com Google Gemini para análises inteligentes de PDVs
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF + JITTER
// ============================================================================

interface RetryOptions {
    maxRetries?: number
    baseDelayMs?: number
    maxDelayMs?: number
}

/**
 * Executes an async function with exponential backoff retry on 429/5xx errors.
 * Respects Retry-After / retryDelay from Gemini API when available.
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const { maxRetries = 3, baseDelayMs = 2000, maxDelayMs = 30000 } = options

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error: unknown) {
            const isLastAttempt = attempt === maxRetries

            // Extract status from Gemini SDK errors
            const status = (error as { status?: number })?.status
            const message = error instanceof Error ? error.message : String(error)

            // Only retry on rate limit (429) or server errors (5xx)
            const isRetryable = status === 429 || (status && status >= 500) || message.includes('429') || message.includes('Too Many Requests')

            if (!isRetryable || isLastAttempt) {
                throw error
            }

            // Try to extract suggested retry delay from error message
            let delay = baseDelayMs * Math.pow(2, attempt)
            const retryMatch = message.match(/retry in (\d+\.?\d*)s/i)
            if (retryMatch) {
                delay = Math.max(delay, parseFloat(retryMatch[1]) * 1000)
            }

            // Cap delay + add jitter (±25%)
            delay = Math.min(delay, maxDelayMs)
            const jitter = delay * 0.25 * (Math.random() * 2 - 1)
            delay = Math.round(delay + jitter)

            console.warn(`[Gemini Retry] Attempt ${attempt + 1}/${maxRetries} failed (${status || 'unknown'}). Retrying in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    // TypeScript: this line is unreachable but satisfies the compiler
    throw new Error('withRetry: exhausted all retries')
}

// Inicializar SDK com API Key
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY não configurada. Análises de IA desabilitadas.')
}

// Instância do Gemini
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

// Modelo principal (Flash é mais rápido e econômico)
// Nota: gemini-1.5-flash foi descontinuado - usando gemini-2.0-flash (disponível até Mar/2026)
export const geminiModel: GenerativeModel | null = genAI
    ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    : null

// Contexto de negócio para o modelo entender o domínio
export const SYSTEM_CONTEXT = `
Você é um **ANALISTA SÊNIOR DE CX (Customer Experience)** da Saritur, uma empresa de transporte rodoviário.
Sua missão é identificar PROBLEMAS e OPORTUNIDADES DE MELHORIA nos PDVs, mesmo quando os scores parecem bons.

## SUA PERSONA
- Você é EXIGENTE e CRITERIOSO - scores acima de 70 não significam que está "tudo bem"
- Você sempre busca MELHORIAS, mesmo em PDVs com bom desempenho
- Você é DIRETO e OBJETIVO - não enrola nem usa linguagem vaga
- Você prioriza AÇÕES PRÁTICAS ao invés de elogios genéricos
- Se um componente está abaixo de 100, ELE PODE MELHORAR - aponte isso

## REGRAS DE ANÁLISE CRÍTICA

### ⚠️ NUNCA diga que está "tudo bem" se:
- Qualquer componente estiver abaixo de 90 (há espaço para melhoria)
- Seguro Viagem estiver abaixo de 100 (oportunidade perdida de receita)
- Frequência estiver abaixo de 100% do esperado (perda de vendas)
- Tendência for negativa, mesmo que pequena (sinal de alerta)
- Recência for > 0 dias (PDV não vendeu hoje - por quê?)

### 🔍 O que você DEVE analisar criticamente:
1. **Recência**: 0 dias = ótimo. 1+ dias = por que não vendeu ontem?
2. **Frequência**: < 100% = PDV está ABAIXO do próprio potencial
3. **Tendência**: Negativa = problema. Estagnada = estagnação. Só positiva é bom
4. **Seguro**: < 100% = dinheiro deixado na mesa (receita perdida)
5. **Metas**: Não bateu = falhou. Bateu 50% = metade do potencial

### 📊 Classificação REAL de saúde:
- 90-100: BOM (mas sempre há ajustes finos)
- 70-89: ATENÇÃO (precisa melhorar)  
- 50-69: PROBLEMA (requer ação urgente)
- < 50: CRÍTICO (intervenção imediata)

## CONTEXTO DO NEGÓCIO

### O que são PDVs
- Pontos de Venda que comercializam passagens de ônibus
- Podem ser: Próprios, Terceirizados, Embarcadas ou Internet
- Vinculados a empresas: Saritur ou Transnorte

### Health Score (0-100) - Composição
| Componente | Peso | O que significa |
|------------|------|-----------------|
| Recência | 20% | Dias desde última venda |
| Frequência | 25% | % de vendas vs média esperada |
| Tendência | 20% | Crescimento/queda nas vendas |
| Seguro | 10% | Taxa de conversão de seguro viagem |
| Metas | 15% | Histórico de cumprimento de metas |
| Evolutivo | 10% | Projeção do mês atual |

### Clusters de Comportamento
- **TERMINAL**: PDV próprio de alto volume
- **ESTRELA**: Alta frequência + crescimento + vende seguro
- **CRESCENDO**: Tendência > 10%
- **REGULAR**: Comportamento estável
- **DORMENTE**: Baixa atividade
- **EM_RISCO**: Recência alta ou tendência negativa

## DIRETRIZES DE RESPOSTA
1. Seja DIRETO - vá ao ponto
2. Aponte PROBLEMAS primeiro, depois soluções
3. Use dados específicos do PDV na análise
4. Sugira ações com prazos concretos (ex: "esta semana", "até sexta")
5. Responda em português brasileiro
6. Use emojis para destacar severidade
`

// Tipos para análise
export interface PdvAnalysisInput {
    nome: string
    empresa: string
    tipo?: string
    healthScore: number
    // 8 Componentes detalhados do Health Score
    componentes: {
        recencia: { score: number; diasSemVenda?: number; diasEsperado?: number; status?: string }
        frequencia: { score: number; atual?: number; esperada?: number; percentualEntrega?: number; status?: string }
        tendencia: {
            score: number
            status?: string
            // V3 Multi-Janela
            momentum?: number          // Momentum composto (%)
            zScore?: number            // Z-Score (significância estatística)
            volatilidade?: number      // Volatilidade histórica
            confianca?: string         // alta | media | baixa | insuficiente
            diasComVenda?: number
            perfilCalculado?: Record<string, unknown>
            // Legado (retrocompat)
            slopeAtual?: number
            desvioSlope?: number
            valorAtual?: number
            descricao?: string
            detalhes?: string
        }
        seguro: { score: number; taxa?: number }
        metas?: { score: number; mesesBatidos?: number; totalMeses?: number; status?: string }
        evolutivo?: { score: number; percentualMeta?: number; status?: string }
        nps?: { score: number; status?: string }
        psat?: { score: number; status?: string }
    }
    cluster?: string
    recomendacoes?: { tipo: string; titulo: string; descricao: string }[]
    // Perfil histórico do PDV (sazonalidade, frequência)
    perfilBaseline?: {
        sazonalidadeSemanal?: Record<string, number> | null
        sazonalidadeMensal?: Record<string, number | { indice: number; observacoes: number }> | null
        freqMediaHistorica?: number
        diasDeDados?: number
    }
    // Ticket médio recente
    ticketMedio?: {
        atual?: number | null
        anterior?: number | null
        variacao?: number | null
    }
    // ===== P1: Momentum de Receita =====
    momentumReceita?: {
        composto?: number           // % momentum receita ponderado
        curto?: number              // 14d
        medio?: number              // 30d
        longo?: number              // 90d
        receitaDiariaAtual?: number // R$/dia (14d)
        receitaDiariaAnterior?: number // R$/dia (14d anterior)
    }
    // ===== P2: Aceleração =====
    aceleracao?: {
        volume?: number             // Mudança de velocidade volume
        receita?: number            // Mudança de velocidade receita
        status?: string             // acelerando_positivo | estavel | desacelerando | desacelerando_rapido
    }
    // ===== P5: Revenue Leakage =====
    revenuLeakage?: {
        detectado?: boolean
        divergencia?: number
        descricao?: string
    }
    // ===== Fase 3C: DNA do PDV =====
    dna?: {
        diasFortes?: string[]
        semanaMesMaisForte?: number
        classePrincipal?: string
        classesDisponiveis?: string[]
        concentracaoClasse?: number
        rotaPrincipal?: string | null
        totalRotas?: number
        concentracaoRota?: number
        ticketMedioGeral?: number
        ticketPorClasse?: Record<string, number>
    }
    // ===== Fase 3D: Contexto de Eventos =====
    evento?: {
        temEvento?: boolean
        contexto?: string           // normal | feriado | vespera_feriado | pos_feriado | ponte | evento_sazonal
        fatorAjuste?: number        // < 1.0 = esperado menos vendas
        descricaoResumida?: string
        eventos?: { tipo: string; nome: string; impactoEsperado: string; descricao: string }[]
    }
}

export interface CarteiraAnalysisInput {
    totalPdvs: number
    scoreMedio: number
    scoreMediana: number
    distribuicao: {
        saudavel: number
        atencao: number
        critico: number
    }
    percentuais?: {
        excelencia: number
        qualidade: number
        atencao: number
        critico: number
    }
    clusters: Record<string, number>
    tendenciaMes?: number
    // Expandidos com dados ricos
    topPdvs?: { nome: string; score: number; tendencia: number; faturamento?: number; ticket_medio?: number; recencia_dias?: number; frequencia_semanal?: number; mix_classes?: number; cluster?: string; tipo?: string | null; classificacao?: string | null }[]
    bottomPdvs?: { nome: string; score: number; tendencia: number; faturamento?: number; ticket_medio?: number; recencia_dias?: number; frequencia_semanal?: number; mix_classes?: number; cluster?: string; tipo?: string | null; classificacao?: string | null }[]
    // Novos campos enriquecidos
    pdvsScoreZero?: string[]
    pdvsEmQuedaForte?: { nome: string; score: number; tendencia: number; faturamento?: number; ticket_medio?: number }[]
    pdvsInativos3d?: { nome: string; dias: number; score: number }[]
    alertasCarteira?: { tipo: string; quantidade: number; descricao: string }[]
    emAltaForte?: number
    emQuedaForte?: number
    faturamentoTotal?: number
    ticketMedioCarteira?: number
}

/**
 * Analisa um PDV individual e gera insights baseados nos componentes do Health Score
 */
export async function analisarPdv(pdv: PdvAnalysisInput): Promise<string> {
    if (!geminiModel) {
        return 'Análise de IA indisponível. Configure GEMINI_API_KEY.'
    }

    // Preparar dados formatados para o prompt
    const healthScore = pdv.healthScore
    const c = pdv.componentes

    // Dados V3 de tendência
    const momentum = c.tendencia.momentum ?? c.tendencia.valorAtual ?? 0
    const zScore = c.tendencia.zScore ?? 0
    const volatilidade = c.tendencia.volatilidade ? (c.tendencia.volatilidade * 100).toFixed(0) : 'N/A'
    const confianca = c.tendencia.confianca || 'N/A'
    const pc = c.tendencia.perfilCalculado as Record<string, unknown> | undefined

    // Sazonalidade semanal
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const sazSemanal = pdv.perfilBaseline?.sazonalidadeSemanal
    const sazonalidadeStr = sazSemanal
        ? diasSemana.map((dia, i) => `${dia}: ${((sazSemanal as Record<string, number>)[i.toString()] || 0).toFixed(1)}`).join(' | ')
        : 'Não disponível'

    // Ticket médio
    const ticket = pdv.ticketMedio
    const ticketStr = ticket?.atual
        ? `R$ ${ticket.atual.toFixed(2)} (anterior: R$ ${(ticket.anterior || 0).toFixed(2)}, variação: ${(ticket.variacao || 0).toFixed(1)}%)`
        : 'Não disponível'

    // Janelas multi-janela
    const janelasStr = pc
        ? `Curta(14d): ${(pc.momentumCurto as number)?.toFixed(1) || 'N/A'}% | Média(30d): ${(pc.momentumMedio as number)?.toFixed(1) || 'N/A'}% | Longa(90d): ${(pc.momentumLongo as number)?.toFixed(1) || 'N/A'}%`
        : 'Dados multi-janela não disponíveis'

    // P1: Receita
    const momReceita = pdv.momentumReceita
    const receitaStr = momReceita?.composto !== undefined
        ? `${momReceita.composto.toFixed(1)}% (Curta: ${momReceita.curto?.toFixed(1) || 'N/A'}% | Média: ${momReceita.medio?.toFixed(1) || 'N/A'}% | Longa: ${momReceita.longo?.toFixed(1) || 'N/A'}%)`
        : 'Dados não disponíveis'
    const receitaDiariaStr = momReceita?.receitaDiariaAtual
        ? `R$ ${momReceita.receitaDiariaAtual.toFixed(2)}/dia (anterior: R$ ${(momReceita.receitaDiariaAnterior || 0).toFixed(2)}/dia)`
        : 'N/A'

    // P2: Aceleração
    const acel = pdv.aceleracao
    const acelStr = acel?.status || 'estavel'
    const acelDetalhe = acel?.volume !== undefined
        ? `Volume: ${acel.volume.toFixed(1)}pp | Receita: ${(acel.receita || 0).toFixed(1)}pp`
        : 'N/A'

    // P5: Revenue Leakage
    const leakage = pdv.revenuLeakage
    const leakageStr = leakage?.detectado
        ? `⚠️ DETECTADO — ${leakage.descricao} (divergência: ${(leakage.divergencia || 0).toFixed(1)}%)`
        : '✅ Não detectado'

    // DNA do PDV (Fase 3C)
    const dna = pdv.dna
    const dnaStr = dna ? [
        `Dias fortes: ${dna.diasFortes?.join(', ') || 'N/A'}`,
        `Semana mais forte do mês: ${dna.semanaMesMaisForte || 'N/A'}ª semana`,
        `Classe principal: ${dna.classePrincipal || 'N/A'} (${(dna.concentracaoClasse || 0).toFixed(0)}% do total)`,
        `Classes: ${dna.classesDisponiveis?.join(', ') || 'N/A'}`,
        `Rota principal: ${dna.rotaPrincipal || 'N/A'} (${(dna.concentracaoRota || 0).toFixed(0)}% das vendas)`,
        `Total de rotas: ${dna.totalRotas || 0}`,
        `Ticket geral: R$ ${(dna.ticketMedioGeral || 0).toFixed(2)}`,
        dna.ticketPorClasse ? `Ticket por classe: ${Object.entries(dna.ticketPorClasse).map(([k, v]) => `${k}: R$${(v as number).toFixed(2)}`).join(' | ')}` : null,
    ].filter(Boolean).join('\n') : 'Dados não disponíveis'

    // Fase 3D: Contexto de Eventos
    const evento = pdv.evento
    const eventoStr = evento?.temEvento
        ? [
            `Contexto: ${evento.contexto || 'normal'}`,
            `Descrição: ${evento.descricaoResumida || 'N/A'}`,
            `Fator de ajuste: ${(evento.fatorAjuste || 1.0).toFixed(2)} (${(evento.fatorAjuste || 1) < 1 ? 'esperada queda' : 'esperado aumento'})`,
            ...(evento.eventos || []).map(e => `- ${e.nome} (${e.tipo}): ${e.descricao}`)
        ].join('\n')
        : null

    const prompt = `
Você é um CONSULTOR DE PERFORMANCE de PDVs da Saritur (transporte rodoviário).

## PDV: ${pdv.nome}
- **Empresa**: ${pdv.empresa}
- **Tipo/Cluster**: ${pdv.cluster || 'Não classificado'}
- **Health Score Geral**: ${healthScore}/100
- **Dias de histórico**: ${pdv.perfilBaseline?.diasDeDados || 'N/A'}

## COMPONENTES DO HEALTH SCORE (analise CADA um)

| Componente | Score | Detalhes |
|------------|-------|----------|
| **Recência** (20%) | ${c.recencia.score}/100 | ${c.recencia.diasSemVenda || 0} dias sem venda (esperado: ${c.recencia.diasEsperado || 'N/A'} dias) |
| **Frequência** (25%) | ${c.frequencia.score}/100 | ${c.frequencia.atual || 0} vendas/semana (esperado: ${c.frequencia.esperada || 'N/A'}) - Entrega: ${c.frequencia.percentualEntrega || 0}% |
| **Tendência V3** (20%) | ${c.tendencia.score}/100 | Momentum: ${momentum.toFixed(1)}%, Z-Score: ${zScore.toFixed(2)}, Vol: ${volatilidade}%, Confiança: ${confianca}, Status: ${c.tendencia.status || 'N/A'} |
| **Seguro Viagem** (10%) | ${c.seguro.score}/100 | Taxa de conversão: ${c.seguro.taxa || 0}% (meta: 40%) |
| **Metas** (15%) | ${c.metas?.score || 0}/100 | ${c.metas?.mesesBatidos || 0}/${c.metas?.totalMeses || 6} meses atingidos |
| **Evolutivo Mês** (10%) | ${c.evolutivo?.score || 0}/100 | ${c.evolutivo?.percentualMeta || 0}% da meta projetada |

## TENDÊNCIA — DETALHAMENTO V3 (Multi-Janela)
- **Janelas de Momentum Volume**: ${janelasStr}
- **Momentum Receita**: ${receitaStr}
- **Receita Diária**: ${receitaDiariaStr}
- **Interpretação**: Momentum positivo = vendas subindo vs período anterior. Z-Score alto (>1.5) = mudança estatisticamente significativa.
- **Descrição**: ${c.tendencia.descricao || 'N/A'}

## ACELERAÇÃO (velocidade de mudança)
- **Status**: ${acelStr}
- **Detalhe**: ${acelDetalhe}
> "acelerando_positivo" = crescimento ganhando velocidade. "desacelerando_rapido" = queda acelerando (🚨 urgente).

## REVENUE LEAKAGE (volume vs receita)
${leakageStr}
> Se detectado: volume de passagens se mantém, mas receita cai. Possível migração de classe (ex: Executivo → Convencional).

## DNA DO PDV (Perfil Comportamental — Fase 3C)
${dnaStr}
> Use esses dados para personalizar suas recomendações. Ex: se concentração de rota > 80%, alerte sobre risco de dependência.
${eventoStr ? `
## CONTEXTO DE EVENTOS (Fase 3D)
${eventoStr}
> **REGRA CRÍTICA**: Se há feriado ou evento sazonal, a queda de vendas é ESPERADA e NÃO deve ser tratada como problema real. Ajuste sua análise pelo fator de ajuste. Se fator = 0.30, vendas a 30% do normal são NORMAIS para este dia.
` : ''}

## PERFIL SEMANAL DESTE PDV (média de vendas por dia da semana)
${sazonalidadeStr}
> Use esta informação para identificar dias fortes e fracos. Sugira ações nos dias fracos.

## TICKET MÉDIO
${ticketStr}
> Compare ticket atual vs anterior para detectar migração de mix de rotas.

## TAREFA
Analise os 6 componentes acima e gere insights PRÁTICOS e ESPECÍFICOS.
- Se score < 50: CRÍTICO - precisa ação imediata
- Se score 50-69: ATENÇÃO - precisa melhorar 
- Se score 70-89: BOM - mas sempre há espaço para melhorar
- Se score 90-100: EXCELENTE - manter o ritmo

PRIORIZE a análise de Tendência V3: explique o que o momentum, z-score e as 3 janelas significam para este PDV em linguagem simples.
Se Revenue Leakage foi detectado, destaque como ALERTA PRIORITÁRIO.
Use o DNA do PDV para contextualizar suas recomendações (ex: se a classe principal é CONVENCIONAL e houve leakage, investigue).

## FORMATO (seja CONCISO, máximo 350 palavras total)
NÃO inclua título de seção como "## Análise de Performance" — comece DIRETO com ### Diagnóstico.

### Diagnóstico
[2 frases: situação geral + principal problema OU destaque]

### Foco Prioritário
[O componente mais crítico que precisa atenção + por quê + ação específica]

### Oportunidade Rápida  
[Uma ação de impacto rápido que pode ser feita esta semana, use dados do perfil semanal e DNA]

### Prognóstico
[Tendência: melhorando/estagnado/piorando baseado no momentum V3 + aceleração] + [Risco de queda nos próximos 30 dias: BAIXO/MÉDIO/ALTO]
`

    return withRetry(async () => {
        const result = await geminiModel!.generateContent(prompt)
        return result.response.text()
    })
}

/**
 * Analisa a carteira completa de PDVs com insights pré-computados
 *
 * ARQUITETURA v2: Alertas já vêm pré-calculados do frontend.
 * O Gemini NARRA — não descobre.
 */
export async function analisarCarteira(carteira: CarteiraAnalysisInput): Promise<string> {
    if (!geminiModel) {
        return 'Análise de IA indisponível. Configure GEMINI_API_KEY.'
    }

    // Montar tabela dos top/bottom para o prompt
    const formatPdvTable = (pdvs: CarteiraAnalysisInput['topPdvs']) => {
        if (!pdvs || pdvs.length === 0) return 'Nenhum'
        return pdvs.map((p, i) =>
            `${i + 1}. ${p.nome} — Score: ${p.score}, Tendência: ${p.tendencia >= 0 ? '+' : ''}${p.tendencia}%, Fat: R$${(p.faturamento || 0).toLocaleString('pt-BR')}, Ticket: R$${(p.ticket_medio || 0).toFixed(2)}, Recência: ${p.recencia_dias || 0}d, Cluster: ${p.cluster || 'N/A'}`
        ).join('\n')
    }

    // Montar alertas pré-computados
    const alertasTexto = carteira.alertasCarteira && carteira.alertasCarteira.length > 0
        ? carteira.alertasCarteira.map((a, i) => `${i + 1}. [${a.tipo.toUpperCase()}] ${a.descricao}`).join('\n')
        : 'Nenhum alerta comportamental detectado.'

    // PDVs inativos
    const inativosTexto = carteira.pdvsInativos3d && carteira.pdvsInativos3d.length > 0
        ? carteira.pdvsInativos3d.map(p => `- ${p.nome}: ${p.dias} dias sem venda (score: ${p.score})`).join('\n')
        : 'Nenhum PDV inativo há 3+ dias.'

    // PDVs score zero
    const zeroTexto = carteira.pdvsScoreZero && carteira.pdvsScoreZero.length > 0
        ? `PDVs com score ZERO: ${carteira.pdvsScoreZero.join(', ')}` : ''

    // PDVs em queda forte
    const quedaTexto = carteira.pdvsEmQuedaForte && carteira.pdvsEmQuedaForte.length > 0
        ? carteira.pdvsEmQuedaForte.map(p => `- ${p.nome}: tendência ${p.tendencia}%, score ${p.score}`).join('\n')
        : 'Nenhum PDV em queda forte (> -10%).'

    const prompt = `
Você é a analista de CX (Customer Experience) da Saritur, empresa de transporte rodoviário.
Sua missão é gerar um RELATÓRIO EXECUTIVO DENSO sobre a carteira de PDVs.

## REGRAS ABSOLUTAS
- CITE PDVs pelo NOME — nunca análise genérica
- Use DADOS CONCRETOS (scores, %, R$)
- Seja DIRETO e EXIGENTE — se algo está ruim, diga claramente
- Máximo 400 palavras total
- Não use markdown bold (**) — escreva em texto plano
- Use emojis apenas nos títulos das seções (🏥 🔴 🟢 🎯 📈)
- Priorize os ALERTAS PRÉ-COMPUTADOS — eles já foram identificados pelo sistema

## DADOS DA CARTEIRA
- Total de PDVs: ${carteira.totalPdvs}
- Score Médio: ${carteira.scoreMedio?.toFixed(1)}
- Score Mediana: ${carteira.scoreMediana}
- Faturamento Total: R$ ${(carteira.faturamentoTotal || 0).toLocaleString('pt-BR')}
- Ticket Médio da Carteira: R$ ${(carteira.ticketMedioCarteira || 0).toFixed(2)}
- Distribuição: Excelência ${carteira.percentuais?.excelencia || 0}% | Qualidade ${carteira.percentuais?.qualidade || 0}% | Atenção ${carteira.percentuais?.atencao || 0}% | Crítico ${carteira.percentuais?.critico || 0}%
- Em alta forte (>+10%): ${carteira.emAltaForte || 0} PDVs
- Em queda forte (<-10%): ${carteira.emQuedaForte || 0} PDVs

## TOP 5 MELHORES
${formatPdvTable(carteira.topPdvs)}

## BOTTOM 5 PIORES
${formatPdvTable(carteira.bottomPdvs)}

${zeroTexto ? `## PDVs COM SCORE ZERO (INOPERANTES)\n${zeroTexto}` : ''}

## PDVs INATIVOS (3+ dias sem venda)
${inativosTexto}

## PDVs EM QUEDA FORTE
${quedaTexto}

## ALERTAS COMPORTAMENTAIS PRÉ-COMPUTADOS
${alertasTexto}

## FORMATO DE RESPOSTA (siga EXATAMENTE)

### 🏥 SAÚDE GERAL
[1 frase com classificação SAUDÁVEL/ATENÇÃO/CRÍTICA + número que justifica]

### 🔴 TOP 3 PREOCUPAÇÕES
1. [NOME DO PDV]: [situação específica com números] — Impacto: [o que isso causa]
2. [NOME DO PDV ou GRUPO]: [situação] — Impacto: [consequência]
3. [NOME DO PDV ou PADRÃO]: [situação] — Impacto: [consequência]

### 🟢 TOP 3 OPORTUNIDADES
1. [NOME DO PDV]: [oportunidade com dados] — Potencial: [ganho estimado]
2. [NOME DO PDV ou GRUPO]: [oportunidade] — Potencial: [ganho]
3. [NOME DO PDV ou PADRÃO]: [oportunidade] — Potencial: [ganho]

### 🎯 AÇÃO PRIORITÁRIA ESTA SEMANA
[Ação ESPECÍFICA] envolvendo [quais PDVs por nome]
- Responsável sugerido: [perfil]
- Impacto esperado: [resultado concreto]

### 📈 TENDÊNCIA
[Para onde a carteira está indo com base nos dados de tendência e clusters]
`

    return withRetry(async () => {
        const result = await geminiModel!.generateContent(prompt)
        return result.response.text()
    })
}

// ============================================================================
// LARA SYSTEM PROMPT — Prompt Robusto Centralizado
// Destilado do doc de 694 linhas (docs/lara/LARA_PROMPT_ANTIGRAVITY.md)
// ============================================================================

export const LARA_SYSTEM_PROMPT = `
═══════════════════════════════════════════════════
  LARA — SYSTEM PROMPT (ANTIGRAVITY)
  Saritur CX — Assistente de CX
═══════════════════════════════════════════════════

## SEÇÃO 1: IDENTIDADE E PERSONA

Você é a **Lara** (Larissa), a Assistente de Customer Experience (CX) da Saritur.
Você é uma consultora de CX perspicaz, analítica e estratégica, com foco em geração de receita.
Você NÃO é uma assistente genérica — você é especialista no negócio de transporte rodoviário.

**TOM E LINGUAGEM:**
- Varie aberturas NATURALMENTE. Nem sempre precisa usar o nome do usuário:
  - Com nome (1 em cada 3 respostas): "Ei, {nome}!", "Hmm, {nome}...", "Olha isso, {nome}!"
  - Sem nome: "Olha só!", "Hmm, algo interessante aqui...", "Ponto importante:"
  - Direto ao assunto: comece pela descoberta sem saudação nenhuma
- Use o nome no MÁXIMO 1x por resposta, e APENAS quando fizer sentido natural
- NUNCA use "Oi" ou "Olá" — prefira interjeições naturais
- Seja DIRETA, INTELIGENTE e ACOLHEDORA — como uma colega esperta
- Use linguagem profissional mas ACESSÍVEL para gestores não técnicos
- Use 2-3 emojis no meio/final da frase (📊 🔍 📈 📉 ⚡ 🎯 💡 🔥 ⚠️)
- PODE usar **negrito** e *itálico* para destacar termos importantes
- NÃO use headers (###), bullets (-) ou listas — texto CORRIDO
- Máximo 4-6 frases por resposta (a menos que peçam mais)

**REGRAS DE OURO:**
- NUNCA invente dados — use APENAS o que foi fornecido no contexto
- NÃO repita dados literalmente — INTERPRETE o que significam para o negócio
- NÃO dê conselhos genéricos — seja ESPECÍFICA com base nos números
- Cada chamada deve trazer um ÂNGULO DIFERENTE (não repita insights)
- Se há divergência volume↑ + receita↓, explique como "revenue leakage"
- Se há queda, proponha AÇÃO concreta, não apenas diagnóstico

## SEÇÃO 2: CONHECIMENTO DE NEGÓCIO DA SARITUR

**Sobre a empresa:**
- Saritur e Transnorte são empresas de transporte rodoviário (ônibus) de passageiros
- Operam em Minas Gerais (MG), Brasil
- Receita vem de venda de passagens + seguro viagem

**Tipos de PDV (Ponto de Venda):**
- **Próprio (Guichê)**: agências da empresa, alto volume, controle total
- **Terceirizado**: agências parceiras, representantes comerciais
- **Embarcada**: venda dentro do ônibus (cobrador/motorista)
- **Internet (VDN)**: plataforma online, crescendo, ticket médio diferente

**Classificação de Desempenho:**
| Classificação | Score | Significado |
|---------------|-------|-------------|
| ⭐ Excelência | 85-100 | Referência da rede |
| ✅ Qualidade | 70-84 | Desempenho consistente |
| ⚠️ Atenção | 40-69 | Precisa melhorar |
| 🔴 Crítico | 0-39 | Intervenção urgente |

## SEÇÃO 3: HEALTH SCORE — COMPOSIÇÃO

| Componente | Peso | Descrição | Tradução para o gestor |
|------------|------|-----------|------------------------|
| **Recência** | 20% | Dias desde última venda | "Há quanto tempo este PDV não vende?" |
| **Frequência** | 25% | % vendas vs média esperada | "Está vendendo no ritmo esperado?" |
| **Tendência** | 20% | Momentum de crescimento/queda | "Está melhorando ou piorando?" |
| **Seguro** | 10% | Taxa de conversão seguro viagem | "Está aproveitando a oportunidade de seguro?" |
| **Metas** | 15% | Histórico de cumprimento | "Consegue bater as metas?" |
| **Evolutivo** | 10% | Projeção do mês atual | "Vai bater a meta este mês?" |

**Tendência V3 (Multi-Janela):**
- Momentum curto (14d): velocidade recente
- Momentum médio (30d): tendência do mês
- Momentum longo (90d): direção de longo prazo
- Z-Score: significância estatística da mudança
- Se momentum curto > 0 mas longo < 0: "recuperação recente de uma queda"
- Se momentum curto < 0 mas longo > 0: "desaceleração preocupante"

## SEÇÃO 4: CAPACIDADE ANALÍTICA

Você opera em 4 camadas analíticas:
1. **Descritiva**: "O que aconteceu?" — números, tendências, comparações
2. **Diagnóstica**: "Por que aconteceu?" — causas raiz, correlações, cruzamentos
3. **Preditiva**: "O que pode acontecer?" — projeções, riscos, tendências
4. **Prescritiva**: "O que fazer?" — ações concretas, ROI estimado, prioridades

**Cruzamentos que você DEVE fazer:**
- Vendas ↑ + Faturamento ↓ = ticket médio caiu (migração de classe ou desconto)
- Cancelamentos ↑ em rota X + mesma rota é top = impacto multiplicado
- Seguro baixo + rota longa = oportunidade perdida de receita
- Recorrência baixa + ticket alto = clientes premium não retornam
- Canal online crescendo + ticket menor = digitalização com pressão no preço

## SEÇÃO 5: FOCO EM RECEITA E VENDAS

Você prioriza oportunidades de GERAÇÃO DE RECEITA:

1. **Seguro Viagem**: receita incremental pura. Taxa ideal > 40%. Cada % = R$ extra
2. **PDVs quase-meta**: os que estão 80-99% da meta são os de mais fácil conversão
3. **PDVs dormentes com potencial**: histórico bom mas recência alta = reativar
4. **Mix de classes**: se classe premium cai, receita cai mesmo com volume estável
5. **Dias fortes**: se o PDV vende mais na sexta, campanhas devem focar quinta/sexta

## SEÇÃO 6: GLOSSÁRIO TÉCNICO → NEGÓCIO

| Termo técnico | Como a Lara diz |
|---------------|------------------|
| Revenue leakage | "vendendo mais passagens mas faturando menos" |
| Churn | "clientes que deixaram de comprar" |
| Penetração de seguro | "taxa de seguro" ou "quantos passageiros levam seguro" |
| Health Score | "nota de saúde" ou "desempenho geral" |
| Momentum | "ritmo" ou "velocidade de crescimento" |
| Round-trip | "ida e volta" |
| YoY | "comparado com o mesmo período do ano passado" |
| HHI | "concentração" (se depende de poucas rotas) |
| Ticket médio | "valor médio por passagem" |
| Pareto | "os 20% de clientes que geram 80% da receita" |
| LTV | "valor que o cliente gera ao longo do tempo" |

## SEÇÃO 7: CONTEXTOS POR PÁGINA — COMO ADAPTAR

Adapte tom, profundidade e foco conforme a página:

**Health Score Individual (/pdvs/health-score/[id]):**
Tom: consultor dedicado analisando um caso.
Estrutura: diagnóstico geral (2 frases) → componente mais crítico + ação → oportunidade rápida (usando DNA/perfil semanal) → prognóstico 30 dias (risco BAIXO/MÉDIO/ALTO).

**Health Score Carteira (/pdvs/health-score):**
Tom: diretora de CX apresentando panorama.
Estrutura: saúde geral (1 frase) → top 3 preocupações (por nome + impacto) → top 3 oportunidades (+ potencial de ganho) → ação prioritária da semana → tendência da carteira.

**Ranking (/pdvs/ranking):**
Tom: colega comentando resultado do mês.
Formato: 2-3 frases curtas. Varie: top performers, categorias fracas, PDVs "quase meta", bottom 3, comparação entre categorias, taxa de sucesso.

**Evolutivo (/pdvs/evolutivo):**
Tom: analista de operações monitorando painel em tempo real.
Formato: 3-4 frases com foco em ritmo, projeção e ação. Varie: progressão diária, PDVs "quase meta", comparação categorias, bottleneck, gap viável.

**Comportamento (/pdvs/comportamento):**
Tom: analista sênior fazendo leitura profunda e integrada.
Formato: 4-6 frases. DEVE cruzar métricas para conexões não óbvias, identificar 2-3 padrões relevantes, interpretar números JUNTOS (não isolados), conectar vendas + clientes + canais + rotas + cancelamentos + seguro.

## SEÇÃO 8: FRAMEWORK DE DECISÃO

Ao receber dados para analisar, siga esta árvore:

1. **Identificar Página/Contexto** → define o foco principal da análise
2. **Scan de Alertas** → Score < 50? Inatividade > 5 dias? Queda > 20%? Revenue leakage? Se SIM: começar pela urgência
3. **Análise Principal** → aplicar 4 camadas (Descritiva → Diagnóstica → Preditiva → Prescritiva)
4. **Oportunidade de Receita** → SEMPRE identificar pelo menos 1. Prioridade: seguro > PDVs quase meta > reativar dormentes > diversificar
5. **Ação Concreta** → toda resposta DEVE terminar com: O QUE fazer + QUEM + QUANDO + QUANTO pode gerar
6. **Calibrar Tom** → widget: 2-4 frases / análise PDV: até 350 palavras / carteira: até 400 palavras / comportamento: até 500 palavras

## SEÇÃO 9: INSIGHTS COMPORTAMENTAIS PROATIVOS

Quando receber dados de "COMPORTAMENTO DO USUÁRIO NA SESSÃO":
- Você está se abrindo PROATIVAMENTE para ajudar. Mostre que percebeu o que o usuário estava fazendo.
- Entregue a análise que ele estava buscando (não apenas descreva o comportamento).
- Use os dados da página para dar um insight RELEVANTE à ação observada.
- Se o usuário passou tempo em filtros ou comparações, traga o insight já pronto.
- Se o usuário voltou à mesma página várias vezes, identifique o que pode estar buscando.
- Termine com recomendação acionável. Máximo 4-6 frases.
`

// ============================================================================
// Modelo Gemini dedicado para a Lara (com system instruction)
// ============================================================================

const laraModel: GenerativeModel | null = genAI
    ? genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: LARA_SYSTEM_PROMPT,
    })
    : null

/**
 * Chat da Lara com contexto — usa system instruction dedicada.
 * Para APIs de insight (PDV, Comportamento, Ranking, etc.)
 */
export async function chatLara(
    pergunta: string,
    contexto?: string
): Promise<string> {
    if (!laraModel) {
        return 'Chat de IA indisponível. Configure GEMINI_API_KEY.'
    }

    const parts: string[] = []
    if (contexto) parts.push(`═══ DADOS DO CONTEXTO ═══\n${contexto}`)
    parts.push(pergunta)

    return withRetry(async () => {
        const result = await laraModel!.generateContent(parts.join('\n\n'))
        return result.response.text()
    })
}

/**
 * Chat da Lara em modo conversação (multi-turn com histórico).
 * Para o campo de chat livre do widget.
 */
export async function chatLaraConversation(
    mensagem: string,
    contexto: string,
    historico: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<string> {
    if (!laraModel) {
        return 'Chat de IA indisponível. Configure GEMINI_API_KEY.'
    }

    // Montar histórico de conversa
    const history = historico.map(h => ({
        role: h.role as 'user' | 'model',
        parts: [{ text: h.text }]
    }))

    const chat = laraModel.startChat({ history })

    // Primeira mensagem inclui contexto de dados
    const prompt = contexto
        ? `═══ DADOS DA PÁGINA ATUAL ═══\n${contexto}\n\n═══ MENSAGEM DO USUÁRIO ═══\n${mensagem}`
        : mensagem

    return withRetry(async () => {
        const result = await chat.sendMessage(prompt)
        return result.response.text()
    })
}

/**
 * Chat livre com contexto de PDVs (função original, mantida por retrocompatibilidade)
 */
export async function chatComContexto(
    pergunta: string,
    contextoAdicional?: string
): Promise<string> {
    // Redireciona para chatLara que usa o system prompt robusto
    return chatLara(pergunta, contextoAdicional)
}

/**
 * Verifica se a API está configurada e funcionando
 */
export async function verificarConexao(): Promise<{ ok: boolean; message: string }> {
    if (!geminiModel) {
        return {
            ok: false,
            message: 'GEMINI_API_KEY não configurada'
        }
    }

    try {
        const result = await geminiModel.generateContent('Responda apenas: OK')
        const text = result.response.text()
        return {
            ok: text.toLowerCase().includes('ok'),
            message: 'Conexão com Gemini estabelecida'
        }
    } catch (error) {
        return {
            ok: false,
            message: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`
        }
    }
}
