// app.config.js - Dynamic Expo configuration
// This allows us to use environment variables in our app

const IS_PRODUCTION = process.env.APP_ENV === 'production';

export default ({ config }) => {
  return {
    ...config,
    name: 'FlirtKey',
    slug: 'flirtkey-app',
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'flirtkey',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a0a',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.flirtkey.app',
      buildNumber: '1',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'FlirtKey needs access to your photos to analyze chat screenshots',
        NSCameraUsageDescription: 'FlirtKey needs camera access to capture screenshots for analysis',
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['flirtkey'],
          },
        ],
        LSApplicationQueriesSchemes: ['flirtkey'],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0a0a0a',
      },
      package: 'com.flirtkey.app',
      versionCode: 1,
      edgeToEdgeEnabled: true,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'flirtkey' }],
          category: ['DEFAULT', 'BROWSABLE'],
        },
        {
          action: 'SEND',
          category: ['DEFAULT'],
          data: [{ mimeType: 'image/*' }],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Environment variables accessible via expo-constants
      appEnv: process.env.APP_ENV || 'development',
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      enableCrashReporting: process.env.ENABLE_CRASH_REPORTING === 'true',
      apiTimeoutMs: parseInt(process.env.API_TIMEOUT_MS || '30000', 10),
      maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
      debugMode: process.env.DEBUG_MODE === 'true',
      logLevel: process.env.LOG_LEVEL || 'info',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      eas: {
        projectId: 'YOUR_EAS_PROJECT_ID', // Run `eas init` to get this
      },
    },
    owner: 'flirtkey', // Your Expo username
    plugins: [
      'expo-localization',
      [
        'expo-image-picker',
        {
          photosPermission: 'FlirtKey needs access to your photos to analyze chat screenshots',
          cameraPermission: 'FlirtKey needs camera access to capture screenshots for analysis',
        },
      ],
      [
        'expo-secure-store',
        {
          faceIDPermission: 'Allow FlirtKey to access your Face ID for secure API key storage',
        },
      ],
    ],
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/YOUR_EAS_PROJECT_ID',
    },
  };
};
