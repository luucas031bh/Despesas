/**
 * ADNY Finance — mes.js
 * Visão consolidada do mês: Casa, ADNY e gastos rápidos.
 */
const Mes = (function () {
  function el(id) {
    return document.getElementById(id);
  }

  function emAberto(l) {
    return Utils.calcularStatus(l) !== 'pago';
  }

  function ordenarLancamentos(lista) {
    return [...lista].sort((a, b) => {
      const da = a.data_vencimento || '';
      const db = b.data_vencimento || '';
      if (da !== db) return da.localeCompare(db);
      return String(a.nome).localeCompare(String(b.nome), 'pt-BR');
    });
  }

  function ordenarOperacional(lista) {
    return [...lista].sort((a, b) => {
      const cmp = String(b.data).localeCompare(String(a.data));
      if (cmp !== 0) return cmp;
      return String(b.criado_em || '').localeCompare(String(a.criado_em || ''));
    });
  }

  function labelCategoriaOp(cat) {
    return CONFIG.LABELS_CATEGORIA_OPERACIONAL[cat] || cat;
  }

  function renderItemLancamento(l) {
    const st = Utils.calcularStatus(l);
    const venc = l.data_vencimento
      ? `Vence ${String(l.data_vencimento).split('-').reverse().join('/')}`
      : `Dia ${l.dia_vencimento}`;
    return `
      <article class="mes-item">
        <div class="mes-item__main">
          <div class="mes-item__nome">${l.nome}</div>
          <div class="mes-item__meta">${l.categoria} · ${venc}</div>
        </div>
        <div class="mes-item__side">
          <span class="mes-item__valor">${Utils.formatarMoeda(l.valor)}</span>
          <span class="badge badge--${st}">${CONFIG.LABELS_STATUS[st]}</span>
        </div>
      </article>`;
  }

  function renderItemOperacional(o) {
    const dataFmt = o.data ? String(o.data).split('-').reverse().join('/') : '—';
    return `
      <article class="mes-item mes-item--op">
        <div class="mes-item__main">
          <div class="mes-item__nome">${labelCategoriaOp(o.categoria)}</div>
          <div class="mes-item__meta">${dataFmt} · ${o.descricao || '—'} · ${o.responsavel || '—'}</div>
        </div>
        <div class="mes-item__side">
          <span class="mes-item__valor">${Utils.formatarMoeda(o.valor)}</span>
          <span class="mes-item__meta">${CONFIG.LABELS_METODO[o.metodo_pagamento] || o.metodo_pagamento}</span>
        </div>
      </article>`;
  }

  function renderSecao(titulo, classe, itens, renderItem, vazioMsg) {
    const total = Utils.somarValores(itens);
    const qtd = itens.length;
    const listaHtml = qtd
      ? itens.map(renderItem).join('')
      : `<div class="empty-state empty-state--compact"><p>${vazioMsg}</p></div>`;

    return `
      <section class="mes-section ${classe}">
        <header class="mes-section__head">
          <div>
            <h2 class="mes-section__title">${titulo}</h2>
            <p class="mes-section__sub">${qtd} ${qtd === 1 ? 'item' : 'itens'}</p>
          </div>
          <div class="mes-section__total">${Utils.formatarMoeda(total)}</div>
        </header>
        <div class="mes-section__list">${listaHtml}</div>
      </section>`;
  }

  function renderTemplate() {
    document.getElementById('app-content').innerHTML = `
      <div class="hero-card">
        <div>
          <span class="eyebrow">Controle mensal</span>
          <h2>Visão do mês</h2>
          <p>Casa, ADNY e gastos rápidos consolidados no período.</p>
        </div>
      </div>
      <div class="mes-toolbar">
        <div class="mes-nav">
          <button type="button" class="btn btn--ghost btn--sm" id="mes-prev" aria-label="Mês anterior">‹</button>
          <span class="mes-nav__label" id="mes-page-label"></span>
          <button type="button" class="btn btn--ghost btn--sm" id="mes-next" aria-label="Próximo mês">›</button>
        </div>
        <p class="mes-periodo" id="mes-periodo-label"></p>
      </div>
      <div id="mes-sections"><p class="despesa-card__meta">Carregando…</p></div>
    `;

    function syncHeaderMes() {
      if (typeof App !== 'undefined' && App.atualizarHeaderMes) {
        App.atualizarHeaderMes();
      }
    }

    el('mes-prev')?.addEventListener('click', () => {
      AppState.mesRef = Utils.mesAnterior(AppState.mesRef);
      syncHeaderMes();
      carregar();
    });
    el('mes-next')?.addEventListener('click', () => {
      AppState.mesRef = Utils.mesProximo(AppState.mesRef);
      syncHeaderMes();
      carregar();
    });
  }

  async function carregar() {
    const label = el('mes-page-label');
    const periodo = el('mes-periodo-label');
    const host = el('mes-sections');
    if (!host) return;

    if (label) label.textContent = Utils.formatarMesLabel(AppState.mesRef);
    if (periodo) periodo.textContent = 'Período: ' + Utils.periodoMesLabel(AppState.mesRef);

    try {
      Utils.setLoading(true);
      const [casaAll, adnyAll, operacionalRaw] = await Promise.all([
        API.getLancamentos(AppState.mesRef, 'casa'),
        API.getLancamentos(AppState.mesRef, 'adny'),
        API.getOperacionalMes(AppState.mesRef),
      ]);

      const casa = ordenarLancamentos(casaAll.filter(emAberto));
      const adny = ordenarLancamentos(adnyAll.filter(emAberto));
      const operacional = (operacionalRaw || []).filter(
        (o) => o.data && String(o.data).substring(0, 7) === AppState.mesRef
      );
      const rapidos = ordenarOperacional(operacional);

      host.innerHTML =
        renderSecao(
          'Casa',
          'mes-section--casa',
          casa,
          renderItemLancamento,
          'Nenhuma conta da Casa em aberto neste mês.'
        ) +
        renderSecao(
          'ADNY',
          'mes-section--adny',
          adny,
          renderItemLancamento,
          'Nenhuma conta da ADNY em aberto neste mês.'
        ) +
        renderSecao(
          'Gastos rápidos',
          'mes-section--rapidos',
          rapidos,
          renderItemOperacional,
          'Nenhum gasto rápido neste período.'
        );

      const totalGeral =
        Utils.somarValores(casa) + Utils.somarValores(adny) + Utils.somarValores(rapidos);
      const resumo = document.createElement('div');
      resumo.className = 'mes-resumo-geral';
      resumo.innerHTML = `
        <div class="summary-card">
          <div class="summary-card__label">Total geral do mês</div>
          <div class="summary-card__value">${Utils.formatarMoeda(totalGeral)}</div>
          <div class="summary-card__sub">Casa + ADNY (em aberto) + gastos rápidos</div>
        </div>`;
      host.insertAdjacentElement('afterbegin', resumo);
    } catch (err) {
      host.innerHTML = `<div class="empty-state"><p>${err.message || 'Erro ao carregar'}</p></div>`;
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
      if (window.lucide) lucide.createIcons();
    }
  }

  function init() {
    document.addEventListener('adny:refresh-dashboard', () => {
      if (AppState.rota === CONFIG.ROTAS.MES) carregar();
    });
  }

  return { renderTemplate, carregar, init };
})();
