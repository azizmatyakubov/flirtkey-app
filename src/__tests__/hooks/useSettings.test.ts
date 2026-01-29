/**
 * useSettings Hook Tests
 * Phase 9.1.8: Test custom hooks
 */

import { renderHook, act } from '@testing-library/react-native';
import { useSettings } from '../../hooks/useSettings';
import { useStore } from '../../stores/useStore';

// Mock secure storage
jest.mock('../../services/storage', () => ({
  saveApiKeySecure: jest.fn(() => Promise.resolve()),
  deleteApiKeySecure: jest.fn(() => Promise.resolve()),
  getApiKeySecure: jest.fn(() => Promise.resolve('')),
}));

describe('useSettings', () => {
  beforeEach(() => {
    useStore.getState().clearAllData();
  });

  it('returns current settings', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.apiKey).toBe('');
    expect(result.current.userCulture).toBe('universal');
    expect(result.current.hasApiKey).toBe(false);
  });

  it('updates API key', async () => {
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.setApiKey('sk-test-key');
    });

    expect(result.current.apiKey).toBe('sk-test-key');
    expect(result.current.hasApiKey).toBe(true);
  });

  it('updates user culture', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setUserCulture('russian');
    });

    expect(result.current.userCulture).toBe('russian');
  });

  it('clears all data', async () => {
    const { result } = renderHook(() => useSettings());

    // Set some data
    await act(async () => {
      await result.current.setApiKey('sk-test');
      result.current.setUserCulture('western');
    });

    act(() => {
      result.current.clearAllData();
    });

    expect(result.current.apiKey).toBe('');
    expect(result.current.userCulture).toBe('universal');
  });

  it('reflects store changes', () => {
    const { result } = renderHook(() => useSettings());

    // Update store directly
    act(() => {
      useStore.getState().setApiKey('direct-update');
    });

    expect(result.current.apiKey).toBe('direct-update');
  });

  it('sets user', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setUser({
        id: 1,
        name: 'Test User',
        culture: 'western',
        language: 'en',
      });
    });

    expect(result.current.user?.name).toBe('Test User');
  });

  it('clears API key', async () => {
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.setApiKey('sk-to-clear');
    });

    expect(result.current.hasApiKey).toBe(true);

    await act(async () => {
      await result.current.clearApiKey();
    });

    expect(result.current.hasApiKey).toBe(false);
    expect(result.current.apiKey).toBe('');
  });
});
