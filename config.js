/**
 * ============================================================
 * ADNY Finance — config.js
 * ============================================================
 * Responsabilidade:
 *   Centraliza URLs, constantes e listas válidas do sistema.
 *
 * Depende de:
 *   Nenhum (carregado primeiro no index.html)
 *
 * Exporta / expõe:
 *   CONFIG (objeto global)
 *
 * Histórico:
 *   v1.0 — 2026-05-28 — Criação inicial
 * ============================================================
 */

/** @type {object} Configurações globais — altere aqui antes de outros arquivos */
const CONFIG = {
  /** URL do Web App GAS após deploy (Implantar > Aplicativo da Web) */
  GAS_URL: 'https://script.google.com/macros/s/AKfycbz7sY5mPWoOP0SaR4kemU1pDedHPo9O5LFwXkiD-TGaKTW86_lh4VCCb3n_LyQg6Qw/exec',

  /** Nome da planilha no Google Drive (referência humana; ID real fica em gas/Code.gs → SPREADSHEET_ID) */
  SPREADSHEET_NAME: 'BancoDeDadosDespesas',

  VERSION: '1.1.0',

  /** Timeout HTTP para a API (ms) */
  API_TIMEOUT: 10000,

  /** Timeout para leitura de boleto via Gemini (ms) */
  BOLETO_API_TIMEOUT: 90000,

  GEMINI_MODEL: 'gemini-2.0-flash',

  MAX_UPLOAD_BYTES: 5 * 1024 * 1024,

  UPLOAD_TIPOS: ['image/jpeg', 'image/png', 'application/pdf'],

  AREAS: ['casa', 'adny'],

  TIPOS_MODELO: ['fixa_parcelada', 'fixa_recorrente', 'recorrente_variavel'],

  STATUS_LANCAMENTO: ['aberto', 'pago', 'vencido'],

  METODOS_PAGAMENTO: [
    'pix',
    'dinheiro',
    'cartao_debito',
    'cartao_credito',
    'boleto',
    'outro',
  ],

  CATEGORIAS_OPERACIONAL: [
    'gasolina',
    'alimentacao',
    'cafe',
    'marmita',
    'lanche',
    'outro',
  ],

  CATEGORIAS: {
    casa: [
      'Luz',
      'Água',
      'Gás',
      'Internet',
      'Prestação Casa',
      'Condomínio',
      'IPTU',
      'Seguro',
      'Telefone',
      'Streaming',
      'Mercado',
      'Outros',
    ],
    adny: {
      fixas: ['Aluguel', 'Água', 'Luz', 'Internet', 'Pronamp', 'Contador'],
      servicos: ['Costureira', 'Bordado', 'Corte', 'Manutenção'],
      compras: ['Tinta', 'Materiais', 'Pequenas Compras', 'Embalagens'],
      diario: ['Gasolina', 'Alimentação', 'Café', 'Marmita', 'Lanche'],
    },
  },

  /** Rotas de navegação do app */
  ROTAS: {
    CASA: 'casa',
    ADNY: 'adny',
    OPERACIONAL: 'operacional',
    RELATORIOS: 'relatorios',
    CONFIG: 'config',
  },

  /** Labels amigáveis para métodos de pagamento */
  LABELS_METODO: {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao_debito: 'Débito',
    cartao_credito: 'Crédito',
    boleto: 'Boleto',
    outro: 'Outro',
  },

  LABELS_STATUS: {
    pago: 'Pago',
    aberto: 'Em aberto',
    vencido: 'Vencido',
  },
};
