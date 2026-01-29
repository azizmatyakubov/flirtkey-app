import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { darkColors, fontSizes, spacing, borderRadius } from '../constants/theme';

// ==========================================
// Types
// ==========================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ==========================================
// Component
// ==========================================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to external service in production
    if (__DEV__) console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional onError callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleRestart = (): void => {
    // Reload the app by resetting the error state
    // In production, you could use expo-updates.reloadAsync() here
    this.handleRetry();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😅</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              Don't worry, your data is safe. We've logged this issue and are working on fixing it.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
                )}
              </ScrollView>
            )}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleRestart}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Restart App</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// Screen Error Boundary (with navigation reset)
// ==========================================

interface ScreenErrorBoundaryProps extends Props {
  screenName?: string;
}

export class ScreenErrorBoundary extends Component<ScreenErrorBoundaryProps, State> {
  constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    if (__DEV__) console.error(`Error in ${this.props.screenName || 'Screen'}:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.screenErrorContainer}>
          <Text style={styles.screenErrorEmoji}>🔧</Text>
          <Text style={styles.screenErrorTitle}>This screen encountered an issue</Text>
          <Text style={styles.screenErrorMessage}>
            {this.props.screenName
              ? `There was a problem loading ${this.props.screenName}.`
              : 'There was a problem loading this screen.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    color: darkColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorContainer: {
    maxHeight: 200,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.sm,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    color: darkColors.error,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: darkColors.error,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  stackText: {
    color: darkColors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: darkColors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  secondaryButtonText: {
    color: darkColors.textSecondary,
  },
  screenErrorContainer: {
    flex: 1,
    backgroundColor: darkColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  screenErrorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  screenErrorTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: darkColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  screenErrorMessage: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: darkColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});
