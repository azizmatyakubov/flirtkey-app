// 6.1.19 Test landscape orientation
// 6.1.20 Test split-screen mode
import { useState, useEffect, useCallback } from 'react';
import { Dimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

interface OrientationState {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  isSmallScreen: boolean;
  isLargeScreen: boolean;
  isSplitScreen: boolean;
  scale: number;
}

/**
 * Hook to detect and respond to orientation changes
 * Supports landscape orientation and split-screen mode
 */
export function useOrientation(): OrientationState {
  const getOrientationState = useCallback((): OrientationState => {
    const { width, height, scale } = Dimensions.get('window');
    const screenDimensions = Dimensions.get('screen');

    const orientation: Orientation = width > height ? 'landscape' : 'portrait';

    // Detect split-screen mode (when window is significantly smaller than screen)
    const windowArea = width * height;
    const screenArea = screenDimensions.width * screenDimensions.height;
    const isSplitScreen = windowArea < screenArea * 0.7; // Less than 70% of screen

    // Small screen: phones
    // Large screen: tablets, large phones in landscape
    const isSmallScreen = Math.min(width, height) < 400;
    const isLargeScreen = Math.min(width, height) >= 600;

    return {
      orientation,
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
      width,
      height,
      isSmallScreen,
      isLargeScreen,
      isSplitScreen,
      scale,
    };
  }, []);

  const [state, setState] = useState<OrientationState>(getOrientationState);

  useEffect(() => {
    const handleChange = () => {
      setState(getOrientationState());
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription?.remove();
    };
  }, [getOrientationState]);

  return state;
}

/**
 * Hook to get responsive values based on orientation
 */
export function useResponsiveValue<T>(portrait: T, landscape: T): T {
  const { isLandscape } = useOrientation();
  return isLandscape ? landscape : portrait;
}

/**
 * Hook to get responsive styles based on orientation
 */
export function useResponsiveStyles<T extends object>(portrait: T, landscape: Partial<T>): T {
  const { isLandscape } = useOrientation();
  return isLandscape ? { ...portrait, ...landscape } : portrait;
}

/**
 * Hook to get layout configuration for different screen sizes
 */
interface LayoutConfig {
  columns: number;
  padding: number;
  itemWidth: number;
  showSidebar: boolean;
  compactMode: boolean;
}

export function useLayoutConfig(): LayoutConfig {
  const { width, isLandscape, isLargeScreen, isSplitScreen } = useOrientation();

  // Calculate columns based on screen width
  let columns = 1;
  if (isLargeScreen) {
    columns = isLandscape ? 3 : 2;
  } else if (isLandscape && !isSplitScreen) {
    columns = 2;
  }

  // Padding based on screen size
  const padding = isLargeScreen ? 24 : isSplitScreen ? 12 : 16;

  // Item width for grid layouts
  const availableWidth = width - padding * 2 - (columns - 1) * padding;
  const itemWidth = Math.floor(availableWidth / columns);

  // Show sidebar on large landscape screens
  const showSidebar = isLargeScreen && isLandscape && !isSplitScreen;

  // Compact mode for split-screen
  const compactMode = isSplitScreen || width < 350;

  return {
    columns,
    padding,
    itemWidth,
    showSidebar,
    compactMode,
  };
}

/**
 * Responsive spacing helper
 */
export function useResponsiveSpacing() {
  const { isLargeScreen, isSplitScreen, isLandscape } = useOrientation();

  return {
    xs: isSplitScreen ? 2 : 4,
    sm: isSplitScreen ? 4 : 8,
    md: isSplitScreen ? 8 : 16,
    lg: isSplitScreen ? 12 : isLargeScreen ? 32 : 24,
    xl: isSplitScreen ? 16 : isLargeScreen ? 48 : 32,
    // Special spacing
    screenPadding: isSplitScreen ? 8 : isLargeScreen ? 24 : 16,
    cardPadding: isSplitScreen ? 8 : 16,
    listItemHeight: isSplitScreen ? 56 : isLandscape ? 64 : 72,
  };
}

/**
 * Font size scaling for different screen sizes
 */
export function useResponsiveFontSizes() {
  const { isSplitScreen, isLargeScreen } = useOrientation();

  const scale = isSplitScreen ? 0.85 : isLargeScreen ? 1.1 : 1;

  return {
    xs: Math.round(11 * scale),
    sm: Math.round(13 * scale),
    md: Math.round(16 * scale),
    lg: Math.round(20 * scale),
    xl: Math.round(24 * scale),
    xxl: Math.round(32 * scale),
  };
}
