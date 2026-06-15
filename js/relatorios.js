/**
 * ADNY Finance — relatorios.js
 * Consulta histórica por período (Casa + ADNY + gastos rápidos) e fechamento mensal.
 */
const Relatorios = (function () {
  const LABEL_FONTE = {
    casa: 'Casa',
    adny: 'ADNY',
    operacional: 'Gasto rápido',
  };

  function renderTemplate() {
    document.getElementById('app-content').innerHTML = `
      <div class="hero-card">
        <div>
          <span class="eyebrow">Análise</span>
          <h2>Relatórios</h2>
          <p>Consulte todos os gastos do período: Casa, ADNY e gastos rápidos.</p>
        </div>
      </div>
      <article class="panel">
        <span class="eyebrow">Consulta</span>
        <h3 style="margin:.2rem 0 1rem">Por período</h3>
        <form id="form-relatorio" class="filter-bar" style="align-items:flex-end;margin-bottom:0">
          <div class="form-group">
            <label for="rel-area">Filtrar</label>
            <select id="rel-area" class="form-control" name="area">
              <option value="todas" selected>Todos (Casa + ADNY + Rápido)</option>
              <option value="casa">Só Casa</option>
              <option value="adny">Só ADNY</option>
              <option value="operacional">Só gastos rápidos</option>
            </select>
          </div>
          <div class="form-group">
            <label for="rel-de">De (YYYY-MM)</label>
            <input id="rel-de" class="form-control" name="de" type="month" required />
          </div>
          <div class="form-group">
            <label for="rel-ate">Até (YYYY-MM)</label>
            <input id="rel-ate" class="form-control" name="ate" type="month" required />
          </div>
          <button type="submit" class="btn btn--primary">Consultar</button>
        </form>
        <div id="relatorio-resultado" style="margin-top:1rem"></div>
      </article>
      <article class="panel">
        <span class="eyebrow">Fechamento</span>
        <h3 style="margin:.2rem 0 1rem">Fechar mês</h3>
        <form id="form-fechar" class="filter-bar" style="margin-bottom:0">
          <div class="form-group">
            <label>Mês</label>
            <input class="form-control" name="mes_ref" type="month" id="fechar-mes" required />
          </div>
          <div class="form-group">
            <label>Área</label>
            <select class="form-control" name="area">
              <option value="casa">Casa</option>
              <option value="adny">ADNY</option>
              <option value="ambas">Ambas</option>
            </select>
          </div>
          <button type="submit" class="btn btn--ghost">Fechar mês</button>
        </form>
      </article>
    `;

    const mes = AppState.mesRef;
    document.getElementById('rel-de').value = Utils.mesAnterior(Utils.mesAnterior(mes));
    document.getElementById('rel-ate').value = mes;
    document.getElementById('fechar-mes').value = mes;

    document.getElementById('form-relatorio').addEventListener('submit', consultar);
    document.getElementById('form-fechar').addEventListener('submit', fecharMes);
  }

  function renderResumoCards(resumo, area) {
    const mostrarTudo = !area || area === 'todas' || area === 'ambas';
    let html = `
      <div class="relatorio-resumo-grid">
        <div class="relatorio-resumo-card relatorio-resumo-card--total">
          <div class="relatorio-resumo-card__label">Total do período</div>
          <div class="relatorio-resumo-card__valor">${Utils.formatarMoeda(resumo.total)}</div>
          <div class="relatorio-resumo-card__sub">${resumo.qtd} lançamento(s) · ${Utils.formatarMoeda(resumo.pagas)} pagos · ${Utils.formatarMoeda(resumo.pendentes)} pendentes</div>
        </div>`;

    if (mostrarTudo || area === 'casa') {
      html += `
        <div class="relatorio-resumo-card">
          <div class="relatorio-resumo-card__label">Casa</div>
          <div class="relatorio-resumo-card__valor">${Utils.formatarMoeda(resumo.casa.total)}</div>
          <div class="relatorio-resumo-card__sub">${resumo.casa.qtd} despesa(s)</div>
        </div>`;
    }
    if (mostrarTudo || area === 'adny') {
      html += `
        <div class="relatorio-resumo-card">
          <div class="relatorio-resumo-card__label">ADNY</div>
          <div class="relatorio-resumo-card__valor">${Utils.formatarMoeda(resumo.adny.total)}</div>
          <div class="relatorio-resumo-card__sub">${resumo.adny.qtd} despesa(s)</div>
        </div>`;
    }
    if (mostrarTudo || area === 'operacional') {
      html += `
        <div class="relatorio-resumo-card">
          <div class="relatorio-resumo-card__label">Gastos rápidos</div>
          <div class="relatorio-resumo-card__valor">${Utils.formatarMoeda(resumo.operacional.total)}</div>
          <div class="relatorio-resumo-card__sub">${resumo.operacional.qtd} gasto(s)</div>
        </div>`;
    }

    html += '</div>';
    return html;
  }

  function renderTabelaMeses(data) {
    const area = data.area;
    const mostrarTudo = !area || area === 'todas' || area === 'ambas';

    if (!data.meses?.length) return '';

    const cols = mostrarTudo
      ? `<th>Mês</th><th>Casa</th><th>ADNY</th><th>Rápido</th><th>Total</th><th>Pagas</th><th>Pendentes</th><th>Qtd</th>`
      : `<th>Mês</th><th>Total</th><th>Pagas</th><th>Pendentes</th><th>Qtd</th>`;

    const rows = data.meses
      .map((m) => {
        if (mostrarTudo) {
          return `<tr>
            <td>${Utils.formatarMesLabel(m.mes_ref)}</td>
            <td class="num">${Utils.formatarMoeda(m.casa?.total || 0)}</td>
            <td class="num">${Utils.formatarMoeda(m.adny?.total || 0)}</td>
            <td class="num">${Utils.formatarMoeda(m.operacional?.total || 0)}</td>
            <td class="num"><strong>${Utils.formatarMoeda(m.total)}</strong></td>
            <td class="num">${Utils.formatarMoeda(m.pagas)}</td>
            <td class="num">${Utils.formatarMoeda(m.pendentes)}</td>
            <td class="num">${m.qtd}</td>
          </tr>`;
        }
        return `<tr>
          <td>${Utils.formatarMesLabel(m.mes_ref)}</td>
          <td class="num">${Utils.formatarMoeda(m.total)}</td>
          <td class="num">${Utils.formatarMoeda(m.pagas)}</td>
          <td class="num">${Utils.formatarMoeda(m.pendentes)}</td>
          <td class="num">${m.qtd}</td>
        </tr>`;
      })
      .join('');

    return `
      <h4 class="relatorio-section-title">Resumo por mês</h4>
      <div class="relatorio-table-wrap">
        <table class="relatorio-table">
          <thead><tr>${cols}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderListaItens(itens) {
    if (!itens?.length) return '';

    const rows = itens
      .map((item) => {
        const fonte = LABEL_FONTE[item.fonte] || item.fonte;
        const dataExibir = item.data
          ? item.data.substring(0, 10).split('-').reverse().join('/')
          : Utils.formatarMesLabel(item.mes_ref);
        const st = item.status === 'pago' ? 'Pago' : CONFIG.LABELS_STATUS[item.status] || item.status;
        return `<tr>
          <td>${dataExibir}</td>
          <td><span class="badge badge--fonte badge--fonte-${item.fonte}">${fonte}</span></td>
          <td>${item.nome}</td>
          <td>${item.categoria || '—'}</td>
          <td class="num">${Utils.formatarMoeda(item.valor)}</td>
          <td><span class="badge badge--${item.status}">${st}</span></td>
        </tr>`;
      })
      .join('');

    return `
      <h4 class="relatorio-section-title">Todos os gastos do período (${itens.length})</h4>
      <div class="relatorio-table-wrap">
        <table class="relatorio-table">
          <thead>
            <tr><th>Data</th><th>Origem</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async function consultar(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const area = fd.get('area');
    const de = fd.get('de');
    const ate = fd.get('ate');
    try {
      Utils.setLoading(true);
      const data = await API.getRelatorio(area, de, ate);
      const wrap = document.getElementById('relatorio-resultado');

      if (!data.meses?.length && !data.itens?.length) {
        wrap.innerHTML = '<p class="empty-state">Sem dados no período.</p>';
        return;
      }

      wrap.innerHTML =
        renderResumoCards(data.resumo || {}, area) +
        renderTabelaMeses(data) +
        renderListaItens(data.itens);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  async function fecharMes(e) {
    e.preventDefault();
    if (!confirm('Registrar fechamento deste mês? Esta ação grava histórico imutável.')) return;
    const fd = new FormData(e.target);
    try {
      Utils.setLoading(true);
      const r = await API.fecharMes(fd.get('mes_ref'), fd.get('area'));
      Utils.showToast(
        `Fechado: ${Utils.formatarMoeda(r.total_despesas)} (${Utils.formatarMoeda(r.total_pagas)} pagas)`
      );
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  return { renderTemplate };
})();
