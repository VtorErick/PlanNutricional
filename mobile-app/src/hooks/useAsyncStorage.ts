import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Sanitizer<T> = (value: unknown) => T;

export function useAsyncStorage<T>(
  key: string,
  initialValue: T,
  sanitize?: Sanitizer<T>
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  const normalizeValue = useCallback(
    (value: unknown) => (sanitize ? sanitize(value) : (value as T)),
    [sanitize]
  );

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (!isMounted) return;

        if (item !== null) {
          setStoredValue(normalizeValue(JSON.parse(item)));
        }
      } catch (error) {
        console.warn(`useAsyncStorage: error reading "${key}"`, error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [key, normalizeValue]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        AsyncStorage.setItem(key, JSON.stringify(next)).catch((err) =>
          console.warn(`useAsyncStorage: error writing "${key}"`, err)
        );
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue, isHydrated];
}
