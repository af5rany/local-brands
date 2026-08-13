import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { BrandProvider, useBrand } from '../BrandContext';

const wrapper = ({ children }: any) => <BrandProvider>{children}</BrandProvider>;

describe('BrandContext', () => {
  it('starts with null selectedBrandId', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper });
    expect(result.current.selectedBrandId).toBeNull();
  });

  it('setSelectedBrandId updates value', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper });
    await act(async () => { result.current.setSelectedBrandId(42); });
    expect(result.current.selectedBrandId).toBe(42);
  });

  it('incrementProductListVersion increments counter', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper });
    expect(result.current.productListVersion).toBe(0);
    await act(async () => { result.current.incrementProductListVersion(); });
    expect(result.current.productListVersion).toBe(1);
  });

  it('invalidateProduct increments per-product version', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper });
    await act(async () => { result.current.invalidateProduct(5); });
    expect(result.current.productVersions[5]).toBe(1);
    await act(async () => { result.current.invalidateProduct(5); });
    expect(result.current.productVersions[5]).toBe(2);
  });

  it('invalidateProduct tracks different products independently', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper });
    await act(async () => { result.current.invalidateProduct(1); result.current.invalidateProduct(2); });
    expect(result.current.productVersions[1]).toBe(1);
    expect(result.current.productVersions[2]).toBe(1);
  });

  it('incrementBrandVersion increments counter', async () => {
    const { result } = await renderHook(() => useBrand(), { wrapper });
    await act(async () => { result.current.incrementBrandVersion(); });
    expect(result.current.brandVersion).toBe(1);
  });

  it('useBrand throws outside provider', async () => {
    await expect(renderHook(() => useBrand())).rejects.toThrow(
      'useBrand must be used within a BrandProvider',
    );
  });
});
