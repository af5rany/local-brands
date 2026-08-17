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
  const [fetchError, setFetchError] = useState(false);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || page > totalPages || fetchError) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await fetchFn(page);
      setFetchError(false);
      setItems(prev => page === 1 ? result.items : [...prev, ...result.items]);
      setTotalPages(result.totalPages);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Infinite scroll error:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, totalPages, fetchFn, fetchError]);

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
    setFetchError(false);
    loadingRef.current = false;
  }, []);

  const resetAndLoad = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    // keep stale items visible while fetching — prevents image unmount/remount flash
    setPage(1);
    setTotalPages(1);
    setFetchError(false);
    setLoading(true);
    try {
      const result = await fetchFn(1);
      setFetchError(false);
      setItems(result.items); // atomic swap: old → new, no blank frame
      setTotalPages(result.totalPages);
      setPage(2);
    } catch (error) {
      console.error('Infinite scroll error:', error);
      setItems([]);
      setFetchError(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFn]);

  // Fetch page 1 silently and replace items without clearing the list first (no skeleton flash).
  const silentRevalidate = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const result = await fetchFn(1);
      setItems(result.items);
      setTotalPages(result.totalPages);
      setPage(2);
    } catch (error) {
      console.error('Infinite scroll revalidate error:', error);
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn]);

  const hasMore = page <= totalPages && !fetchError;

  return { items, loading, refreshing, hasMore, fetchError, loadMore, refresh, reset, resetAndLoad, silentRevalidate };
}
