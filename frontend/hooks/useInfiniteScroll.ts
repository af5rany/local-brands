import { useState, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<{ items: T[]; totalPages: number }>;
  initialPage?: number;
}

export function useInfiniteScroll<T>({ fetchFn, initialPage = 1 }: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || page > totalPages) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await fetchFn(page);
      setItems(prev => page === 1 ? result.items : [...prev, ...result.items]);
      setTotalPages(result.totalPages);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Infinite scroll error:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, totalPages, fetchFn]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setItems([]);
    loadingRef.current = false;
    try {
      const result = await fetchFn(1);
      setItems(result.items);
      setTotalPages(result.totalPages);
      setPage(2);
    } catch (error) {
      console.error('Infinite scroll refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFn]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    loadingRef.current = false;
  }, []);

  const hasMore = page <= totalPages;

  return { items, loading, refreshing, hasMore, loadMore, refresh, reset };
}
