/**
 * ConfirmDialog Component (4.4.10)
 * Confirmation dialog with customizable actions
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { Button, ButtonVariant } from './Button';
import { darkColors, spacing, fontSizes } from '../constants/theme';

export interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonVariant;
  isLoading?: boolean;
  icon?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  icon,
  destructive = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // Use danger variant if destructive is true
  const actualVariant = destructive ? 'danger' : confirmVariant;

  return (
    <Modal
      visible={visible}
      onClose={handleCancel}
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
    >
      <View style={styles.container}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        {!icon && destructive && (
          <Ionicons name="warning" size={48} color={darkColors.error} style={{ marginBottom: spacing.md }} />
        )}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          <Button
            title={cancelText}
            onPress={handleCancel}
            variant="secondary"
            disabled={isLoading}
            style={styles.button}
          />
          <Button
            title={confirmText}
            onPress={handleConfirm}
            variant={actualVariant}
            loading={isLoading}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

// Convenience functions for common dialogs
export interface DeleteDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading?: boolean;
}

export function DeleteDialog({
  visible,
  onClose,
  onConfirm,
  itemName,
  isLoading,
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemName}?`}
      message="This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      confirmVariant="danger"
      isLoading={isLoading}
      icon="⚠️"
    />
  );
}

export interface UnsavedChangesDialogProps {
  visible: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave?: () => void;
}

export function UnsavedChangesDialog({
  visible,
  onClose,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) {
  return (
    <Modal visible={visible} onClose={onClose} showCloseButton={false}>
      <View style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Unsaved Changes</Text>
        <Text style={styles.message}>You have unsaved changes. What would you like to do?</Text>

        <View style={styles.actionsVertical}>
          {onSave && (
            <Button
              title="Save Changes"
              onPress={() => {
                onSave();
                onClose();
              }}
              variant="primary"
              fullWidth
            />
          )}
          <Button
            title="Discard Changes"
            onPress={() => {
              onDiscard();
              onClose();
            }}
            variant="danger"
            fullWidth
          />
          <Button title="Keep Editing" onPress={onClose} variant="ghost" fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  actionsVertical: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});

export default ConfirmDialog;
