import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({ brandId: '2' }),
    useFocusEffect: (cb: any) => React.useEffect(cb, []),
  };
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColors: () => ({
    text: '#000', background: '#fff', primary: '#000', border: '#ccc',
    borderLight: '#eee', surface: '#f9f9f9', textTertiary: '#999', danger: '#ef4444',
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

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const makeFetch = (data: any) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);

import ShippingZonesScreen from '../index';

const mockZones = [
  {
    id: 1,
    name: 'Gulf Region',
    countries: ['SA', 'AE', 'KW'],
    isActive: true,
    rates: [
      { id: 10, methodName: 'Standard Shipping', method: 'standard', price: 20, estimatedDays: 5, isActive: true },
      { id: 11, methodName: 'Express', method: 'express', price: 45, estimatedDays: 2, isActive: true },
    ],
  },
];

describe('ShippingZonesScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders SHIPPING ZONES header', async () => {
    global.fetch = jest.fn(() => makeFetch([]));
    const { getByText } = await render(<ShippingZonesScreen />);
    await waitFor(() => expect(getByText('SHIPPING ZONES')).toBeTruthy());
  });

  it('shows empty state with ADD FIRST ZONE when no zones', async () => {
    global.fetch = jest.fn(() => makeFetch([]));
    const { getByText } = await render(<ShippingZonesScreen />);
    await waitFor(() => {
      expect(getByText('NO SHIPPING ZONES')).toBeTruthy();
      expect(getByText('ADD FIRST ZONE')).toBeTruthy();
    });
  });

  it('renders zone cards when zones are loaded', async () => {
    global.fetch = jest.fn(() => makeFetch(mockZones));
    const { getByText } = await render(<ShippingZonesScreen />);
    await waitFor(() => {
      expect(getByText('Gulf Region')).toBeTruthy();
      expect(getByText('SA, AE, KW')).toBeTruthy();
    });
  });

  it('shows rate count badge on zone card', async () => {
    global.fetch = jest.fn(() => makeFetch(mockZones));
    const { getByText } = await render(<ShippingZonesScreen />);
    await waitFor(() => {
      expect(getByText('2 RATES')).toBeTruthy();
    });
  });

  it('expands zone to show rates when tapped', async () => {
    global.fetch = jest.fn(() => makeFetch(mockZones));
    const { getByText } = await render(<ShippingZonesScreen />);
    await waitFor(() => expect(getByText('Gulf Region')).toBeTruthy());

    fireEvent.press(getByText('Gulf Region'));

    await waitFor(() => {
      expect(getByText('Standard Shipping')).toBeTruthy();
      expect(getByText('Express')).toBeTruthy();
    });
  });
});
