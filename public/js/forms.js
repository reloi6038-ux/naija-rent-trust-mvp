/**
 * Form helpers: validation, image previews, drag-and-drop.
 */
const Forms = {
  /** Basic required-field validation. Returns true if valid. */
  validate(form) {
    let ok = true;
    form.querySelectorAll('[required]').forEach((field) => {
      const empty = !field.value || (field.type === 'file' && !field.files.length);
      field.classList.toggle('invalid', empty);
      if (empty) ok = false;
    });
    if (!ok) {
      const first = form.querySelector('.invalid');
      if (first) { first.focus(); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      toast('Please fill in all required fields.', 'error');
    }
    return ok;
  },

  /** Wire up image dropzone + preview. */
  setupDropzone({ input, dropzone, previewGrid, maxFiles = 5, maxSizeMB = 1 }) {
    if (!input || !dropzone) return;
    const state = [];

    const render = () => {
      if (!previewGrid) return;
      previewGrid.innerHTML = '';
      state.forEach((file, i) => {
        const url = URL.createObjectURL(file);
        const wrap = document.createElement('div');
        wrap.className = 'preview-item';
        wrap.innerHTML = `
          <img src="${url}" alt="Preview ${i + 1}" />
          <button type="button" class="remove" aria-label="Remove image">✕</button>
        `;
        wrap.querySelector('.remove').addEventListener('click', () => {
          state.splice(i, 1);
          URL.revokeObjectURL(url);
          sync();
        });
        previewGrid.appendChild(wrap);
      });
    };

    const sync = () => {
      const dt = new DataTransfer();
      state.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      render();
    };

    const add = (files) => {
      for (const file of files) {
        if (state.length >= maxFiles) { toast(`Maximum ${maxFiles} images.`, 'error'); break; }
        if (!file.type.startsWith('image/')) { toast('Only image files are allowed.', 'error'); continue; }
        if (file.size > maxSizeMB * 1024 * 1024) { toast(`Each image must be under ${maxSizeMB}MB.`, 'error'); continue; }
        state.push(file);
      }
      sync();
    };

    dropzone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => { add(Array.from(e.target.files)); });
    ['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); dropzone.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
      e.preventDefault(); dropzone.classList.remove('dragover');
    }));
    dropzone.addEventListener('drop', (e) => add(Array.from(e.dataTransfer.files)));
  },

  /** Wire up live total move-in preview. */
  setupFeeCalculator(form, outputEl) {
    if (!form || !outputEl) return;
    const keys = ['annualRent', 'agencyFee', 'legalFee', 'cautionDeposit'];
    const update = () => {
      const sum = keys.reduce((acc, k) => acc + Number(form.elements[k]?.value || 0), 0);
      outputEl.textContent = 'Estimated total move-in: ' + naira(sum);
    };
    keys.forEach((k) => form.elements[k]?.addEventListener('input', update));
    update();
  }
};

