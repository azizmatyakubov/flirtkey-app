/**
 * GifSuggestion Component
 * Phase 2, Task 3: Shows suggested GIFs alongside text suggestions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import type { GifResult } from '../services/gifService';
import { darkColors, spacing, borderRadius, fontSizes } from '../constants/theme';

interface GifSuggestionProps {
  gifs: GifResult[];
  loading?: boolean;
  onRefresh?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GIF_SIZE = Math.min(140, (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 2.5);

export const GifSuggestion = React.memo(function GifSuggestion({ gifs, loading = false, onRefresh }: GifSuggestionProps) {
  const [previewGif, setPreviewGif] = useState<GifResult | null>(null);

  const handleCopyLink = async (gif: GifResult) => {
    await Clipboard.setStringAsync(gif.url);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'GIF link copied to clipboard');
  };

  const handlePreview = async (gif: GifResult) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGif(gif);
  };

  if (loading) {
    return (
      <Animated.View entering={FadeIn} style={styles.container}>
        <Text style={styles.sectionTitle}>Or send a GIF 🎬</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={darkColors.primary} size="small" />
          <Text style={styles.loadingText}>Finding the perfect GIF...</Text>
        </View>
      </Animated.View>
    );
  }

  if (gifs.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Or send a GIF 🎬</Text>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {gifs.map((gif, index) => (
          <Animated.View
            key={gif.id}
            entering={SlideInRight.delay(index * 100)}
          >
            <TouchableOpacity
              style={styles.gifCard}
              onPress={() => handlePreview(gif)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: gif.previewUrl }}
                style={styles.gifImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyLink(gif)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.copyButtonText}>📋 Copy</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Full-size Preview Modal */}
      <Modal
        visible={!!previewGif}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewGif(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreviewGif(null)}
        >
          <View style={styles.modalContent}>
            {previewGif && (
              <>
                <Image
                  source={{ uri: previewGif.url }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      handleCopyLink(previewGif);
                      setPreviewGif(null);
                    }}
                  >
                    <Text style={styles.modalButtonText}>📋 Copy GIF Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCloseButton]}
                    onPress={() => setPreviewGif(null)}
                  >
                    <Text style={styles.modalButtonText}>✕ Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  refreshButton: {
    padding: spacing.xs,
  },
  refreshText: {
    fontSize: 18,
  },
  scrollContent: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  gifCard: {
    width: GIF_SIZE,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  gifImage: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    backgroundColor: darkColors.surface,
  },
  copyButton: {
    backgroundColor: darkColors.primary + '90',
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  loadingText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.9,
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: borderRadius.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  modalCloseButton: {
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default GifSuggestion;
