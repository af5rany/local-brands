import { renderHook, act, waitFor } from '@testing-library/react-native';

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete mockStorage[key]; return Promise.resolve(); }),
}));

import { useSearchHistory } from '../useSearchHistory';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'search_history';

describe('useSearchHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  it('initializes with empty history', async () => {
    const { result } = await renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.history).toEqual([]));
  });

  it('loads existing history from AsyncStorage on mount', async () => {
    mockStorage[KEY] = JSON.stringify(['shoes', 'bag']);
    const { result } = await renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.history).toEqual(['shoes', 'bag']));
  });

  it('addQuery prepends and persists', async () => {
    const { result } = await renderHook(() => useSearchHistory());
    await act(async () => { await result.current.addQuery('watch'); });
    expect(result.current.history).toEqual(['watch']);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(KEY, JSON.stringify(['watch']));
  });

  it('addQuery deduplicates — moves existing query to front', async () => {
    mockStorage[KEY] = JSON.stringify(['shoes', 'bag', 'hat']);
    const { result } = await renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.history.length).toBe(3));
    await act(async () => { await result.current.addQuery('bag'); });
    expect(result.current.history).toEqual(['bag', 'shoes', 'hat']);
  });

  it('addQuery trims whitespace and ignores empty strings', async () => {
    const { result } = await renderHook(() => useSearchHistory());
    await act(async () => { await result.current.addQuery('   '); });
    expect(result.current.history).toEqual([]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('clearHistory removes all and clears storage', async () => {
    mockStorage[KEY] = JSON.stringify(['shoes']);
    const { result } = await renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.history.length).toBe(1));
    await act(async () => { await result.current.clearHistory(); });
    expect(result.current.history).toEqual([]);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(KEY);
  });
});
