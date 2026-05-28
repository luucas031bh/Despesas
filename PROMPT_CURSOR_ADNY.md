# PROMPT COMPLETO — SISTEMA FINANCEIRO PESSOAL + ADNY
## Para uso no Cursor AI

---

## ⚠️ LEIA ANTES DE COMEÇAR — REGRAS DE DESENVOLVIMENTO

Você está construindo um sistema financeiro pessoal + operacional chamado **ADNY Finance**.

Antes de escrever qualquer linha de código, leia este documento inteiro.

Este projeto será construído em **etapas incrementais**. A versão inicial (v1) não é o sistema completo — é a base sólida sobre a qual tudo será construído. Cada arquivo deve ser escrito como se um terceiro desenvolvedor fosse continuar o trabalho sem nenhuma explicação verbal.

**Portanto:**
- Todo arquivo deve ter um cabeçalho explicativo
- Toda seção deve ter comentários de bloco
- Toda função deve ter comentário inline explicando o que faz, por quê existe, e o que retorna
- Toda variável de configuração deve estar centralizada e comentada
- O código precisa ser **legível por humanos**, não apenas por máquinas

---

## 1. VISÃO GERAL DO PROJETO

```
Nome:        ADNY Finance
Tipo:        Sistema financeiro pessoal + operacional
Hospedagem:  GitHub Pages (frontend estático)
Backend:     Google Apps Script (GAS) — API REST simples
Banco:       Google Sheets (estruturado como banco de dados)
Frontend:    HTML + CSS + JavaScript puro (sem frameworks)
Dispositivos: Desktop (prioridade) + iPhone (responsivo)
```

### O que este sistema FAZ (escopo v1):
- Controle de despesas pessoais/casa
- Controle de despesas operacionais da empresa ADNY
- Recorrência automática (Modelos → Lançamentos)
- Dashboards separados por área
- Status visual (pago / em aberto / vencido)
- Lançamentos operacionais rápidos (diários)
- Histórico mensal e consulta por período

### O que este sistema NÃO FAZ (fora do escopo):
- Controle de vendas
- Controle de estoque
- Emissão de nota fiscal
- Controle de produção
- Faturamento

---

## 2. ARQUITETURA DO PROJETO

```
/adny-finance/
│
├── index.html              ← Ponto de entrada. Carrega o app.
├── app.js                  ← Inicialização, roteamento entre dashboards
├── config.js               ← Todas as configurações centralizadas (URLs, constantes)
│
├── /css/
│   ├── reset.css           ← Reset + base tipográfica
│   ├── variables.css       ← Tokens de design (cores, espaçamentos, tipografia)
│   ├── layout.css          ← Grid, sidebar, header, estrutura geral
│   ├── components.css      ← Cards, botões, badges, inputs, modais
│   ├── dashboard.css       ← Estilos específicos dos dashboards
│   └── responsive.css      ← Media queries para iPhone/mobile
│
├── /js/
│   ├── api.js              ← Todas as chamadas ao Google Apps Script
│   ├── auth.js             ← Controle simples de sessão/usuário (futuro)
│   ├── dashboard-casa.js   ← Lógica do dashboard Pessoal/Casa
│   ├── dashboard-adny.js   ← Lógica do dashboard ADNY
│   ├── modelos.js          ← CRUD de Modelos de despesas
│   ├── lancamentos.js      ← CRUD de Lançamentos mensais
│   ├── operacional.js      ← Lançamentos rápidos diários (ADNY)
│   ├── relatorios.js       ← Consultas históricas e relatórios
│   └── utils.js            ← Funções utilitárias reutilizáveis
│
├── /components/
│   ├── sidebar.html        ← HTML da navegação lateral
│   ├── modal-modelo.html   ← Modal de cadastro/edição de Modelo
│   ├── modal-lancamento.html ← Modal de lançamento mensal
│   └── modal-operacional.html ← Modal rápido de lançamento diário
│
└── /gas/
    └── Code.gs             ← Google Apps Script completo (backend + banco)
```

---

## 3. BANCO DE DADOS — GOOGLE SHEETS

O Google Sheets funcionará como banco de dados relacional simples.
Cada aba = uma tabela. Os nomes das abas são fixos e críticos.

### 3.1 — Tabela: `MODELOS`

> Define o "template" de cada despesa recorrente.
> Um Modelo gera Lançamentos automaticamente todo mês.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | STRING | UUID gerado no frontend. Ex: `mod_1718293847_abc` |
| area | ENUM | `"casa"` ou `"adny"` |
| categoria | STRING | Ex: `"Fixa Operacional"`, `"Serviços Contratados"` |
| nome | STRING | Nome legível. Ex: `"Conta de Luz Casa"` |
| tipo | ENUM | `"fixa_parcelada"` / `"fixa_recorrente"` / `"recorrente_variavel"` |
| valor_base | NUMBER | Valor padrão ou estimado. 0 se variável. |
| dia_vencimento | NUMBER | Dia do mês do vencimento. Ex: `10` |
| total_parcelas | NUMBER | Número total de parcelas. `0` = sem fim (recorrente) |
| parcela_atual | NUMBER | Parcela corrente no momento do cadastro |
| data_inicio | DATE | `YYYY-MM` — Mês de início da recorrência |
| data_fim | DATE | `YYYY-MM` — Mês final. Vazio se sem fim. |
| empresa | STRING | Nome da empresa/fornecedor. Ex: `"Cemig"` |
| recebedor | STRING | Nome do beneficiário do pagamento |
| telefone | STRING | Telefone, SAC ou WhatsApp do fornecedor |
| link_boleto | STRING | URL do boleto ou portal de pagamento |
| chave_pix | STRING | Chave PIX do recebedor |
| observacoes | TEXT | Campo livre para anotações |
| ativo | BOOLEAN | `TRUE` = ativo / `FALSE` = arquivado (soft delete) |
| criado_em | DATETIME | ISO 8601. Preenchido automaticamente. |
| atualizado_em | DATETIME | ISO 8601. Atualizado a cada edição. |

---

### 3.2 — Tabela: `LANCAMENTOS`

> Representa a ocorrência real de um Modelo em um mês específico.
> É aqui que o usuário informa o valor real, marca como pago, etc.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | STRING | UUID gerado no frontend. Ex: `lan_1718293847_xyz` |
| modelo_id | STRING | FK → `MODELOS.id`. Pode ser nulo para lançamentos avulsos. |
| area | ENUM | `"casa"` ou `"adny"` |
| categoria | STRING | Herdada do Modelo ou informada manualmente |
| nome | STRING | Herdado do Modelo ou informado manualmente |
| mes_ref | STRING | `YYYY-MM` — Mês de referência deste lançamento |
| valor | NUMBER | Valor real do mês (atualizado pelo usuário) |
| dia_vencimento | NUMBER | Dia de vencimento neste mês específico |
| data_vencimento | DATE | `YYYY-MM-DD` — Data exata calculada |
| status | ENUM | `"aberto"` / `"pago"` / `"vencido"` |
| data_pagamento | DATE | `YYYY-MM-DD` — Data em que foi pago. Vazio se não pago. |
| metodo_pagamento | ENUM | `"pix"` / `"dinheiro"` / `"cartao_debito"` / `"cartao_credito"` / `"boleto"` / `"outro"` |
| parcela_numero | NUMBER | Qual parcela é esta (ex: `3` de `60`) |
| observacoes | TEXT | Campo livre |
| gerado_auto | BOOLEAN | `TRUE` = gerado pelo sistema / `FALSE` = inserido manualmente |
| criado_em | DATETIME | ISO 8601 |
| atualizado_em | DATETIME | ISO 8601 |

---

### 3.3 — Tabela: `OPERACIONAL_DIARIO`

> Lançamentos rápidos de gastos diários da ADNY.
> Alta frequência, poucos campos, máxima velocidade.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | STRING | UUID gerado no frontend |
| data | DATE | `YYYY-MM-DD` — Data do gasto |
| categoria | ENUM | `"gasolina"` / `"alimentacao"` / `"cafe"` / `"marmita"` / `"lanche"` / `"outro"` |
| descricao | STRING | Descrição rápida. Ex: `"Shell posto centro"` |
| valor | NUMBER | Valor do gasto |
| metodo_pagamento | ENUM | `"pix"` / `"dinheiro"` / `"cartao_debito"` / `"cartao_credito"` / `"outro"` |
| responsavel | STRING | Quem realizou o gasto. Ex: `"Lucas"`, `"Isabela"` |
| observacoes | TEXT | Campo livre opcional |
| criado_em | DATETIME | ISO 8601 |

---

### 3.4 — Tabela: `CONFIG`

> Configurações do sistema. Chave-valor simples.
> Nunca apagar esta aba.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| chave | STRING | Identificador único. Ex: `"ultimo_fechamento"` |
| valor | STRING | Valor da configuração |
| descricao | STRING | Explicação legível para humanos |
| atualizado_em | DATETIME | ISO 8601 |

**Chaves obrigatórias na inicialização:**
```
versao_sistema       → "1.0.0"
ultimo_fechamento    → "" (vazio no início)
mes_ativo            → "YYYY-MM" do mês corrente
geracao_automatica   → "TRUE"
```

---

### 3.5 — Tabela: `HISTORICO_FECHAMENTOS`

> Registro imutável de cada fechamento mensal.
> Nunca editar registros aqui.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | STRING | UUID |
| mes_ref | STRING | `YYYY-MM` |
| area | ENUM | `"casa"` / `"adny"` / `"ambas"` |
| total_despesas | NUMBER | Soma total do mês |
| total_pagas | NUMBER | Soma das despesas pagas |
| total_pendentes | NUMBER | Soma das despesas não pagas |
| fechado_em | DATETIME | ISO 8601 |
| observacoes | TEXT | Campo livre |

---

## 4. GOOGLE APPS SCRIPT — `Code.gs`

### 4.1 — Estrutura do arquivo

O `Code.gs` deve ser organizado em blocos bem comentados, nesta ordem:

```
1. CONFIGURAÇÕES GLOBAIS
2. UTILITÁRIOS INTERNOS
3. ROTEADOR PRINCIPAL (doGet/doPost)
4. HANDLERS DE MODELOS
5. HANDLERS DE LANÇAMENTOS
6. HANDLERS DE OPERACIONAL DIÁRIO
7. HANDLERS DE RELATÓRIOS
8. GERAÇÃO AUTOMÁTICA DE LANÇAMENTOS
9. FECHAMENTO MENSAL
10. INICIALIZAÇÃO DO BANCO
```

### 4.2 — Padrão de resposta da API

Toda resposta do GAS deve seguir este padrão JSON:

```json
// SUCESSO
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}

// ERRO
{
  "success": false,
  "error": "Descrição do erro",
  "code": "ERRO_ESPECIFICO"
}
```

### 4.3 — Rotas da API (via parâmetro `action`)

```
GET  ?action=getModelos&area=casa
GET  ?action=getModelo&id=mod_xxx
GET  ?action=getLancamentos&mes=2025-06&area=casa
GET  ?action=getOperacional&data=2025-06-01
GET  ?action=getRelatorio&area=adny&de=2025-01&ate=2025-06
GET  ?action=getConfig

POST action=criarModelo        body: { ...dadosModelo }
POST action=editarModelo       body: { id, ...dadosModelo }
POST action=arquivarModelo     body: { id }
POST action=criarLancamento    body: { ...dadosLancamento }
POST action=editarLancamento   body: { id, ...dadosLancamento }
POST action=pagarLancamento    body: { id, data_pagamento, metodo_pagamento, valor }
POST action=criarOperacional   body: { ...dadosOperacional }
POST action=fecharMes          body: { mes_ref, area }
POST action=gerarLancamentos   body: { mes_ref } ← força geração manual
```

---

## 5. DESIGN SYSTEM — CSS

### 5.1 — Paleta de cores (em `variables.css`)

```css
/* TEMA: Clássico, limpo, profissional — não corporativo genérico */
/* Inspiração: fintech europeia, editorial financeiro */

:root {
  /* Cores base */
  --color-bg:           #F5F4F0;   /* Fundo geral — off-white quente */
  --color-surface:      #FFFFFF;   /* Cards e painéis */
  --color-surface-2:    #EEECE6;   /* Fundo alternativo, hover */
  --color-border:       #DEDAD2;   /* Bordas suaves */
  --color-border-strong:#C8C3B8;   /* Bordas com mais peso */

  /* Tipografia */
  --color-text:         #1C1A16;   /* Texto principal — quase preto */
  --color-text-muted:   #7A7265;   /* Texto secundário */
  --color-text-light:   #AEA89E;   /* Placeholder, desabilitado */

  /* Acento principal — azul petróleo clássico */
  --color-accent:       #1B4F72;
  --color-accent-light: #EBF5FB;
  --color-accent-hover: #154360;

  /* Área CASA — verde musgo */
  --color-casa:         #1E6B45;
  --color-casa-light:   #E8F5EE;
  --color-casa-border:  #A8D5BB;

  /* Área ADNY — vinho/borgonha */
  --color-adny:         #7B2D42;
  --color-adny-light:   #F9EEF1;
  --color-adny-border:  #D4A0B0;

  /* Status */
  --color-pago:         #1A7A4A;
  --color-pago-bg:      #E6F4EC;
  --color-vencido:      #B03A2E;
  --color-vencido-bg:   #FDECEA;
  --color-aberto:       #A0760A;
  --color-aberto-bg:    #FEF9E7;

  /* Tipografia */
  --font-display:  'Playfair Display', Georgia, serif;  /* Títulos e valores */
  --font-body:     'DM Sans', 'Helvetica Neue', sans-serif; /* Interface */
  --font-mono:     'JetBrains Mono', 'Courier New', monospace; /* Valores numéricos */

  /* Espaçamentos — escala 4px */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Raios de borda */
  --radius-sm:  6px;
  --radius:     10px;
  --radius-lg:  16px;
  --radius-xl:  24px;

  /* Sombras */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:     0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);

  /* Transições */
  --transition-fast:  0.15s ease;
  --transition:       0.25s ease;
  --transition-slow:  0.4s ease;

  /* Layout */
  --sidebar-width:    240px;
  --header-height:    60px;
  --content-max:      1200px;
}
```

### 5.2 — Tipografia

Use as fontes via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Regras de uso:**
- `var(--font-display)` → títulos de seção, valores monetários grandes, nome do sistema
- `var(--font-body)` → todo o resto da interface
- `var(--font-mono)` → valores numéricos em tabelas e cards de resumo

### 5.3 — Layout geral

```
┌─────────────────────────────────────────────────┐
│  HEADER (fixed, 60px)                           │
│  Logo | Mês ativo | Área ativa | Usuário        │
├──────────┬──────────────────────────────────────┤
│ SIDEBAR  │  CONTENT AREA                        │
│ (240px)  │                                      │
│          │  ┌─────────────────────────────────┐ │
│ Nav Casa │  │  DASHBOARD / TELA ATUAL         │ │
│ Nav ADNY │  │                                 │ │
│          │  └─────────────────────────────────┘ │
│ -------- │                                      │
│ Relatórios│                                     │
│ Config   │                                      │
└──────────┴──────────────────────────────────────┘

Mobile (< 768px):
- Sidebar vira bottom navigation bar (5 ícones)
- Header simplificado
- Cards empilhados em coluna única
```

---

## 6. COMPONENTES DA INTERFACE

### 6.1 — Card de Despesa (lista)

Cada despesa na lista deve ser um card com:

```
[● STATUS] [NOME DA DESPESA]          [R$ VALOR]
           Empresa · Vence dia 10     [BADGE TIPO]
```

Ao clicar → expande (accordion) mostrando:
- Todos os detalhes do Modelo
- Histórico dos últimos 3 meses
- Botões: Pagar / Editar / Arquivar

### 6.2 — Cards de Resumo (topo do dashboard)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  TOTAL MÊS   │ │    PAGAS     │ │   PENDENTES  │ │   VENCIDAS   │
│  R$ 8.420    │ │  R$ 5.200    │ │  R$ 2.100    │ │  R$ 1.120    │
│  23 despesas │ │  15 pagas    │ │  6 abertas   │ │  2 atrasadas │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### 6.3 — Modal de Lançamento Rápido (Operacional Diário)

```
┌─────────────────────────────┐
│  + Novo Gasto               │
│                             │
│  Valor:  [R$ _______]       │
│  Categoria: [dropdown]      │
│  Pagamento: [PIX][Din][Crd] │
│  Descrição: [______]        │
│                             │
│  [CANCELAR]   [SALVAR →]   │
└─────────────────────────────┘
```
Máximo 3 cliques do dashboard ao salvo.

### 6.4 — Filtros do Dashboard

```
[Todos] [Vencidas] [A Vencer] [Pagas] | Mês: [<] Junho 2025 [>]
```

---

## 7. LÓGICA DE RECORRÊNCIA

### 7.1 — Geração de Lançamentos

A geração automática ocorre:
1. **Automaticamente** quando o sistema detecta que um novo mês começou
2. **Manualmente** via botão "Gerar mês" no dashboard

**Regras:**
- Para cada Modelo `ativo = TRUE`:
  - Se `tipo = fixa_recorrente` → gera lançamento todo mês sem fim
  - Se `tipo = fixa_parcelada` → gera até `data_fim` ou até `total_parcelas` esgotarem
  - Se `tipo = recorrente_variavel` → gera com `valor = valor_base` (usuário atualiza depois)
- Nunca gera lançamento duplicado para o mesmo `modelo_id + mes_ref`
- Lançamentos gerados têm `gerado_auto = TRUE`

### 7.2 — Cálculo de Status

```javascript
// Esta função é central. Toda exibição de status usa ela.
function calcularStatus(lancamento) {
  if (lancamento.status === 'pago') return 'pago';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(lancamento.data_vencimento + 'T00:00:00');

  if (vencimento < hoje) return 'vencido';
  return 'aberto';
}
```

---

## 8. INSTRUÇÃO DE CONSTRUÇÃO — V1 (PRIMEIRA ENTREGA)

### O que construir na V1:

**Prioridade 1 — Estrutura base:**
- [ ] `variables.css` com todos os tokens
- [ ] `layout.css` com sidebar + header + content area
- [ ] `components.css` com cards, botões, badges, inputs
- [ ] `responsive.css` com breakpoints mobile
- [ ] `config.js` com todas as constantes centralizadas
- [ ] `utils.js` com funções de formatação de data, moeda, UUID
- [ ] `api.js` com a camada de comunicação com o GAS (com tratamento de erro)

**Prioridade 2 — Google Apps Script:**
- [ ] `Code.gs` completo com todas as rotas listadas na seção 4.3
- [ ] Inicialização automática das abas do Sheets se não existirem
- [ ] Geração automática de lançamentos ao chamar `doGet`
- [ ] Todos os CRUDs de Modelos e Lançamentos

**Prioridade 3 — Dashboard Casa (funcional):**
- [ ] Cards de resumo (total, pagas, pendentes, vencidas)
- [ ] Lista de despesas com accordion
- [ ] Filtros por status e navegação de mês
- [ ] Modal de cadastro/edição de Modelo
- [ ] Modal de pagamento de Lançamento

**Deixar para V2:**
- Dashboard ADNY
- Lançamentos operacionais rápidos
- Relatórios e histórico
- Fechamento mensal

---

## 9. PADRÕES DE CÓDIGO OBRIGATÓRIOS

### 9.1 — Cabeçalho de arquivo (todo arquivo deve começar assim)

```javascript
/**
 * ============================================================
 * ADNY Finance — [NOME DO ARQUIVO]
 * ============================================================
 * Responsabilidade:
 *   [O que este arquivo faz em 1-2 linhas]
 *
 * Depende de:
 *   [Lista de arquivos/módulos que este arquivo usa]
 *
 * Exporta / expõe:
 *   [Funções ou objetos principais disponíveis]
 *
 * Histórico:
 *   v1.0 — [DATA] — Criação inicial
 * ============================================================
 */
```

### 9.2 — Comentário de função

```javascript
/**
 * gerarLancamentosDoMes
 * ---------------------
 * Percorre todos os Modelos ativos e gera Lançamentos para o
 * mês informado, caso ainda não existam.
 *
 * @param {string} mesRef - Formato "YYYY-MM". Ex: "2025-06"
 * @returns {object} { gerados: number, ignorados: number, erros: string[] }
 *
 * Notas:
 *  - Nunca duplica: verifica existência antes de inserir
 *  - Parcelas esgotadas são ignoradas silenciosamente
 */
function gerarLancamentosDoMes(mesRef) { ... }
```

### 9.3 — Configurações em `config.js`

```javascript
/**
 * config.js — Configurações centralizadas do ADNY Finance
 * Altere aqui antes de mudar qualquer outro arquivo.
 */
const CONFIG = {
  // URL do Google Apps Script deployado
  // Troque esta URL após cada novo deploy do GAS
  GAS_URL: 'https://script.google.com/macros/s/SEU_ID_AQUI/exec',

  // Versão do frontend (incremente a cada release)
  VERSION: '1.0.0',

  // Timeout das requisições à API (ms)
  API_TIMEOUT: 10000,

  // Categorias válidas por área
  CATEGORIAS: {
    casa: ['Luz', 'Água', 'Prestação Casa', ...],
    adny: {
      fixas: ['Aluguel', 'Água', 'Luz', 'Internet', 'Pronamp'],
      servicos: ['Costureira', 'Bordado', 'Corte'],
      compras: ['Tinta', 'Materiais', 'Pequenas Compras'],
      diario: ['Gasolina', 'Alimentação', 'Café', 'Marmita', 'Lanche']
    }
  },

  // Métodos de pagamento aceitos
  METODOS_PAGAMENTO: ['pix', 'dinheiro', 'cartao_debito', 'cartao_credito', 'boleto', 'outro'],
};
```

---

## 10. OBSERVAÇÕES FINAIS PARA O CURSOR

1. **Não crie tudo de uma vez.** Siga a ordem da seção 8.
2. **Não use frameworks** (React, Vue, Angular). HTML + CSS + JS puro.
3. **Não use libraries desnecessárias.** A única exceção permitida é uma lib de ícones (ex: Lucide Icons via CDN).
4. **Comente tudo** como se o próximo desenvolvedor nunca tivesse visto o projeto.
5. **O banco de dados pode mudar.** Toda função que acessa o Sheets deve ter uma camada de abstração — nunca acesse colunas por índice numérico, sempre por nome de coluna mapeado.
6. **Pense na escalabilidade.** O sistema vai crescer. Estruturas de dados bem definidas economizam refatoração.
7. **Mobile não é afterthought.** Teste visualmente cada componente em 390px de largura (iPhone 14).
8. **Nunca delete dados** — use soft delete (`ativo = FALSE`) em Modelos. Lançamentos são imutáveis; se errar, cria um estorno.

---

*Documento gerado para uso no Cursor AI — ADNY Finance v1.0*
*Revise a seção 8 antes de cada sessão de desenvolvimento para saber onde parou.*
