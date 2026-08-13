import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// --- Module mocks ---

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({ brandId: '1' }),
  Link: ({ children }: any) => children,
  router: { push: mockRouterPush, replace: jest.fn(), back: mockRouterBack },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'brandOwner', name: 'Brand Owner' },
    token: 'test-token',
    logout: jest.fn(),
  }),
}));

jest.mock('@/context/NetworkContext', () => ({
  useNetwork: () => ({ isConnected: true }),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColors: () => ({
    text: '#000',
    background: '#fff',
    primary: '#000',
    border: '#ccc',
    borderLight: '#eee',
    card: '#fff',
    surface: '#f9f9f9',
    textTertiary: '#999',
    textSecondary: '#666',
    success: '#22c55e',
    danger: '#ef4444',
    info: '#3b82f6',
  }),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');

jest.mock('@/components/OfflinePlaceholder', () => {
  const { Text } = require('react-native');
  return ({ onRetry }: any) => <Text onPress={onRetry}>Offline</Text>;
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// --- Fixtures ---

const mockOrder = {
  id: 42,
  status: 'PENDING',
  totalAmount: 99.99,
  createdAt: '2025-01-15T10:00:00Z',
  user: { name: 'Jane Doe', email: 'jane@example.com' },
  brandItems: [
    { id: 1, productName: 'Blue Hoodie', quantity: 2, unitPrice: 40, totalPrice: 80 },
  ],
};

const makeFetchPage = (items: object[]) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: items, pagination: { totalPages: 1 } }),
  } as Response);

// --- Component import ---

import BrandOrdersScreen from '../index';

describe('BrandOrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ORDERS header', async () => {
    global.fetch = jest.fn(() => makeFetchPage([]));

    const { getByText } = await render(<BrandOrdersScreen />);

    await waitFor(() => {
      expect(getByText('ORDERS')).toBeTruthy();
    });
  });

  it('shows empty state when no orders are returned', async () => {
    global.fetch = jest.fn(() => makeFetchPage([]));

    const { getByText } = await render(<BrandOrdersScreen />);

    await waitFor(() => {
      expect(getByText('No orders yet.')).toBeTruthy();
    });
  });

  it('renders an order card with the order number and status badge', async () => {
    global.fetch = jest.fn(() => makeFetchPage([mockOrder]));

    const { getByText } = await render(<BrandOrdersScreen />);

    await waitFor(() => {
      expect(getByText('#ORD-0042')).toBeTruthy();
      expect(getByText('PENDING')).toBeTruthy();
    });
  });

  it('displays customer name and item details in the order card', async () => {
    global.fetch = jest.fn(() => makeFetchPage([mockOrder]));

    const { getByText } = await render(<BrandOrdersScreen />);

    await waitFor(() => {
      expect(getByText('Jane Doe')).toBeTruthy();
      expect(getByText(/Blue Hoodie/)).toBeTruthy();
    });
  });

  it('navigates to the order detail screen when an order card is pressed', async () => {
    global.fetch = jest.fn(() => makeFetchPage([mockOrder]));

    const { getByText } = await render(<BrandOrdersScreen />);

    await waitFor(() => {
      expect(getByText('#ORD-0042')).toBeTruthy();
    });

    fireEvent.press(getByText('#ORD-0042'));

    expect(mockRouterPush).toHaveBeenCalledWith('/orders/42');
  });
});
