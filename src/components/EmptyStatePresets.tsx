import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// ==========================================
// Types
// ==========================================

interface EmptyStateProps {
  emoji?: string;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

// ==========================================
// Base Empty State Component
// ==========================================

export function EmptyState({
  emoji,
  title,
  message,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {emoji && <Text style={[styles.emoji, compact && styles.emojiCompact]}>{emoji}</Text>}
      <Text style={[styles.title, { color: theme.colors.text }, compact && styles.titleCompact]}>
        {title}
      </Text>
      {message && (
        <Text
          style={[
            styles.message,
            { color: theme.colors.textSecondary },
            compact && styles.messageCompact,
          ]}
        >
          {message}
        </Text>
      )}
      {actionText && onAction && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primary },
            compact && styles.actionButtonCompact,
          ]}
          onPress={onAction}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
      {secondaryActionText && onSecondaryAction && (
        <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryAction}>
          <Text style={[styles.secondaryText, { color: theme.colors.primary }]}>
            {secondaryActionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ==========================================
// Preset Empty States
// ==========================================

// No Contacts Added
export function NoContactsEmpty({ onAddContact }: { onAddContact: () => void }) {
  return (
    <EmptyState
      emoji="💘"
      title="No profiles yet"
      message="Add your first contact profile to start getting personalized suggestions!"
      actionText="Add Contact Profile"
      onAction={onAddContact}
    />
  );
}

// No Suggestions
export function NoSuggestionsEmpty({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <EmptyState
      emoji="💭"
      title="Ready to help!"
      message="Paste their message and tap Generate to get tailored suggestions."
      actionText={onGenerate ? 'Generate Suggestions' : undefined}
      onAction={onGenerate}
    />
  );
}

// No Conversation History
export function NoConversationHistoryEmpty() {
  return (
    <EmptyState
      emoji="📝"
      title="No conversation history"
      message="Your past conversations will appear here once you start using FlirtKey."
      compact
    />
  );
}

// No Screenshot Analysis
export function NoAnalysisEmpty({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      emoji="📸"
      title="Analyze a screenshot"
      message="Upload a conversation screenshot to get detailed analysis and suggestions."
      actionText="Upload Screenshot"
      onAction={onUpload}
    />
  );
}

// No Search Results
export function NoSearchResultsEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      emoji="🔍"
      title="No results found"
      message={`We couldn't find any profiles matching "${query}"`}
      actionText="Clear Search"
      onAction={onClear}
      compact
    />
  );
}

// No Favorites
export function NoFavoritesEmpty() {
  return (
    <EmptyState
      emoji="⭐"
      title="No favorites yet"
      message="Star suggestions to save them for later."
      compact
    />
  );
}

// No Pro Tips
export function NoProTipsEmpty() {
  return (
    <EmptyState
      emoji="💡"
      title="No tips saved"
      message="Save pro tips that resonate with you."
      compact
    />
  );
}

// Offline State
export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      emoji="📡"
      title="You're offline"
      message="Please check your internet connection and try again."
      actionText={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
}

// API Key Missing
export function NoApiKeyEmpty({ onSetup }: { onSetup: () => void }) {
  return (
    <EmptyState
      emoji="🔑"
      title="API Key Required"
      message="Set up your OpenAI API key to start generating suggestions."
      actionText="Set Up API Key"
      onAction={onSetup}
    />
  );
}

// Rate Limit Exceeded
export function RateLimitEmpty({ onLearnMore }: { onLearnMore?: () => void }) {
  return (
    <EmptyState
      emoji="⏳"
      title="Rate limit reached"
      message="You've made too many requests. Please wait a moment before trying again."
      actionText={onLearnMore ? 'Learn More' : undefined}
      onAction={onLearnMore}
    />
  );
}

// No Inside Jokes
export function NoInsideJokesEmpty() {
  return (
    <EmptyState
      emoji="😂"
      title="No inside jokes yet"
      message="Add inside jokes to make suggestions more personal."
      compact
    />
  );
}

// Error State
export function ErrorEmpty({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      emoji="😅"
      title="Something went wrong"
      message={message || "We couldn't load this content. Please try again."}
      actionText={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
    />
  );
}

// Coming Soon
export function ComingSoonEmpty({ feature }: { feature: string }) {
  return (
    <EmptyState
      emoji="🚀"
      title="Coming Soon"
      message={`${feature} is under development and will be available soon!`}
      compact
    />
  );
}

// No Notifications
export function NoNotificationsEmpty() {
  return <EmptyState emoji="🔔" title="No notifications" message="You're all caught up!" compact />;
}

// First Time User
export function WelcomeEmpty({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <EmptyState
      emoji="👋"
      title="Welcome to FlirtKey!"
      message="Let's set up your first profile and start getting better at texting."
      actionText="Get Started"
      onAction={onGetStarted}
    />
  );
}

// No Quick Replies
export function NoQuickRepliesEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      emoji="⚡"
      title="No quick replies"
      message="Add templates for fast responses."
      actionText="Add Quick Reply"
      onAction={onAdd}
      compact
    />
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  containerCompact: {
    minHeight: 200,
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emojiCompact: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  titleCompact: {
    fontSize: 18,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  messageCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonCompact: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    padding: 8,
  },
  secondaryText: {
    fontSize: 14,
  },
});
