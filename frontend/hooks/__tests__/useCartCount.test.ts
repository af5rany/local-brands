import { renderHook, act, waitFor } from '@testing-library/react-native';

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');

import { useCartCount } from '../useCartCount';
import { useAuth } from '@/context/AuthContext';

const mockUseAuth = useAuth as jest.Mock;

describe('useCartCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('returns 0 and does not fetch when no token', async () => {
    mockUseAuth.mockReturnValue({ token: null });
    const { result } = await renderHook(() => useCartCount());
    await waitFor(() => expect(result.current.count).toBe(0));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches cart and sets count from totalItems', async () => {
    mockUseAuth.mockReturnValue({ token: 'tok' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ totalItems: 5 }),
    });
    const { result } = await renderHook(() => useCartCount());
    await waitFor(() => expect(result.current.count).toBe(5));
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/cart',
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
  });

  it('falls back to cartItems.length when totalItems absent', async () => {
    mockUseAuth.mockReturnValue({ token: 'tok' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ cartItems: [1, 2, 3] }),
    });
    const { result } = await renderHook(() => useCartCount());
    await waitFor(() => expect(result.current.count).toBe(3));
  });

  it('sets count to 0 on fetch error', async () => {
    mockUseAuth.mockReturnValue({ token: 'tok' });
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    const { result } = await renderHook(() => useCartCount());
    await waitFor(() => expect(result.current.count).toBe(0));
  });

  it('refresh re-fetches and updates count', async () => {
    mockUseAuth.mockReturnValue({ token: 'tok' });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalItems: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalItems: 7 }) });

    const { result } = await renderHook(() => useCartCount());
    await waitFor(() => expect(result.current.count).toBe(2));

    await act(async () => { await result.current.refresh(); });
    expect(result.current.count).toBe(7);
  });
});
