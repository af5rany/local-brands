import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "search_history";
const MAX = 8;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setHistory(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  const addQuery = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const next = [q, ...existing.filter((x) => x !== q)].slice(0, MAX);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      setHistory(next);
    } catch {}
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(KEY);
      setHistory([]);
    } catch {}
  }, []);

  return { history, addQuery, clearHistory };
};
