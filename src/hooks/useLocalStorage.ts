import { useState, useEffect, useCallback } from 'react';

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
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? normalizeValue(JSON.parse(item)) : normalizeValue(initialValue);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
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
        window.localStorage.setItem(key, JSON.stringify(normalizeValue(storedValue)));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, normalizeValue, storedValue]);

  return [storedValue, setValue];
}
