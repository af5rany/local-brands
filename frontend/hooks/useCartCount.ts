import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import getApiUrl from '@/helpers/getApiUrl';

export function useCartCount() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!token) { setCount(0); return; }
    try {
      const res = await fetch(`${getApiUrl()}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.totalItems || data.cartItems?.length || 0);
      }
    } catch { setCount(0); }
  }, [token]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  return { count, refresh: fetchCount };
}
