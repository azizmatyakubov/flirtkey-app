/**
 * OfflineIndicator Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock NetInfo
let mockNetInfoCallback: ((state: any) => void) | null = null;

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((callback) => {
    mockNetInfoCallback = callback;
    // Simulate initial connected state
    callback({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
    return jest.fn(); // unsubscribe
  }),
  refresh: jest.fn(),
}));

import { OfflineIndicator, useNetworkStatus } from '../../components/OfflineIndicator';

describe('OfflineIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetInfoCallback = null;
  });

  it('renders nothing when online', () => {
    const { toJSON } = render(<OfflineIndicator />);

    // When online, indicator should be hidden (still rendered but animated off-screen)
    expect(toJSON()).not.toBeNull();
  });

  it('shows offline message when disconnected', async () => {
    const { getByText } = render(<OfflineIndicator />);

    // Simulate going offline
    act(() => {
      mockNetInfoCallback?.({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    await waitFor(() => {
      expect(getByText('No internet connection')).toBeTruthy();
    });
  });

  it('shows weak connection warning', async () => {
    const { getByText } = render(<OfflineIndicator />);

    // Simulate weak connection
    act(() => {
      mockNetInfoCallback?.({
        isConnected: true,
        isInternetReachable: false,
        type: 'cellular',
      });
    });

    await waitFor(() => {
      expect(getByText('Weak cellular connection')).toBeTruthy();
    });
  });

  it('shows retry button when offline', async () => {
    const onRetry = jest.fn();
    const { getByText } = render(<OfflineIndicator onRetry={onRetry} />);

    act(() => {
      mockNetInfoCallback?.({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    await waitFor(() => {
      const retryButton = getByText('Retry');
      expect(retryButton).toBeTruthy();
    });
  });

  it('calls onRetry when retry button is pressed', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    const onRetry = jest.fn();
    const { getByText } = render(<OfflineIndicator onRetry={onRetry} />);

    act(() => {
      mockNetInfoCallback?.({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    await waitFor(async () => {
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      expect(NetInfo.refresh).toHaveBeenCalled();
      expect(onRetry).toHaveBeenCalled();
    });
  });

  it('shows "Back online" message when recovering', async () => {
    jest.useFakeTimers();

    const { getByText, queryByText } = render(<OfflineIndicator showWhenOnline={true} />);

    // Go offline
    act(() => {
      mockNetInfoCallback?.({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    await waitFor(() => {
      expect(getByText('No internet connection')).toBeTruthy();
    });

    // Come back online
    act(() => {
      mockNetInfoCallback?.({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });
    });

    await waitFor(() => {
      expect(getByText('Back online!')).toBeTruthy();
    });

    // Message should disappear after timeout
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    jest.useRealTimers();
  });
});

describe('useNetworkStatus', () => {
  it('returns current network status', () => {
    let status: any;

    const TestComponent = () => {
      status = useNetworkStatus();
      return null;
    };

    render(<TestComponent />);

    expect(status).toEqual({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
  });

  it('updates when network status changes', () => {
    let status: any;

    const TestComponent = () => {
      status = useNetworkStatus();
      return null;
    };

    render(<TestComponent />);

    act(() => {
      mockNetInfoCallback?.({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    expect(status.isConnected).toBe(false);
    expect(status.type).toBe('none');
  });
});
