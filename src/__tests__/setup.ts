/**
 * Jest Test Setup
 * Phase 9.1.1-9.1.2: Setup Jest and React Native Testing Library
 */

// Global variables
(global as Record<string, unknown>)['__DEV__'] = true;

// Mock console.warn to reduce noise
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Reanimated') ||
      message.includes('NativeEventEmitter') ||
      message.includes('Animated') ||
      message.includes('TurboModuleRegistry'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global test utilities
(global as Record<string, unknown>)['mockApiResponse'] = <T>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

(global as Record<string, unknown>)['wait'] = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Extend global types
declare global {
  function mockApiResponse<T>(data: T): { data: T; status: number; statusText: string };
  function wait(ms: number): Promise<void>;
}
