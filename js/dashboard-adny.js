/**
 * ADNY Finance — dashboard-adny.js
 * Dashboard operacional ADNY (mesma lógica da casa, área adny).
 */
const DashboardAdny = (function () {
  const AREA = 'adny';
  let filtroStatus = 'todos';
  let modelosCache = [];

  function el(id) {
    return document.getElementById(id);
  }

  function renderTemplate() {
    el('app-content').innerHTML = `
      <h1 class="page-title page-title--adny">ADNY — Despesas</h1>
      <div class="dashboard-toolbar">
        <button type="button" class="btn btn--adny" id="btn-novo-modelo-adny">+ Novo modelo</button>
        <button type="button" class="btn btn--ghost" id="btn-importar-boleto-adny">Importar boleto</button>
        <button type="button" class="btn btn--ghost" id="btn-gerar-mes-adny">Gerar mês</button>
        <button type="button" class="btn btn--ghost" id="btn-op-rapido">+ Gasto rápido</button>
      </div>
      <div class="summary-grid" id="summary-adny"></div>
      <div class="filter-bar" id="filter-adny"></div>
      <div class="despesa-list" id="lista-adny"></div>
    `;
    bindToolbar();
    bindFiltros();
  }

  function bindToolbar() {
    el('btn-novo-modelo-adny')?.addEventListener('click', () =>
      Modelos.abrirModal(AREA, null)
    );
    el('btn-importar-boleto-adny')?.addEventListener('click', () =>
      LeitorBoleto.abrir(AREA)
    );
    el('btn-gerar-mes-adny')?.addEventListener('click', async () => {
      try {
        Utils.setLoading(true);
        const r = await API.repairGerar(AppState.mesRef);
        let msg = `Gerados: ${r.gerados}, ignorados: ${r.ignorados || 0}`;
        if (r.datas_corrigidas) msg += `, datas corrigidas: ${r.datas_corrigidas}`;
        if (r.ignorados_detalhe && r.ignorados_detalhe.length) {
          msg += ' — ' + r.ignorados_detalhe.map((d) => `${d.nome}: ${d.motivo}`).join('; ');
        }
        Utils.showToast(msg, r.gerados > 0 ? undefined : 'error');
        await carregar();
      } catch (e) {
        Utils.showToast(e.message, 'error');
      } finally {
        Utils.setLoading(false);
      }
    });
    el('btn-op-rapido')?.addEventListener('click', () => {
      App.navegar(CONFIG.ROTAS.OPERACIONAL);
      Operacional.abrirModal();
    });
  }

  function bindFiltros() {
    const container = el('filter-adny');
    container.innerHTML = `
      <div class="filter-tabs">
        <button type="button" class="filter-tab is-active" data-filtro="todos">Todos</button>
        <button type="button" class="filter-tab" data-filtro="vencido">Vencidas</button>
        <button type="button" class="filter-tab" data-filtro="aberto">A vencer</button>
        <button type="button" class="filter-tab" data-filtro="pago">Pagas</button>
      </div>
      <div class="mes-nav">
        <button type="button" class="btn btn--ghost btn--sm" id="mes-prev-adny">‹</button>
        <span class="mes-nav__label" id="mes-label-adny"></span>
        <button type="button" class="btn btn--ghost btn--sm" id="mes-next-adny">›</button>
      </div>
    `;
    container.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        filtroStatus = tab.dataset.filtro;
        container.querySelectorAll('.filter-tab').forEach((t) =>
          t.classList.toggle('is-active', t === tab)
        );
        renderLista(AppState.lancamentosAdny);
      });
    });
    el('mes-prev-adny')?.addEventListener('click', () => {
      AppState.mesRef = Utils.mesAnterior(AppState.mesRef);
      carregar();
    });
    el('mes-next-adny')?.addEventListener('click', () => {
      AppState.mesRef = Utils.mesProximo(AppState.mesRef);
      carregar();
    });
  }

  function calcularResumo(lancamentos) {
    let total = 0;
    let pagas = 0;
    let pendentes = 0;
    let vencidas = 0;
    let qtdPagas = 0;
    let qtdAbertas = 0;
    let qtdVencidas = 0;
    lancamentos.forEach((l) => {
      const v = Number(l.valor) || 0;
      const st = Utils.calcularStatus(l);
      total += v;
      if (st === 'pago') {
        pagas += v;
        qtdPagas++;
      } else if (st === 'vencido') {
        vencidas += v;
        qtdVencidas++;
      } else {
        pendentes += v;
        qtdAbertas++;
      }
    });
    return { total, pagas, pendentes, vencidas, qtd: lancamentos.length, qtdPagas, qtdAbertas, qtdVencidas };
  }

  function renderResumo(lancamentos) {
    const r = calcularResumo(lancamentos);
    el('summary-adny').innerHTML = `
      <div class="summary-card"><div class="summary-card__label">Total mês</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.total)}</div>
        <div class="summary-card__sub">${r.qtd} despesas</div></div>
      <div class="summary-card summary-card--pagas"><div class="summary-card__label">Pagas</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.pagas)}</div>
        <div class="summary-card__sub">${r.qtdPagas} pagas</div></div>
      <div class="summary-card summary-card--pendentes"><div class="summary-card__label">Pendentes</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.pendentes)}</div>
        <div class="summary-card__sub">${r.qtdAbertas} abertas</div></div>
      <div class="summary-card summary-card--vencidas"><div class="summary-card__label">Vencidas</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.vencidas)}</div>
        <div class="summary-card__sub">${r.qtdVencidas} atrasadas</div></div>
    `;
  }

  function filtrarLista(lancamentos) {
    if (filtroStatus === 'todos') return lancamentos;
    return lancamentos.filter((l) => Utils.calcularStatus(l) === filtroStatus);
  }

  function modelosSemLancamentoNoMes(modelos, lancamentos) {
    const ids = new Set(lancamentos.map((l) => l.modelo_id));
    return modelos.filter((m) => m.id && !ids.has(m.id));
  }

  function renderLista(lancamentos) {
    const lista = filtrarLista(lancamentos);
    const container = el('lista-adny');
    const pendentes = modelosSemLancamentoNoMes(modelosCache, lancamentos);
    if (!lista.length) {
      const nomes = pendentes.map((m) => m.nome).join(', ');
      container.innerHTML = pendentes.length
        ? `
        <div class="empty-state empty-state--pendentes">
          <strong>Cadastro na planilha, mas não neste mês</strong>
          <p><strong>${pendentes.length}</strong> modelo(s): ${nomes}</p>
          <p>Toque em <strong>Gerar mês</strong> (mês: ${Utils.formatarMesLabel(AppState.mesRef)}).</p>
          <button type="button" class="btn btn--adny" id="btn-gerar-mes-inline-adny">Gerar mês agora</button>
        </div>`
        : `<div class="empty-state"><strong>Nenhuma despesa neste mês</strong><p>Cadastre com <strong>+ Novo modelo</strong> ou toque em <strong>Gerar mês</strong>.</p></div>`;
      el('btn-gerar-mes-inline-adny')?.addEventListener('click', () =>
        el('btn-gerar-mes-adny')?.click()
      );
      return;
    }
    container.innerHTML = lista
      .map((l) => {
        const st = Utils.calcularStatus(l);
        const mod = modelosCache.find((m) => m.id === l.modelo_id);
        return `
        <article class="despesa-card" data-id="${l.id}">
          <div class="despesa-card__header" data-toggle-adny="${l.id}">
            <span class="status-dot status-dot--${st}"></span>
            <div class="despesa-card__main">
              <div class="despesa-card__nome">${l.nome}</div>
              <div class="despesa-card__meta">${mod?.empresa || '—'} · Dia ${l.dia_vencimento}</div>
            </div>
            <div class="despesa-card__badges">
              <span class="despesa-card__valor">${Utils.formatarMoeda(l.valor)}</span>
              <span class="badge badge--${st}">${CONFIG.LABELS_STATUS[st]}</span>
            </div>
            <span class="despesa-card__chevron">▼</span>
          </div>
          <div class="despesa-card__body" id="body-adny-${l.id}"></div>
        </article>`;
      })
      .join('');

    container.querySelectorAll('[data-toggle-adny]').forEach((hdr) => {
      hdr.addEventListener('click', () => {
        const card = hdr.closest('.despesa-card');
        const id = hdr.dataset.toggleAdny;
        const open = card.classList.toggle('is-expanded');
        if (open) expandir(id, lancamentos);
      });
    });
  }

  function expandir(lancId, lancamentos) {
    const l = lancamentos.find((x) => x.id === lancId);
    const mod = modelosCache.find((m) => m.id === l.modelo_id);
    const body = el(`body-adny-${lancId}`);
    if (!body || !l) return;
    const st = Utils.calcularStatus(l);
    body.innerHTML = `
      <dl class="despesa-detail-grid">
        <dt>Categoria</dt><dd>${l.categoria}</dd>
        <dt>Vencimento</dt><dd>${l.data_vencimento}</dd>
      </dl>
      <div class="despesa-actions">
        ${st !== 'pago' ? `<button type="button" class="btn btn--adny btn--sm" data-pagar-adny="${l.id}">Pagar</button>` : ''}
        ${mod ? `<button type="button" class="btn btn--ghost btn--sm" data-edit-adny="${mod.id}">Editar modelo</button>` : ''}
      </div>`;
    body.querySelector('[data-pagar-adny]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Lancamentos.abrirModalPagamento(l);
    });
    body.querySelector('[data-edit-adny]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Modelos.abrirModal(AREA, mod);
    });
  }

  async function carregar() {
    try {
      Utils.setLoading(true);
      el('mes-label-adny').textContent = Utils.formatarMesLabel(AppState.mesRef);
      AppState.areaAtiva = AREA;
      document.getElementById('header-area-label').textContent = 'ADNY';
      const [lancamentosRaw, modelos] = await Promise.all([
        API.getLancamentos(AppState.mesRef, AREA),
        API.getModelos(AREA),
      ]);
      modelosCache = modelos;
      AppState.lancamentosAdny = Utils.aplicarStatusLista(lancamentosRaw);
      renderResumo(AppState.lancamentosAdny);
      renderLista(AppState.lancamentosAdny);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  function init() {
    document.addEventListener('adny:refresh-dashboard', (e) => {
      if (!e.detail?.area || e.detail.area === AREA) carregar();
    });
  }

  return { renderTemplate, carregar, init };
})();
