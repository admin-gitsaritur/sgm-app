<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SGM — Sistema de Gestão de Metas

Sistema web para gestão estratégica de metas, projetos e indicadores da Saritur. Permite o acompanhamento hierárquico de metas corporativas, projetos vinculados e indicadores de performance com visualizações interativas.

## 🏗️ Arquitetura

```
src/
├── components/
│   ├── ui/               # Componentes globais reutilizáveis
│   │   ├── ActionButton   # Botão de ação com tooltip e ícone
│   │   ├── Button         # Botão padrão com variantes
│   │   ├── CellText       # Texto de célula de tabela
│   │   ├── CurrencyInput  # Input com máscara de moeda BRL (R$)
│   │   ├── DataTable      # Tabela de dados com sorting e busca
│   │   ├── DropdownMenu   # Menu dropdown (Radix UI)
│   │   ├── FormField      # Campo de formulário com label
│   │   ├── IconBadge      # Badge com ícone
│   │   ├── Input          # Input padrão
│   │   ├── Modal          # Modal com ESC/Enter
│   │   ├── PageHeader     # Header de página
│   │   ├── ProgressBar    # Barra de progresso
│   │   ├── Select         # Select dropdown (Radix UI)
│   │   ├── Spinner        # Loading spinner
│   │   ├── Toast          # Toast notifications (sonner)
│   │   └── UserAvatar     # Avatar do usuário
│   ├── ConfirmDialog.tsx  # Dialog de confirmação
│   ├── ErrorBoundary.tsx  # Error boundary global
│   └── Layout.tsx         # Layout principal com sidebar
├── pages/
│   ├── Dashboard.tsx      # Dashboard com KPIs e gráficos
│   ├── Metas.tsx          # CRUD de metas com curva personalizada
│   ├── Projetos.tsx       # CRUD de projetos
│   ├── Indicadores.tsx    # CRUD de indicadores com curva e CurrencyInput
│   ├── Mapeamento.tsx     # Mapa estratégico visual (React Flow)
│   ├── Responsaveis.tsx   # Gestão de responsáveis
│   ├── Relatorios.tsx     # Relatórios
│   ├── Usuarios.tsx       # Gestão de usuários
│   ├── Auditoria.tsx      # Log de auditoria
│   ├── Configuracoes.tsx  # Configurações do sistema
│   ├── Login.tsx          # Login
│   ├── TrocarSenha.tsx    # Troca de senha obrigatória
│   └── EsqueciSenha.tsx   # Recuperação de senha
├── services/
│   └── api.ts             # Cliente HTTP com refresh token
├── store/
│   └── authStore.ts       # Store de autenticação (Zustand)
└── router.tsx             # Rotas da aplicação
```

## 🧩 Stack Tecnológica

| Categoria | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilização | Tailwind CSS + Design tokens |
| Componentes | Radix UI (Select, Dialog, Tooltip, Dropdown) |
| Ícones | Lucide React |
| Toasts | Sonner |
| Flow/Mapa | @xyflow/react (React Flow) |
| Estado | Zustand |
| HTTP | Fetch API com interceptor de refresh |

## 🚀 Rodando Localmente

**Pré-requisitos:** Node.js >= 18

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis
cp .env.local.example .env.local
# Configurar GEMINI_API_KEY no .env.local

# Rodar em modo dev
npm run dev

# Build de produção
npm run build
```

## 📱 Funcionalidades

### Metas (Camada 1)
- CRUD completo de metas anuais
- Unidade configurável (R$, %, Unidade)
- Periodicidade: Mensal, Trimestral, Quadrimestral, Semestral
- Curva personalizada dinâmica (adapta ao período selecionado)
- Máscara de moeda BRL para campos monetários

### Projetos (Camada 2)
- CRUD de projetos vinculados às metas
- Responsável principal e status
- Ações com tooltips

### Indicadores (Camada 3)
- CRUD de indicadores vinculados aos projetos
- Atualização de realizado com período de referência (M-1 default)
- Curva personalizada por periodicidade
- Máscara de moeda BRL
- Labels de período com nome completo + ano (ex: Fevereiro/2026)

### Mapeamento Estratégico
- Visualização hierárquica estilo n8n (React Flow)
- 3 camadas: Metas → Projetos → Indicadores
- Nós arrastáveis com posições salvas em localStorage
- MiniMap, zoom, pan e controles
- Conexões animadas com smoothstep
- Badges de camada e barras de progresso

### Dashboard
- KPIs em tempo real
- Gráficos de desempenho
- Filtros por período

## 🎨 Design System

- **Cores primárias:** Laranja Saritur (`#F37137`) e Marrom (`#4E3205`)
- **Tipografia:** Sora (Google Fonts)
- **Componentes:** Baseados em Radix UI com estilos customizados
- **Padrão:** Todos os componentes são globais, reutilizáveis e sem hardcodes

## 📄 Licença

Propriedade da Saritur. Uso interno.
