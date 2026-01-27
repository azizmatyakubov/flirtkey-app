import Constants from 'expo-constants';

/**
 * Environment configuration
 * Values are loaded from app.config.js extra field
 */
interface AppConfig {
  appEnv: 'development' | 'staging' | 'production';
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  apiTimeoutMs: number;
  maxRetryAttempts: number;
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Get extra config from expo-constants
const extra = Constants.expoConfig?.extra as Partial<AppConfig> | undefined;

export const Config: AppConfig = {
  appEnv: (extra?.appEnv as AppConfig['appEnv']) || 'development',
  enableAnalytics: extra?.enableAnalytics ?? false,
  enableCrashReporting: extra?.enableCrashReporting ?? false,
  apiTimeoutMs: extra?.apiTimeoutMs ?? 30000,
  maxRetryAttempts: extra?.maxRetryAttempts ?? 3,
  debugMode: extra?.debugMode ?? false,
  logLevel: (extra?.logLevel as AppConfig['logLevel']) || 'info',
};

// Derived values
export const isDevelopment = Config.appEnv === 'development';
export const isProduction = Config.appEnv === 'production';
export const isStaging = Config.appEnv === 'staging';

// App metadata from Constants
export const AppInfo = {
  name: Constants.expoConfig?.name ?? 'FlirtKey',
  version: Constants.expoConfig?.version ?? '1.0.0',
  // Device info is available in Constants as well
};

export default Config;
