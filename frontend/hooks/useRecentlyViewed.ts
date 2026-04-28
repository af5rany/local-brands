import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "recently_viewed_products";
const MAX = 15;

export const useRecentlyViewed = () => {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setIds(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const addProduct = useCallback(async (id: number) => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const existing: number[] = raw ? JSON.parse(raw) : [];
      const next = [id, ...existing.filter((x) => x !== id)].slice(0, MAX);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      setIds(next);
    } catch {}
  }, []);

  const clearProducts = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(KEY);
      setIds([]);
    } catch {}
  }, []);

  return { ids, addProduct, clearProducts };
};
