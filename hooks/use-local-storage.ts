"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      setValue(initialValue);
    } finally {
      setIsReady(true);
    }
  }, [key, initialValue]);

  const setStoredValue = (nextValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof nextValue === "function" ? (nextValue as (v: T) => T)(prev) : nextValue;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  };

  return [value, setStoredValue, isReady] as const;
}
