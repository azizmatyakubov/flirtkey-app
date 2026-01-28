/**
 * Mock for @react-native-async-storage/async-storage
 */

let storage: Record<string, string> = {};

export const getItem = jest.fn((key: string) => Promise.resolve(storage[key] ?? null));
export const setItem = jest.fn((key: string, value: string) => {
  storage[key] = value;
  return Promise.resolve();
});
export const removeItem = jest.fn((key: string) => {
  delete storage[key];
  return Promise.resolve();
});
export const clear = jest.fn(() => {
  storage = {};
  return Promise.resolve();
});
export const getAllKeys = jest.fn(() => Promise.resolve(Object.keys(storage)));
export const multiGet = jest.fn((keys: string[]) =>
  Promise.resolve(keys.map((key) => [key, storage[key] ?? null]))
);
export const multiSet = jest.fn((keyValuePairs: [string, string][]) => {
  keyValuePairs.forEach(([key, value]) => {
    storage[key] = value;
  });
  return Promise.resolve();
});
export const multiRemove = jest.fn((keys: string[]) => {
  keys.forEach((key) => delete storage[key]);
  return Promise.resolve();
});

// Reset storage for tests
export const __resetStorage = () => {
  storage = {};
};

export default {
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
  multiGet,
  multiSet,
  multiRemove,
  __resetStorage,
};
