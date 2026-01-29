/**
 * ContactCard Component (Optimized with React.memo)
 * Memoized list item for performance optimization
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from '../types';
import { Avatar } from './Avatar';
import { StageBadge } from './Badge';
import { SwipeableRow } from './SwipeableRow';
import { darkColors, spacing, fontSizes, borderRadius, shadows } from '../constants/theme';

interface ContactCardProps {
  contact: Contact;
  animatedValue: Animated.Value;
  onPress: (contact: Contact) => void;
  onLongPress: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
}

// Pure comparison function for memo
const areEqual = (prevProps: ContactCardProps, nextProps: ContactCardProps) => {
  return (
    prevProps.contact.id === nextProps.contact.id &&
    prevProps.contact.name === nextProps.contact.name &&
    prevProps.contact.messageCount === nextProps.contact.messageCount &&
    prevProps.contact.relationshipStage === nextProps.contact.relationshipStage &&
    prevProps.contact.avatar === nextProps.contact.avatar &&
    prevProps.contact.lastMessageDate === nextProps.contact.lastMessageDate
  );
};

export const ContactCard = React.memo<ContactCardProps>(
  ({ contact, animatedValue, onPress, onLongPress, onDelete, onEdit }) => {
    // Memoize handlers to prevent unnecessary re-renders
    const handlePress = useCallback(() => onPress(contact), [contact, onPress]);
    const handleLongPress = useCallback(() => onLongPress(contact), [contact, onLongPress]);
    const handleDelete = useCallback(() => onDelete(contact), [contact, onDelete]);
    const handleEdit = useCallback(() => onEdit(contact), [contact, onEdit]);

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
            style={styles.contactCard}
            onPress={handlePress}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
          >
            <Avatar name={contact.name} imageUri={contact.avatar} size="md" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <StageBadge stage={contact.relationshipStage} size="sm" />
            </View>
            <View style={styles.contactMeta}>
              <View style={styles.messageCountRow}>
                <Ionicons name="chatbubble-outline" size={13} color={darkColors.textSecondary} />
                <Text style={styles.messageCount}>{contact.messageCount}</Text>
              </View>
              {contact.lastMessageDate && (
                <Text style={styles.lastMessage}>
                  {formatRelativeTime(new Date(contact.lastMessageDate))}
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

ContactCard.displayName = 'ContactCard';

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
  contactCard: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    ...shadows.md,
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  contactName: {
    color: darkColors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  contactMeta: {
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

export default ContactCard;
