/**
 * Modal Component (4.4.9)
 * Reusable modal with overlay and animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ModalPosition = 'center' | 'bottom';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  position?: ModalPosition;
  contentStyle?: ViewStyle;
  fullHeight?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  position = 'center',
  contentStyle,
  fullHeight = false,
}: ModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(
    new Animated.Value(position === 'bottom' ? SCREEN_HEIGHT : 0)
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === 'bottom' ? SCREEN_HEIGHT : 50,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, position]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback
          onPress={closeOnBackdrop ? onClose : undefined}
        >
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.container,
            position === 'bottom' && styles.containerBottom,
          ]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.content,
              position === 'bottom' && styles.contentBottom,
              fullHeight && styles.fullHeight,
              { transform: [{ translateY: slideAnim }] },
              contentStyle,
            ]}
          >
            {(title || showCloseButton) && (
              <View style={styles.header}>
                <Text style={styles.title}>{title || ''}</Text>
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close modal"
                  >
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.body}>{children}</View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  containerBottom: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  content: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  contentBottom: {
    maxWidth: '100%',
    maxHeight: '90%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: borderRadius.lg * 2,
    borderTopRightRadius: borderRadius.lg * 2,
  },
  fullHeight: {
    maxHeight: '95%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  title: {
    color: darkColors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.lg,
  },
  body: {
    padding: spacing.md,
  },
});

export default Modal;
