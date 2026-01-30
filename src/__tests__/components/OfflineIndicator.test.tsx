/**
 * OfflineIndicator Component Tests
 *
 * Tests network status detection and banner display logic.
 * Animation details are mocked out since react-native-reanimated
 * doesn't render cleanly in React 19's test renderer.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// Reanimated mock is handled globally via moduleNameMapper.
// Override Animated.View to be a plain View for rendering:
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const AnimatedView = React.forwardRef((props: any, ref: any) =>
    React.createElement('View', { ...props, ref })
  );
  AnimatedView.displayName = 'AnimatedView';

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      Text: 'Text',
      createAnimatedComponent: (c: any) => c,
    },
    View: AnimatedView,
    // Use plain functions instead of jest.fn() to survive resetMocks
    useAnimatedStyle: () => ({}),
    useSharedValue: (val: any) => ({ value: val }),
    withSpring: (val: any) => val,
    withTiming: (val: any) => val,
    withSequence: (...args: any[]) => args[args.length - 1],
    Easing: { bezier: () => {} },
  };
});

// Mock NetInfo
let mockNetInfoCallback: ((state: any) => void) | null = null;

const mockRefresh = jest.fn();
const mockAddEventListener = jest.fn((callback: any) => {
  mockNetInfoCallback = callback;
  callback({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  });
  return () => {}; // unsubscribe
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (...args: any[]) => mockAddEventListener(...args),
  refresh: (...args: any[]) => mockRefresh(...args),
}));

import { OfflineIndicator, useNetworkStatus } from '../../components/OfflineIndicator';

let callCount = 0;

function resetNetInfoMock() {
  mockNetInfoCallback = null;
  callCount = 0;
  mockRefresh.mockReset();
  mockAddEventListener.mockReset();
  mockAddEventListener.mockImplementation((callback: any) => {
    callCount++;
    mockNetInfoCallback = callback;
    // Only send initial online state on first subscription
    // (re-subscriptions from dependency changes should not reset state)
    if (callCount === 1) {
      callback({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });
    }
    return () => {}; // unsubscribe
  });
}

describe('OfflineIndicator', () => {
  beforeEach(() => {
    resetNetInfoMock();
  });

  it('renders nothing when online (no banner content)', () => {
    const { toJSON } = render(<OfflineIndicator />);
    // When online with no recovery, getBannerContent returns null → component returns null
    expect(toJSON()).toBeNull();
  });

  it('shows offline message when disconnected', async () => {
    const { getByText } = render(<OfflineIndicator />);

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

  it('shows retry button when offline and onRetry provided', async () => {
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
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  it('calls onRetry and refreshes when retry button is pressed', async () => {
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
      fireEvent.press(retryButton);
    });

    expect(mockRefresh).toHaveBeenCalled();
    expect(onRetry).toHaveBeenCalled();
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
  beforeEach(() => {
    resetNetInfoMock();
  });

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
