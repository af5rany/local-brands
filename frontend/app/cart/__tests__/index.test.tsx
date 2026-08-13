import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';

const mockLogin = jest.fn();
const mockFetchCart = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
    useLocalSearchParams: () => ({}),
    useFocusEffect: (cb: any) => React.useEffect(cb, []),
  };
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    token: 'valid-token',
    user: { id: 1, name: 'Test User' },
    login: mockLogin,
    logout: jest.fn(),
    loading: false,
    isGuest: false,
  }),
}));

jest.mock('@/context/CartContext', () => ({
  useCart: () => ({ refresh: mockFetchCart, cartCount: 0 }),
}));

jest.mock('@/context/NetworkContext', () => ({
  useNetwork: () => ({ isConnected: true }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColors: () => ({
    text: '#000',
    background: '#fff',
    primary: '#000',
    border: '#ccc',
    card: '#fff',
    subtext: '#666',
    icon: '#000',
  }),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');

jest.mock('@/components/Header', () => () => null);
jest.mock('@/components/OfflinePlaceholder', () => () => null);
jest.mock('@/components/GuestBanner', () => () => null);

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

import CartScreen from '../index';

const mockCartData = {
  id: 1,
  totalAmount: 250,
  totalItems: 2,
  items: [
    {
      id: 1,
      quantity: 1,
      unitPrice: 100,
      product: { id: 1, name: 'Product A', images: [] },
      variant: { id: 10, attributes: { color: 'Red', size: 'M' } },
    },
    {
      id: 2,
      quantity: 1,
      unitPrice: 150,
      product: { id: 2, name: 'Product B', images: [] },
      variant: null,
    },
  ],
};

describe('CartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('fetches cart on mount when token present', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCartData,
    });

    render(<CartScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/cart',
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-token' },
        }),
      );
    });
  });

  it('shows cart items when fetch succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCartData,
    });

    const { findByText } = await render(<CartScreen />);

    expect(await findByText('PRODUCT A')).toBeTruthy();
    expect(await findByText('PRODUCT B')).toBeTruthy();
  });

  it('shows empty state when cart has no items', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, totalAmount: 0, totalItems: 0, items: [] }),
    });

    const { findByText } = await render(<CartScreen />);
    expect(await findByText(/empty/i)).toBeTruthy();
  });
});
