/**
 * Image Utilities (Phase 7: Screenshot Analysis)
 *
 * Features:
 * - 7.1.4: Image cropping
 * - 7.1.5: Image compression
 * - 7.1.6: Handle large images
 * - 7.2.5: Optimize image size for API
 * - 7.2.6: Image quality settings
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { getInfoAsync, type FileInfo } from 'expo-file-system';

// ==========================================
// Types
// ==========================================

export interface ImageSize {
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export interface ProcessedImage {
  uri: string;
  base64: string;
  width: number;
  height: number;
  fileSize: number;
  format: 'jpeg' | 'png';
}

export interface CropRegion {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

// ==========================================
// Constants
// ==========================================

// 7.2.5: Optimal sizes for GPT-4 Vision
export const VISION_API_LIMITS = {
  // GPT-4 Vision processes images at different detail levels
  // High detail: 768x768 tiles
  // Low detail: 512x512
  maxWidth: 2048,
  maxHeight: 2048,
  recommendedWidth: 1024,
  recommendedHeight: 1024,
  // Max file size in bytes (20MB for OpenAI)
  maxFileSize: 20 * 1024 * 1024,
  // Recommended max for faster uploads
  recommendedMaxSize: 5 * 1024 * 1024,
};

// 7.2.6: Quality presets
export const QUALITY_PRESETS = {
  low: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.6,
    description: 'Fast, lower quality',
  },
  medium: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    description: 'Balanced quality and speed',
  },
  high: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.95,
    description: 'Best quality, slower',
  },
};

export type QualityPreset = keyof typeof QUALITY_PRESETS;

// ==========================================
// 7.1.5 & 7.2.5: Image Compression
// ==========================================

/**
 * Compress an image to optimal size for Vision API
 */
export async function compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = VISION_API_LIMITS.recommendedWidth,
    maxHeight = VISION_API_LIMITS.recommendedHeight,
    quality = 0.8,
    format = 'jpeg',
  } = options;

  // Apply manipulations
  const actions: ImageManipulator.Action[] = [];

  // Resize if needed
  actions.push({
    resize: {
      width: maxWidth,
      height: maxHeight,
    },
  });

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  // Get compressed file size
  const compressedInfo = (await getInfoAsync(result.uri)) as FileInfo & { size?: number };
  const fileSize = compressedInfo.size || 0;

  return {
    uri: result.uri,
    base64: result.base64 || '',
    width: result.width,
    height: result.height,
    fileSize,
    format,
  };
}

/**
 * 7.1.6: Handle large images - compress iteratively until under size limit
 */
export async function handleLargeImage(
  uri: string,
  maxSizeBytes: number = VISION_API_LIMITS.recommendedMaxSize
): Promise<ProcessedImage> {
  let quality = 0.9;
  let maxDimension = VISION_API_LIMITS.recommendedWidth;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const compressed = await compressImage(uri, {
      maxWidth: maxDimension,
      maxHeight: maxDimension,
      quality,
      format: 'jpeg',
    });

    if (compressed.fileSize <= maxSizeBytes) {
      return compressed;
    }

    // Reduce quality and dimensions for next attempt
    quality = Math.max(0.3, quality - 0.15);
    maxDimension = Math.max(512, maxDimension - 256);
    attempts++;
  }

  // Final attempt with minimum settings
  return compressImage(uri, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.5,
    format: 'jpeg',
  });
}

// ==========================================
// 7.1.4: Image Cropping
// ==========================================

/**
 * Crop an image to specified region
 */
export async function cropImage(
  uri: string,
  cropRegion: CropRegion,
  options: Omit<CompressionOptions, 'maxWidth' | 'maxHeight'> = {}
): Promise<ProcessedImage> {
  const { quality = 0.9, format = 'jpeg' } = options;

  const result = await ImageManipulator.manipulateAsync(uri, [{ crop: cropRegion }], {
    compress: quality,
    format: format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  const fileInfo = (await getInfoAsync(result.uri)) as FileInfo & { size?: number };
  const fileSize = fileInfo.size || 0;

  return {
    uri: result.uri,
    base64: result.base64 || '',
    width: result.width,
    height: result.height,
    fileSize,
    format,
  };
}

/**
 * Auto-crop to remove black bars (letterboxing)
 */
export async function autoCrop(uri: string, _threshold: number = 20): Promise<ProcessedImage> {
  // This is a placeholder - full implementation would need
  // pixel analysis which isn't available in Expo without
  // additional native modules

  // For now, just return the optimized image
  return compressImage(uri);
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Get image dimensions from URI
 */
export async function getImageDimensions(uri: string): Promise<ImageSize | null> {
  return new Promise((resolve) => {
    const Image = require('react-native').Image;
    Image.getSize(
      uri,
      (width: number, height: number) => resolve({ width, height }),
      () => resolve(null)
    );
  });
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Calculate dimensions that fit within max while maintaining aspect ratio
 */
export function calculateFitDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageSize {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down to fit maxWidth
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  // Scale down to fit maxHeight
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Convert file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if image is too large for Vision API
 */
export function isImageTooLarge(width: number, height: number, fileSize?: number): boolean {
  const dimensionsTooLarge =
    width > VISION_API_LIMITS.maxWidth || height > VISION_API_LIMITS.maxHeight;

  const sizeTooLarge = fileSize ? fileSize > VISION_API_LIMITS.maxFileSize : false;

  return dimensionsTooLarge || sizeTooLarge;
}

/**
 * Optimize image for Vision API based on quality preset
 */
export async function optimizeForVisionAPI(
  uri: string,
  preset: QualityPreset = 'medium'
): Promise<ProcessedImage> {
  return handleLargeImage(
    uri,
    preset === 'high' ? VISION_API_LIMITS.maxFileSize : VISION_API_LIMITS.recommendedMaxSize
  );
}

/**
 * Convert base64 to data URI for API calls
 */
export function toDataUri(base64: string, format: 'jpeg' | 'png' = 'jpeg'): string {
  if (base64.startsWith('data:')) {
    return base64;
  }
  return `data:image/${format};base64,${base64}`;
}

/**
 * Extract base64 from data URI
 */
export function fromDataUri(dataUri: string): string {
  if (!dataUri.startsWith('data:')) {
    return dataUri;
  }
  const parts = dataUri.split(',');
  return parts[1] || dataUri;
}

export default {
  compressImage,
  handleLargeImage,
  cropImage,
  autoCrop,
  getImageDimensions,
  calculateAspectRatio,
  calculateFitDimensions,
  formatFileSize,
  isImageTooLarge,
  optimizeForVisionAPI,
  toDataUri,
  fromDataUri,
  VISION_API_LIMITS,
  QUALITY_PRESETS,
};
