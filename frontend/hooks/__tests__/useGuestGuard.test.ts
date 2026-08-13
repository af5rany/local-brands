import { renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useGuestGuard } from '../useGuestGuard';
import { useAuth } from '@/context/AuthContext';

const mockUseAuth = useAuth as jest.Mock;

describe('useGuestGuard', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => alertSpy.mockRestore());

  it('requireAuth returns false when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({ token: 'tok', isGuest: false });
    const { result } = await renderHook(() => useGuestGuard());
    expect(result.current.requireAuth()).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('requireAuth shows Alert and returns true when guest', async () => {
    mockUseAuth.mockReturnValue({ token: 'guest-tok', isGuest: true });
    const { result } = await renderHook(() => useGuestGuard());
    expect(result.current.requireAuth()).toBe(true);
    expect(alertSpy).toHaveBeenCalledWith(
      'Guest Account',
      expect.any(String),
      expect.any(Array),
    );
  });

  it('requireAuth shows Alert and returns true when no token', async () => {
    mockUseAuth.mockReturnValue({ token: null, isGuest: false });
    const { result } = await renderHook(() => useGuestGuard());
    expect(result.current.requireAuth()).toBe(true);
    expect(alertSpy).toHaveBeenCalled();
  });
});
