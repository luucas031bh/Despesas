# ADNY Finance — passos 4 a 9 no Apps Script (o que dá para automatizar no PC)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$gasDir = Join-Path $root 'gas'
$planilha = 'https://docs.google.com/spreadsheets/d/17SEHLETtxDgwrCwchH5uTs64WuFbXPSGsSMIvH4M9TU/edit'

Write-Host ''
Write-Host '=== ADNY — Publicar no Google (passo 4+) ===' -ForegroundColor Cyan
Write-Host ''

# Passo 5: appsscript.json na area de transferencia
$manifest = Join-Path $gasDir 'appsscript.json'
if (-not (Test-Path $manifest)) { throw "Nao encontrado: $manifest" }
Get-Content $manifest -Raw -Encoding UTF8 | Set-Clipboard
Write-Host '[OK] appsscript.json copiado para a area de transferencia.' -ForegroundColor Green
Write-Host '     No Apps Script: abra appsscript.json e cole (Ctrl+V).' -ForegroundColor Yellow

# Abrir planilha (Extensões > Apps Script)
Start-Process $planilha
Write-Host '[OK] Planilha aberta no navegador.' -ForegroundColor Green

Write-Host ''
Write-Host 'No editor Apps Script (voce faz manualmente — precisa da sua conta Google):' -ForegroundColor Cyan
Write-Host '  4. Engrenagem > marque "Exibir appsscript.json no editor"'
Write-Host '  5. Abra appsscript.json > Ctrl+V > Salvar'
Write-Host '  6. Menu funcoes > autorizarPermissoesGemini > Executar > Autorizar'
Write-Host '  7. Implantar > Gerenciar implantacoes > Nova versao > Implantar'
Write-Host ''
Write-Host 'Code.gs: arquivo em' (Join-Path $gasDir 'Code.gs') '- cole no editor se ainda nao colou.'
Write-Host 'Teste: Importar boleto > Analisar boleto no app.' -ForegroundColor Cyan
Write-Host ''
