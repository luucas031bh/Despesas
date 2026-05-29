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

const PAGE_TITLES = {
  casa: 'Casa',
  adny: 'ADNY',
  operacional: 'Gasto rápido',
  mes: 'Mês',
  relatorios: 'Relatórios',
  config: 'Configurações',
};

const PAGE_EYEBROWS = {
  casa: 'Finanças pessoais',
  adny: 'Operacional',
  operacional: 'Operacional diário',
  mes: 'Controle mensal',
  relatorios: 'Análise',
  config: 'Ajustes',
};

const App = (function () {
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
    const label = Utils.formatarMesLabel(AppState.mesRef);
    const headerMes = document.getElementById('header-mes');
    const sideMonth = document.getElementById('sideMonthLabel');
    const topbarMonth = document.getElementById('topbar-month');
    if (headerMes) headerMes.textContent = label;
    if (sideMonth) sideMonth.textContent = label;
    if (topbarMonth && topbarMonth.value !== AppState.mesRef) {
      topbarMonth.value = AppState.mesRef;
    }
  }

  function atualizarPageTitle(rota) {
    const title = document.getElementById('pageTitle');
    const eyebrow = document.getElementById('header-area-label');
    if (title) title.textContent = PAGE_TITLES[rota] || 'ADNY Finance';
    if (eyebrow) eyebrow.textContent = PAGE_EYEBROWS[rota] || 'ADNY Finance';
  }

  function atualizarConexao(ok) {
    const el = document.getElementById('connectionLabel');
    if (!el) return;
    el.textContent = ok ? 'Backend conectado' : 'Sem conexão com a API';
  }

  function initTheme() {
    const theme = localStorage.getItem('adny_theme') || 'dark';
    document.querySelector('.app-shell')?.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  function bindThemeToggle() {
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const shell = document.querySelector('.app-shell');
      const next = shell?.dataset.theme === 'dark' ? 'light' : 'dark';
      shell?.setAttribute('data-theme', next);
      localStorage.setItem('adny_theme', next);
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
    });
  }

  function bindTopbarMonth() {
    const input = document.getElementById('topbar-month');
    const prev = document.getElementById('topbar-prev-month');
    const next = document.getElementById('topbar-next-month');
    if (!input) return;

    input.value = AppState.mesRef;

    input.addEventListener('change', async () => {
      AppState.mesRef = Utils.mesRefUtil(input.value);
      atualizarHeaderMes();
      await navegar(AppState.rota);
    });

    prev?.addEventListener('click', async () => {
      AppState.mesRef = Utils.mesAnterior(AppState.mesRef);
      atualizarHeaderMes();
      await navegar(AppState.rota);
    });

    next?.addEventListener('click', async () => {
      AppState.mesRef = Utils.mesProximo(AppState.mesRef);
      atualizarHeaderMes();
      await navegar(AppState.rota);
    });
  }

  async function navegar(rota) {
    AppState.rota = rota;
    AppState.areaAtiva = rota === CONFIG.ROTAS.ADNY ? 'adny' : 'casa';
    atualizarNav(rota);
    atualizarHeaderMes();
    atualizarPageTitle(rota);

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
      case CONFIG.ROTAS.MES:
        Mes.renderTemplate();
        await Mes.carregar();
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
      <article class="panel config-panel">
        <span class="eyebrow">Sistema</span>
        <h2 style="margin:.2rem 0 1rem;font-size:1.25rem">Informações do projeto</h2>
        <p><strong>Versão frontend:</strong> ${CONFIG.VERSION}</p>
        <p><strong>Planilha:</strong> ${CONFIG.SPREADSHEET_NAME}</p>
        <p><strong>ID planilha:</strong> <code>${CONFIG.SPREADSHEET_ID}</code></p>
        <p><strong>URL planilha:</strong><br />
          <a href="${CONFIG.SPREADSHEET_URL}" target="_blank" rel="noopener">${CONFIG.SPREADSHEET_URL}</a></p>
        <p><strong>API GAS:</strong><br />
          <a href="${CONFIG.GAS_URL}?action=ping" target="_blank" rel="noopener">${CONFIG.GAS_URL}</a></p>
        <p class="muted" style="margin-top:1rem">
          No Google: cole o <code>gas/Code.gs</code> inteiro no Apps Script e faça <strong>Nova versão</strong> do Web App.
        </p>
      </article>
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
    initTheme();
    bindThemeToggle();
    bindTopbarMonth();
    atualizarHeaderMes();

    let apiOk = false;
    try {
      await API.ping();
      apiOk = true;
      AppState.config = await API.getConfig();
      if (AppState.config.mes_ativo) {
        AppState.mesRef = Utils.mesRefUtil(AppState.config.mes_ativo);
        atualizarHeaderMes();
      }
    } catch (err) {
      Utils.showToast(
        err?.message || 'API indisponível — cole o Code.gs completo no Apps Script e faça Nova versão.',
        'error'
      );
    }
    atualizarConexao(apiOk);

    await carregarModais();
    Modelos.init();
    LeitorBoleto.init();
    Lancamentos.init();
    Operacional.init();
    DashboardCasa.init();
    DashboardAdny.init();
    Mes.init();
    Auth.init();
    bindNav();
    await navegar(CONFIG.ROTAS.CASA);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { navegar, init, atualizarHeaderMes };
})();
