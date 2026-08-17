import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: () => null,
  AppleAuthenticationButtonType: { SIGN_IN: 'SIGN_IN' },
  AppleAuthenticationButtonStyle: { BLACK: 'BLACK' },
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    token: null,
    user: null,
    loading: false,
    isGuest: false,
  }),
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
    textTertiary: '#999',
    surface: '#f9f9f9',
  }),
}));

jest.mock('@/hooks/useSocialAuth', () => ({
  useSocialAuth: () => ({
    handleGoogle: jest.fn(),
    handleFacebook: jest.fn(),
    handleApple: jest.fn(),
    googleLoading: false,
    facebookLoading: false,
    appleLoading: false,
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

import LoginScreen from '../login';

describe('LoginScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders email and password inputs', async () => {
    const { getByPlaceholderText } = await render(<LoginScreen />);
    expect(getByPlaceholderText('hello@example.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
  });

  it('shows alert when submitting with empty fields', async () => {
    const { getAllByText } = await render(<LoginScreen />);
    // Index 0 = section label "SIGN IN", index 1 = button "SIGN IN"
    const loginBtn = getAllByText(/sign in/i)[1];

    await act(async () => {
      fireEvent.press(loginBtn);
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls fetch with credentials on submit', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'jwt-token' }),
    });

    const { getByPlaceholderText, getAllByText } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('hello@example.com'), 'user@example.com');
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'pass123');
    });

    await act(async () => {
      fireEvent.press(getAllByText(/sign in/i)[1]);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@example.com', password: 'pass123' }),
        }),
      );
    });
  });

  it('shows error alert on failed login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    const { getByPlaceholderText, getAllByText } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('hello@example.com'), 'user@example.com');
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
      fireEvent.press(getAllByText(/sign in/i)[1]);
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });
});
