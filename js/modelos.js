/**
 * ADNY Finance — modelos.js
 * CRUD de Modelos de despesas recorrentes + modal.
 */
const Modelos = (function () {
  let areaAtual = 'casa';
  let editandoId = null;

  function abrirModal(area, modelo) {
    areaAtual = area;
    editandoId = modelo && modelo.id ? modelo.id : null;
    const viaBoleto = modelo && modelo._viaBoleto;
    const backdrop = document.getElementById('modal-modelo-backdrop');
    const form = document.getElementById('form-modelo');
    if (!backdrop || !form) return;

    form.reset();
    document.getElementById('modelo-area').value = area;

    const titulo = document.getElementById('modal-modelo-titulo');
    if (editandoId) {
      titulo.textContent = 'Editar modelo';
    } else if (viaBoleto) {
      titulo.textContent = 'Novo modelo (via boleto)';
    } else {
      titulo.textContent = 'Novo modelo de despesa';
    }

    preencherCategorias(area);

    if (modelo) {
      const dados = { ...modelo };
      delete dados._viaBoleto;
      delete dados.id;

      if (dados.categoria) {
        const sel = document.getElementById('modelo-categoria');
        if (sel && !Array.from(sel.options).some((o) => o.value === dados.categoria)) {
          const opt = document.createElement('option');
          opt.value = dados.categoria;
          opt.textContent = dados.categoria;
          sel.appendChild(opt);
        }
      }

      Object.keys(dados).forEach((k) => {
        const elField = form.elements.namedItem(k);
        if (elField && dados[k] != null && dados[k] !== '') {
          elField.value = dados[k];
        }
      });
      if (form.elements.valor_base && dados.valor_base != null) {
        form.elements.valor_base.value = dados.valor_base;
      }
      if (!form.elements.total_parcelas.value) form.elements.total_parcelas.value = 0;
      if (!form.elements.parcela_atual.value) form.elements.parcela_atual.value = 1;
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
        await API.gerarLancamentos(AppState.mesRef);
      } else {
        const criado = await API.criarModelo({
          id: Utils.gerarId('mod'),
          mes_ref: AppState.mesRef,
          ...dados,
        });
        let ok = (criado.lancamentos_gerados || 0) > 0;
        if (!ok) {
          const g = await API.gerarLancamentos(AppState.mesRef);
          ok = (g.gerados || 0) > 0;
        }
        Utils.showToast(
          ok
            ? 'Despesa adicionada à lista do mês.'
            : 'Modelo salvo na planilha. Toque em "Gerar mês" ou confira o mês exibido no topo.'
        );
      }
      fecharModal();
      document.dispatchEvent(
        new CustomEvent('adny:refresh-dashboard', { detail: { area: dados.area } })
      );
    } catch (err) {
      console.error('Erro ao salvar modelo:', err);
      Utils.showToast(err.message || 'Erro ao salvar. Verifique conexão com o Google Apps Script.', 'error');
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
