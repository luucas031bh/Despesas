# ADNY Finance

Sistema financeiro pessoal (Casa) + operacional (ADNY). Frontend estático + Google Apps Script + Google Sheets.

**Planilha:** `BancoDeDadosDespesas`

## Estrutura

- `index.html` — entrada do app
- `config.js` — URL do GAS e constantes
- `gas/Code.gs` — backend (copiar para o Apps Script)
- `js/leitor-boleto.js` — importação de boletos via Gemini
- `css/`, `js/`, `components/`

## Configuração (ordem)

### 1. Google Sheets

1. Crie ou abra a planilha **BancoDeDadosDespesas** no Google Drive
2. **Extensões → Apps Script** (script vinculado à planilha)

### 2. Google Apps Script

1. Cole o conteúdo de `gas/Code.gs`
2. Execute **`setupBancoDeDados`** (autorize permissões) — cria as abas do banco
3. **Implantar → Nova implantação → Aplicativo da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
4. Copie a URL `/exec` e cole em `config.js` → `GAS_URL`

**Importante:** toda alteração no `Code.gs` exige **nova implantação** (Gerenciar implantações → Editar → Nova versão).

### 3. API Gemini (leitor de boletos — gratuita)

1. Crie uma chave em [Google AI Studio](https://aistudio.google.com/apikey)
2. No Apps Script, edite a função **`configurarGeminiApiKey()`** em `Code.gs` — cole sua chave na variável `key`
3. Execute **`configurarGeminiApiKey()`** uma vez
4. **Nova versão** do Web App (redeploy)

A chave fica **somente** no Apps Script (Script Properties). Nunca coloque no GitHub.

### 4. Frontend (GitHub Pages ou local)

```bash
npx serve .
```

Publicado em: https://lucas031bh.github.io/Despesas/

## Importar boleto (JPEG, PNG, PDF)

1. No dashboard **Casa** ou **ADNY**, clique **Importar boleto**
2. Envie foto ou PDF do boleto
3. Escolha **Casa** ou **ADNY**
4. O Gemini extrai valor, vencimento, empresa, linha digitável, etc.
5. Responda perguntas se houver dúvidas (tipo fixo/variável, observações)
6. Revise o **Novo modelo** pré-preenchido e clique **Salvar modelo**
7. Clique **Gerar mês** para criar o lançamento do mês

## Abas criadas automaticamente

- `MODELOS`, `LANCAMENTOS`, `OPERACIONAL_DIARIO`, `CONFIG`, `HISTORICO_FECHAMENTOS`

## Versão

1.1.0 — leitor de boletos com Gemini + dashboards Casa/ADNY.
