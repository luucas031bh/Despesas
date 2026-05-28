/**
 * ADNY Finance — relatorios.js
 * Consulta histórica por período e fechamento mensal.
 */
const Relatorios = (function () {
  function renderTemplate() {
    document.getElementById('app-content').innerHTML = `
      <h1 class="page-title">Relatórios</h1>
      <form id="form-relatorio" class="filter-bar" style="align-items:flex-end">
        <div class="form-group">
          <label for="rel-area">Área</label>
          <select id="rel-area" class="form-control" name="area">
            <option value="casa">Casa</option>
            <option value="adny">ADNY</option>
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
      <div class="relatorio-table-wrap" id="relatorio-resultado"></div>
      <hr style="margin:2rem 0;border:none;border-top:1px solid var(--color-border)" />
      <h2 class="page-title" style="font-size:1.25rem">Fechamento mensal</h2>
      <form id="form-fechar" class="filter-bar">
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
    `;

    const mes = AppState.mesRef;
    document.getElementById('rel-de').value = Utils.mesAnterior(Utils.mesAnterior(mes));
    document.getElementById('rel-ate').value = mes;
    document.getElementById('fechar-mes').value = mes;

    document.getElementById('form-relatorio').addEventListener('submit', consultar);
    document.getElementById('form-fechar').addEventListener('submit', fecharMes);
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
      if (!data.meses?.length) {
        wrap.innerHTML = '<p class="empty-state">Sem dados no período.</p>';
        return;
      }
      wrap.innerHTML = `
        <table class="relatorio-table">
          <thead><tr><th>Mês</th><th>Total</th><th>Pagas</th><th>Pendentes</th><th>Qtd</th></tr></thead>
          <tbody>
            ${data.meses
              .map(
                (m) => `<tr>
              <td>${Utils.formatarMesLabel(m.mes_ref)}</td>
              <td class="num">${Utils.formatarMoeda(m.total)}</td>
              <td class="num">${Utils.formatarMoeda(m.pagas)}</td>
              <td class="num">${Utils.formatarMoeda(m.pendentes)}</td>
              <td class="num">${m.qtd}</td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>`;
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
