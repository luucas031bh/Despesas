/**
 * ADNY Finance — leitor-boleto.js
 * Wizard de importação de boleto (JPEG/PNG/PDF) via Gemini.
 */
const LeitorBoleto = (function () {
  let step = 1;
  let areaSelecionada = null;
  let arquivo = null;
  let previewUrl = null;
  let resultado = null;
  const respostas = {};

  function el(id) {
    return document.getElementById(id);
  }

  function abrir(areaPref) {
    step = 1;
    areaSelecionada = areaPref || null;
    arquivo = null;
    resultado = null;
    Object.keys(respostas).forEach((k) => delete respostas[k]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }

    const backdrop = el('modal-boleto-backdrop');
    if (!backdrop) return;
    backdrop.hidden = false;
    renderStep();
  }

  function fechar() {
    el('modal-boleto-backdrop').hidden = true;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function renderStep() {
    const body = el('boleto-step-body');
    const footer = el('boleto-step-footer');
    if (!body || !footer) return;

    el('boleto-step-label').textContent = `Etapa ${step} de 4`;

    if (step === 1) renderUpload(body, footer);
    else if (step === 2) renderArea(body, footer);
    else if (step === 3) renderDuvidas(body, footer);
    else renderConcluir(body, footer);
  }

  function renderUpload(body, footer) {
    body.innerHTML = `
      <p class="despesa-card__meta" style="margin-bottom:1rem">
        Envie foto ou PDF do boleto (máx. ${Math.round(CONFIG.MAX_UPLOAD_BYTES / 1024 / 1024)} MB).
      </p>
      <div class="form-group">
        <label for="boleto-file">Arquivo</label>
        <input type="file" id="boleto-file" class="form-control"
          accept="image/jpeg,image/png,application/pdf" />
      </div>
      <div id="boleto-preview" class="boleto-preview"></div>
    `;
    footer.innerHTML = `
      <button type="button" class="btn btn--ghost" id="btn-boleto-cancel">Cancelar</button>
      <button type="button" class="btn btn--primary" id="btn-boleto-next" disabled>Próximo →</button>
    `;

    el('btn-boleto-cancel').onclick = fechar;
    el('btn-boleto-next').onclick = () => {
      step = 2;
      renderStep();
    };

    el('boleto-file').onchange = (e) => {
      const file = e.target.files[0];
      const preview = el('boleto-preview');
      const btn = el('btn-boleto-next');
      if (!file) {
        arquivo = null;
        btn.disabled = true;
        preview.innerHTML = '';
        return;
      }
      if (!CONFIG.UPLOAD_TIPOS.includes(file.type)) {
        Utils.showToast('Use JPEG, PNG ou PDF.', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > CONFIG.MAX_UPLOAD_BYTES) {
        Utils.showToast('Arquivo muito grande.', 'error');
        e.target.value = '';
        return;
      }
      arquivo = file;
      btn.disabled = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
        preview.innerHTML = `<img src="${previewUrl}" alt="Preview" class="boleto-preview__img" />`;
      } else {
        preview.innerHTML = `<p class="boleto-preview__pdf">📄 ${file.name}</p>`;
      }
    };
  }

  function renderArea(body, footer) {
    const selCasa = areaSelecionada === 'casa' ? ' is-selected' : '';
    const selAdny = areaSelecionada === 'adny' ? ' is-selected' : '';
    body.innerHTML = `
      <p class="despesa-card__meta" style="margin-bottom:1rem">
        Esta despesa é <strong>Casa (pessoal)</strong> ou <strong>ADNY (empresa)</strong>?
      </p>
      <div class="boleto-area-btns">
        <button type="button" class="btn btn--casa boleto-area-btn${selCasa}" data-area="casa">Casa</button>
        <button type="button" class="btn btn--adny boleto-area-btn${selAdny}" data-area="adny">ADNY</button>
      </div>
    `;
    footer.innerHTML = `
      <button type="button" class="btn btn--ghost" id="btn-boleto-back">← Voltar</button>
      <button type="button" class="btn btn--primary" id="btn-boleto-analisar" ${areaSelecionada ? '' : 'disabled'}>
        Analisar boleto
      </button>
    `;

    body.querySelectorAll('.boleto-area-btn').forEach((btn) => {
      btn.onclick = () => {
        areaSelecionada = btn.dataset.area;
        body.querySelectorAll('.boleto-area-btn').forEach((b) =>
          b.classList.toggle('is-selected', b === btn)
        );
        el('btn-boleto-analisar').disabled = false;
      };
    });

    el('btn-boleto-back').onclick = () => {
      step = 1;
      renderStep();
    };
    el('btn-boleto-analisar').onclick = analisarBoleto;
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = String(dataUrl).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function analisarBoleto() {
    if (!arquivo || !areaSelecionada) return;
    try {
      Utils.setLoading(true);
      const base64 = await fileToBase64(arquivo);
      resultado = await API.lerBoleto({
        mimeType: arquivo.type,
        base64,
        area: areaSelecionada,
      });
      step = resultado.duvidas && resultado.duvidas.length ? 3 : 4;
      renderStep();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  function renderDuvidas(body, footer) {
    const duvidas = resultado?.duvidas || [];
    body.innerHTML = `
      <p class="despesa-card__meta" style="margin-bottom:1rem">
        Precisamos confirmar alguns detalhes antes de preencher o cadastro:
      </p>
      <div id="boleto-duvidas-form"></div>
    `;
    const form = el('boleto-duvidas-form');
    duvidas.forEach((d) => {
      const wrap = document.createElement('div');
      wrap.className = 'form-group';
      wrap.innerHTML = `<label>${d.pergunta}</label>`;
      if (d.opcoes && d.opcoes.length) {
        const sel = document.createElement('select');
        sel.className = 'form-control';
        sel.dataset.duvidaId = d.id;
        sel.innerHTML =
          '<option value="">Selecione…</option>' +
          d.opcoes
            .map((o) => `<option value="${o.valor}">${o.label}</option>`)
            .join('');
        wrap.appendChild(sel);
      } else if (d.id === 'observacoes') {
        const ta = document.createElement('textarea');
        ta.className = 'form-control';
        ta.dataset.duvidaId = d.id;
        ta.rows = 2;
        ta.placeholder = 'Observações adicionais…';
        wrap.appendChild(ta);
      }
      form.appendChild(wrap);
    });

    footer.innerHTML = `
      <button type="button" class="btn btn--ghost" id="btn-boleto-back">← Voltar</button>
      <button type="button" class="btn btn--primary" id="btn-boleto-refinar">Continuar →</button>
    `;
    el('btn-boleto-back').onclick = () => {
      step = 2;
      renderStep();
    };
    el('btn-boleto-refinar').onclick = refinarEChegar;
  }

  async function refinarEChegar() {
    const form = el('boleto-duvidas-form');
    const inputs = form.querySelectorAll('[data-duvida-id]');
    const resp = {};
    for (const inp of inputs) {
      const val = inp.value.trim();
      if (!val) {
        Utils.showToast('Responda todas as perguntas.', 'error');
        return;
      }
      if (inp.dataset.duvidaId === 'observacoes') {
        resp.observacoes_extra = val;
      } else {
        resp[inp.dataset.duvidaId] = val;
      }
    }
    try {
      Utils.setLoading(true);
      resultado = await API.refinarBoleto({
        area: areaSelecionada,
        campos: resultado.campos,
        respostas: resp,
      });
      step = 4;
      renderStep();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      Utils.setLoading(false);
    }
  }

  function renderConcluir(body, footer) {
    const c = resultado?.campos || {};
    body.innerHTML = `
      <p class="despesa-card__meta" style="margin-bottom:1rem">
        Revise os dados extraídos. Ao confirmar, abriremos o cadastro já preenchido.
      </p>
      <dl class="despesa-detail-grid">
        <dt>Nome</dt><dd>${c.nome || '—'}</dd>
        <dt>Empresa</dt><dd>${c.empresa || '—'}</dd>
        <dt>Categoria</dt><dd>${c.categoria || '—'}</dd>
        <dt>Valor</dt><dd>${Utils.formatarMoeda(c.valor_base)}</dd>
        <dt>Vencimento</dt><dd>Dia ${c.dia_vencimento || '—'} · ${c.data_inicio || '—'}</dd>
        <dt>Tipo</dt><dd>${c.tipo || '—'}</dd>
      </dl>
    `;
    footer.innerHTML = `
      <button type="button" class="btn btn--ghost" id="btn-boleto-back">← Voltar</button>
      <button type="button" class="btn btn--primary" id="btn-boleto-preencher">Preencher cadastro →</button>
    `;
    el('btn-boleto-back').onclick = () => {
      step = resultado?.duvidas?.length ? 3 : 2;
      renderStep();
    };
    el('btn-boleto-preencher').onclick = preencherCadastro;
  }

  function preencherCadastro() {
    if (!resultado?.campos) return;
    fechar();
    Modelos.abrirModal(areaSelecionada, {
      ...resultado.campos,
      _viaBoleto: true,
    });
    Utils.showToast('Revise os campos e clique em Salvar modelo.');
  }

  function init() {
    el('btn-fechar-modal-boleto')?.addEventListener('click', fechar);
    el('btn-cancel-boleto')?.addEventListener('click', fechar);
    el('modal-boleto-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-boleto-backdrop') fechar();
    });
  }

  return { init, abrir, fechar };
})();
