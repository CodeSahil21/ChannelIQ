import { useCallback, useMemo, useRef } from 'react';

// Debounce hook for search and API calls
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
};

// Memoized API response cache
export const useApiCache = <T>(key: string, data: T) => {
  return useMemo(() => data, [key, data]);
};

// Virtual scrolling for large lists
export const useVirtualScroll = (items: any[], itemHeight: number, containerHeight: number) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const bufferSize = Math.floor(visibleCount / 2);
    
    return {
      visibleCount: visibleCount + bufferSize * 2,
      startIndex: 0,
      endIndex: Math.min(items.length, visibleCount + bufferSize * 2)
    };
  }, [items.length, itemHeight, containerHeight]);
};

// Image lazy loading
export const useLazyImage = (src: string) => {
  const imgRef = useRef<HTMLImageElement>(null);
  
  const loadImage = useCallback(() => {
    if (imgRef.current && src) {
      imgRef.current.src = src;
    }
  }, [src]);

  return { imgRef, loadImage };
};