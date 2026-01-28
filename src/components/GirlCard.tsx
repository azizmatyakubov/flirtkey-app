/**
 * GirlCard Component (Optimized with React.memo)
 * Memoized list item for performance optimization
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Girl } from '../types';
import { Avatar } from './Avatar';
import { StageBadge } from './Badge';
import { SwipeableRow } from './SwipeableRow';
import { darkColors, spacing, fontSizes, borderRadius, shadows, accentColors } from '../constants/theme';

interface GirlCardProps {
  girl: Girl;
  animatedValue: Animated.Value;
  onPress: (girl: Girl) => void;
  onLongPress: (girl: Girl) => void;
  onDelete: (girl: Girl) => void;
  onEdit: (girl: Girl) => void;
}

// Pure comparison function for memo
const areEqual = (prevProps: GirlCardProps, nextProps: GirlCardProps) => {
  return (
    prevProps.girl.id === nextProps.girl.id &&
    prevProps.girl.name === nextProps.girl.name &&
    prevProps.girl.messageCount === nextProps.girl.messageCount &&
    prevProps.girl.relationshipStage === nextProps.girl.relationshipStage &&
    prevProps.girl.avatar === nextProps.girl.avatar &&
    prevProps.girl.lastMessageDate === nextProps.girl.lastMessageDate
  );
};

export const GirlCard = React.memo<GirlCardProps>(
  ({ girl, animatedValue, onPress, onLongPress, onDelete, onEdit }) => {
    // Memoize handlers to prevent unnecessary re-renders
    const handlePress = useCallback(() => onPress(girl), [girl, onPress]);
    const handleLongPress = useCallback(() => onLongPress(girl), [girl, onLongPress]);
    const handleDelete = useCallback(() => onDelete(girl), [girl, onDelete]);
    const handleEdit = useCallback(() => onEdit(girl), [girl, onEdit]);

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: animatedValue,
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <SwipeableRow onDelete={handleDelete} onEdit={handleEdit}>
          <TouchableOpacity
            style={styles.girlCard}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
          >
            <Avatar name={girl.name} imageUri={girl.avatar} size="md" />
            <View style={styles.girlInfo}>
              <Text style={styles.girlName}>{girl.name}</Text>
              <StageBadge stage={girl.relationshipStage} size="sm" />
            </View>
            <View style={styles.girlMeta}>
              <View style={styles.messageCountRow}>
                <Ionicons name="chatbubble-outline" size={13} color={darkColors.textSecondary} />
                <Text style={styles.messageCount}>{girl.messageCount}</Text>
              </View>
              {girl.lastMessageDate && (
                <Text style={styles.lastMessage}>
                  {formatRelativeTime(new Date(girl.lastMessageDate))}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={darkColors.textTertiary} style={styles.chevron} />
          </TouchableOpacity>
        </SwipeableRow>
      </Animated.View>
    );
  },
  areEqual
);

GirlCard.displayName = 'GirlCard';

// Helper function for relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.sm + 4,
  },
  girlCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.md,
  },
  girlInfo: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  girlName: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  girlMeta: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  messageCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageCount: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  lastMessage: {
    color: darkColors.textTertiary,
    fontSize: fontSizes.xs,
    marginTop: 3,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default GirlCard;
