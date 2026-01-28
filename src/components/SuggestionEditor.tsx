// 6.2.12 Suggestion editing before copy
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Suggestion } from '../types';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

const SUGGESTION_COLORS = {
  safe: { bg: '#22c55e20', border: '#22c55e', emoji: '🟢' },
  balanced: { bg: '#f59e0b20', border: '#f59e0b', emoji: '🟡' },
  bold: { bg: '#ef444420', border: '#ef4444', emoji: '🔴' },
};

interface SuggestionEditorProps {
  visible: boolean;
  suggestion: Suggestion | null;
  onClose: () => void;
  onSave: (editedText: string) => void;
}

export function SuggestionEditor({ visible, suggestion, onClose, onSave }: SuggestionEditorProps) {
  const [editedText, setEditedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (suggestion) {
      setEditedText(suggestion.text);
      setOriginalText(suggestion.text);
    }
  }, [suggestion]);

  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  if (!suggestion) return null;

  const colors = SUGGESTION_COLORS[suggestion.type];
  const hasChanges = editedText !== originalText;

  const handleCopyAndClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(editedText);
    Alert.alert('Copied! 📋', 'Your edited message is ready to paste');
    onSave(editedText);
    onClose();
  };

  const handleReset = () => {
    Haptics.selectionAsync();
    setEditedText(originalText);
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert('Discard changes?', 'You have unsaved edits. Are you sure you want to close?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          entering={SlideInUp.springify()}
          style={[styles.container, { borderColor: colors.border }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.emoji}>{colors.emoji}</Text>
              <Text style={[styles.title, { color: colors.border }]}>
                Edit {suggestion.type.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Original text hint */}
          <Text style={styles.hint}>Edit your message before copying:</Text>

          {/* Editor */}
          <View style={styles.editorContainer}>
            <TextInput
              ref={inputRef}
              style={styles.editor}
              value={editedText}
              onChangeText={setEditedText}
              multiline
              placeholder="Type your message..."
              placeholderTextColor={darkColors.textSecondary}
              autoFocus
              textAlignVertical="top"
            />

            {/* Character count */}
            <Text style={styles.charCount}>{editedText.length} characters</Text>
          </View>

          {/* Original for reference */}
          {hasChanges && (
            <Animated.View entering={FadeIn} style={styles.originalContainer}>
              <Text style={styles.originalLabel}>Original:</Text>
              <Text style={styles.originalText} numberOfLines={2}>
                {originalText}
              </Text>
            </Animated.View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {hasChanges && (
              <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                <Text style={styles.resetText}>↩️ Reset</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleCopyAndClose}
              style={[styles.copyButton, { backgroundColor: colors.border }]}
            >
              <Text style={styles.copyText}>📋 {hasChanges ? 'Copy Edited' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: darkColors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: fontSizes.lg,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.lg,
  },
  hint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  editorContainer: {
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    marginBottom: spacing.md,
  },
  editor: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  originalContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  originalLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
  },
  originalText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  resetButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  resetText: {
    color: darkColors.text,
    fontSize: fontSizes.md,
  },
  copyButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  copyText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});
