import { renderHook, act, waitFor } from '@testing-library/react-native';

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete mockStorage[key]; return Promise.resolve(); }),
}));

import { useRecentlyViewed } from '../useRecentlyViewed';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'recently_viewed_products';

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  it('initializes with empty ids', async () => {
    const { result } = await renderHook(() => useRecentlyViewed());
    await waitFor(() => expect(result.current.ids).toEqual([]));
  });

  it('loads existing ids from AsyncStorage on mount', async () => {
    mockStorage[KEY] = JSON.stringify([1, 2, 3]);
    const { result } = await renderHook(() => useRecentlyViewed());
    await waitFor(() => expect(result.current.ids).toEqual([1, 2, 3]));
  });

  it('addProduct prepends id and persists', async () => {
    const { result } = await renderHook(() => useRecentlyViewed());
    await act(async () => { await result.current.addProduct(10); });
    expect(result.current.ids).toEqual([10]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(KEY, JSON.stringify([10]));
  });

  it('addProduct deduplicates — moves existing id to front', async () => {
    mockStorage[KEY] = JSON.stringify([1, 2, 3]);
    const { result } = await renderHook(() => useRecentlyViewed());
    await waitFor(() => expect(result.current.ids).toEqual([1, 2, 3]));
    await act(async () => { await result.current.addProduct(2); });
    expect(result.current.ids).toEqual([2, 1, 3]);
  });

  it('clearProducts removes all ids and clears storage', async () => {
    mockStorage[KEY] = JSON.stringify([1, 2]);
    const { result } = await renderHook(() => useRecentlyViewed());
    await waitFor(() => expect(result.current.ids).toEqual([1, 2]));
    await act(async () => { await result.current.clearProducts(); });
    expect(result.current.ids).toEqual([]);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(KEY);
  });
});
