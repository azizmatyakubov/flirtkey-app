/**
 * Avatar Component (4.4.4)
 * Profile image with fallback to initials
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { darkColors, fontSizes } from '../constants/theme';

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
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
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
  const avatarSize = sizeConfig.size;
  const fontSize = sizeConfig.fontSize;
  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);

  const content = (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: imageUri ? undefined : backgroundColor,
        },
        containerStyle,
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
          <Text style={[styles.editIcon, { fontSize: avatarSize * 0.15 }]}>
            📷
          </Text>
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
    backgroundColor: darkColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: darkColors.background,
  },
  editIcon: {
    textAlign: 'center',
  },
});

export default Avatar;
