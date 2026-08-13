import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';

// --- Module mocks ---

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockRouterPush, back: mockRouterBack, replace: jest.fn() }),
    useLocalSearchParams: () => ({ brandId: '1' }),
    useFocusEffect: (cb: any) => React.useEffect(cb, []),
    Link: ({ children }: any) => children,
    router: { push: mockRouterPush, replace: jest.fn(), back: mockRouterBack },
  };
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'brandOwner', name: 'Brand Owner' },
    token: 'test-token',
    logout: jest.fn(),
  }),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColors: () => ({
    text: '#000',
    background: '#fff',
    primary: '#000',
    border: '#ccc',
    borderLight: '#eee',
    surface: '#f9f9f9',
    textTertiary: '#999',
    textSecondary: '#666',
    success: '#22c55e',
    danger: '#ef4444',
  }),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');

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

const futureDate = '2099-12-31T00:00:00Z';

const mockPromoCode = {
  id: 10,
  code: 'SUMMER20',
  type: 'percentage',
  value: 20,
  isActive: true,
  expiryDate: futureDate,
  usesCount: 5,
  maxUses: 100,
  minOrderAmount: null,
};

const makeFetchItems = (items: object[]) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ items }),
  } as Response);

// --- Component import ---

import PromoCodesScreen from '../index';

describe('PromoCodesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the PROMO CODES header', async () => {
    global.fetch = jest.fn(() => makeFetchItems([]));
    render(<PromoCodesScreen />);
    await waitFor(() => expect(screen.getByText('PROMO CODES')).toBeTruthy());
  });

  it('shows empty state with create button when no promo codes exist', async () => {
    global.fetch = jest.fn(() => makeFetchItems([]));
    render(<PromoCodesScreen />);
    await waitFor(() => {
      expect(screen.getByText('NO PROMO CODES YET')).toBeTruthy();
      expect(screen.getByText('CREATE FIRST CODE')).toBeTruthy();
    });
  });

  it('renders a promo code card with code and discount info', async () => {
    global.fetch = jest.fn(() => makeFetchItems([mockPromoCode]));
    render(<PromoCodesScreen />);
    await waitFor(() => {
      expect(screen.getByText('SUMMER20')).toBeTruthy();
      expect(screen.getByText(/20% OFF/)).toBeTruthy();
      expect(screen.getByText('ACTIVE')).toBeTruthy();
    });
  });

  it('shows DEACTIVATE action button for an active promo code', async () => {
    global.fetch = jest.fn(() => makeFetchItems([mockPromoCode]));
    render(<PromoCodesScreen />);
    await waitFor(() => expect(screen.getByText('DEACTIVATE')).toBeTruthy());
  });

  it('navigates to create screen when the add button is pressed', async () => {
    global.fetch = jest.fn(() => makeFetchItems([]));
    render(<PromoCodesScreen />);
    await waitFor(() => expect(screen.getByText('CREATE FIRST CODE')).toBeTruthy());
    fireEvent.press(screen.getByText('CREATE FIRST CODE'));
    expect(mockRouterPush).toHaveBeenCalledWith('/brands/1/promo-codes/create');
  });
});
