/**
 * Avatar Component (4.4.4)
 * Profile image with fallback to initials
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, accentColors, fontSizes } from '../constants/theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  imageUri?: string;
  size?: AvatarSize;
  onPress?: () => void;
  showEditBadge?: boolean;
  containerStyle?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, { size: number; fontSize: number }> = {
  xs: { size: 32, fontSize: fontSizes.xs },
  sm: { size: 40, fontSize: fontSizes.sm },
  md: { size: 50, fontSize: fontSizes.lg },
  lg: { size: 70, fontSize: fontSizes.xl },
  xl: { size: 100, fontSize: fontSizes.xxl },
} as const;

const getInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0]?.[0] ?? '?').toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
};

const AVATAR_COLORS = [
  accentColors.rose, // rose
  accentColors.coral, // coral
  accentColors.gradientPurple, // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
] as const;

const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? '#6366f1';
};

export function Avatar({
  name,
  imageUri,
  size = 'md',
  onPress,
  showEditBadge = false,
  containerStyle,
}: AvatarProps) {
  const sizeConfig = SIZE_MAP[size] ?? SIZE_MAP.md;
  const avatarSize = sizeConfig?.size ?? SIZE_MAP.md.size;
  const fontSize = sizeConfig?.fontSize ?? SIZE_MAP.md.fontSize;
  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  const content = (
    <View style={[styles.outerRing, { width: avatarSize + 4, height: avatarSize + 4, borderRadius: (avatarSize + 4) / 2 }, containerStyle]}>
      <LinearGradient
        colors={[accentColors.gradientStart, accentColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientRing, { width: avatarSize + 4, height: avatarSize + 4, borderRadius: (avatarSize + 4) / 2 }]}
      >
        <View
          style={[
            styles.container,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: imageUri ? darkColors.background : backgroundColor,
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                },
              ]}
            />
          ) : (
            <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
          )}
        </View>
      </LinearGradient>

      {showEditBadge && (
        <View
          style={[
            styles.editBadge,
            {
              width: avatarSize * 0.3,
              height: avatarSize * 0.3,
              borderRadius: (avatarSize * 0.3) / 2,
            },
          ]}
        >
          <Ionicons name="camera" size={avatarSize * 0.15} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  outerRing: {
    position: 'relative',
  },
  gradientRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: darkColors.text,
    fontWeight: 'bold' as const,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: accentColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: darkColors.background,
  },
});

export default Avatar;
