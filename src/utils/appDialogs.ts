interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

function createBaseDialog({ title, message, confirmText = 'Aceptar', cancelText }: DialogOptions) {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Dialog APIs are unavailable in the current environment.');
  }

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(15, 23, 42, 0.55)';
  overlay.style.backdropFilter = 'blur(1px)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.zIndex = '9999';

  const card = document.createElement('div');
  card.style.width = 'min(420px, 95vw)';
  card.style.background = '#ffffff';
  card.style.borderRadius = '20px';
  card.style.padding = '20px';
  card.style.maxHeight = 'min(560px, 80vh)';
  card.style.boxShadow = '0 20px 45px rgba(2, 6, 23, 0.2)';
  card.style.border = '1px solid #e2e8f0';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.margin = '0 0 8px 0';
  titleEl.style.fontSize = '18px';
  titleEl.style.fontWeight = '700';
  titleEl.style.color = '#0f172a';

  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.margin = '0';
  messageEl.style.fontSize = '14px';
  messageEl.style.lineHeight = '1.45';
  messageEl.style.color = '#475569';
  messageEl.style.whiteSpace = 'pre-line';
  messageEl.style.overflowWrap = 'anywhere';
  messageEl.style.overflowY = 'auto';
  messageEl.style.maxHeight = '50vh';
  messageEl.style.paddingRight = '4px';

  const actions = document.createElement('div');
  actions.style.marginTop = '18px';
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '10px';
  actions.style.flexWrap = 'wrap';

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = confirmText;
  confirmBtn.style.border = 'none';
  confirmBtn.style.cursor = 'pointer';
  confirmBtn.style.padding = '10px 14px';
  confirmBtn.style.borderRadius = '10px';
  confirmBtn.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
  confirmBtn.style.color = '#ffffff';
  confirmBtn.style.fontWeight = '700';

  let cancelBtn: HTMLButtonElement | null = null;
  if (cancelText) {
    cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelText;
    cancelBtn.style.border = '1px solid #cbd5e1';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.padding = '10px 14px';
    cancelBtn.style.borderRadius = '10px';
    cancelBtn.style.background = '#ffffff';
    cancelBtn.style.color = '#334155';
    cancelBtn.style.fontWeight = '700';
    actions.appendChild(cancelBtn);
  }

  actions.appendChild(confirmBtn);
  card.appendChild(titleEl);
  card.appendChild(messageEl);
  card.appendChild(actions);
  overlay.appendChild(card);

  return { overlay, confirmBtn, cancelBtn };
}

export function showAppAlert(options: DialogOptions): Promise<void> {
  return new Promise((resolve) => {
    let dialog;
    try {
      dialog = createBaseDialog(options);
    } catch {
      window.alert(`${options.title}\n\n${options.message}`);
      resolve();
      return;
    }
    const { overlay, confirmBtn } = dialog;

    const close = () => {
      overlay.remove();
      resolve();
    };

    confirmBtn.onclick = close;
    overlay.onclick = (event) => {
      if (event.target === overlay) close();
    };

    document.body.appendChild(overlay);
  });
}

export function showAppConfirm(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let dialog;
    try {
      dialog = createBaseDialog({
        ...options,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
      });
    } catch {
      resolve(window.confirm(`${options.title}\n\n${options.message}`));
      return;
    }
    const { overlay, confirmBtn, cancelBtn } = dialog;

    const close = (result: boolean) => {
      overlay.remove();
      resolve(result);
    };

    confirmBtn.onclick = () => close(true);
    if (cancelBtn) cancelBtn.onclick = () => close(false);
    overlay.onclick = (event) => {
      if (event.target === overlay) close(false);
    };

    document.body.appendChild(overlay);
  });
}
