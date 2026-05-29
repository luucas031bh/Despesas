/**
 * ADNY Finance — lancamentos.js
 * Pagamento e edição de lançamentos mensais.
 */
const Lancamentos = (function () {
  let pagandoId = null;
  let pagandoLanc = null;

  function refreshDashboard(lancamento) {
    document.dispatchEvent(
      new CustomEvent('adny:refresh-dashboard', {
        detail: { area: lancamento?.area },
      })
    );
  }

  function abrirModalPagamento(lancamento) {
    pagandoId = lancamento.id;
    pagandoLanc = lancamento;
    const backdrop = document.getElementById('modal-pagar-backdrop');
    const form = document.getElementById('form-pagar');
    if (!backdrop || !form) return;

    form.reset();
    document.getElementById('pagar-nome').textContent = lancamento.nome;
    form.valor.value = lancamento.valor;
    form.data_pagamento.value = Utils.hojeISO();
    form.metodo_pagamento.value = 'pix';
    backdrop.hidden = false;
  }

  function fecharModal() {
    document.getElementById('modal-pagar-backdrop').hidden = true;
    pagandoId = null;
    pagandoLanc = null;
  }

  /**
   * Marca despesa como paga (PIX, valor do lançamento, data de hoje).
   * Use detalhado: true para abrir o modal com valor/método/data.
   */
  async function marcarComoPaga(lancamento, opcoes) {
    if (!lancamento) return;
    if (Utils.calcularStatus(lancamento) === 'pago') return;

    if (opcoes?.detalhado) {
      abrirModalPagamento(lancamento);
      return;
    }

    const msg = `Marcar "${lancamento.nome}" como paga (${Utils.formatarMoeda(lancamento.valor)})?`;
    if (!opcoes?.semConfirm && !confirm(msg)) return;

    try {
      Utils.setLoading(true);
      await API.pagarLancamento({
        id: lancamento.id,
        valor: Number(lancamento.valor) || 0,
        data_pagamento: Utils.hojeISO(),
        metodo_pagamento: opcoes?.metodo || 'pix',
      });
      Utils.showToast('Despesa marcada como paga.');
      refreshDashboard(lancamento);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  async function desfazerPagamento(lancamento) {
    if (!lancamento || Utils.calcularStatus(lancamento) !== 'pago') return;
    if (!confirm(`Marcar "${lancamento.nome}" como em aberto novamente?`)) return;

    try {
      Utils.setLoading(true);
      await API.editarLancamento({
        id: lancamento.id,
        status: 'aberto',
        data_pagamento: '',
        metodo_pagamento: '',
      });
      Utils.showToast('Pagamento desfeito.');
      refreshDashboard(lancamento);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  async function salvarPagamento(e) {
    e.preventDefault();
    const form = e.target;
    try {
      Utils.setLoading(true);
      await API.pagarLancamento({
        id: pagandoId,
        valor: Utils.parseMoeda(form.valor.value),
        data_pagamento: form.data_pagamento.value,
        metodo_pagamento: form.metodo_pagamento.value,
      });
      Utils.showToast('Pagamento registrado.');
      fecharModal();
      refreshDashboard(pagandoLanc);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  async function arquivarModeloDoLancamento(modeloId, area) {
    if (!modeloId) return;
    if (!confirm('Arquivar este modelo? Não gerará novos lançamentos.')) return;
    try {
      Utils.setLoading(true);
      await API.arquivarModelo(modeloId);
      Utils.showToast('Modelo arquivado.');
      document.dispatchEvent(
        new CustomEvent('adny:refresh-dashboard', { detail: { area } })
      );
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  function init() {
    document.getElementById('form-pagar')?.addEventListener('submit', salvarPagamento);
    document.getElementById('btn-fechar-modal-pagar')?.addEventListener('click', fecharModal);
    document.getElementById('btn-cancel-pagar')?.addEventListener('click', fecharModal);
    document.getElementById('modal-pagar-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-pagar-backdrop') fecharModal();
    });
  }

  return {
    init,
    abrirModalPagamento,
    fecharModal,
    marcarComoPaga,
    desfazerPagamento,
    arquivarModeloDoLancamento,
  };
})();
