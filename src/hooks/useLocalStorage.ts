import { useState, useEffect, useCallback } from 'react';
import { dispatchAppStorageError } from '../utils/storageEvents';
import { readStorageValue, writeStorageValue } from '../utils/safeStorage';

type Sanitizer<T> = (value: unknown) => T;

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  sanitize?: Sanitizer<T>
): [T, (value: T | ((val: T) => T)) => void] {
  const normalizeValue = useCallback(
    (value: unknown) => (sanitize ? sanitize(value) : (value as T)),
    [sanitize]
  );

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? readStorageValue(window.localStorage, key) : '';
      return item ? normalizeValue(JSON.parse(item)) : normalizeValue(initialValue);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      dispatchAppStorageError({
        key,
        operation: 'read',
        message: `No se pudo leer el almacenamiento local para "${key}".`,
      });
      return normalizeValue(initialValue);
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((previousValue) => {
      const nextValue =
        typeof value === 'function'
          ? (value as (val: T) => T)(previousValue)
          : value;

      return normalizeValue(nextValue);
    });
  }, [normalizeValue]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        writeStorageValue(window.localStorage, key, JSON.stringify(normalizeValue(storedValue)));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
      dispatchAppStorageError({
        key,
        operation: 'write',
        message: `No se pudo guardar el almacenamiento local para "${key}".`,
      });
    }
  }, [key, normalizeValue, storedValue]);

  return [storedValue, setValue];
}
