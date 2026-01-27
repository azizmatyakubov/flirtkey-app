import type { Theme, ThemeColors, ThemeSpacing, ThemeFontSizes, ThemeBorderRadius } from '../types';

// ========================================
// 1.5.1: Color Palette (already exists, moved here)
// ========================================
export const darkColors: ThemeColors = {
  // Brand colors
  primary: '#6366f1',
  secondary: '#8b5cf6',

  // Background colors
  background: '#0a0a0a',
  surface: '#1a1a1a',

  // Text colors
  text: '#ffffff',
  textSecondary: '#888888',

  // UI colors
  border: '#333333',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',

  // Suggestion colors
  safe: '#22c55e',
  balanced: '#f59e0b',
  bold: '#ef4444',
};

export const lightColors: ThemeColors = {
  // Brand colors
  primary: '#6366f1',
  secondary: '#8b5cf6',

  // Background colors
  background: '#f8f9fa',
  surface: '#ffffff',

  // Text colors
  text: '#111827',
  textSecondary: '#6b7280',

  // UI colors
  border: '#e5e7eb',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',

  // Suggestion colors
  safe: '#16a34a',
  balanced: '#d97706',
  bold: '#dc2626',
};

// ========================================
// 1.5.2: Spacing Constants
// ========================================
export const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ========================================
// 1.5.3: Typography Scale
// ========================================
export const fontSizes: ThemeFontSizes = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// ========================================
// 1.5.4: Shadow Presets
// ========================================
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

// ========================================
// 1.5.5: Border Radius Constants
// ========================================
export const borderRadius: ThemeBorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// ========================================
// 1.5.6: Complete Theme Objects
// ========================================
export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  fontSizes,
  borderRadius,
  isDark: true,
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  fontSizes,
  borderRadius,
  isDark: false,
};

// Default theme
export const defaultTheme = darkTheme;

// ========================================
// 1.5.7: Base Component Styles
// ========================================
export const componentStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },

  // Card styles
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },

  // Input styles
  input: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: darkColors.text,
    fontSize: fontSizes.md,
    borderWidth: 1,
    borderColor: darkColors.border,
  },

  // Button styles
  button: {
    backgroundColor: darkColors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },

  // Text styles
  heading: {
    color: darkColors.text,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },

  subheading: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },

  body: {
    color: darkColors.text,
    fontSize: fontSizes.md,
  },

  caption: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },

  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
};
