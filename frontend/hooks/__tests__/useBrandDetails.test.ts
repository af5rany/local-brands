import { renderHook, act, waitFor } from '@testing-library/react-native';

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');
jest.mock('@/components/ProductFilterModal', () => ({}));

import { useBrandDetails } from '../useBrandDetails';

const mockBrand = { id: 1, name: 'Acme', owner: { id: 5 } };

describe('useBrandDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('starts in loading state', async () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = await renderHook(() => useBrandDetails('1', 'tok', null));
    expect(result.current.loading).toBe(true);
    expect(result.current.brand).toBeNull();
  });

  it('fetchBrandDetails sets brand on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockBrand,
    });
    const { result } = await renderHook(() => useBrandDetails('1', 'tok', null));
    await act(async () => { await result.current.fetchBrandDetails(); });
    expect(result.current.brand).toEqual(mockBrand);
    expect(result.current.loading).toBe(false);
  });

  it('fetchBrandDetails sets error on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    const { result } = await renderHook(() => useBrandDetails('1', 'tok', null));
    await act(async () => { await result.current.fetchBrandDetails(); });
    expect(result.current.error).toBeTruthy();
    expect(result.current.brand).toBeNull();
  });

  it('toggleFollow flips isFollowing and adjusts followerCount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    const { result } = await renderHook(() => useBrandDetails('1', 'tok', null));

    await act(async () => { result.current.setIsFollowing(false); result.current.setFollowerCount(10); });

    await act(async () => { await result.current.toggleFollow(); });

    expect(result.current.isFollowing).toBe(true);
    expect(result.current.followerCount).toBe(11);
  });

  it('does not fetch when brandId is undefined', async () => {
    const { result } = await renderHook(() => useBrandDetails(undefined, 'tok', null));
    await act(async () => { await result.current.fetchBrandDetails(); });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
