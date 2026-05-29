# ADNY Finance

Sistema financeiro pessoal (Casa) + operacional (ADNY). Frontend estático + Google Apps Script + Google Sheets.

## URLs do projeto (já configuradas)

| O quê | Onde está |
|-------|-----------|
| **Planilha** | [BancoDeDadosDespesas](https://docs.google.com/spreadsheets/d/17SEHLETtxDgwrCwchH5uTs64WuFbXPSGsSMIvH4M9TU/edit) |
| **ID planilha** | `17SEHLETtxDgwrCwchH5uTs64WuFbXPSGsSMIvH4M9TU` |
| **API (Web App)** | `https://script.google.com/macros/s/AKfycbz7sY5mPWoOP0SaR4kemU1pDedHPo9O5LFwXkiD-TGaKTW86_lh4VCCb3n_LyQg6Qw/exec` |
| **App (GitHub Pages)** | https://lucas031bh.github.io/Despesas/ |

Esses valores estão em **`config.js`** (frontend) e no topo de **`gas/Code.gs`** (backend).  
Se mudar a planilha ou o deploy, atualize **nos dois arquivos**.

## Como publicar no Google (sempre arquivo completo)

### 1. Apps Script

1. Abra a [planilha BancoDeDadosDespesas](https://docs.google.com/spreadsheets/d/17SEHLETtxDgwrCwchH5uTs64WuFbXPSGsSMIvH4M9TU/edit)
2. **Extensões → Apps Script**
3. Apague todo o editor e cole **o `gas/Code.gs` inteiro** do repositório
4. **Salvar**
5. Execute **`setupBancoDeDados`** (uma vez, ou após mudar de planilha)
6. Execute **`configurarGeminiApiKey()`** (uma vez, para leitor de boletos)
7. **Implantar → Gerenciar implantações → Nova versão** (sempre após alterar o `.gs`)

### 2. Frontend

Faça push no GitHub — o `config.js` já traz a mesma URL do GAS.

Teste local: `npx serve .`

## Testar se a API está OK

Abra no navegador:

- Ping: [exec?action=ping](https://script.google.com/macros/s/AKfycbz7sY5mPWoOP0SaR4kemU1pDedHPo9O5LFwXkiD-TGaKTW86_lh4VCCb3n_LyQg6Qw/exec?action=ping)
- Config: [exec?action=getConfig](https://script.google.com/macros/s/AKfycbz7sY5mPWoOP0SaR4kemU1pDedHPo9O5LFwXkiD-TGaKTW86_lh4VCCb3n_LyQg6Qw/exec?action=getConfig)

Deve retornar `"success": true`.

## Importar boleto (Gemini)

1. Dashboard **Casa** ou **ADNY** → **Importar boleto**
2. JPEG, PNG ou PDF → escolher área → revisar → **Salvar modelo**
3. **Gerar mês** para criar lançamento

Chave Gemini: só no `Code.gs` → função `configurarGeminiApiKey()` (não commitar chave em repositório público).

## Abas da planilha

`MODELOS`, `LANCAMENTOS`, `OPERACIONAL_DIARIO`, `CONFIG`, `HISTORICO_FECHAMENTOS`

## Versão

1.1.0
