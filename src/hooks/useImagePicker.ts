/**
 * useImagePicker Hook (Enhanced for Phase 7)
 *
 * Features:
 * - 7.1.1: Image selection from library
 * - 7.1.2: Basic implementation
 * - 7.1.3: Camera capture option
 * - 7.1.4: Image cropping (via options)
 * - 7.1.5: Image compression
 * - 7.1.6: Handle large images
 * - 7.1.7: Image preview data
 * - 7.1.9: Handle permission errors
 * - 7.1.10: Multi-image selection
 */

import { useState, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';
import {
  compressImage,
  handleLargeImage,
  optimizeForVisionAPI,
  type QualityPreset,
  type ProcessedImage,
} from '../utils/imageUtils';

// ==========================================
// Types
// ==========================================

export interface ImageResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
  isCompressed?: boolean;
  originalUri?: string;
}

export interface UseImagePickerOptions {
  // Basic options
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;

  // Size limits
  maxWidth?: number;
  maxHeight?: number;
  maxFileSizeMB?: number;

  // Auto-processing
  autoCompress?: boolean;
  optimizeForVision?: boolean;
  visionQuality?: QualityPreset;

  // Multi-select
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
}

export interface UseImagePickerResult {
  // State
  image: ImageResult | null;
  images: ImageResult[];
  isLoading: boolean;
  error: string | null;
  processingProgress: number;

  // Actions
  pickFromLibrary: () => Promise<ImageResult | null>;
  pickMultiple: () => Promise<ImageResult[]>;
  takePhoto: () => Promise<ImageResult | null>;
  clear: () => void;
  clearAll: () => void;
  removeImage: (index: number) => void;

  // Processing
  compressCurrentImage: (quality?: number) => Promise<ImageResult | null>;
  optimizeForAPI: () => Promise<ImageResult | null>;

  // Permissions
  hasLibraryPermission: boolean | null;
  hasCameraPermission: boolean | null;
  requestLibraryPermission: () => Promise<boolean>;
  requestCameraPermission: () => Promise<boolean>;
  openSettings: () => void;
}

// ==========================================
// Default Options
// ==========================================

const defaultOptions: UseImagePickerOptions = {
  allowsEditing: true,
  quality: 0.8,
  base64: true,
  maxWidth: 1024,
  maxHeight: 1024,
  autoCompress: true,
  optimizeForVision: true,
  visionQuality: 'medium',
  allowsMultipleSelection: false,
  selectionLimit: 5,
};

// ==========================================
// Hook Implementation
// ==========================================

export const useImagePicker = (options: UseImagePickerOptions = {}): UseImagePickerResult => {
  const mergedOptions = { ...defaultOptions, ...options };

  // State
  const [image, setImage] = useState<ImageResult | null>(null);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [hasLibraryPermission, setHasLibraryPermission] = useState<boolean | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // ==========================================
  // 7.1.9: Permission Handling
  // ==========================================

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const showPermissionDeniedAlert = useCallback(
    (type: 'camera' | 'library') => {
      const title = type === 'camera' ? 'Camera Access Required' : 'Photo Library Access Required';
      const message =
        type === 'camera'
          ? 'To take photos, please allow camera access in your device settings.'
          : 'To select photos, please allow photo library access in your device settings.';

      Alert.alert(title, message, [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: openSettings },
      ]);
    },
    [openSettings]
  );

  const requestLibraryPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const granted = status === 'granted';
      setHasLibraryPermission(granted);

      if (!granted) {
        if (!canAskAgain) {
          // Permission permanently denied
          showPermissionDeniedAlert('library');
        }
        setError('Photo library permission denied');
      }

      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return false;
    }
  }, [showPermissionDeniedAlert]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      setHasCameraPermission(granted);

      if (!granted) {
        if (!canAskAgain) {
          // Permission permanently denied
          showPermissionDeniedAlert('camera');
        }
        setError('Camera permission denied');
      }

      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return false;
    }
  }, [showPermissionDeniedAlert]);

  // ==========================================
  // Image Processing
  // ==========================================

  const processImage = useCallback(
    async (
      asset: ImagePicker.ImagePickerAsset,
      _index: number = 0,
      _total: number = 1
    ): Promise<ImageResult | null> => {
      try {
        const originalUri = asset.uri;
        let processedUri = asset.uri;
        let base64 = asset.base64;
        let width = asset.width;
        let height = asset.height;
        let fileSize = asset.fileSize;
        let isCompressed = false;

        // 7.1.5 & 7.1.6: Auto-compress if enabled or image is too large
        if (mergedOptions.autoCompress || mergedOptions.optimizeForVision) {
          setProcessingProgress(0.3);

          let processed: ProcessedImage;

          if (mergedOptions.optimizeForVision) {
            // 7.2.5: Optimize specifically for Vision API
            processed = await optimizeForVisionAPI(originalUri, mergedOptions.visionQuality);
          } else {
            // 7.1.6: Handle large images
            const maxSize = (mergedOptions.maxFileSizeMB || 5) * 1024 * 1024;
            processed = await handleLargeImage(originalUri, maxSize);
          }

          processedUri = processed.uri;
          base64 = processed.base64;
          width = processed.width;
          height = processed.height;
          fileSize = processed.fileSize;
          isCompressed = true;

          setProcessingProgress(0.8);
        }

        const result: ImageResult = {
          uri: processedUri,
          base64: base64 || undefined,
          width,
          height,
          type: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          fileSize,
          isCompressed,
          originalUri: isCompressed ? originalUri : undefined,
        };

        setProcessingProgress(1);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process image';
        console.error('Image processing error:', message);
        return null;
      }
    },
    [mergedOptions]
  );

  // ==========================================
  // 7.1.2: Pick from Library
  // ==========================================

  const pickFromLibrary = useCallback(async (): Promise<ImageResult | null> => {
    setIsLoading(true);
    setError(null);
    setProcessingProgress(0);

    try {
      // Check permission
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestLibraryPermission();
        if (!granted) {
          setIsLoading(false);
          return null;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: mergedOptions.quality,
        base64: mergedOptions.base64,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        setIsLoading(false);
        return null;
      }

      const processedImage = await processImage(asset);
      if (processedImage) {
        setImage(processedImage);
        setImages([processedImage]);
      }

      return processedImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  }, [mergedOptions, processImage, requestLibraryPermission]);

  // ==========================================
  // 7.1.10: Multi-image Selection
  // ==========================================

  const pickMultiple = useCallback(async (): Promise<ImageResult[]> => {
    setIsLoading(true);
    setError(null);
    setProcessingProgress(0);

    try {
      // Check permission
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestLibraryPermission();
        if (!granted) {
          setIsLoading(false);
          return [];
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: mergedOptions.selectionLimit,
        quality: mergedOptions.quality,
        base64: mergedOptions.base64,
        exif: false,
        orderedSelection: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return [];
      }

      const processedImages: ImageResult[] = [];
      const total = result.assets.length;

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        if (!asset) continue;

        setProcessingProgress((i + 0.5) / total);
        const processed = await processImage(asset, i, total);

        if (processed) {
          processedImages.push(processed);
        }
        setProcessingProgress((i + 1) / total);
      }

      if (processedImages.length > 0) {
        setImage(processedImages[0] || null);
        setImages(processedImages);
      }

      return processedImages;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick images';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  }, [mergedOptions, processImage, requestLibraryPermission]);

  // ==========================================
  // 7.1.3: Camera Capture
  // ==========================================

  const takePhoto = useCallback(async (): Promise<ImageResult | null> => {
    setIsLoading(true);
    setError(null);
    setProcessingProgress(0);

    try {
      // Check permission
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestCameraPermission();
        if (!granted) {
          setIsLoading(false);
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: mergedOptions.quality,
        base64: mergedOptions.base64,
        exif: false,
        cameraType: ImagePicker.CameraType.back,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return null;
      }

      const asset = result.assets[0];
      if (!asset) {
        setIsLoading(false);
        return null;
      }

      const processedImage = await processImage(asset);
      if (processedImage) {
        setImage(processedImage);
        setImages([processedImage]);
      }

      return processedImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take photo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
      setProcessingProgress(0);
    }
  }, [mergedOptions, processImage, requestCameraPermission]);

  // ==========================================
  // Manual Compression
  // ==========================================

  const compressCurrentImage = useCallback(
    async (quality: number = 0.7): Promise<ImageResult | null> => {
      if (!image) return null;

      setIsLoading(true);
      setError(null);

      try {
        const compressed = await compressImage(image.originalUri || image.uri, {
          quality,
          maxWidth: mergedOptions.maxWidth,
          maxHeight: mergedOptions.maxHeight,
        });

        const result: ImageResult = {
          uri: compressed.uri,
          base64: compressed.base64,
          width: compressed.width,
          height: compressed.height,
          type: `image/${compressed.format}`,
          fileName: image.fileName,
          fileSize: compressed.fileSize,
          isCompressed: true,
          originalUri: image.originalUri || image.uri,
        };

        setImage(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to compress image';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [image, mergedOptions]
  );

  const optimizeForAPI = useCallback(async (): Promise<ImageResult | null> => {
    if (!image) return null;

    setIsLoading(true);
    setError(null);

    try {
      const optimized = await optimizeForVisionAPI(
        image.originalUri || image.uri,
        mergedOptions.visionQuality
      );

      const result: ImageResult = {
        uri: optimized.uri,
        base64: optimized.base64,
        width: optimized.width,
        height: optimized.height,
        type: `image/${optimized.format}`,
        fileName: image.fileName,
        fileSize: optimized.fileSize,
        isCompressed: true,
        originalUri: image.originalUri || image.uri,
      };

      setImage(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to optimize image';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [image, mergedOptions.visionQuality]);

  // ==========================================
  // Clear Functions
  // ==========================================

  const clear = useCallback(() => {
    setImage(null);
    setError(null);
    setProcessingProgress(0);
  }, []);

  const clearAll = useCallback(() => {
    setImage(null);
    setImages([]);
    setError(null);
    setProcessingProgress(0);

    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages.splice(index, 1);

      // Update primary image
      if (newImages.length === 0) {
        setImage(null);
      } else if (index === 0) {
        setImage(newImages[0] || null);
      }

      return newImages;
    });
  }, []);

  // ==========================================
  // Return
  // ==========================================

  return {
    // State
    image,
    images,
    isLoading,
    error,
    processingProgress,

    // Actions
    pickFromLibrary,
    pickMultiple,
    takePhoto,
    clear,
    clearAll,
    removeImage,

    // Processing
    compressCurrentImage,
    optimizeForAPI,

    // Permissions
    hasLibraryPermission,
    hasCameraPermission,
    requestLibraryPermission,
    requestCameraPermission,
    openSettings,
  };
};

export default useImagePicker;
