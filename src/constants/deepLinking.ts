import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

/**
 * Deep linking configuration
 * Allows the app to be opened via URLs like:
 * - flirtkey://home
 * - flirtkey://chat
 * - flirtkey://settings
 * - flirtkey://girl/123
 * - flirtkey://analyze (screenshot analysis)
 * - flirtkey://screenshot (screenshot analysis)
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['flirtkey://', 'https://flirtkey.app', 'https://*.flirtkey.app'],
  config: {
    screens: {
      Main: 'main',
      Home: 'home',
      Chat: 'chat',
      AddGirl: 'add',
      GirlProfile: {
        path: 'girl/:girlId?',
        parse: {
          girlId: (girlId: string) => parseInt(girlId, 10),
        },
      },
      Settings: 'settings',
      ApiKeySetup: 'setup/api-key',
      Onboarding: 'onboarding',
      ScreenshotAnalysis: {
        path: 'analyze',
        parse: {
          girlId: (girlId: string) => parseInt(girlId, 10),
        },
        alias: ['screenshot', 'share'],
      },
    },
  },
};

/**
 * Check if a URL is a valid deep link for this app
 */
export function isValidDeepLink(url: string): boolean {
  const prefixes = linking.prefixes;
  return prefixes.some((prefix) => url.startsWith(prefix.replace('*', '')));
}

/**
 * Extract screen name from deep link URL
 */
export function getScreenFromUrl(url: string): keyof RootStackParamList | null {
  try {
    const urlObj = new URL(url.replace('flirtkey://', 'https://flirtkey.app/'));
    const path = urlObj.pathname.replace(/^\//, '');

    const screenMap: Record<string, keyof RootStackParamList> = {
      '': 'Home',
      home: 'Home',
      chat: 'Chat',
      add: 'AddGirl',
      settings: 'Settings',
      onboarding: 'Onboarding',
      analyze: 'ScreenshotAnalysis',
      screenshot: 'ScreenshotAnalysis',
      share: 'ScreenshotAnalysis',
    };

    // Check for exact match
    if (screenMap[path]) {
      return screenMap[path];
    }

    // Check for girl profile path
    if (path.startsWith('girl/')) {
      return 'GirlProfile';
    }

    return null;
  } catch {
    return null;
  }
}
