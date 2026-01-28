/**
 * ImagePreview Component (7.1.7)
 *
 * Full-featured image preview with:
 * - 7.1.7: Image preview
 * - 7.1.8: Image zoom (pinch to zoom)
 * - Action buttons (retake, crop, etc.)
 * - Image info display
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';
import { formatFileSize } from '../utils/imageUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_SCALE = 5;
const MIN_SCALE = 0.5;

// ==========================================
// Types
// ==========================================

export interface ImagePreviewProps {
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
  isCompressed?: boolean;
  onRetake?: () => void;
  onRemove?: () => void;
  onCrop?: () => void;
  onAnalyze?: () => void;
  showInfo?: boolean;
  showActions?: boolean;
  loading?: boolean;
  containerStyle?: object;
}

// ==========================================
// ImageZoom Component (7.1.8)
// ==========================================

interface ImageZoomProps {
  uri: string;
  onClose: () => void;
}

function ImageZoom({ uri, onClose }: ImageZoomProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  // Pan gesture for moving
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        scale.value = withSpring(2.5);
      }
    });

  // Single tap to close
  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (scale.value === 1) {
        runOnJS(handleClose)();
      }
    });

  const composedGesture = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, panGesture),
    doubleTapGesture,
    singleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.zoomContainer}>
        <View style={styles.zoomBackground}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Zoom hint */}
          <Text style={styles.zoomHint}>Pinch to zoom • Double-tap to zoom • Tap to close</Text>

          {/* Zoomable image */}
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.zoomImageContainer, animatedStyle]}>
              <Image source={{ uri }} style={styles.zoomImage} resizeMode="contain" />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ==========================================
// ImagePreview Component (7.1.7)
// ==========================================

export function ImagePreview({
  uri,
  width,
  height,
  fileSize,
  isCompressed,
  onRetake,
  onRemove,
  onCrop,
  onAnalyze,
  showInfo = true,
  showActions = true,
  loading = false,
  containerStyle,
}: ImagePreviewProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const aspectRatio = width && height ? width / height : 1;
  const displayWidth = Math.min(SCREEN_WIDTH - spacing.lg * 2, 400);
  const displayHeight = displayWidth / aspectRatio;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Image Container */}
      <TouchableOpacity
        style={[
          styles.imageContainer,
          { width: displayWidth, height: Math.min(displayHeight, 400) },
        ]}
        onPress={() => setIsZoomOpen(true)}
        activeOpacity={0.9}
        disabled={loading}
      >
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
        />

        {/* Loading overlay */}
        {(loading || imageLoading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={darkColors.primary} />
            <Text style={styles.loadingText}>{loading ? 'Processing...' : 'Loading...'}</Text>
          </View>
        )}

        {/* Tap to zoom hint */}
        {!loading && !imageLoading && (
          <View style={styles.zoomHintBadge}>
            <Text style={styles.zoomHintBadgeText}>🔍 Tap to zoom</Text>
          </View>
        )}

        {/* Compressed badge */}
        {isCompressed && (
          <View style={styles.compressedBadge}>
            <Text style={styles.compressedBadgeText}>Optimized</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Image Info */}
      {showInfo && (
        <View style={styles.infoContainer}>
          {width && height && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={styles.infoValue}>
                {width} × {height}
              </Text>
            </View>
          )}
          {fileSize && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>File</Text>
              <Text style={styles.infoValue}>{formatFileSize(fileSize)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {showActions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionsScroll}
          contentContainerStyle={styles.actionsContainer}
        >
          {onAnalyze && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={onAnalyze}
              disabled={loading}
            >
              <Text style={styles.primaryActionText}>✨ Analyze</Text>
            </TouchableOpacity>
          )}

          {onRetake && (
            <TouchableOpacity style={styles.actionButton} onPress={onRetake} disabled={loading}>
              <Text style={styles.actionButtonText}>📷 Retake</Text>
            </TouchableOpacity>
          )}

          {onCrop && (
            <TouchableOpacity style={styles.actionButton} onPress={onCrop} disabled={loading}>
              <Text style={styles.actionButtonText}>✂️ Crop</Text>
            </TouchableOpacity>
          )}

          {onRemove && (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeAction]}
              onPress={onRemove}
              disabled={loading}
            >
              <Text style={styles.removeActionText}>🗑️ Remove</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Zoom Modal */}
      {isZoomOpen && <ImageZoom uri={uri} onClose={() => setIsZoomOpen(false)} />}
    </View>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  zoomHintBadgeText: {
    color: darkColors.text,
    fontSize: fontSizes.xs,
  },
  compressedBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: darkColors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  compressedBadgeText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
  },
  infoValue: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  actionsScroll: {
    marginTop: spacing.md,
    maxHeight: 50,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  actionButtonText: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  primaryAction: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  removeAction: {
    borderColor: darkColors.error,
  },
  removeActionText: {
    color: darkColors.error,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },

  // Zoom styles
  zoomContainer: {
    flex: 1,
  },
  zoomBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  zoomImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
});

export default ImagePreview;
