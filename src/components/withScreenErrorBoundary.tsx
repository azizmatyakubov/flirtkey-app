/**
 * withScreenErrorBoundary — HOC that wraps a screen component with ScreenErrorBoundary
 *
 * Usage:
 *   export default withScreenErrorBoundary(MyScreen, 'MyScreen');
 */

import React from 'react';
import { ScreenErrorBoundary } from './ErrorBoundary';

export function withScreenErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName: string
): React.FC<P> {
  const WithBoundary: React.FC<P> = (props) => (
    <ScreenErrorBoundary screenName={screenName}>
      <WrappedComponent {...props} />
    </ScreenErrorBoundary>
  );

  WithBoundary.displayName = `withScreenErrorBoundary(${screenName})`;
  return WithBoundary;
}
