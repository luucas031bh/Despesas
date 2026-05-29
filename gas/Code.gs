/**
 * ============================================================
 * ADNY Finance — Code.gs (Google Apps Script)
 * ============================================================
 * Planilha: BancoDeDadosDespesas
 * Deploy como Web App: Executar como EU, Acesso: Qualquer pessoa
 * ============================================================
 */

// ——— 1. CONFIGURAÇÕES GLOBAIS ———

/** ID da planilha BancoDeDadosDespesas (trecho entre /d/ e /edit na URL) */
var SPREADSHEET_ID = '17SFH1FTixDgwrCwchH5uTs64WuFbXPSGzSMlvH4M9TU';

/** URL do Web App (copiar também para config.js → GAS_URL) */
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz7sY5mPWoOP0SaR4kemU1pDedHPo9O5LFwXkiD-TGaKTW86_lh4VCCb3n_LyQg6Qw/exec';

/** Código de implantação (Gerenciar implantações) */
var DEPLOYMENT_ID = 'AKfycbz7sY5mPWoOP0SaR4kemU1pDedHPo9O5LFwXkiD-TGaKTW86_lh4VCCb3n_LyQg6Qw';

var SHEETS = {
  MODELOS: 'MODELOS',
  LANCAMENTOS: 'LANCAMENTOS',
  OPERACIONAL_DIARIO: 'OPERACIONAL_DIARIO',
  CONFIG: 'CONFIG',
  HISTORICO_FECHAMENTOS: 'HISTORICO_FECHAMENTOS'
};

var COLS_MODELOS = [
  'id', 'area', 'categoria', 'nome', 'tipo', 'valor_base', 'dia_vencimento',
  'total_parcelas', 'parcela_atual', 'data_inicio', 'data_fim', 'empresa',
  'recebedor', 'telefone', 'link_boleto', 'chave_pix', 'observacoes', 'ativo',
  'criado_em', 'atualizado_em'
];

var COLS_LANCAMENTOS = [
  'id', 'modelo_id', 'area', 'categoria', 'nome', 'mes_ref', 'valor',
  'dia_vencimento', 'data_vencimento', 'status', 'data_pagamento',
  'metodo_pagamento', 'parcela_numero', 'observacoes', 'gerado_auto',
  'criado_em', 'atualizado_em'
];

var COLS_OPERACIONAL = [
  'id', 'data', 'categoria', 'descricao', 'valor', 'metodo_pagamento',
  'responsavel', 'observacoes', 'criado_em'
];

var COLS_CONFIG = ['chave', 'valor', 'descricao', 'atualizado_em'];

var COLS_HISTORICO = [
  'id', 'mes_ref', 'area', 'total_despesas', 'total_pagas',
  'total_pendentes', 'fechado_em', 'observacoes'
];

// ——— 2. UTILITÁRIOS INTERNOS ———

/**
 * Resolve o ID da planilha: constante SPREADSHEET_ID, Script Properties ou planilha ativa (editor).
 */
function getSpreadsheetId_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'COLE_O_ID_DA_PLANILHA_AQUI') {
    return SPREADSHEET_ID;
  }
  var stored = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (stored) return stored;
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active.getId();
  throw new Error(
    'Planilha não configurada. Execute setupBancoDeDados() no editor GAS (com a planilha aberta) ou cole SPREADSHEET_ID em Code.gs.'
  );
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(getSpreadsheetId_());
}

function getSheet_(name) {
  inicializarBanco_();
  return getSpreadsheet_().getSheetByName(name);
}

function nowISO_() {
  return new Date().toISOString();
}

function mesAtualRef_() {
  var d = new Date();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  return d.getFullYear() + '-' + m;
}

function respostaOk_(data, message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      data: data || {},
      message: message || 'Operação realizada com sucesso'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function respostaErro_(error, code) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: error,
      code: code || 'ERRO_GENERICO'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
}

function rowToObject_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = row[i] !== undefined && row[i] !== '' ? row[i] : '';
  }
  return obj;
}

function getAllRows_(sheetName, colDefs) {
  var sheet = getSheet_(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(String);
  var rows = [];
  for (var r = 1; r < data.length; r++) {
    rows.push(rowToObject_(headers, data[r]));
  }
  return rows;
}

function findRowIndex_(sheet, idCol, id) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return -1;
  var headers = data[0];
  var idIdx = headers.indexOf(idCol);
  if (idIdx < 0) return -1;
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idIdx]) === String(id)) return r + 1;
  }
  return -1;
}

function appendRow_(sheetName, colDefs, obj) {
  var sheet = getSheet_(sheetName);
  var row = colDefs.map(function (c) {
    return obj[c] !== undefined && obj[c] !== null ? obj[c] : '';
  });
  sheet.appendRow(row);
}

function updateRowById_(sheetName, colDefs, id, updates) {
  var sheet = getSheet_(sheetName);
  var rowNum = findRowIndex_(sheet, 'id', id);
  if (rowNum < 0) throw new Error('Registro não encontrado: ' + id);
  var headers = getHeaders_(sheet);
  var current = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  var obj = rowToObject_(headers, current);
  Object.keys(updates).forEach(function (k) {
    if (updates[k] !== undefined) obj[k] = updates[k];
  });
  var newRow = headers.map(function (h) {
    return obj[h] !== undefined && obj[h] !== null ? obj[h] : '';
  });
  sheet.getRange(rowNum, 1, 1, headers.length).setValues([newRow]);
}

function boolVal_(v) {
  return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
}

function compararMes_(mesRef, limite) {
  return mesRef <= limite;
}

function calcularStatusLanc_(lanc) {
  if (lanc.status === 'pago') return 'pago';
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (!lanc.data_vencimento) return 'aberto';
  var parts = String(lanc.data_vencimento).split('-');
  var v = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (v < hoje) return 'vencido';
  return 'aberto';
}

function dataVencimentoDoMes_(mesRef, dia) {
  var p = mesRef.split('-');
  var y = Number(p[0]);
  var m = Number(p[1]);
  var ultimo = new Date(y, m, 0).getDate();
  var d = Math.min(Math.max(1, Number(dia) || 1), ultimo);
  return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
}

function getConfigValor_(chave) {
  var rows = getAllRows_(SHEETS.CONFIG, COLS_CONFIG);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].chave === chave) return rows[i].valor;
  }
  return '';
}

function setConfigValor_(chave, valor) {
  var sheet = getSheet_(SHEETS.CONFIG);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(String);
  var chIdx = headers.indexOf('chave');
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][chIdx]) === chave) {
      var valIdx = headers.indexOf('valor');
      var updIdx = headers.indexOf('atualizado_em');
      sheet.getRange(r + 1, valIdx + 1).setValue(valor);
      sheet.getRange(r + 1, updIdx + 1).setValue(nowISO_());
      return;
    }
  }
  appendRow_(SHEETS.CONFIG, COLS_CONFIG, {
    chave: chave,
    valor: valor,
    descricao: chave,
    atualizado_em: nowISO_()
  });
}

// ——— 3. ROTEADOR PRINCIPAL ———

function doGet(e) {
  try {
    inicializarBanco_();
    var mesAtivo = getConfigValor_('mes_ativo') || mesAtualRef_();
    if (getConfigValor_('geracao_automatica') === 'TRUE') {
      gerarLancamentosDoMes_(mesAtivo);
    }
    var action = (e && e.parameter && e.parameter.action) || '';
    return rotear_(action, e && e.parameter ? e.parameter : {}, null);
  } catch (err) {
    return respostaErro_(err.message, 'DOGET_ERRO');
  }
}

function doPost(e) {
  try {
    inicializarBanco_();
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = (body && body.action) || (e && e.parameter && e.parameter.action) || '';
    var payload = body;
    delete payload.action;
    return rotear_(action, e && e.parameter ? e.parameter : {}, payload);
  } catch (err) {
    return respostaErro_(err.message, 'DOPOST_ERRO');
  }
}

function rotear_(action, params, body) {
  switch (action) {
    case 'getModelos':
      return respostaOk_(handlerGetModelos_(params.area));
    case 'getModelo':
      return respostaOk_(handlerGetModelo_(params.id));
    case 'getLancamentos':
      return respostaOk_(handlerGetLancamentos_(params.mes, params.area));
    case 'getOperacional':
      return respostaOk_(handlerGetOperacional_(params.data));
    case 'getRelatorio':
      return respostaOk_(handlerGetRelatorio_(params.area, params.de, params.ate));
    case 'getConfig':
      return respostaOk_(handlerGetConfig_());
    case 'criarModelo':
      return respostaOk_(handlerCriarModelo_(body));
    case 'editarModelo':
      return respostaOk_(handlerEditarModelo_(body));
    case 'arquivarModelo':
      return respostaOk_(handlerArquivarModelo_(body.id));
    case 'criarLancamento':
      return respostaOk_(handlerCriarLancamento_(body));
    case 'editarLancamento':
      return respostaOk_(handlerEditarLancamento_(body));
    case 'pagarLancamento':
      return respostaOk_(handlerPagarLancamento_(body));
    case 'criarOperacional':
      return respostaOk_(handlerCriarOperacional_(body));
    case 'fecharMes':
      return respostaOk_(handlerFecharMes_(body.mes_ref, body.area));
    case 'gerarLancamentos':
      return respostaOk_(gerarLancamentosDoMes_(body.mes_ref));
    default:
      return respostaErro_('Ação inválida: ' + action, 'ACAO_INVALIDA');
  }
}

// ——— 4. HANDLERS MODELOS ———

function handlerGetModelos_(area) {
  var rows = getAllRows_(SHEETS.MODELOS, COLS_MODELOS);
  return rows.filter(function (m) {
    return boolVal_(m.ativo) && (!area || m.area === area);
  });
}

function handlerGetModelo_(id) {
  var rows = getAllRows_(SHEETS.MODELOS, COLS_MODELOS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return rows[i];
  }
  throw new Error('Modelo não encontrado');
}

function handlerCriarModelo_(d) {
  var now = nowISO_();
  var obj = {
    id: d.id,
    area: d.area,
    categoria: d.categoria,
    nome: d.nome,
    tipo: d.tipo,
    valor_base: Number(d.valor_base) || 0,
    dia_vencimento: Number(d.dia_vencimento) || 1,
    total_parcelas: Number(d.total_parcelas) || 0,
    parcela_atual: Number(d.parcela_atual) || 1,
    data_inicio: d.data_inicio,
    data_fim: d.data_fim || '',
    empresa: d.empresa || '',
    recebedor: d.recebedor || '',
    telefone: d.telefone || '',
    link_boleto: d.link_boleto || '',
    chave_pix: d.chave_pix || '',
    observacoes: d.observacoes || '',
    ativo: 'TRUE',
    criado_em: now,
    atualizado_em: now
  };
  appendRow_(SHEETS.MODELOS, COLS_MODELOS, obj);
  return obj;
}

function handlerEditarModelo_(d) {
  var id = d.id;
  delete d.id;
  delete d.action;
  d.atualizado_em = nowISO_();
  updateRowById_(SHEETS.MODELOS, COLS_MODELOS, id, d);
  return handlerGetModelo_(id);
}

function handlerArquivarModelo_(id) {
  updateRowById_(SHEETS.MODELOS, COLS_MODELOS, id, {
    ativo: 'FALSE',
    atualizado_em: nowISO_()
  });
  return { id: id, ativo: false };
}

// ——— 5. HANDLERS LANÇAMENTOS ———

function handlerGetLancamentos_(mes, area) {
  var rows = getAllRows_(SHEETS.LANCAMENTOS, COLS_LANCAMENTOS);
  var filtrados = rows.filter(function (l) {
    return l.mes_ref === mes && (!area || l.area === area);
  });
  return filtrados.map(function (l) {
    var st = calcularStatusLanc_(l);
    if (st === 'vencido' && l.status !== 'pago') {
      l.status = 'vencido';
    }
    return l;
  });
}

function handlerCriarLancamento_(d) {
  var now = nowISO_();
  var mesRef = d.mes_ref;
  var dia = Number(d.dia_vencimento) || 1;
  var obj = {
    id: d.id,
    modelo_id: d.modelo_id || '',
    area: d.area,
    categoria: d.categoria,
    nome: d.nome,
    mes_ref: mesRef,
    valor: Number(d.valor) || 0,
    dia_vencimento: dia,
    data_vencimento: d.data_vencimento || dataVencimentoDoMes_(mesRef, dia),
    status: d.status || 'aberto',
    data_pagamento: d.data_pagamento || '',
    metodo_pagamento: d.metodo_pagamento || '',
    parcela_numero: Number(d.parcela_numero) || 0,
    observacoes: d.observacoes || '',
    gerado_auto: d.gerado_auto ? 'TRUE' : 'FALSE',
    criado_em: now,
    atualizado_em: now
  };
  appendRow_(SHEETS.LANCAMENTOS, COLS_LANCAMENTOS, obj);
  return obj;
}

function handlerEditarLancamento_(d) {
  var id = d.id;
  delete d.id;
  delete d.action;
  d.atualizado_em = nowISO_();
  updateRowById_(SHEETS.LANCAMENTOS, COLS_LANCAMENTOS, id, d);
  var rows = getAllRows_(SHEETS.LANCAMENTOS, COLS_LANCAMENTOS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === id) return rows[i];
  }
  throw new Error('Lançamento não encontrado');
}

function handlerPagarLancamento_(d) {
  return handlerEditarLancamento_({
    id: d.id,
    status: 'pago',
    data_pagamento: d.data_pagamento,
    metodo_pagamento: d.metodo_pagamento,
    valor: d.valor !== undefined ? Number(d.valor) : undefined
  });
}

// ——— 6. OPERACIONAL ———

function handlerGetOperacional_(data) {
  var rows = getAllRows_(SHEETS.OPERACIONAL_DIARIO, COLS_OPERACIONAL);
  if (!data) return rows;
  return rows.filter(function (r) {
    return String(r.data).substring(0, 10) === String(data).substring(0, 10);
  });
}

function handlerCriarOperacional_(d) {
  var obj = {
    id: d.id,
    data: d.data,
    categoria: d.categoria,
    descricao: d.descricao || '',
    valor: Number(d.valor) || 0,
    metodo_pagamento: d.metodo_pagamento || 'pix',
    responsavel: d.responsavel || '',
    observacoes: d.observacoes || '',
    criado_em: nowISO_()
  };
  appendRow_(SHEETS.OPERACIONAL_DIARIO, COLS_OPERACIONAL, obj);
  return obj;
}

// ——— 7. RELATÓRIOS ———

function handlerGetRelatorio_(area, de, ate) {
  var rows = getAllRows_(SHEETS.LANCAMENTOS, COLS_LANCAMENTOS);
  var meses = [];
  var resumo = {};

  rows.forEach(function (l) {
    if (area && l.area !== area) return;
    if (de && l.mes_ref < de) return;
    if (ate && l.mes_ref > ate) return;

    if (meses.indexOf(l.mes_ref) < 0) meses.push(l.mes_ref);
    if (!resumo[l.mes_ref]) {
      resumo[l.mes_ref] = { mes_ref: l.mes_ref, total: 0, pagas: 0, pendentes: 0, qtd: 0 };
    }
    var v = Number(l.valor) || 0;
    var st = calcularStatusLanc_(l);
    resumo[l.mes_ref].total += v;
    resumo[l.mes_ref].qtd += 1;
    if (st === 'pago') resumo[l.mes_ref].pagas += v;
    else resumo[l.mes_ref].pendentes += v;
  });

  meses.sort();
  var lista = meses.map(function (m) { return resumo[m]; });
  return { area: area, de: de, ate: ate, meses: lista };
}

function handlerGetConfig_() {
  var rows = getAllRows_(SHEETS.CONFIG, COLS_CONFIG);
  var cfg = {};
  rows.forEach(function (r) { cfg[r.chave] = r.valor; });
  return cfg;
}

// ——— 8. GERAÇÃO AUTOMÁTICA ———

function gerarLancamentosDoMes_(mesRef) {
  var modelos = handlerGetModelos_(null);
  var lancamentos = getAllRows_(SHEETS.LANCAMENTOS, COLS_LANCAMENTOS);
  var gerados = 0;
  var ignorados = 0;
  var erros = [];

  modelos.forEach(function (mod) {
    try {
      if (!deveGerarModelo_(mod, mesRef)) {
        ignorados++;
        return;
      }
      var existe = lancamentos.some(function (l) {
        return l.modelo_id === mod.id && l.mes_ref === mesRef;
      });
      if (existe) {
        ignorados++;
        return;
      }

      var parcelaNum = Number(mod.parcela_atual) || 1;
      var lancId = 'lan_' + new Date().getTime() + '_' + Math.random().toString(36).slice(2, 6);
      var dia = Number(mod.dia_vencimento) || 1;

      handlerCriarLancamento_({
        id: lancId,
        modelo_id: mod.id,
        area: mod.area,
        categoria: mod.categoria,
        nome: mod.nome,
        mes_ref: mesRef,
        valor: Number(mod.valor_base) || 0,
        dia_vencimento: dia,
        data_vencimento: dataVencimentoDoMes_(mesRef, dia),
        status: 'aberto',
        parcela_numero: parcelaNum,
        gerado_auto: true
      });
      gerados++;
    } catch (e) {
      erros.push(mod.nome + ': ' + e.message);
    }
  });

  setConfigValor_('mes_ativo', mesRef);
  return { mes_ref: mesRef, gerados: gerados, ignorados: ignorados, erros: erros };
}

function deveGerarModelo_(mod, mesRef) {
  if (!boolVal_(mod.ativo)) return false;
  if (mod.data_inicio && mesRef < mod.data_inicio) return false;
  if (mod.data_fim && mesRef > mod.data_fim) return false;

  var tipo = mod.tipo;
  if (tipo === 'fixa_recorrente' || tipo === 'recorrente_variavel') return true;

  if (tipo === 'fixa_parcelada') {
    var total = Number(mod.total_parcelas) || 0;
    if (total <= 0) return true;
    var inicio = mod.data_inicio || mesRef;
    var diff = diffMeses_(inicio, mesRef);
    var parcela = Number(mod.parcela_atual) + diff;
    return parcela <= total;
  }
  return true;
}

function diffMeses_(de, ate) {
  var a = de.split('-').map(Number);
  var b = ate.split('-').map(Number);
  return (b[0] - a[0]) * 12 + (b[1] - a[1]);
}

// ——— 9. FECHAMENTO MENSAL ———

function handlerFecharMes_(mesRef, area) {
  var lancs = handlerGetLancamentos_(mesRef, area === 'ambas' ? null : area);
  var total = 0;
  var pagas = 0;
  var pendentes = 0;

  lancs.forEach(function (l) {
    var v = Number(l.valor) || 0;
    total += v;
    if (calcularStatusLanc_(l) === 'pago') pagas += v;
    else pendentes += v;
  });

  var histId = 'fec_' + new Date().getTime();
  appendRow_(SHEETS.HISTORICO_FECHAMENTOS, COLS_HISTORICO, {
    id: histId,
    mes_ref: mesRef,
    area: area || 'ambas',
    total_despesas: total,
    total_pagas: pagas,
    total_pendentes: pendentes,
    fechado_em: nowISO_(),
    observacoes: ''
  });

  setConfigValor_('ultimo_fechamento', mesRef);
  return {
    id: histId,
    mes_ref: mesRef,
    area: area,
    total_despesas: total,
    total_pagas: pagas,
    total_pendentes: pendentes
  };
}

// ——— 10. INICIALIZAÇÃO DO BANCO ———

function inicializarBanco_() {
  var ss = getSpreadsheet_();
  criarAbaSeNaoExiste_(ss, SHEETS.MODELOS, COLS_MODELOS);
  criarAbaSeNaoExiste_(ss, SHEETS.LANCAMENTOS, COLS_LANCAMENTOS);
  criarAbaSeNaoExiste_(ss, SHEETS.OPERACIONAL_DIARIO, COLS_OPERACIONAL);
  criarAbaSeNaoExiste_(ss, SHEETS.CONFIG, COLS_CONFIG);
  criarAbaSeNaoExiste_(ss, SHEETS.HISTORICO_FECHAMENTOS, COLS_HISTORICO);
  seedConfig_();
}

function criarAbaSeNaoExiste_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function seedConfig_() {
  var defaults = [
    { chave: 'versao_sistema', valor: '1.0.0', descricao: 'Versão do sistema' },
    { chave: 'ultimo_fechamento', valor: '', descricao: 'Último mês fechado' },
    { chave: 'mes_ativo', valor: mesAtualRef_(), descricao: 'Mês de referência ativo' },
    { chave: 'geracao_automatica', valor: 'TRUE', descricao: 'Gerar lançamentos automaticamente' }
  ];
  var rows = getAllRows_(SHEETS.CONFIG, COLS_CONFIG);
  var chaves = rows.map(function (r) { return r.chave; });
  defaults.forEach(function (d) {
    if (chaves.indexOf(d.chave) < 0) {
      appendRow_(SHEETS.CONFIG, COLS_CONFIG, {
        chave: d.chave,
        valor: d.valor,
        descricao: d.descricao,
        atualizado_em: nowISO_()
      });
    }
  });
}

/** Execute uma vez no editor GAS para criar abas na planilha */
function setupBancoDeDados() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', active.getId());
    Logger.log('SPREADSHEET_ID salvo: ' + active.getId());
    Logger.log('Planilha: ' + active.getName());
  }
  inicializarBanco_();
  Logger.log('Banco inicializado — abas criadas em BancoDeDadosDespesas');
}
