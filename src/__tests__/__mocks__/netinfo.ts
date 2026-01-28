/**
 * Mock for @react-native-community/netinfo
 */

export default {
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
};

export const NetInfoStateType = {
  unknown: 'unknown',
  none: 'none',
  cellular: 'cellular',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  ethernet: 'ethernet',
  wimax: 'wimax',
  vpn: 'vpn',
  other: 'other',
};
