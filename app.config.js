// app.config.js - Dynamic Expo configuration
// This allows us to use environment variables in our app

export default ({ config }) => {
  return {
    ...config,
    name: 'FlirtKey',
    slug: 'flirtkey-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a0a',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.flirtkey.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0a0a0a',
      },
      package: 'com.flirtkey.app',
      edgeToEdgeEnabled: true,
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
    },
    plugins: [
      'expo-localization',
    ],
  };
};
