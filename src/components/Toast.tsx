/**
 * Toast/Snackbar Component (4.4.11)
 * Temporary notification messages
 */

import React, { useEffect, useRef, createContext, useContext, useState, useCallback } from 'react';
import { Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastState extends ToastConfig {
  id: string;
  visible: boolean;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const TYPE_CONFIG: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: darkColors.success, icon: '✓' },
  error: { bg: darkColors.error, icon: '✕' },
  warning: { bg: darkColors.warning, icon: '⚠' },
  info: { bg: darkColors.primary, icon: 'ℹ' },
};

interface ToastComponentProps {
  toast: ToastState;
  onHide: () => void;
}

function ToastComponent({ toast, onHide }: ToastComponentProps) {
  const translateY = useRef(new Animated.Value(toast.position === 'bottom' ? 100 : -100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const config = TYPE_CONFIG[toast.type || 'info'];

  useEffect(() => {
    // Show animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide
    const timeoutId = setTimeout(() => {
      hideWithAnimation();
    }, toast.duration || 3000);
    timeoutRef.current = timeoutId;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hideWithAnimation = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: toast.position === 'bottom' ? 100 : -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const handleAction = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    toast.action?.onPress();
    hideWithAnimation();
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        toast.position === 'bottom' ? styles.toastBottom : styles.toastTop,
        { backgroundColor: config.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
      {toast.action && (
        <TouchableOpacity onPress={handleAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{toast.action.label}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={hideWithAnimation} style={styles.closeButton}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((config: ToastConfig) => {
    setToast({
      ...config,
      id: Date.now().toString(),
      visible: true,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && toast.visible && <ToastComponent toast={toast} onHide={hideToast} />}
    </ToastContext.Provider>
  );
}

// Standalone toast function for non-context usage
let globalShowToast: ((config: ToastConfig) => void) | null = null;

export function setGlobalToastHandler(handler: (config: ToastConfig) => void) {
  globalShowToast = handler;
}

export function toast(config: ToastConfig) {
  if (globalShowToast) {
    globalShowToast(config);
  } else {
    console.warn('Toast provider not initialized');
  }
}

// Convenience functions
toast.success = (message: string, options?: Partial<ToastConfig>) => {
  toast({ ...options, message, type: 'success' });
};

toast.error = (message: string, options?: Partial<ToastConfig>) => {
  toast({ ...options, message, type: 'error' });
};

toast.warning = (message: string, options?: Partial<ToastConfig>) => {
  toast({ ...options, message, type: 'warning' });
};

toast.info = (message: string, options?: Partial<ToastConfig>) => {
  toast({ ...options, message, type: 'info' });
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    maxWidth: SCREEN_WIDTH - spacing.md * 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastTop: {
    top: 60,
  },
  toastBottom: {
    bottom: 40,
  },
  icon: {
    color: '#ffffff',
    fontSize: fontSizes.md,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontSize: fontSizes.sm,
  },
  actionButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    color: '#ffffff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  closeButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  closeIcon: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fontSizes.sm,
  },
});

export default ToastProvider;
