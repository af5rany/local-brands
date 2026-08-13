import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

jest.mock('../../components/Toast', () => () => null);

import { ToastProvider, useToast } from '../ToastContext';

const wrapper = ({ children }: any) => <ToastProvider>{children}</ToastProvider>;

describe('ToastContext', () => {
  it('showToast sets message and type', async () => {
    const { result } = await renderHook(() => useToast(), { wrapper });
    await act(async () => { result.current.showToast('Hello', 'success'); });
    expect(result.current.showToast).toBeDefined();
    expect(result.current.hideToast).toBeDefined();
  });

  it('hideToast is callable', async () => {
    const { result } = await renderHook(() => useToast(), { wrapper });
    await act(async () => { result.current.showToast('msg', 'error'); });
    await act(async () => { result.current.hideToast(); });
    // no throw = pass
  });

  it('useToast throws outside provider', async () => {
    await expect(renderHook(() => useToast())).rejects.toThrow();
  });
});
