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

Crie ou use a planilha **BancoDeDadosDespesas** no Google Drive.

### 2. Google Apps Script

1. Na planilha: **Extensões → Apps Script**
2. Cole o conteúdo de `gas/Code.gs`
3. Execute a função **`setupBancoDeDados`** (autorize permissões)
4. **Implantar → Nova implantação → Aplicativo da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
5. Copie a URL `/exec` e cole em `config.js` → `GAS_URL`

### 3. Frontend local ou GitHub Pages

```bash
# Teste local (na pasta do projeto)
npx serve .
# ou abra index.html via servidor HTTP (necessário para fetch dos modais)
```

Edite `config.js` se a URL do GAS mudar após novo deploy.

## Abas criadas automaticamente

- `MODELOS`, `LANCAMENTOS`, `OPERACIONAL_DIARIO`, `CONFIG`, `HISTORICO_FECHAMENTOS`

## Versão

1.0.0 — v1 com dashboard Casa/ADNY, operacional, relatórios e API completa.
