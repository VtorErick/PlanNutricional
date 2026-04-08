export const APP_STORAGE_ERROR_EVENT = 'app-storage-error';

export interface AppStorageErrorDetail {
  key: string;
  operation: 'read' | 'write';
  message: string;
}

export function dispatchAppStorageError(detail: AppStorageErrorDetail) {
  if (typeof window === 'undefined') return;

  try {
    window.dispatchEvent(
      new CustomEvent<AppStorageErrorDetail>(APP_STORAGE_ERROR_EVENT, { detail })
    );
  } catch {
    // ignore event dispatch errors
  }
}
