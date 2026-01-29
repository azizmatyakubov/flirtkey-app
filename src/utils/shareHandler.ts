/**
 * Share Handler (Phase 7.4)
 *
 * Handles shared content from other apps:
 * - 7.4.1: iOS share extension support
 * - 7.4.2: Android share target
 * - 7.4.3: Handle shared images
 * - 7.4.4: Deep link to analysis
 * - 7.4.5: Test share integration
 */

import { Linking } from 'react-native';
import {
  documentDirectory,
  copyAsync,
  readAsStringAsync,
  readDirectoryAsync,
  getInfoAsync,
  deleteAsync,
  EncodingType,
} from 'expo-file-system/legacy';

// ==========================================
// Types
// ==========================================

export interface SharedContent {
  type: 'image' | 'text' | 'url' | 'unknown';
  mimeType?: string;
  uri?: string;
  text?: string;
  data?: string; // base64 for images
}

export interface ShareHandlerResult {
  success: boolean;
  content?: SharedContent;
  error?: string;
}

// ==========================================
// Deep Link Configuration
// ==========================================

export const DEEP_LINK_SCHEME = 'flirtkey';
export const DEEP_LINK_PATHS = {
  analyze: 'analyze',
  screenshot: 'screenshot',
  share: 'share',
};

/**
 * Build a deep link URL for the app
 */
export function buildDeepLink(path: string, params?: Record<string, string>): string {
  let url = `${DEEP_LINK_SCHEME}://${path}`;

  if (params && Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Parse a deep link URL
 */
export function parseDeepLink(
  url: string
): { path: string; params: Record<string, string> } | null {
  try {
    if (!url.startsWith(`${DEEP_LINK_SCHEME}://`)) {
      return null;
    }

    const withoutScheme = url.replace(`${DEEP_LINK_SCHEME}://`, '');
    const [pathPart, queryPart] = withoutScheme.split('?');

    const params: Record<string, string> = {};
    if (queryPart) {
      queryPart.split('&').forEach((param) => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }

    return {
      path: pathPart || '',
      params,
    };
  } catch (error) {
    if (__DEV__) console.error('Error parsing deep link:', error);
    return null;
  }
}

// ==========================================
// Share Intent Handling
// ==========================================

/**
 * Get the initial URL when app is opened (for deep links)
 */
export async function getInitialURL(): Promise<string | null> {
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    if (__DEV__) console.error('Error getting initial URL:', error);
    return null;
  }
}

/**
 * Subscribe to URL/share events
 */
export function subscribeToURLEvents(callback: (url: string) => void): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });

  return () => subscription.remove();
}

/**
 * Check if the app can open a URL
 */
export async function canOpenURL(url: string): Promise<boolean> {
  try {
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

// ==========================================
// Image Handling for Shares
// ==========================================

/**
 * Copy shared image to app's document directory
 * Required for iOS share extension
 */
export async function copySharedImage(sourceUri: string): Promise<string | null> {
  try {
    const filename = `shared_${Date.now()}.jpg`;
    const destUri = `${documentDirectory}${filename}`;

    await copyAsync({
      from: sourceUri,
      to: destUri,
    });

    return destUri;
  } catch (error) {
    if (__DEV__) console.error('Error copying shared image:', error);
    return null;
  }
}

/**
 * Read shared image as base64
 */
export async function readSharedImageAsBase64(uri: string): Promise<string | null> {
  try {
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    if (__DEV__) console.error('Error reading shared image:', error);
    return null;
  }
}

/**
 * Clean up shared files (call when done processing)
 */
export async function cleanupSharedFiles(): Promise<void> {
  try {
    const docDir = documentDirectory;
    if (!docDir) return;

    const files = await readDirectoryAsync(docDir);
    const sharedFiles = files.filter((f) => f.startsWith('shared_'));

    await Promise.all(
      sharedFiles.map(async (file) => {
        const fileUri = `${docDir}${file}`;
        const info = await getInfoAsync(fileUri);
        if (info.exists) {
          // For now, just delete - modificationTime may not be available
          await deleteAsync(fileUri, { idempotent: true });
        }
      })
    );
  } catch (error) {
    if (__DEV__) console.error('Error cleaning up shared files:', error);
  }
}

// ==========================================
// Share Content Processing
// ==========================================

/**
 * Process shared content from URL
 */
export async function processSharedContent(url: string): Promise<ShareHandlerResult> {
  try {
    const parsed = parseDeepLink(url);
    if (!parsed) {
      return { success: false, error: 'Invalid URL format' };
    }

    const { path, params } = parsed;

    // Handle different share paths
    switch (path) {
      case DEEP_LINK_PATHS.screenshot:
      case DEEP_LINK_PATHS.analyze:
      case DEEP_LINK_PATHS.share: {
        const imageUri = params['imageUri'];
        const textContent = params['text'];

        if (imageUri) {
          const localUri = await copySharedImage(imageUri);
          if (!localUri) {
            return { success: false, error: 'Failed to copy shared image' };
          }

          const base64 = await readSharedImageAsBase64(localUri);

          return {
            success: true,
            content: {
              type: 'image',
              uri: localUri,
              data: base64 || undefined,
              mimeType: 'image/jpeg',
            },
          };
        }

        if (textContent) {
          return {
            success: true,
            content: {
              type: 'text',
              text: textContent,
            },
          };
        }

        return { success: false, error: 'No content in share' };
      }

      default:
        return { success: false, error: `Unknown path: ${path}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process share',
    };
  }
}

// ==========================================
// Platform-specific Configuration Info
// ==========================================

/**
 * Get configuration instructions for share extension
 */
export function getShareExtensionConfig(): {
  ios: string;
  android: string;
} {
  return {
    ios: `
iOS Share Extension Setup:
1. Add Share Extension target in Xcode
2. Configure app.json with:
   {
     "expo": {
       "ios": {
         "supportsTablet": true,
         "bundleIdentifier": "com.yourapp.flirtkey",
         "infoPlist": {
           "CFBundleURLTypes": [
             {
               "CFBundleURLSchemes": ["flirtkey"]
             }
           ],
           "NSPhotoLibraryUsageDescription": "Allow access to share photos for analysis"
         }
       }
     }
   }
3. Create ShareExtension in Xcode (requires ejecting or using config plugins)
4. Handle shared content in extension and pass to main app via deep link
    `,
    android: `
Android Share Target Setup:
1. Configure app.json with:
   {
     "expo": {
       "android": {
         "package": "com.yourapp.flirtkey",
         "intentFilters": [
           {
             "action": "SEND",
             "category": ["DEFAULT"],
             "data": [
               { "mimeType": "image/*" }
             ]
           },
           {
             "action": "VIEW",
             "autoVerify": true,
             "data": [
               { "scheme": "flirtkey" }
             ],
             "category": ["DEFAULT", "BROWSABLE"]
           }
         ]
       }
     }
   }
2. Handle intent in main activity
3. Process shared image and pass to React Native
    `,
  };
}

// ==========================================
// Export
// ==========================================

export default {
  // Deep links
  buildDeepLink,
  parseDeepLink,
  getInitialURL,
  subscribeToURLEvents,
  canOpenURL,

  // Image handling
  copySharedImage,
  readSharedImageAsBase64,
  cleanupSharedFiles,

  // Content processing
  processSharedContent,

  // Configuration
  getShareExtensionConfig,

  // Constants
  DEEP_LINK_SCHEME,
  DEEP_LINK_PATHS,
};
