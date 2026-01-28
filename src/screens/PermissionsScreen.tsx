import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { darkColors, accentColors, spacing, fontSizes, borderRadius, shadows } from '../constants/theme';

type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'limited';

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: PermissionStatus;
  required: boolean;
}

interface PermissionsScreenProps {
  navigation: any;
  route?: {
    params?: {
      fromSettings?: boolean;
    };
  };
}

export function PermissionsScreen({ navigation, route }: PermissionsScreenProps) {
  const fromSettings = route?.params?.fromSettings;

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'photos',
      title: 'Photo Library',
      description: 'Access your photos to analyze chat screenshots',
      icon: 'images',
      status: 'undetermined',
      required: true,
    },
    {
      id: 'camera',
      title: 'Camera',
      description: 'Take photos of chat screens directly',
      icon: 'camera',
      status: 'undetermined',
      required: false,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Get tips and reminders (optional)',
      icon: 'notifications',
      status: 'undetermined',
      required: false,
    },
  ]);

  // Check current permission status on mount
  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = useCallback(async () => {
    const photoPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
    const notificationPermission = await Notifications.getPermissionsAsync();

    setPermissions((prev) =>
      prev.map((perm) => {
        switch (perm.id) {
          case 'photos':
            return {
              ...perm,
              status: mapPermissionStatus(photoPermission.status, photoPermission.accessPrivileges),
            };
          case 'camera':
            return {
              ...perm,
              status: mapPermissionStatus(cameraPermission.status),
            };
          case 'notifications':
            return {
              ...perm,
              status: mapPermissionStatus(notificationPermission.status),
            };
          default:
            return perm;
        }
      })
    );
  }, []);

  const mapPermissionStatus = (
    status: string,
    accessPrivileges?: 'all' | 'limited' | 'none'
  ): PermissionStatus => {
    if (accessPrivileges === 'limited') {
      return 'limited';
    }
    switch (status) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'undetermined';
    }
  };

  const requestPhotoPermission = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    updatePermissionStatus('photos', mapPermissionStatus(result.status, result.accessPrivileges));

    if (result.status === 'denied') {
      showSettingsAlert('Photo Library');
    }
  };

  const requestCameraPermission = async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    updatePermissionStatus('camera', mapPermissionStatus(result.status));

    if (result.status === 'denied') {
      showSettingsAlert('Camera');
    }
  };

  const requestNotificationPermission = async () => {
    const result = await Notifications.requestPermissionsAsync();
    updatePermissionStatus('notifications', mapPermissionStatus(result.status));

    if (result.status === 'denied') {
      showSettingsAlert('Notifications');
    }
  };

  const updatePermissionStatus = (id: string, status: PermissionStatus) => {
    setPermissions((prev) => prev.map((perm) => (perm.id === id ? { ...perm, status } : perm)));
  };

  const showSettingsAlert = (permissionName: string) => {
    Alert.alert(
      `${permissionName} Access Denied`,
      `To enable ${permissionName} access, please go to Settings and allow FlirtKey to access your ${permissionName.toLowerCase()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  };

  const handleRequestPermission = async (id: string) => {
    switch (id) {
      case 'photos':
        await requestPhotoPermission();
        break;
      case 'camera':
        await requestCameraPermission();
        break;
      case 'notifications':
        await requestNotificationPermission();
        break;
    }
  };

  const handleContinue = () => {
    // Check if required permissions are granted
    const photoPermission = permissions.find((p) => p.id === 'photos');
    if (photoPermission?.status !== 'granted' && photoPermission?.status !== 'limited') {
      Alert.alert(
        'Photo Access Required',
        'FlirtKey needs access to your photos to analyze chat screenshots. Please allow photo access to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Allow',
            onPress: requestPhotoPermission,
          },
        ]
      );
      return;
    }

    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  const handleSkip = () => {
    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  const getStatusColor = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return darkColors.success;
      case 'limited':
        return darkColors.warning;
      case 'denied':
        return darkColors.error;
      default:
        return darkColors.textSecondary;
    }
  };

  const getStatusText = (status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return '✓ Allowed';
      case 'limited':
        return '⚠ Limited';
      case 'denied':
        return '✗ Denied';
      default:
        return 'Not Set';
    }
  };

  const getButtonText = (permission: Permission) => {
    switch (permission.status) {
      case 'granted':
        return '✓ Allowed';
      case 'limited':
        return 'Change in Settings';
      case 'denied':
        return 'Open Settings';
      default:
        return 'Allow Access';
    }
  };

  const handleButtonPress = (permission: Permission) => {
    if (permission.status === 'denied' || permission.status === 'limited') {
      Linking.openSettings();
    } else {
      handleRequestPermission(permission.id);
    }
  };

  const allRequiredGranted = permissions
    .filter((p) => p.required)
    .every((p) => p.status === 'granted' || p.status === 'limited');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {fromSettings && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={accentColors.coral} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <LinearGradient
          colors={[accentColors.gradientStart, accentColors.gradientEnd]}
          style={styles.titleIconCircle}
        >
          <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>FlirtKey needs a few permissions to work its magic</Text>
      </View>

      {/* Permission Cards */}
      <View style={styles.permissionsContainer}>
        {permissions.map((permission) => (
          <View
            key={permission.id}
            style={[
              styles.permissionCard,
              permission.status === 'granted' && styles.permissionCardGranted,
            ]}
          >
            <View style={styles.permissionHeader}>
              <View style={styles.permissionIconCircle}>
                <Ionicons name={permission.icon as any} size={24} color={accentColors.coral} />
              </View>
              <View style={styles.permissionInfo}>
                <View style={styles.permissionTitleRow}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  {permission.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.permissionDescription}>{permission.description}</Text>
              </View>
            </View>

            <View style={styles.permissionActions}>
              <Text style={[styles.statusText, { color: getStatusColor(permission.status) }]}>
                {getStatusText(permission.status)}
              </Text>

              {permission.status !== 'granted' && (
                <TouchableOpacity
                  style={[
                    styles.allowButton,
                    permission.status === 'denied' && styles.settingsButton,
                  ]}
                  onPress={() => handleButtonPress(permission)}
                >
                  <Text
                    style={[
                      styles.allowButtonText,
                      permission.status === 'denied' && styles.settingsButtonText,
                    ]}
                  >
                    {getButtonText(permission)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Platform-specific note */}
      <View style={styles.noteContainer}>
        <Ionicons name="bulb" size={16} color={accentColors.gold} />
        <Text style={styles.noteText}>
          {Platform.OS === 'ios'
            ? 'You can change these anytime in Settings → FlirtKey'
            : 'You can change these anytime in Settings → Apps → FlirtKey'}
        </Text>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          style={!allRequiredGranted ? styles.continueButtonDisabled : undefined}
        >
          <LinearGradient
            colors={[accentColors.gradientStart, accentColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {!fromSettings && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    minHeight: 80,
  },
  backText: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  titleIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: darkColors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
  },
  permissionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  permissionCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  permissionCardGranted: {
    borderColor: darkColors.success + '40',
    backgroundColor: darkColors.success + '10',
  },
  permissionHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  permissionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${accentColors.coral}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  permissionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: darkColors.text,
    marginRight: spacing.sm,
  },
  requiredBadge: {
    backgroundColor: darkColors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  requiredText: {
    fontSize: fontSizes.xs,
    color: darkColors.primary,
    fontWeight: '500',
  },
  permissionDescription: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
  },
  permissionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  allowButton: {
    backgroundColor: darkColors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  settingsButtonText: {
    color: darkColors.text,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  noteText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.glow,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skipButtonText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
  },
});
