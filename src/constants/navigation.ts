import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Default navigation screen options for the app
 */
export const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0a0a0a' },
  animation: 'slide_from_right',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

/**
 * Modal screen options (slide up from bottom)
 */
export const modalScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'slide_from_bottom',
  presentation: 'modal',
};

/**
 * Fade animation screen options
 */
export const fadeScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'fade',
};

/**
 * Screen-specific options
 */
export const screenOptions = {
  Home: {
    ...defaultScreenOptions,
  },
  Chat: {
    ...defaultScreenOptions,
  },
  AddGirl: {
    ...modalScreenOptions,
  },
  GirlProfile: {
    ...defaultScreenOptions,
  },
  Settings: {
    ...defaultScreenOptions,
  },
  ApiKeySetup: {
    ...modalScreenOptions,
  },
  Onboarding: {
    ...fadeScreenOptions,
    gestureEnabled: false,
  },
} as const;

/**
 * Screen names as constants to avoid typos
 */
export const SCREENS = {
  HOME: 'Home',
  CHAT: 'Chat',
  ADD_GIRL: 'AddGirl',
  GIRL_PROFILE: 'GirlProfile',
  SETTINGS: 'Settings',
  API_KEY_SETUP: 'ApiKeySetup',
  ONBOARDING: 'Onboarding',
} as const;
