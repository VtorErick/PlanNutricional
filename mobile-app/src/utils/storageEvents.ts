type AppStorageListener = (detail: AppStorageErrorDetail) => void;

export const APP_STORAGE_ERROR_EVENT = 'app-storage-error';

export interface AppStorageErrorDetail {
  key: string;
  operation: 'read' | 'write';
  message: string;
}

const listeners = new Set<AppStorageListener>();

export function dispatchAppStorageError(detail: AppStorageErrorDetail) {
  listeners.forEach((listener) => {
    try {
      listener(detail);
    } catch {
      // ignore listener errors
    }
  });
}

export function subscribeToStorageErrors(listener: AppStorageListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
