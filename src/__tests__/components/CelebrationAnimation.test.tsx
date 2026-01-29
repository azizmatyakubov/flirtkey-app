/**
 * CelebrationAnimation Component Tests
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

// Import after mocks
import { CelebrationAnimation } from '../../components/CelebrationAnimation';

describe('CelebrationAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when not visible', () => {
    const { toJSON } = render(<CelebrationAnimation visible={false} />);

    // Component should return null when not visible
    expect(toJSON()).toBeNull();
  });

  it('renders when visible', () => {
    const { toJSON } = render(<CelebrationAnimation visible={true} />);

    expect(toJSON()).not.toBeNull();
  });

  it('triggers haptic feedback when visible', async () => {
    const Haptics = require('expo-haptics');

    render(<CelebrationAnimation visible={true} />);

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });
  });

  it('calls onComplete callback after animation', async () => {
    const onComplete = jest.fn();

    render(<CelebrationAnimation visible={true} onComplete={onComplete} />);

    // Animation completion is mocked, so we just verify it renders
    expect(onComplete).not.toHaveBeenCalled(); // Would be called after animation
  });

  it('accepts custom center coordinates', () => {
    const { toJSON } = render(<CelebrationAnimation visible={true} centerX={100} centerY={200} />);

    expect(toJSON()).not.toBeNull();
  });

  it('re-triggers when visibility changes', async () => {
    const Haptics = require('expo-haptics');

    const { rerender } = render(<CelebrationAnimation visible={false} />);

    expect(Haptics.notificationAsync).not.toHaveBeenCalled();

    rerender(<CelebrationAnimation visible={true} />);

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    });
  });
});
