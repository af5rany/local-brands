import React, { createContext, useContext, useRef } from "react";

type ScrollFn = () => void;

interface ScrollToTopContextType {
  register: (routeName: string, fn: ScrollFn) => void;
  unregister: (routeName: string) => void;
  trigger: (routeName: string) => void;
}

const ScrollToTopContext = createContext<ScrollToTopContextType>({
  register: () => {},
  unregister: () => {},
  trigger: () => {},
});

export function ScrollToTopProvider({ children }: { children: React.ReactNode }) {
  const fnsRef = useRef<Map<string, ScrollFn>>(new Map());

  const register = (routeName: string, fn: ScrollFn) => {
    fnsRef.current.set(routeName, fn);
  };

  const unregister = (routeName: string) => {
    fnsRef.current.delete(routeName);
  };

  const trigger = (routeName: string) => {
    fnsRef.current.get(routeName)?.();
  };

  return (
    <ScrollToTopContext.Provider value={{ register, unregister, trigger }}>
      {children}
    </ScrollToTopContext.Provider>
  );
}

export const useScrollToTop = () => useContext(ScrollToTopContext);
