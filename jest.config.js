/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts', '<rootDir>/src/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@react-native-community/netinfo$': '<rootDir>/src/__tests__/__mocks__/netinfo.ts',
    '^expo$': '<rootDir>/src/__tests__/__mocks__/expo.ts',
    '^expo/(.*)$': '<rootDir>/src/__tests__/__mocks__/expo.ts',
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__tests__/__mocks__/async-storage.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  resetMocks: true,
  testTimeout: 10000,
  globals: {
    __DEV__: true,
  },
};
