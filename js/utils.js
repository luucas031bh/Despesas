/**
 * ============================================================
 * ADNY Finance — utils.js
 * ============================================================
 * Responsabilidade:
 *   Formatação de moeda/data, UUID, status de lançamentos, toasts.
 *
 * Depende de:
 *   config.js
 *
 * Exporta / expõe:
 *   Utils (objeto global)
 *
 * Histórico:
 *   v1.0 — 2026-05-28 — Criação inicial
 * ============================================================
 */

const Utils = (function () {
  const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  /**
   * gerarId
   * Prefixo + timestamp + sufixo aleatório.
   * @param {string} prefixo - Ex: 'mod', 'lan', 'op'
   * @returns {string}
   */
  function gerarId(prefixo) {
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${prefixo}_${Date.now()}_${rnd}`;
  }

  /**
   * mesAtualRef — YYYY-MM do mês corrente
   * @returns {string}
   */
  function mesAtualRef() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  /**
   * hojeISO — data local YYYY-MM-DD
   * @returns {string}
   */
  function hojeISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * formatarMoeda — BRL
   * @param {number} valor
   * @returns {string}
   */
  function formatarMoeda(valor) {
    const n = Number(valor) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * parseMoeda — converte "1.234,56" ou número
   * @param {string|number} str
   * @returns {number}
   */
  function parseMoeda(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const limpo = String(str)
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    return parseFloat(limpo) || 0;
  }

  /**
   * formatarMesLabel — "2025-06" → "Junho 2025"
   * @param {string} mesRef
   * @returns {string}
   */
  function formatarMesLabel(mesRef) {
    const [y, m] = mesRef.split('-').map(Number);
    if (!y || !m) return mesRef;
    return `${MESES[m - 1]} ${y}`;
  }

  /**
   * mesAnterior / mesProximo — navegação YYYY-MM
   */
  function shiftMes(mesRef, delta) {
    const [y, m] = mesRef.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${nm}`;
  }

  function mesAnterior(mesRef) {
    return shiftMes(mesRef, -1);
  }

  function mesProximo(mesRef) {
    return shiftMes(mesRef, 1);
  }

  /**
   * calcularDataVencimento — último dia do mês se dia > dias no mês
   * @param {string} mesRef YYYY-MM
   * @param {number} dia
   * @returns {string} YYYY-MM-DD
   */
  function calcularDataVencimento(mesRef, dia) {
    const [y, m] = mesRef.split('-').map(Number);
    const ultimo = new Date(y, m, 0).getDate();
    const d = Math.min(Math.max(1, dia || 1), ultimo);
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  /**
   * calcularStatus — regra central de exibição
   * @param {object} lancamento
   * @returns {'pago'|'aberto'|'vencido'}
   */
  function calcularStatus(lancamento) {
    if (!lancamento) return 'aberto';
    if (lancamento.status === 'pago') return 'pago';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = lancamento.data_vencimento;
    if (!venc) return 'aberto';

    const vencimento = new Date(venc + 'T00:00:00');
    if (vencimento < hoje) return 'vencido';
    return 'aberto';
  }

  /**
   * aplicarStatusLista — atualiza .status em memória para exibição
   */
  function aplicarStatusLista(lancamentos) {
    return (lancamentos || []).map((l) => ({
      ...l,
      status_exibicao: calcularStatus(l),
    }));
  }

  /**
   * showToast — notificação temporária
   */
  function showToast(mensagem, tipo) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast' + (tipo === 'error' ? ' toast--error' : '');
    el.textContent = mensagem;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  /**
   * setLoading — overlay global
   */
  function setLoading(ativo) {
    const el = document.getElementById('loading-overlay');
    if (el) el.hidden = !ativo;
  }

  /**
   * flatCategoriasAdny — lista única para selects
   */
  function flatCategoriasAdny() {
    const c = CONFIG.CATEGORIAS.adny;
    return [...c.fixas, ...c.servicos, ...c.compras, ...c.diario];
  }

  function categoriasPorArea(area) {
    if (area === 'casa') return CONFIG.CATEGORIAS.casa;
    return flatCategoriasAdny();
  }

  const MIME_POR_EXT = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    pdf: 'application/pdf',
  };

  /**
   * normalizarMimeArquivo — iOS/Android muitas vezes enviam type vazio ou octet-stream
   */
  function normalizarMimeArquivo(file) {
    if (!file) return '';
    let mime = (file.type || '').toLowerCase().trim();
    if (mime === 'image/jpg') mime = 'image/jpeg';
    const ext = (file.name || '').split('.').pop().toLowerCase();
    if ((!mime || mime === 'application/octet-stream') && ext && MIME_POR_EXT[ext]) {
      mime = MIME_POR_EXT[ext];
    }
    return mime;
  }

  function arquivoUploadPermitido(mime) {
    return CONFIG.UPLOAD_TIPOS.includes(mime);
  }

  function extensaoUploadPermitida(nome) {
    const ext = (nome || '').split('.').pop().toLowerCase();
    return CONFIG.UPLOAD_EXTENSOES.includes(ext);
  }

  return {
    gerarId,
    mesAtualRef,
    hojeISO,
    formatarMoeda,
    parseMoeda,
    formatarMesLabel,
    mesAnterior,
    mesProximo,
    calcularDataVencimento,
    calcularStatus,
    aplicarStatusLista,
    showToast,
    setLoading,
    flatCategoriasAdny,
    categoriasPorArea,
    normalizarMimeArquivo,
    arquivoUploadPermitido,
    extensaoUploadPermitida,
  };
})();
