/**
 * Components Index (4.4.13)
 * Export all reusable components
 */

// Form Components
export { TextInput } from './TextInput';
export type { TextInputProps } from './TextInput';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { MultiSelect } from './MultiSelect';
export type { MultiSelectProps, MultiSelectOption } from './MultiSelect';

// Display Components
export { Avatar } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';

export { Badge, StageBadge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize, RelationshipStageBadgeProps } from './Badge';

export { Card } from './Card';
export type { CardProps, CardVariant } from './Card';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// Button Components
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './IconButton';

// Overlay Components
export { Modal } from './Modal';
export type { ModalProps, ModalPosition } from './Modal';

export { ConfirmDialog, DeleteDialog, UnsavedChangesDialog } from './ConfirmDialog';
export type {
  ConfirmDialogProps,
  DeleteDialogProps,
  UnsavedChangesDialogProps,
} from './ConfirmDialog';

export { ToastProvider, useToast, toast, setGlobalToastHandler } from './Toast';
export type { ToastConfig, ToastType, ToastPosition } from './Toast';

// Loading Components
export {
  LoadingSpinner,
  PulsingDots,
  Skeleton,
  CardSkeleton,
  ListSkeleton,
} from './LoadingSpinner';
export type {
  LoadingSpinnerProps,
  PulsingDotsProps,
  SkeletonProps,
  ListSkeletonProps,
} from './LoadingSpinner';

// List Components
export { SwipeableRow } from './SwipeableRow';
export type { SwipeableRowProps } from './SwipeableRow';

export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './SearchBar';

export { SortMenu } from './SortMenu';
export type { SortMenuProps, SortOption } from './SortMenu';

// Chat & Suggestions UI Components (Phase 6)
export { CharacterCount } from './CharacterCount';
export { QuickPhrases } from './QuickPhrases';
export { TypingIndicator } from './TypingIndicator';
export { ShimmerEffect, SuggestionCardShimmer, LoadingShimmer } from './ShimmerEffect';
export { AnimatedSuggestionCard } from './AnimatedSuggestionCard';
export { InterestLevelDisplay } from './InterestLevelDisplay';
export { ProTipCard, TipOfTheDay, getTipOfTheDay } from './ProTipCard';
export { ConversationContext, LastTopicIndicator } from './ConversationContext';

// New Phase 6 Components
// 6.1.10 Voice Input
export { VoiceInput } from './VoiceInput';

// 6.1.11 Paste Detection
export { PasteDetector, useClipboardDetection } from './PasteDetector';

// 6.1.12 Keyboard Accessory View
export { KeyboardAccessoryView, KeyboardAccessoryWrapper } from './KeyboardAccessoryView';

// 6.1.18 Quick Action Shortcuts
export { QuickActionShortcuts, QuickActionToolbar } from './QuickActionShortcuts';

// 6.2.10 Swipeable Suggestions
export { SwipeableSuggestions } from './SwipeableSuggestions';

// 6.2.12 Suggestion Editor
export { SuggestionEditor } from './SuggestionEditor';

// 6.2.13 Suggestion Regeneration
export { RegenerateButton, RegeneratePanel } from './SuggestionRegenerate';

// 6.2.14 Suggestion History
export { SuggestionHistory } from './SuggestionHistory';

// 6.2.15 Share Suggestion
export { ShareButton, ShareMenu, shareSuggestion } from './ShareSuggestion';

// 6.3.7 Interest Level Chart
export { InterestLevelChart, MiniInterestChart } from './InterestLevelChart';

// Phase 7: Screenshot Analysis Components
// 7.1.7 Image Preview
export { ImagePreview } from './ImagePreview';
export type { ImagePreviewProps } from './ImagePreview';

// 7.3.7 Image Annotation Overlay
export { ImageAnnotationOverlay } from './ImageAnnotationOverlay';
export type {
  ImageAnnotationOverlayProps,
  AnnotationPoint,
  AnnotationRegion,
} from './ImageAnnotationOverlay';

// Phase 8: Settings & Polish Components
// 8.5.1 Onboarding Flow
export { OnboardingFlow } from './OnboardingFlow';

// 8.5.3 Loading Skeletons
export {
  Skeleton as SkeletonNew,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  ContactListSkeleton,
  ChatSkeleton,
  SuggestionSkeleton,
  ProfileSkeleton,
  ScreenshotAnalysisSkeleton,
  SettingsSkeleton,
} from './LoadingSkeleton';

// 8.5.4 Error Boundaries
export { ErrorBoundary, ScreenErrorBoundary } from './ErrorBoundary';

// 8.5.2 Empty States
export {
  EmptyState as EmptyStateBase,
  NoContactsEmpty,
  NoSuggestionsEmpty,
  NoConversationHistoryEmpty,
  NoAnalysisEmpty,
  NoSearchResultsEmpty,
  NoFavoritesEmpty,
  NoProTipsEmpty,
  OfflineEmpty,
  NoApiKeyEmpty,
  RateLimitEmpty,
  NoInsideJokesEmpty,
  ErrorEmpty,
  ComingSoonEmpty,
  NoNotificationsEmpty,
  WelcomeEmpty,
  NoQuickRepliesEmpty,
} from './EmptyStatePresets';

// Polish Features (Phase 9)
// Celebration Animation for Copy
export { CelebrationAnimation } from './CelebrationAnimation';

// Offline Indicator
export { OfflineIndicator, useNetworkStatus } from './OfflineIndicator';

// Optimized List Components
export { ContactCard } from './ContactCard';

// Chat Components
export { ChatBubble } from './ChatBubble';
export type { ChatMessage, MessageSender } from './ChatBubble';

// Engagement & Quality Components
export { DailyTipCard } from './DailyTipCard';
export { StreakBadge } from './StreakBadge';
export { ResponseQualityIndicator } from './ResponseQualityIndicator';
export type { ToneType } from './ResponseQualityIndicator';
