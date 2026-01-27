/**
 * useImagePicker Hook (2.4.6)
 * Image selection and camera capture
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

interface ImageResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

interface UseImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

interface UseImagePickerResult {
  // State
  image: ImageResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  pickFromLibrary: () => Promise<ImageResult | null>;
  takePhoto: () => Promise<ImageResult | null>;
  clear: () => void;

  // Permissions
  hasLibraryPermission: boolean | null;
  hasCameraPermission: boolean | null;
  requestLibraryPermission: () => Promise<boolean>;
  requestCameraPermission: () => Promise<boolean>;
}

const defaultOptions: UseImagePickerOptions = {
  allowsEditing: true,
  quality: 0.8,
  base64: true,
  maxWidth: 1024,
  maxHeight: 1024,
};

export const useImagePicker = (options: UseImagePickerOptions = {}): UseImagePickerResult => {
  const mergedOptions = { ...defaultOptions, ...options };

  const [image, setImage] = useState<ImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLibraryPermission, setHasLibraryPermission] = useState<boolean | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const openSettings = useCallback(() => {
    Alert.alert(
      'Permission Required',
      'Please enable permission in Settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }, []);

  const requestLibraryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const granted = status === 'granted';
    setHasLibraryPermission(granted);

    if (!granted) {
      openSettings();
    }

    return granted;
  }, [openSettings]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    const granted = status === 'granted';
    setHasCameraPermission(granted);

    if (!granted) {
      openSettings();
    }

    return granted;
  }, [openSettings]);

  const processResult = useCallback((result: ImagePicker.ImagePickerResult): ImageResult | null => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset) {
      return null;
    }

    return {
      uri: asset.uri,
      base64: asset.base64 || undefined,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
    };
  }, []);

  const pickFromLibrary = useCallback(async (): Promise<ImageResult | null> => {
    setIsLoading(true);
    setError(null);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: mergedOptions.quality,
        base64: mergedOptions.base64,
        exif: false,
      });

      const processedImage = processResult(result);
      setImage(processedImage);
      return processedImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mergedOptions, processResult, requestLibraryPermission]);

  const takePhoto = useCallback(async (): Promise<ImageResult | null> => {
    setIsLoading(true);
    setError(null);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: mergedOptions.allowsEditing,
        aspect: mergedOptions.aspect,
        quality: mergedOptions.quality,
        base64: mergedOptions.base64,
        exif: false,
      });

      const processedImage = processResult(result);
      setImage(processedImage);
      return processedImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take photo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mergedOptions, processResult, requestCameraPermission]);

  const clear = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return {
    image,
    isLoading,
    error,
    pickFromLibrary,
    takePhoto,
    clear,
    hasLibraryPermission,
    hasCameraPermission,
    requestLibraryPermission,
    requestCameraPermission,
  };
};

export default useImagePicker;
