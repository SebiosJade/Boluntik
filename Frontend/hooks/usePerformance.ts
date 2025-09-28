import { useCallback, useMemo } from 'react';

// Performance optimization hooks

/**
 * Memoized callback hook for preventing unnecessary re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  return useCallback(callback, []);
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = []
): T {
  return useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      }) as T;
    })(),
    [delay, ...deps]
  );
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = []
): T {
  return useCallback(
    (() => {
      let lastCall = 0;
      return ((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          callback(...args);
        }
      }) as T;
    })(),
    [delay, ...deps]
  );
}

/**
 * Memoized object creation to prevent reference changes
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, Object.values(obj));
}

/**
 * Memoized array creation to prevent reference changes
 */
export function useStableArray<T>(arr: T[]): T[] {
  return useMemo(() => arr, arr);
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const startTime = useMemo(() => performance.now(), []);
  
  useMemo(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (__DEV__ && renderTime > 16) { // More than one frame (16ms)
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }, [startTime, componentName]);
}
