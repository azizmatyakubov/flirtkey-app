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
export type { LoadingSpinnerProps, PulsingDotsProps, SkeletonProps, ListSkeletonProps } from './LoadingSpinner';

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
