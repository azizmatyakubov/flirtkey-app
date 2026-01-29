/**
 * useClipboard Hook (2.4.5)
 * Clipboard operations with feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';

interface UseClipboardResult {
  // State
  copiedText: string;
  hasCopied: boolean;
  isPasting: boolean;

  // Actions
  copy: (text: string) => Promise<boolean>;
  paste: () => Promise<string>;
  clear: () => void;

  // For showing copy feedback
  showCopyFeedback: boolean;
}

const FEEDBACK_DURATION = 2000; // 2 seconds

export const useClipboard = (): UseClipboardResult => {
  const [copiedText, setCopiedText] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedText(text);
      setHasCopied(true);
      setShowCopyFeedback(true);

      // Clear feedback after duration
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowCopyFeedback(false);
      }, FEEDBACK_DURATION);

      return true;
    } catch (error) {
      if (__DEV__) console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const paste = useCallback(async (): Promise<string> => {
    setIsPasting(true);
    try {
      const text = await Clipboard.getStringAsync();
      return text || '';
    } catch (error) {
      if (__DEV__) console.error('Failed to paste from clipboard:', error);
      return '';
    } finally {
      setIsPasting(false);
    }
  }, []);

  const clear = useCallback(() => {
    setCopiedText('');
    setHasCopied(false);
    setShowCopyFeedback(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    copiedText,
    hasCopied,
    isPasting,
    copy,
    paste,
    clear,
    showCopyFeedback,
  };
};

export default useClipboard;
