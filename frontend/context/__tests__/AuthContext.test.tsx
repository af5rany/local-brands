import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((k: string) => Promise.resolve(mockStorage[k] ?? null)),
  setItem: jest.fn((k: string, v: string) => { mockStorage[k] = v; return Promise.resolve(); }),
  removeItem: jest.fn((k: string) => { delete mockStorage[k]; return Promise.resolve(); }),
}));

// Minimal valid JWT: header.payload.signature — payload has exp far in future
// { id: 1, role: 'customer', isGuest: false, exp: 9999999999 }
const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwicm9sZSI6ImN1c3RvbWVyIiwiaXNHdWVzdCI6ZmFsc2UsImV4cCI6OTk5OTk5OTk5OX0.sig';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({ id: 1, role: 'customer', isGuest: false, exp: 9999999999 })),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');

import { AuthProvider, useAuth } from '../AuthContext';

const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    global.fetch = jest.fn();
  });

  it('starts loading=true then resolves to false with no token', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('login sets token and fetches user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Alice', role: 'customer' }),
    });
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.login(VALID_TOKEN); });

    expect(result.current.token).toBe(VALID_TOKEN);
    expect(result.current.user?.name).toBe('Alice');
  });

  it('logout clears token and user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Alice' }),
    });
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.login(VALID_TOKEN); });
    expect(result.current.token).toBe(VALID_TOKEN);

    await act(async () => { result.current.logout(); });
    await waitFor(() => expect(result.current.token).toBeNull());
    expect(result.current.user).toBeNull();
  });

  it('isGuest returns true when token has isGuest=true', async () => {
    const { jwtDecode } = require('jwt-decode');
    jwtDecode.mockReturnValue({ id: 2, role: 'customer', isGuest: true, exp: 9999999999 });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 2, name: 'Guest', isGuest: true }),
    });
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.login(VALID_TOKEN); });

    expect(result.current.isGuest).toBe(true);
  });
});
