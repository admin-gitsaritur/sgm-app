# SGM — Registro de Scripts (Sessões de Desenvolvimento)

## Script 10/03/2026 — Refinamento de Indicadores, Curva Dinâmica e Mapeamento

### Resumo

Sessão focada em padronização de componentes, refatoração da página de Indicadores e criação da página de Mapeamento Estratégico.

### Alterações Realizadas

#### 1. Refatoração da página `/indicadores`
- **Eliminação de hardcodes**: toda a página foi reescrita usando componentes globais (`PageHeader`, `DataTable`, `Button`, `Input`, `Select`, `Modal`, `FormField`, `ActionButton`, `IconBadge`, `CellText`, `ProgressBar`, `DataTableStatusBadge`, `DataTableBadge`)
- **Sorting e busca** client-side via `DataTable`
- **Filtro por projeto** com `Select`
- **Toast notifications** para feedback
- **Tooltips** nos botões de ação

#### 2. Campos "Unidade" e "Frequência"
- **Unidade** em Indicadores: trocado de `Input` para `Select` dropdown (R$, %, Un) — igual a Metas
- **Frequência**: removidas opções **Semanal** e **Quinzenal** (em Metas e Indicadores)
- Periodicidades disponíveis: Mensal, Trimestral, Quadrimestral, Semestral

#### 3. Tipo de Curva (dinâmica por periodicidade)
- Novo campo **Tipo de Curva** (Linear / Personalizada) adicionado a Indicadores
- Já existia em Metas — ambos agora compartilham a mesma lógica
- Curva personalizada se adapta à periodicidade:
  | Periodicidade | Períodos | Labels |
  |---|---|---|
  | Mensal | 12 | Jan, Fev, ..., Dez |
  | Trimestral | 4 | 1º Tri, 2º Tri, 3º Tri, 4º Tri |
  | Quadrimestral | 3 | 1º Quad, 2º Quad, 3º Quad |
  | Semestral | 2 | 1º Sem, 2º Sem |
- Array da curva reseta ao trocar periodicidade

#### 4. Máscara de moeda BRL
- Novo componente global `CurrencyInput.tsx`
- Formatação automática: `500000` → `R$ 5.000,00`
- Separadores pt-BR (ponto milhar, vírgula decimal)
- `inputMode="numeric"` para teclado mobile
- Aplicado em:
  - Metas: campo "Valor da Meta" (quando unidade = R$)
  - Indicadores: campo "Meta do Indicador"
  - Indicadores: modal "Atualizar Realizado"

#### 5. Período de Referência no modal "Atualizar Realizado"
- Novo `Select` com períodos baseados na frequência do indicador
- Labels completos com ano: `Fevereiro/2026`, `1º Trimestre/2026`
- Default **M-1** (período anterior ao atual)

#### 6. Nova página: Mapeamento Estratégico (`/mapeamento`)
- Visualização interativa estilo n8n usando **React Flow** (`@xyflow/react`)
- Hierarquia em 3 camadas:
  - 🟠 Camada 1 — Metas (laranja)
  - 🟤 Camada 2 — Projetos (marrom)
  - 🟢 Camada 3 — Indicadores (verde)
- Nós arrastáveis com **posições salvas em localStorage**
- MiniMap, zoom, pan e controles
- Conexões animadas (smoothstep)
- Badges de camada e barras de progresso nos nós
- Auto-layout em árvore hierárquica
- Rota: `/mapeamento` (ADMIN, GESTOR)
- Sidebar: entrada com ícone `GitBranch`

#### 7. Fix de ícones no sidebar
- Dashboard: ícone alterado para `Gauge`
- Metas: ícone alterado para `Target`

#### 8. Fix geral de componentes
- `SelectTrigger`: adicionado `position: relative` para conter `leftIcon`
- `CellText`: variantes corrigidas (`muted`, `default`)
- `ProgressBar`: props corrigidas (`height` em vez de `max`/`size`)
- Toast: chamadas corrigidas para formato objeto `{ title: "..." }`

### Arquivos Criados
- `src/pages/Mapeamento.tsx`
- `src/components/ui/CurrencyInput.tsx`

### Arquivos Modificados
- `src/pages/Indicadores.tsx` — refatoração completa + curva + CurrencyInput
- `src/pages/Metas.tsx` — periodicidade dinâmica + CurrencyInput
- `src/components/ui/Select.tsx` — fix leftIcon positioning
- `src/components/Layout.tsx` — sidebar: ícones + Mapeamento
- `src/router.tsx` — rota /mapeamento
- `README.md` — documentação completa

### Pendências para Próximo Script
- [ ] Verificar integração backend para `tipoCurva` e `curvaPersonalizada` nos indicadores
- [ ] Responsive test em mobile para Mapeamento (React Flow)
- [ ] Considerar salvar posições do mapeamento no backend (por usuário)
- [ ] Adicionar busca/filtro por meta no Mapeamento
