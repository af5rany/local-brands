import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ brandId: '3' }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColors: () => ({
    text: '#000', background: '#fff', primary: '#000', border: '#ccc',
    borderLight: '#eee', surface: '#f9f9f9', textTertiary: '#999',
    danger: '#ef4444', success: '#22c55e',
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

jest.mock('@/components/Header', () => {
  const { Text } = require('react-native');
  return ({ title }: any) => <Text>{title}</Text>;
});

const makeFetch = (data: any) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response);

import EmailCampaignsScreen from '../index';

const mockCampaigns = [
  { id: 1, subject: 'Summer Sale', status: 'draft', createdAt: new Date().toISOString() },
  { id: 2, subject: 'New Arrivals', status: 'sent', createdAt: new Date().toISOString() },
];

describe('EmailCampaignsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders email campaigns title', async () => {
    global.fetch = jest.fn(() => makeFetch([]));
    const { getByText } = await render(<EmailCampaignsScreen />);
    await waitFor(() => {
      // Header or title text should be present
      expect(getByText(/email campaign/i)).toBeTruthy();
    });
  });

  it('shows empty state when no campaigns', async () => {
    global.fetch = jest.fn(() => makeFetch([]));
    const { getByText } = await render(<EmailCampaignsScreen />);
    await waitFor(() => {
      expect(getByText(/no campaign/i)).toBeTruthy();
    });
  });

  it('renders campaign list when campaigns loaded', async () => {
    global.fetch = jest.fn(() => makeFetch(mockCampaigns));
    const { getByText } = await render(<EmailCampaignsScreen />);
    await waitFor(() => {
      expect(getByText('Summer Sale')).toBeTruthy();
      expect(getByText('New Arrivals')).toBeTruthy();
    });
  });

  it('displays draft status badge', async () => {
    global.fetch = jest.fn(() => makeFetch(mockCampaigns));
    const { getByText } = await render(<EmailCampaignsScreen />);
    await waitFor(() => {
      expect(getByText(/draft/i)).toBeTruthy();
    });
  });

  it('displays sent status badge', async () => {
    global.fetch = jest.fn(() => makeFetch(mockCampaigns));
    const { getByText } = await render(<EmailCampaignsScreen />);
    await waitFor(() => {
      expect(getByText(/sent/i)).toBeTruthy();
    });
  });
});
