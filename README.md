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
4. **Configurações do projeto** (engrenagem) → marque **Exibir o arquivo de manifesto appsscript.json no editor**
5. Abra **`appsscript.json`** e cole o conteúdo de **`gas/appsscript.json`** (inclui permissão para chamar o Gemini)
6. **Salvar**
7. Execute **`setupBancoDeDados`** (uma vez, ou após mudar de planilha)
8. Execute **`autorizarPermissoesGemini`** → **Autorizar** quando o Google pedir (rede externa)
9. **Implantar → Gerenciar implantações → Nova versão** (sempre após alterar o `.gs`)

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

Chave Gemini: constante `GEMINI_API_KEY` no topo do `Code.gs` (não commitar em repositório público).

Se aparecer erro de **UrlFetchApp.fetch** / **script.external_request**: atualize o `appsscript.json`, rode **`autorizarPermissoesGemini`** e republicue o Web App.

## Abas da planilha

`MODELOS`, `LANCAMENTOS`, `OPERACIONAL_DIARIO`, `CONFIG`, `HISTORICO_FECHAMENTOS`, **`FORNECEDORES`**

### Fornecedores (terceirizados)

- Página: **`fornecedores.html`** (mesma API GAS e mesma planilha)
- Tipos: **costura**, **bordado**, **silk**, **dtf**
- Campos gerais na aba + **`dados_json`** (peças, tamanhos, matriz silk, DTF)
- Após atualizar o `Code.gs`, rode **`setupBancoDeDados`** ou abra o app (cria a aba automaticamente)

API: `getFornecedores`, `getFornecedor`, `criarFornecedor`, `editarFornecedor`, `excluirFornecedor`

## Versão

1.1.0
