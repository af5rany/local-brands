import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({ brandId: '1' }),
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

import BrandReturnsScreen from '../index';

describe('BrandReturnsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders RETURNS header', async () => {
    global.fetch = jest.fn(() => makeFetch({ items: [], total: 0 }));
    const { getByText } = await render(<BrandReturnsScreen />);
    await waitFor(() => expect(getByText('RETURNS')).toBeTruthy());
  });

  it('shows status filter tabs', async () => {
    global.fetch = jest.fn(() => makeFetch({ items: [], total: 0 }));
    const { getByText } = await render(<BrandReturnsScreen />);
    await waitFor(() => {
      expect(getByText('ALL')).toBeTruthy();
      expect(getByText('REQUESTED')).toBeTruthy();
    });
  });

  it('shows NO RETURNS when list is empty', async () => {
    global.fetch = jest.fn(() => makeFetch({ items: [], total: 0 }));
    const { getByText } = await render(<BrandReturnsScreen />);
    await waitFor(() => {
      expect(getByText('NO RETURNS')).toBeTruthy();
    });
  });

  it('renders return cards when data is present', async () => {
    const mockReturns = [
      {
        id: 42,
        status: 'requested',
        reason: 'size_fit',
        user: { name: 'Test Customer' },
        createdAt: new Date().toISOString(),
      },
    ];
    global.fetch = jest.fn(() => makeFetch({ items: mockReturns, total: 1 }));
    const { getByText } = await render(<BrandReturnsScreen />);
    await waitFor(() => {
      expect(getByText('RETURN #42')).toBeTruthy();
      expect(getByText('Test Customer')).toBeTruthy();
    });
  });

  it('displays the correct status label on a return card', async () => {
    const mockReturns = [
      {
        id: 7,
        status: 'approved',
        reason: 'wrong_item',
        user: { name: 'Jane' },
        createdAt: new Date().toISOString(),
      },
    ];
    global.fetch = jest.fn(() => makeFetch({ items: mockReturns, total: 1 }));
    const { getAllByText } = await render(<BrandReturnsScreen />);
    await waitFor(() => {
      expect(getAllByText('APPROVED').length).toBeGreaterThan(0);
    });
  });
});
