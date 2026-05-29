/**
 * ADNY Finance — dashboard-casa.js
 * Dashboard Pessoal/Casa (área casa).
 */
const DashboardCasa = (function () {
  const AREA = 'casa';
  let filtroStatus = 'todos';
  let modelosCache = [];

  function el(id) {
    return document.getElementById(id);
  }

  function renderTemplate() {
    const root = el('app-content');
    root.innerHTML = `
      <h1 class="page-title page-title--casa">Casa — Despesas</h1>
      <div class="dashboard-toolbar">
        <button type="button" class="btn btn--casa" id="btn-novo-modelo-casa">+ Novo modelo</button>
        <button type="button" class="btn btn--ghost" id="btn-importar-boleto-casa">Importar boleto</button>
        <button type="button" class="btn btn--ghost" id="btn-gerar-mes-casa">Gerar mês</button>
      </div>
      <div class="summary-grid" id="summary-casa"></div>
      <div class="filter-bar" id="filter-casa"></div>
      <div class="despesa-list" id="lista-casa"></div>
    `;
    bindToolbar();
    bindFiltros();
  }

  function bindToolbar() {
    el('btn-novo-modelo-casa')?.addEventListener('click', () =>
      Modelos.abrirModal(AREA, null)
    );
    el('btn-importar-boleto-casa')?.addEventListener('click', () =>
      LeitorBoleto.abrir(AREA)
    );
    el('btn-gerar-mes-casa')?.addEventListener('click', async () => {
      try {
        Utils.setLoading(true);
        const r = await API.gerarLancamentos(AppState.mesRef);
        Utils.showToast(`Gerados: ${r.gerados}, ignorados: ${r.ignorados}`);
        await carregar();
      } catch (e) {
        Utils.showToast(e.message, 'error');
      } finally {
        Utils.setLoading(false);
      }
    });
  }

  function bindFiltros() {
    const container = el('filter-casa');
    container.innerHTML = `
      <div class="filter-tabs" role="tablist">
        <button type="button" class="filter-tab is-active" data-filtro="todos">Todos</button>
        <button type="button" class="filter-tab" data-filtro="vencido">Vencidas</button>
        <button type="button" class="filter-tab" data-filtro="aberto">A vencer</button>
        <button type="button" class="filter-tab" data-filtro="pago">Pagas</button>
      </div>
      <div class="mes-nav">
        <button type="button" class="btn btn--ghost btn--sm" id="mes-prev-casa" aria-label="Mês anterior">‹</button>
        <span class="mes-nav__label" id="mes-label-casa"></span>
        <button type="button" class="btn btn--ghost btn--sm" id="mes-next-casa" aria-label="Próximo mês">›</button>
      </div>
    `;

    container.querySelectorAll('.filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        filtroStatus = tab.dataset.filtro;
        container.querySelectorAll('.filter-tab').forEach((t) =>
          t.classList.toggle('is-active', t === tab)
        );
        renderLista(AppState.lancamentosCasa);
      });
    });

    el('mes-prev-casa')?.addEventListener('click', () => {
      AppState.mesRef = Utils.mesAnterior(AppState.mesRef);
      carregar();
    });
    el('mes-next-casa')?.addEventListener('click', () => {
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

    return {
      total,
      pagas,
      pendentes,
      vencidas,
      qtd: lancamentos.length,
      qtdPagas,
      qtdAbertas,
      qtdVencidas,
    };
  }

  function renderResumo(lancamentos) {
    const r = calcularResumo(lancamentos);
    el('summary-casa').innerHTML = `
      <div class="summary-card">
        <div class="summary-card__label">Total mês</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.total)}</div>
        <div class="summary-card__sub">${r.qtd} despesas</div>
      </div>
      <div class="summary-card summary-card--pagas">
        <div class="summary-card__label">Pagas</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.pagas)}</div>
        <div class="summary-card__sub">${r.qtdPagas} pagas</div>
      </div>
      <div class="summary-card summary-card--pendentes">
        <div class="summary-card__label">Pendentes</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.pendentes)}</div>
        <div class="summary-card__sub">${r.qtdAbertas} abertas</div>
      </div>
      <div class="summary-card summary-card--vencidas">
        <div class="summary-card__label">Vencidas</div>
        <div class="summary-card__value">${Utils.formatarMoeda(r.vencidas)}</div>
        <div class="summary-card__sub">${r.qtdVencidas} atrasadas</div>
      </div>
    `;
  }

  function filtrarLista(lancamentos) {
    if (filtroStatus === 'todos') return lancamentos;
    return lancamentos.filter((l) => Utils.calcularStatus(l) === filtroStatus);
  }

  function modeloPorId(id) {
    return modelosCache.find((m) => m.id === id);
  }

  function modelosSemLancamentoNoMes(modelos, lancamentos) {
    const ids = new Set(lancamentos.map((l) => l.modelo_id));
    return modelos.filter((m) => m.id && !ids.has(m.id));
  }

  async function historicoModelo(modeloId) {
    if (!modeloId) return [];
    try {
      const meses = [
        Utils.mesAnterior(AppState.mesRef),
        Utils.mesAnterior(Utils.mesAnterior(AppState.mesRef)),
        Utils.mesAnterior(Utils.mesAnterior(Utils.mesAnterior(AppState.mesRef))),
      ];
      const todos = [];
      for (const m of meses) {
        const chunk = await API.getLancamentos(m, AREA);
        todos.push(...chunk.filter((l) => l.modelo_id === modeloId));
      }
      return todos;
    } catch {
      return [];
    }
  }

  function renderLista(lancamentos) {
    const lista = filtrarLista(lancamentos);
    const container = el('lista-casa');
    const pendentes = modelosSemLancamentoNoMes(modelosCache, lancamentos);

    if (!lista.length) {
      const nomes = pendentes.map((m) => m.nome).join(', ');
      container.innerHTML = pendentes.length
        ? `
        <div class="empty-state empty-state--pendentes">
          <strong>Cadastro na planilha, mas não neste mês</strong>
          <p><strong>${pendentes.length}</strong> modelo(s): ${nomes}</p>
          <p>Toque em <strong>Gerar mês</strong> para exibir na lista (mês: ${Utils.formatarMesLabel(AppState.mesRef)}).</p>
          <button type="button" class="btn btn--casa" id="btn-gerar-mes-inline-casa">Gerar mês agora</button>
        </div>`
        : `
        <div class="empty-state">
          <strong>Nenhuma despesa neste mês</strong>
          <p>Cadastre com <strong>+ Novo modelo</strong> ou toque em <strong>Gerar mês</strong>.</p>
        </div>`;
      el('btn-gerar-mes-inline-casa')?.addEventListener('click', () =>
        el('btn-gerar-mes-casa')?.click()
      );
      return;
    }

    container.innerHTML = lista
      .map((l) => {
        const st = Utils.calcularStatus(l);
        const mod = modeloPorId(l.modelo_id);
        const empresa = mod?.empresa || '—';
        return `
        <article class="despesa-card" data-id="${l.id}">
          <div class="despesa-card__header" data-toggle="${l.id}">
            <span class="status-dot status-dot--${st}" title="${CONFIG.LABELS_STATUS[st]}"></span>
            <div class="despesa-card__main">
              <div class="despesa-card__nome">${l.nome}</div>
              <div class="despesa-card__meta">${empresa} · Vence dia ${l.dia_vencimento}</div>
            </div>
            <div class="despesa-card__badges">
              <span class="despesa-card__valor">${Utils.formatarMoeda(l.valor)}</span>
              <span class="badge badge--${st}">${CONFIG.LABELS_STATUS[st]}</span>
            </div>
            <span class="despesa-card__chevron">▼</span>
          </div>
          <div class="despesa-card__body" id="body-${l.id}"></div>
        </article>`;
      })
      .join('');

    container.querySelectorAll('[data-toggle]').forEach((hdr) => {
      hdr.addEventListener('click', async () => {
        const card = hdr.closest('.despesa-card');
        const id = hdr.dataset.toggle;
        const expanded = card.classList.toggle('is-expanded');
        if (expanded) await expandirCard(id, lancamentos);
      });
    });
  }

  async function expandirCard(lancId, lancamentos) {
    const l = lancamentos.find((x) => x.id === lancId);
    const body = el(`body-${lancId}`);
    if (!l || !body) return;

    const mod = modeloPorId(l.modelo_id);
    const hist = l.modelo_id ? await historicoModelo(l.modelo_id) : [];

    const histHtml = hist.length
      ? hist
          .map(
            (h) =>
              `<div>${h.mes_ref}: ${Utils.formatarMoeda(h.valor)} — ${CONFIG.LABELS_STATUS[Utils.calcularStatus(h)]}</div>`
          )
          .join('')
      : '<div>Sem histórico anterior</div>';

    const btnPagar =
      Utils.calcularStatus(l) === 'pago'
        ? ''
        : `<button type="button" class="btn btn--casa btn--sm" data-pagar="${l.id}">Pagar</button>`;

    body.innerHTML = `
      <dl class="despesa-detail-grid">
        <dt>Categoria</dt><dd>${l.categoria}</dd>
        <dt>Vencimento</dt><dd>${l.data_vencimento}</dd>
        <dt>Parcela</dt><dd>${l.parcela_numero || '—'}</dd>
        <dt>PIX</dt><dd>${mod?.chave_pix || '—'}</dd>
        <dt>Telefone</dt><dd>${mod?.telefone || '—'}</dd>
        <dt>Observações</dt><dd>${l.observacoes || mod?.observacoes || '—'}</dd>
      </dl>
      <div class="despesa-historico"><h4>Últimos 3 meses</h4>${histHtml}</div>
      <div class="despesa-actions">
        ${btnPagar}
        ${mod ? `<button type="button" class="btn btn--ghost btn--sm" data-edit-mod="${mod.id}">Editar modelo</button>` : ''}
        ${mod ? `<button type="button" class="btn btn--ghost btn--sm" data-arq-mod="${mod.id}">Arquivar</button>` : ''}
      </div>
    `;

    body.querySelector('[data-pagar]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Lancamentos.abrirModalPagamento(l);
    });
    body.querySelector('[data-edit-mod]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Modelos.abrirModal(AREA, mod);
    });
    body.querySelector('[data-arq-mod]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Lancamentos.arquivarModeloDoLancamento(mod.id, AREA);
    });
  }

  async function carregar() {
    el('mes-label-casa').textContent = Utils.formatarMesLabel(AppState.mesRef);
    AppState.areaAtiva = AREA;
    document.getElementById('header-area-label').textContent = 'Casa';

    try {
      Utils.setLoading(true);
      const [lancamentosRaw, modelos] = await Promise.all([
        API.getLancamentos(AppState.mesRef, AREA),
        API.getModelos(AREA),
      ]);
      modelosCache = modelos;
      let lancamentos = lancamentosRaw;
      const faltando = modelosSemLancamentoNoMes(modelos, lancamentos);
      if (faltando.length > 0) {
        const g = await API.gerarLancamentos(AppState.mesRef);
        if ((g.gerados || 0) > 0) {
          lancamentos = await API.getLancamentos(AppState.mesRef, AREA);
        }
      }
      AppState.lancamentosCasa = Utils.aplicarStatusLista(lancamentos);
      renderResumo(AppState.lancamentosCasa);
      renderLista(AppState.lancamentosCasa);
    } catch (err) {
      Utils.showToast(err.message, 'error');
      el('lista-casa').innerHTML = `<div class="empty-state"><p>${err.message}</p><p>Se persistir: republicue o Code.gs no Apps Script (Nova versão).</p></div>`;
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
