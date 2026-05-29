/**
 * ADNY Finance — operacional.js
 * Lançamentos rápidos diários (ADNY).
 */
const Operacional = (function () {
  function renderTemplate() {
    document.getElementById('app-content').innerHTML = `
      <h1 class="page-title page-title--adny">Gastos do dia</h1>
      <div class="dashboard-toolbar">
        <button type="button" class="btn btn--adny" id="btn-novo-operacional">+ Novo gasto</button>
      </div>
      <p class="app-header__meta" style="margin-bottom:1rem" id="op-data-label"></p>
      <div class="operacional-quick" id="lista-operacional"></div>
    `;
    document.getElementById('btn-novo-operacional')?.addEventListener('click', abrirModal);
    carregar();
  }

  function inputDataDoForm(form) {
    return form?.elements?.namedItem('data_gasto');
  }

  function abrirModal() {
    const backdrop = document.getElementById('modal-operacional-backdrop');
    const form = document.getElementById('form-operacional');
    if (!backdrop || !form) return;
    form.reset();
    const dataInput = inputDataDoForm(form);
    if (dataInput) dataInput.value = Utils.hojeISO();
    backdrop.hidden = false;
  }

  function fecharModal() {
    document.getElementById('modal-operacional-backdrop').hidden = true;
  }

  async function carregar() {
    const hoje = Utils.hojeISO();
    const label = document.getElementById('op-data-label');
    if (label) label.textContent = 'Data: ' + hoje;
    const container = document.getElementById('lista-operacional');
    if (!container) return;
    try {
      Utils.setLoading(true);
      const itens = await API.getOperacional(hoje);
      if (!itens.length) {
        container.innerHTML = `<div class="empty-state"><p>Nenhum gasto hoje.</p></div>`;
        return;
      }
      container.innerHTML = itens
        .map(
          (o) => `
        <div class="operacional-item">
          <div class="operacional-item__valor">${Utils.formatarMoeda(o.valor)}</div>
          <div><strong>${o.categoria}</strong> — ${o.descricao || '—'}</div>
          <div class="despesa-card__meta">${CONFIG.LABELS_METODO[o.metodo_pagamento] || o.metodo_pagamento} · ${o.responsavel || '—'}</div>
        </div>`
        )
        .join('');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.target;
    try {
      Utils.setLoading(true);
      const dataInput = inputDataDoForm(form);
      const dataGasto = dataInput?.value || Utils.hojeISO();
      await API.criarOperacional({
        id: Utils.gerarId('op'),
        data: dataGasto,
        categoria: form.categoria.value,
        descricao: form.descricao.value,
        valor: Utils.parseMoeda(form.valor.value),
        metodo_pagamento: form.metodo_pagamento.value,
        responsavel: form.responsavel.value,
      });
      Utils.showToast('Gasto salvo.');
      fecharModal();
      carregar();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  function init() {
    document.getElementById('form-operacional')?.addEventListener('submit', salvar);
    document.getElementById('btn-fechar-modal-op')?.addEventListener('click', fecharModal);
    document.getElementById('btn-cancel-op')?.addEventListener('click', fecharModal);
    document.getElementById('modal-operacional-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-operacional-backdrop') fecharModal();
    });
  }

  return { renderTemplate, carregar, abrirModal, fecharModal, init };
})();
