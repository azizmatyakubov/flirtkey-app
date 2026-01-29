import type { Theme, ThemeColors, ThemeSpacing, ThemeFontSizes, ThemeBorderRadius } from '../types';
import { fonts } from './fonts';

// ========================================
// 1.5.1: Color Palette — Premium Warm Romantic
// ========================================
export const darkColors: ThemeColors = {
  // Brand colors — warm rose/coral
  primary: '#FF6B6B',
  secondary: '#FF8E53',

  // Background colors — deep navy
  background: '#0F0F1A',
  surface: '#1A1B2E',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#9BA1B7',
  textTertiary: '#5C6180',

  // UI colors
  border: '#2A2B45',
  error: '#FF4757',
  success: '#2ED573',
  warning: '#FFBE76',

  // Suggestion colors
  safe: '#2ED573',
  balanced: '#FFBE76',
  bold: '#FF4757',
};

export const lightColors: ThemeColors = {
  // Brand colors
  primary: '#FF6B6B',
  secondary: '#FF8E53',

  // Background colors
  background: '#FFF5F5',
  surface: '#FFFFFF',

  // Text colors
  text: '#1A1B2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // UI colors
  border: '#FFE0E0',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',

  // Suggestion colors
  safe: '#16A34A',
  balanced: '#D97706',
  bold: '#DC2626',
};

// ========================================
// Premium accent colors (non-theme, shared)
// ========================================
export const accentColors = {
  gold: '#FFD700',
  goldLight: '#FFF3C4',
  rose: '#FF6B6B',
  coral: '#FF8E53',
  pink: '#FFB4C2',
  pinkLight: '#FFE0E6',
  gradientStart: '#FF6B6B',
  gradientEnd: '#FF8E53',
  gradientPurple: '#A855F7',
  surfaceHighlight: '#252640',
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
  xl: 28,
  xxl: 36,
};

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  glow: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ========================================
// 1.5.5: Border Radius Constants
// ========================================
export const borderRadius: ThemeBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
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
    fontFamily: fonts.semiBold,
  },

  // Text styles
  heading: {
    color: darkColors.text,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    fontFamily: fonts.bold,
  },

  subheading: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    fontFamily: fonts.semiBold,
  },

  body: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
  },

  caption: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
  },

  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    fontFamily: fonts.medium,
  },
};

// ========================================
// Premium Color Palette (used by Paywall, UI components)
// ========================================
export const PREMIUM_COLORS = {
  gold: accentColors.gold,
  goldLight: accentColors.goldLight,
  goldDark: '#B8960F',
  gradientStart: accentColors.gradientStart,
  gradientEnd: accentColors.gradientEnd,
  gradientPurple: accentColors.gradientPurple,
  gradientPrimary: darkColors.primary,
  gradientPro: accentColors.gradientPurple,
  surface: darkColors.surface,
  surfaceElevated: '#252640',
  surfaceHighlight: accentColors.surfaceHighlight,
  background: darkColors.background,
  text: darkColors.text,
  textSecondary: darkColors.textSecondary,
  border: darkColors.border,
  primary: darkColors.primary,
};

// ========================================
// Typography presets (shorthand)
// ========================================
export const TYPOGRAPHY = {
  hero: { ...componentStyles.heading, fontSize: fontSizes.xxl },
  h1: { ...componentStyles.heading, fontSize: fontSizes.xl },
  h2: { ...componentStyles.subheading, fontSize: fontSizes.lg },
  heading: componentStyles.heading,
  subheading: componentStyles.subheading,
  body: componentStyles.body,
  bodyBold: { ...componentStyles.body, fontWeight: fontWeights.bold },
  small: { ...componentStyles.caption, fontSize: fontSizes.xs },
  caption: componentStyles.caption,
  label: componentStyles.label,
  buttonText: componentStyles.buttonText,
  fontSizes,
  fontWeights,
  lineHeights,
};
