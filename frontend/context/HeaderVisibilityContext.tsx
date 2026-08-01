import React, { createContext, useContext, useRef } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

const HIDE_THRESHOLD = 40;
const SHOW_THRESHOLD = 20;

interface HeaderVisibilityContextType {
  headerTranslateY: SharedValue<number>;
  reportScroll: (y: number, contentHeight?: number, layoutHeight?: number) => void;
  setHeaderHeight: (h: number) => void;
  resetHeader: () => void;
}

const HeaderVisibilityContext = createContext<HeaderVisibilityContextType | null>(null);

export const HeaderVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const headerTranslateY = useSharedValue(0);
  const lastY = useRef(0);
  const accDelta = useRef(0);
  const headerHeightRef = useRef(60);
  const isHidden = useRef(false);

  const setHeaderHeight = (h: number) => {
    headerHeightRef.current = h;
  };

  const resetHeader = () => {
    lastY.current = 0;
    accDelta.current = 0;
    isHidden.current = false;
    headerTranslateY.value = withTiming(0, { duration: 180 });
  };

  const reportScroll = (y: number, contentHeight?: number, layoutHeight?: number) => {
    // At top — always show
    if (y <= 0) {
      accDelta.current = 0;
      isHidden.current = false;
      headerTranslateY.value = withTiming(0, { duration: 180 });
      lastY.current = y;
      return;
    }

    // Near bottom — suppress to avoid bounce glitch
    if (contentHeight && layoutHeight && y >= contentHeight - layoutHeight - 20) {
      lastY.current = y;
      return;
    }

    const diff = y - lastY.current;
    lastY.current = y;

    // Accumulate in current direction; reset on direction change
    if (diff > 0) {
      accDelta.current = accDelta.current > 0 ? accDelta.current + diff : diff;
    } else if (diff < 0) {
      accDelta.current = accDelta.current < 0 ? accDelta.current + diff : diff;
    }

    if (!isHidden.current && accDelta.current > HIDE_THRESHOLD) {
      isHidden.current = true;
      accDelta.current = 0;
      headerTranslateY.value = withTiming(-headerHeightRef.current, { duration: 200 });
    } else if (isHidden.current && accDelta.current < -SHOW_THRESHOLD) {
      isHidden.current = false;
      accDelta.current = 0;
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
