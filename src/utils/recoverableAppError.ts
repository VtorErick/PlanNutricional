const AUTO_RELOAD_STORAGE_KEY = 'planNutricional:lastRecoverableReloadAt';
const AUTO_RELOAD_COOLDOWN_MS = 30_000;

function getErrorText(error: unknown) {
  if (!error) return '';
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.stack || ''}`;
  }
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isRecoverableAppLoadError(error: unknown) {
  const text = getErrorText(error);

  return /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch dynamically imported module|Importing a module script failed|module script|Failed to fetch/i.test(text);
}

export function reloadAppOnceForRecoverableError() {
  if (typeof window === 'undefined') return false;

  const now = Date.now();

  try {
    const lastReloadAt = Number(window.sessionStorage.getItem(AUTO_RELOAD_STORAGE_KEY) || '0');
    if (Number.isFinite(lastReloadAt) && now - lastReloadAt < AUTO_RELOAD_COOLDOWN_MS) {
      return false;
    }

    window.sessionStorage.setItem(AUTO_RELOAD_STORAGE_KEY, String(now));
  } catch {
    // If sessionStorage is unavailable, still try the one action that can recover stale chunks.
  }

  window.setTimeout(() => {
    try {
      window.location.reload();
    } catch (error) {
      console.warn('Failed to reload after recoverable app error:', error);
    }
  }, 80);

  return true;
}
