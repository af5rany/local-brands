import React, { createContext, useContext, useRef } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const SCROLL_THRESHOLD = 8;

interface HeaderVisibilityContextType {
  headerTranslateY: SharedValue<number>;
  reportScroll: (y: number) => void;
  setHeaderHeight: (h: number) => void;
  resetHeader: () => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityContextType | null>(null);

export const HeaderVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const headerTranslateY = useSharedValue(0);
  const lastY = useRef(0);
  const headerHeightRef = useRef(60);

  const setHeaderHeight = (h: number) => {
    headerHeightRef.current = h;
  };

  const resetHeader = () => {
    lastY.current = 0;
    headerTranslateY.value = withTiming(0, { duration: 180 });
  };

  const reportScroll = (y: number) => {
    const diff = y - lastY.current;
    lastY.current = y;

    if (y <= 0) {
      headerTranslateY.value = withTiming(0, { duration: 180 });
      return;
    }

    if (diff > SCROLL_THRESHOLD) {
      headerTranslateY.value = withTiming(-headerHeightRef.current, { duration: 200 });
    } else if (diff < -SCROLL_THRESHOLD) {
      headerTranslateY.value = withTiming(0, { duration: 200 });
    }
  };

  return (
    <HeaderVisibilityContext.Provider value={{ headerTranslateY, reportScroll, setHeaderHeight, resetHeader }}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
};

export const useHeaderVisibility = (): HeaderVisibilityContextType => {
  const ctx = useContext(HeaderVisibilityContext);
  if (!ctx) throw new Error("useHeaderVisibility must be used within HeaderVisibilityProvider");
  return ctx;
};
