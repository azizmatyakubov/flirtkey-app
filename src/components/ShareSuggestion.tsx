// 6.2.15 Share suggestion
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Suggestion } from '../types';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

export async function shareSuggestion(suggestion: Suggestion, girlName?: string): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const suggestionType = suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1);

  // Format the share text
  const shareText = girlName
    ? `💘 FlirtKey Suggestion for ${girlName}\n\n${suggestionType} Reply:\n"${suggestion.text}"\n\n💡 ${suggestion.reason}\n\n- Generated with FlirtKey`
    : `💘 FlirtKey Suggestion\n\n${suggestionType} Reply:\n"${suggestion.text}"\n\n💡 ${suggestion.reason}\n\n- Generated with FlirtKey`;

  try {
    const isAvailable = await Sharing.isAvailableAsync();

    if (isAvailable) {
      // On iOS/Android, use native share sheet
      // Note: Sharing.shareAsync requires a file, so we'll use a workaround
      // We'll create a temporary approach using the clipboard + alert for now
      await Clipboard.setStringAsync(shareText);

      Alert.alert(
        'Share Suggestion',
        'The suggestion has been copied. You can now paste and share it!',
        [{ text: 'OK' }]
      );
    } else {
      // Fallback: just copy to clipboard
      await Clipboard.setStringAsync(shareText);
      Alert.alert('Copied!', 'Suggestion copied to clipboard. You can now paste it anywhere.');
    }
  } catch (error) {
    console.error('Error sharing:', error);
    // Fallback to clipboard
    await Clipboard.setStringAsync(shareText);
    Alert.alert('Copied!', 'Suggestion copied to clipboard.');
  }
}

// Share button component
interface ShareButtonProps {
  suggestion: Suggestion;
  girlName?: string;
  compact?: boolean;
}

export function ShareButton({ suggestion, girlName, compact = false }: ShareButtonProps) {
  const handleShare = () => shareSuggestion(suggestion, girlName);

  if (compact) {
    return (
      <TouchableOpacity onPress={handleShare} style={styles.compactButton}>
        <Ionicons name="share-outline" size={18} color={darkColors.text} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handleShare} style={styles.button}>
      <Ionicons name="share-outline" size={18} color={darkColors.text} />
      <Text style={styles.buttonText}>Share</Text>
    </TouchableOpacity>
  );
}

// Share menu with multiple options
interface ShareMenuProps {
  visible: boolean;
  suggestion: Suggestion;
  girlName?: string;
  onClose: () => void;
}

export function ShareMenu({ visible, suggestion, girlName, onClose }: ShareMenuProps) {
  if (!visible) return null;

  const handleCopyText = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(suggestion.text);
    Alert.alert('Copied!', 'Message text copied to clipboard.');
    onClose();
  };

  const handleCopyWithReason = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `"${suggestion.text}"\n\n💡 ${suggestion.reason}`;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Message with reasoning copied to clipboard.');
    onClose();
  };

  const handleShare = async () => {
    await shareSuggestion(suggestion, girlName);
    onClose();
  };

  return (
    <View style={styles.menuOverlay}>
      <TouchableOpacity style={styles.menuBackdrop} onPress={onClose} />
      <View style={styles.menu}>
        <Text style={styles.menuTitle}>Share Options</Text>

        <TouchableOpacity onPress={handleCopyText} style={styles.menuItem}>
          <Ionicons name="copy-outline" size={20} color={darkColors.text} style={{ marginRight: spacing.md }} />
          <Text style={styles.menuText}>Copy message only</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCopyWithReason} style={styles.menuItem}>
          <Ionicons name="bulb-outline" size={20} color={darkColors.text} style={{ marginRight: spacing.md }} />
          <Text style={styles.menuText}>Copy with reasoning</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.menuItem}>
          <Ionicons name="share-outline" size={20} color={darkColors.text} style={{ marginRight: spacing.md }} />
          <Text style={styles.menuText}>Share formatted</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    gap: spacing.xs,
  },
  compactButton: {
    padding: spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  buttonText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
  },
  // Menu styles
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menu: {
    backgroundColor: darkColors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  menuTitle: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
  },
});
