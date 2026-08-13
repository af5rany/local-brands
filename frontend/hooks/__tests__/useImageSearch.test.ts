import { renderHook, act } from '@testing-library/react-native';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'tok' }),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async (uri: string) => ({ uri })),
  SaveFormat: { JPEG: 'jpeg' },
}));

import { useImageSearch } from '../useImageSearch';
import * as ImagePicker from 'expo-image-picker';

describe('useImageSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('starts with empty state', async () => {
    const { result } = await renderHook(() => useImageSearch());
    expect(result.current.searching).toBe(false);
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('searchByImage returns results on success', async () => {
    const mockProducts = [{ id: 1, name: 'Shirt' }];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockProducts }),
    });
    const { result } = await renderHook(() => useImageSearch());
    let found: any;
    await act(async () => { found = await result.current.searchByImage('file://img.jpg'); });
    expect(found).toEqual(mockProducts);
    expect(result.current.results).toEqual(mockProducts);
    expect(result.current.error).toBeNull();
  });

  it('searchByImage sets error on failed fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });
    const { result } = await renderHook(() => useImageSearch());
    await act(async () => { await result.current.searchByImage('file://img.jpg'); });
    expect(result.current.error).toMatch(/Search failed/i);
    expect(result.current.results).toEqual([]);
  });

  it('clear resets all state', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: 1 }] }),
    });
    const { result } = await renderHook(() => useImageSearch());
    await act(async () => { await result.current.searchByImage('file://img.jpg'); });
    await act(async () => { result.current.clear(); });
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.searchedImageUri).toBeNull();
  });

  it('pickFromGallery sets error when permission denied', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
    const { result } = await renderHook(() => useImageSearch());
    await act(async () => { await result.current.pickFromGallery(); });
    expect(result.current.error).toMatch(/permission denied/i);
  });
});
