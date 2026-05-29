/**
 * ============================================================
 * ADNY Finance — app.js
 * ============================================================
 * Inicialização, roteamento, estado global.
 * ============================================================
 */

/** Estado compartilhado entre módulos */
const AppState = {
  mesRef: Utils.mesAtualRef(),
  rota: CONFIG.ROTAS.CASA,
  areaAtiva: 'casa',
  lancamentosCasa: [],
  lancamentosAdny: [],
  config: {},
};

const App = (function () {
  /** Modais já estão no index.html; fetch opcional para desenvolvimento modular */
  async function carregarModais() {
    if (document.getElementById('modal-modelo-backdrop')) return;
    const host = document.getElementById('modals-host');
    if (!host) return;
    const files = [
      'components/modal-modelo.html',
      'components/modal-lancamento.html',
      'components/modal-operacional.html',
    ];
    for (const f of files) {
      try {
        const res = await fetch(f);
        if (res.ok) host.insertAdjacentHTML('beforeend', await res.text());
      } catch (e) {
        console.warn('Modal não carregado:', f, e);
      }
    }
  }

  function atualizarNav(rota) {
    document.querySelectorAll('[data-rota]').forEach((el) => {
      const match = el.dataset.rota === rota;
      el.classList.toggle('is-active', match);
    });
  }

  function atualizarHeaderMes() {
    const el = document.getElementById('header-mes');
    if (el) el.textContent = Utils.formatarMesLabel(AppState.mesRef);
  }

  async function navegar(rota) {
    AppState.rota = rota;
    atualizarNav(rota);
    atualizarHeaderMes();

    const content = document.getElementById('app-content');

    switch (rota) {
      case CONFIG.ROTAS.CASA:
        DashboardCasa.renderTemplate();
        await DashboardCasa.carregar();
        break;
      case CONFIG.ROTAS.ADNY:
        DashboardAdny.renderTemplate();
        await DashboardAdny.carregar();
        break;
      case CONFIG.ROTAS.OPERACIONAL:
        Operacional.renderTemplate();
        break;
      case CONFIG.ROTAS.RELATORIOS:
        Relatorios.renderTemplate();
        break;
      case CONFIG.ROTAS.CONFIG:
        renderConfig();
        break;
      default:
        content.innerHTML = '<p>Rota não encontrada</p>';
    }
  }

  function renderConfig() {
    document.getElementById('app-content').innerHTML = `
      <h1 class="page-title">Configurações</h1>
      <div class="summary-card" style="max-width:640px">
        <p><strong>Versão frontend:</strong> ${CONFIG.VERSION}</p>
        <p><strong>Planilha:</strong> ${CONFIG.SPREADSHEET_NAME}</p>
        <p><strong>ID planilha:</strong> <code style="font-size:0.75rem;word-break:break-all">${CONFIG.SPREADSHEET_ID}</code></p>
        <p><strong>URL planilha:</strong><br />
          <a href="${CONFIG.SPREADSHEET_URL}" target="_blank" rel="noopener" style="font-size:0.75rem;word-break:break-all">${CONFIG.SPREADSHEET_URL}</a></p>
        <p><strong>API GAS:</strong><br />
          <a href="${CONFIG.GAS_URL}?action=ping" target="_blank" rel="noopener" style="font-size:0.75rem;word-break:break-all">${CONFIG.GAS_URL}</a></p>
        <p class="despesa-card__meta" style="margin-top:1rem">
          No Google: cole o <code>gas/Code.gs</code> inteiro no Apps Script e faça <strong>Nova versão</strong> do Web App.
          URLs acima já estão em <code>config.js</code> e <code>Code.gs</code>.
        </p>
      </div>
    `;
  }

  function bindNav() {
    document.querySelectorAll('[data-rota]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navegar(el.dataset.rota);
      });
    });
  }

  async function init() {
    try {
      AppState.config = await API.getConfig();
      if (AppState.config.mes_ativo) AppState.mesRef = AppState.config.mes_ativo;
    } catch (err) {
      Utils.showToast(
        err?.message || 'API indisponível — verifique GAS_URL e SPREADSHEET_ID no Apps Script',
        'error'
      );
    }

    await carregarModais();
    Modelos.init();
    LeitorBoleto.init();
    Lancamentos.init();
    Operacional.init();
    DashboardCasa.init();
    DashboardAdny.init();
    Auth.init();
    bindNav();
    await navegar(CONFIG.ROTAS.CASA);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { navegar, init };
})();
