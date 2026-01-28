// 6.1.11 Paste detection with prompt
import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeOut, SlideInUp } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

interface PasteDetectorProps {
  currentValue?: string;
  onPasteDetected: (text: string) => void;
  show: boolean;
  onDismiss: () => void;
  clipboardContent: string | null;
}

export function PasteDetector({
  onPasteDetected,
  show,
  onDismiss,
  clipboardContent,
}: PasteDetectorProps) {
  if (!show || !clipboardContent) return null;

  const handlePaste = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPasteDetected(clipboardContent);
    onDismiss();
  };

  const truncatedContent =
    clipboardContent.length > 50 ? clipboardContent.substring(0, 50) + '...' : clipboardContent;

  return (
    <Animated.View entering={SlideInUp.springify()} exiting={FadeOut} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>📋 Paste detected</Text>
        <Text style={styles.preview}>"{truncatedContent}"</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
            <Text style={styles.pasteText}>Paste</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// Hook to detect clipboard changes
export function useClipboardDetection(isActive: boolean) {
  const [clipboardContent, setClipboardContent] = React.useState<string | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const lastClipboard = useRef<string>('');

  const checkClipboard = useCallback(async () => {
    if (!isActive) return;

    try {
      const hasString = await Clipboard.hasStringAsync();
      if (hasString) {
        const content = await Clipboard.getStringAsync();
        if (content && content !== lastClipboard.current && content.length > 0) {
          // Check if it looks like a message (not a URL, not just numbers, etc.)
          const looksLikeMessage =
            content.length > 5 &&
            content.length < 2000 &&
            !content.startsWith('http') &&
            !/^\d+$/.test(content);

          if (looksLikeMessage) {
            lastClipboard.current = content;
            setClipboardContent(content);
            setShowPrompt(true);
          }
        }
      }
    } catch (error) {
      // Clipboard access failed, silently ignore
    }
  }, [isActive]);

  useEffect(() => {
    // Check clipboard periodically when screen is active
    const interval = setInterval(checkClipboard, 2000);
    return () => clearInterval(interval);
  }, [checkClipboard]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    // Add the current content to "seen" so we don't prompt again
    if (clipboardContent) {
      lastClipboard.current = clipboardContent;
    }
  }, [clipboardContent]);

  const handlePaste = useCallback(
    (callback: (text: string) => void) => {
      if (clipboardContent) {
        callback(clipboardContent);
        setShowPrompt(false);
      }
    },
    [clipboardContent]
  );

  return {
    clipboardContent,
    showPrompt,
    dismissPrompt,
    handlePaste,
    checkClipboard,
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: spacing.md,
  },
  content: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  preview: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dismissText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  pasteButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  pasteText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});
