/**
 * ============================================================
 * ADNY Finance — api.js
 * ============================================================
 * Responsabilidade:
 *   Camada HTTP para o Google Apps Script (GET/POST).
 *
 * Depende de:
 *   config.js, utils.js
 *
 * Exporta / expõe:
 *   API (objeto global)
 *
 * Histórico:
 *   v1.0 — 2026-05-28 — Criação inicial
 * ============================================================
 */

const API = (function () {
  /**
   * request — fetch com timeout e parse JSON padronizado
   * @param {string} method GET|POST
   * @param {object} params query ou body
   * @returns {Promise<object>} data da resposta
   */
  async function request(method, params, postUrl, timeoutMs) {
    const controller = new AbortController();
    const ms = timeoutMs || CONFIG.API_TIMEOUT;
    const timer = setTimeout(() => controller.abort(), ms);

    try {
      let url = postUrl || CONFIG.GAS_URL;
      const opts = {
        method,
        signal: controller.signal,
        redirect: 'follow',
      };

      if (method === 'GET') {
        const qs = new URLSearchParams(params || {}).toString();
        url += (url.includes('?') ? '&' : '?') + qs;
      } else {
        opts.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        opts.body = JSON.stringify(params || {});
      }

      const res = await fetch(url, opts);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          'Resposta inválida do servidor. Republicue o Apps Script (Nova versão) e confira GAS_URL.'
        );
      }

      if (!json.success) {
        const err = new Error(json.error || 'Erro na API');
        err.code = json.code;
        throw err;
      }

      return json.data;
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Tempo esgotado ao conectar com o servidor.');
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  function get(params) {
    return request('GET', params);
  }

  function post(action, body, timeoutMs) {
    let url = CONFIG.GAS_URL;
    url += (url.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(action);
    return request('POST', { action, ...body }, url, timeoutMs);
  }

  /* ——— Modelos ——— */
  const getModelos = (area) => get({ action: 'getModelos', area });
  const getModelo = (id) => get({ action: 'getModelo', id });
  const criarModelo = (dados) => post('criarModelo', dados);
  const editarModelo = (dados) => post('editarModelo', dados);
  const arquivarModelo = (id) => post('arquivarModelo', { id });

  /* ——— Lançamentos ——— */
  const getLancamentos = (mes, area) =>
    get({ action: 'getLancamentos', mes, area });
  const criarLancamento = (dados) => post('criarLancamento', dados);
  const editarLancamento = (dados) => post('editarLancamento', dados);
  const pagarLancamento = (dados) => post('pagarLancamento', dados);

  /* ——— Operacional ——— */
  const getOperacional = (data) => get({ action: 'getOperacional', data });
  const criarOperacional = (dados) => post('criarOperacional', dados);

  /* ——— Relatórios / sistema ——— */
  const getRelatorio = (area, de, ate) =>
    get({ action: 'getRelatorio', area, de, ate });
  const getConfig = () => get({ action: 'getConfig' });
  const ping = () => get({ action: 'ping' });
  const fecharMes = (mes_ref, area) => post('fecharMes', { mes_ref, area });
  const gerarLancamentos = (mes_ref) => post('gerarLancamentos', { mes_ref });

  /* ——— Leitor de boletos (Gemini) ——— */
  const lerBoleto = (dados) => post('lerBoleto', dados, CONFIG.BOLETO_API_TIMEOUT);
  const refinarBoleto = (dados) =>
    post('refinarBoleto', dados, CONFIG.BOLETO_API_TIMEOUT);

  return {
    get,
    post,
    getModelos,
    getModelo,
    criarModelo,
    editarModelo,
    arquivarModelo,
    getLancamentos,
    criarLancamento,
    editarLancamento,
    pagarLancamento,
    getOperacional,
    criarOperacional,
    getRelatorio,
    getConfig,
    ping,
    fecharMes,
    gerarLancamentos,
    lerBoleto,
    refinarBoleto,
  };
})();
