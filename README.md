# ADNY Finance

Sistema financeiro pessoal (Casa) + operacional (ADNY). Frontend estático + Google Apps Script + Google Sheets.

**Planilha:** `BancoDeDadosDespesas`

## Estrutura

- `index.html` — entrada do app
- `config.js` — URL do GAS e constantes
- `gas/Code.gs` — backend (copiar para o Apps Script)
- `css/`, `js/`, `components/`

## Configuração (ordem)

### 1. Google Sheets

1. Crie ou abra a planilha **BancoDeDadosDespesas** no Google Drive
2. Copie o **ID da planilha** da URL do navegador:

```
https://docs.google.com/spreadsheets/d/ESTE_TRECO_AQUI/edit
```

O ID é o trecho entre `/d/` e `/edit`.

### 2. Google Apps Script

1. Na planilha: **Extensões → Apps Script**
2. Cole o conteúdo de `gas/Code.gs`
3. Substitua `COLE_O_ID_DA_PLANILHA_AQUI` por o ID copiado no passo anterior (`SPREADSHEET_ID`)
4. Execute a função **`setupBancoDeDados`** (autorize permissões) — cria as abas do banco
5. **Implantar → Nova implantação → Aplicativo da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
6. Copie a URL `/exec` e cole em `config.js` → `GAS_URL`

**Importante:** toda alteração no `Code.gs` exige **nova implantação** (Gerenciar implantações → Editar → Nova versão). Sem redeploy, o Web App continua com o código antigo.

### 3. Frontend local ou GitHub Pages

```bash
# Teste local (na pasta do projeto)
npx serve .
# ou abra index.html via servidor HTTP (necessário para fetch dos modais)
```

Edite `config.js` se a URL do GAS mudar após novo deploy.

## Abas criadas automaticamente

- `MODELOS`, `LANCAMENTOS`, `OPERACIONAL_DIARIO`, `CONFIG`, `HISTORICO_FECHAMENTOS`

## Validar salvamento

1. Crie um modelo no app (Casa → + Novo modelo)
2. Confira se aparece uma linha na aba **MODELOS** da planilha
3. Clique **Gerar mês** — linhas devem aparecer na aba **LANCAMENTOS**

## Versão

1.0.0 — v1 com dashboard Casa/ADNY, operacional, relatórios e API completa.
