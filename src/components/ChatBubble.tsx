/**
 * ChatBubble Component (Optimized with React.memo)
 * Displays a chat message bubble with sender/receiver styling
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { hapticLight, hapticCopy } from '../utils/haptics';

export type MessageSender = 'user' | 'them' | 'system';

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isRead?: boolean;
  reaction?: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  onLongPress?: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage, emoji: string) => void;
  showTimestamp?: boolean;
  showReadStatus?: boolean;
}

// Pure comparison function for memo
const areEqual = (prevProps: ChatBubbleProps, nextProps: ChatBubbleProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.sender === nextProps.message.sender &&
    prevProps.message.isRead === nextProps.message.isRead &&
    prevProps.message.reaction === nextProps.message.reaction &&
    prevProps.showTimestamp === nextProps.showTimestamp
  );
};

function ChatBubbleBase({
  message,
  onLongPress,
  onReact,
  showTimestamp = true,
  showReadStatus = false,
}: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  // Handle copy on long press
  const handleLongPress = useCallback(async () => {
    await hapticCopy();
    await Clipboard.setStringAsync(message.text);
    onLongPress?.(message);
  }, [message, onLongPress]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // System message (centered, different style)
  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.text}</Text>
        {showTimestamp && (
          <Text style={styles.systemTimestamp}>{formatTime(message.timestamp)}</Text>
        )}
      </View>
    );
  }

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={[styles.container, isUser ? styles.userContainer : styles.herContainer]}
    >
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.herBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.herText]}>{message.text}</Text>

        {/* Reaction badge */}
        {message.reaction && (
          <View style={styles.reactionBadge}>
            <Text style={styles.reactionText}>{message.reaction}</Text>
          </View>
        )}
      </View>

      {/* Timestamp and read status */}
      <View style={[styles.meta, isUser && styles.metaUser]}>
        {showTimestamp && <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>}
        {showReadStatus && isUser && (
          <Text style={styles.readStatus}>{message.isRead ? '✓✓' : '✓'}</Text>
        )}
      </View>

      {/* Quick reaction buttons (shown on focus) */}
      {onReact && (
        <View style={[styles.quickReactions, isUser && styles.quickReactionsUser]}>
          {['❤️', '😂', '👍', '🔥'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                hapticLight();
                onReact(message, emoji);
              }}
              style={styles.reactionButton}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  herContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: darkColors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  herBubble: {
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderBottomLeftRadius: spacing.xs,
  },
  text: {
    fontSize: fontSizes.md,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  herText: {
    color: darkColors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: spacing.xs,
  },
  metaUser: {
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
  },
  readStatus: {
    fontSize: fontSizes.xs,
    color: darkColors.primary,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  systemText: {
    fontSize: fontSizes.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    backgroundColor: darkColors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  systemTimestamp: {
    fontSize: fontSizes.xs,
    color: darkColors.textTertiary,
    marginTop: spacing.xs,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  reactionText: {
    fontSize: 12,
  },
  quickReactions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    opacity: 0, // Hidden by default, shown on focus/hover
  },
  quickReactionsUser: {
    justifyContent: 'flex-end',
  },
  reactionButton: {
    padding: spacing.xs,
  },
  reactionEmoji: {
    fontSize: 16,
  },
});

// Export memoized component
export const ChatBubble = memo(ChatBubbleBase, areEqual);
ChatBubble.displayName = 'ChatBubble';

export default ChatBubble;
