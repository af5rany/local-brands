import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';

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
    user: { id: 1, name: 'Test User', role: 'CUSTOMER' },
    loading: false,
    isGuest: false,
  }),
}));

jest.mock('@/context/CartContext', () => ({
  useCart: () => ({ refresh: jest.fn(), fetchCart: jest.fn(), cartCount: 2 }),
}));

jest.mock('@/context/NetworkContext', () => ({
  useNetwork: () => ({ isConnected: true }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColors: () => ({
    text: '#000', background: '#fff', primary: '#000', border: '#ccc',
    card: '#fff', subtext: '#666', icon: '#000',
  }),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');
jest.mock('@/components/Header', () => () => null);
jest.mock('@/components/GuestBanner', () => () => null);

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

import CheckoutScreen from '../index';

const mockCartData = {
  id: 1,
  totalAmount: 200,
  totalItems: 2,
  items: [
    {
      id: 1,
      quantity: 2,
      unitPrice: 100,
      product: { id: 1, name: 'Shirt', images: ['img.jpg'], price: 100 },
      variant: { id: 10, attributes: { color: 'Blue', size: 'M' } },
    },
  ],
};

const mockAddresses = [
  {
    id: 1,
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    zipCode: '12345',
  },
];

describe('CheckoutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('fetches cart and addresses on mount', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockCartData })
      .mockResolvedValueOnce({ ok: true, json: async () => mockAddresses });

    render(<CheckoutScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/cart',
        expect.any(Object),
      );
    });
  });

  it('shows cart items count after fetch', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockCartData })
      .mockResolvedValueOnce({ ok: true, json: async () => mockAddresses });

    render(<CheckoutScreen />);

    await waitFor(() => {
      // Cart starts collapsed: shows item count and subtotal
      expect(screen.getByText('1 ITEM')).toBeTruthy();
    });
  });

  it('shows order total', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockCartData })
      .mockResolvedValueOnce({ ok: true, json: async () => mockAddresses });

    render(<CheckoutScreen />);

    await waitFor(() => {
      expect(screen.getAllByText(/200\.00/).length).toBeGreaterThan(0);
    });
  });
});
