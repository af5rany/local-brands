import { renderHook, act } from '@testing-library/react-native';
import { useInfiniteScroll } from '../useInfiniteScroll';

const makeFetch = (items: any[], totalPages: number) =>
  jest.fn().mockResolvedValue({ items, totalPages });

describe('useInfiniteScroll', () => {
  it('starts with empty state', async () => {
    const { result } = await renderHook(() =>
      useInfiniteScroll({ fetchFn: makeFetch([], 1) }),
    );
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it('loadMore fetches page and appends items', async () => {
    const fetchFn = makeFetch([{ id: 1 }, { id: 2 }], 3);
    const { result } = await renderHook(() => useInfiniteScroll({ fetchFn }));

    await act(async () => { await result.current.loadMore(); });

    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.hasMore).toBe(true);
  });

  it('loadMore appends on subsequent pages', async () => {
    const fetchFn = jest.fn()
      .mockResolvedValueOnce({ items: [{ id: 1 }], totalPages: 2 })
      .mockResolvedValueOnce({ items: [{ id: 2 }], totalPages: 2 });

    const { result } = await renderHook(() => useInfiniteScroll({ fetchFn }));
    await act(async () => { await result.current.loadMore(); });
    await act(async () => { await result.current.loadMore(); });

    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('hasMore is false when page exceeds totalPages', async () => {
    const fetchFn = makeFetch([{ id: 1 }], 1);
    const { result } = await renderHook(() => useInfiniteScroll({ fetchFn }));
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.hasMore).toBe(false);
  });

  it('refresh resets items and re-fetches page 1', async () => {
    const fetchFn = jest.fn()
      .mockResolvedValueOnce({ items: [{ id: 1 }], totalPages: 2 })
      .mockResolvedValueOnce({ items: [{ id: 99 }], totalPages: 1 });

    const { result } = await renderHook(() => useInfiniteScroll({ fetchFn }));
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.items).toEqual([{ id: 1 }]);

    await act(async () => { await result.current.refresh(); });
    expect(result.current.items).toEqual([{ id: 99 }]);
  });

  it('reset clears all state', async () => {
    const fetchFn = makeFetch([{ id: 1 }], 5);
    const { result } = await renderHook(() => useInfiniteScroll({ fetchFn }));
    await act(async () => { await result.current.loadMore(); });

    await act(async () => { result.current.reset(); });
    expect(result.current.items).toEqual([]);
    expect(result.current.hasMore).toBe(true);
  });
});
