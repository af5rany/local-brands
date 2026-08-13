import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// --- Module mocks (must come before component import) ---

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ brandId: '1' }),
  Link: ({ children }: any) => children,
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
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
    subtext: '#666',
    icon: '#000',
    surface: '#f9f9f9',
    surfaceRaised: '#f0f0f0',
    textTertiary: '#999',
    textSecondary: '#666',
    success: '#22c55e',
    danger: '#ef4444',
    info: '#3b82f6',
  }),
}));

jest.mock('@/helpers/getApiUrl', () => () => 'http://localhost:3000');

jest.mock('@/components/Skeleton', () => ({
  Skeleton: ({ children }: any) => children ?? null,
}));

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

// --- Shared analytics fixture ---

const mockAnalytics = {
  totalProducts: 12,
  totalRevenue: 4500,
  totalOrders: 30,
  totalUnitsSold: 60,
  pendingOrders: 2,
  followerCount: 150,
  totalViews: 3200,
  topProducts: [],
  recentOrders: [],
  activePromoCodes: 3,
  pendingReturns: 1,
  totalDiscountGiven: 200,
};

// --- Component import (after all mocks) ---

import BrandDashboard from '../dashboard';

// --- Helpers ---

const makeFetchOk = (data: object) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);

describe('BrandDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the DASHBOARD header while loading', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves → stays loading

    const { getByText } = await render(<BrandDashboard />);
    expect(getByText('DASHBOARD')).toBeTruthy();
  });

  it('renders stats labels after data loads', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => makeFetchOk(mockAnalytics))
      .mockImplementationOnce(() => makeFetchOk({ name: 'Acme Brand' }));

    const { getByText, getAllByText } = await render(<BrandDashboard />);

    await waitFor(() => {
      expect(getByText('REVENUE')).toBeTruthy();
      expect(getAllByText('ORDERS').length).toBeGreaterThan(0);
      expect(getByText('PRODUCTS')).toBeTruthy();
    });
  });

  it('displays the brand name in the header subtitle', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => makeFetchOk(mockAnalytics))
      .mockImplementationOnce(() => makeFetchOk({ name: 'Acme Brand' }));

    const { getByText } = await render(<BrandDashboard />);

    await waitFor(() => {
      expect(getByText('Acme Brand')).toBeTruthy();
    });
  });

  it('shows quick-action navigation cards', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => makeFetchOk(mockAnalytics))
      .mockImplementationOnce(() => makeFetchOk({ name: 'Acme Brand' }));

    const { getByText, getAllByText } = await render(<BrandDashboard />);

    await waitFor(() => {
      expect(getByText('QUICK ACTIONS')).toBeTruthy();
      expect(getAllByText('ORDERS').length).toBeGreaterThan(0);
      expect(getByText('PROMO CODES')).toBeTruthy();
      expect(getAllByText('RETURNS').length).toBeGreaterThan(0);
    });
  });

  it('shows pending-orders alert banner when pendingOrders > 0', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => makeFetchOk({ ...mockAnalytics, pendingOrders: 3 }))
      .mockImplementationOnce(() => makeFetchOk({ name: 'Acme Brand' }));

    const { getByText } = await render(<BrandDashboard />);

    await waitFor(() => {
      expect(getByText(/3 pending order/i)).toBeTruthy();
    });
  });
});
