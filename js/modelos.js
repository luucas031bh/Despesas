/**
 * ADNY Finance — modelos.js
 * CRUD de Modelos de despesas recorrentes + modal.
 */
const Modelos = (function () {
  let areaAtual = 'casa';
  let editandoId = null;

  function abrirModal(area, modelo) {
    areaAtual = area;
    editandoId = modelo ? modelo.id : null;
    const backdrop = document.getElementById('modal-modelo-backdrop');
    const form = document.getElementById('form-modelo');
    if (!backdrop || !form) return;

    form.reset();
    document.getElementById('modelo-area').value = area;

    const titulo = document.getElementById('modal-modelo-titulo');
    titulo.textContent = editandoId ? 'Editar modelo' : 'Novo modelo de despesa';

    preencherCategorias(area);

    if (modelo) {
      Object.keys(modelo).forEach((k) => {
        const el = form.elements.namedItem(k);
        if (el) el.value = modelo[k] ?? '';
      });
      if (form.elements.valor_base) {
        form.elements.valor_base.value = modelo.valor_base;
      }
    } else {
      form.elements.data_inicio.value = AppState.mesRef;
      form.elements.dia_vencimento.value = 10;
      form.elements.parcela_atual.value = 1;
      form.elements.tipo.value = 'fixa_recorrente';
    }

    backdrop.hidden = false;
  }

  function fecharModal() {
    const backdrop = document.getElementById('modal-modelo-backdrop');
    if (backdrop) backdrop.hidden = true;
    editandoId = null;
  }

  function preencherCategorias(area) {
    const sel = document.getElementById('modelo-categoria');
    if (!sel) return;
    const cats = Utils.categoriasPorArea(area);
    sel.innerHTML = cats
      .map((c) => `<option value="${c}">${c}</option>`)
      .join('');
  }

  async function salvar(e) {
    e.preventDefault();
    const form = e.target;
    const dados = {
      area: form.area.value,
      categoria: form.categoria.value,
      nome: form.nome.value.trim(),
      tipo: form.tipo.value,
      valor_base: Utils.parseMoeda(form.valor_base.value),
      dia_vencimento: Number(form.dia_vencimento.value) || 1,
      total_parcelas: Number(form.total_parcelas.value) || 0,
      parcela_atual: Number(form.parcela_atual.value) || 1,
      data_inicio: form.data_inicio.value,
      data_fim: form.data_fim.value,
      empresa: form.empresa.value,
      recebedor: form.recebedor.value,
      telefone: form.telefone.value,
      link_boleto: form.link_boleto.value,
      chave_pix: form.chave_pix.value,
      observacoes: form.observacoes.value,
    };

    try {
      Utils.setLoading(true);
      if (editandoId) {
        await API.editarModelo({ id: editandoId, ...dados });
        Utils.showToast('Modelo atualizado.');
      } else {
        await API.criarModelo({ id: Utils.gerarId('mod'), ...dados });
        Utils.showToast('Modelo criado.');
      }
      fecharModal();
      document.dispatchEvent(
        new CustomEvent('adny:refresh-dashboard', { detail: { area: dados.area } })
      );
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  function init() {
    const form = document.getElementById('form-modelo');
    if (form) form.addEventListener('submit', salvar);

    document.getElementById('btn-fechar-modal-modelo')?.addEventListener('click', fecharModal);
    document.getElementById('btn-cancel-modelo')?.addEventListener('click', fecharModal);
    document.getElementById('modal-modelo-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-modelo-backdrop') fecharModal();
    });
  }

  return { init, abrirModal, fecharModal };
})();
