import type {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { RootStackParamList } from './index';

// Screen props type for each screen
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;
export type AddContactScreenProps = NativeStackScreenProps<RootStackParamList, 'AddContact'>;
export type ContactProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'ContactProfile'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type WelcomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Welcome'>;
export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
export type ApiKeySetupScreenProps = NativeStackScreenProps<RootStackParamList, 'ApiKeySetup'>;
export type PermissionsScreenProps = NativeStackScreenProps<RootStackParamList, 'Permissions'>;
export type UserProfileSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'UserProfileSetup'
>;
export type ScreenshotAnalysisScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ScreenshotAnalysis'
>;
export type ChatHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatHistory'>;

// Navigation prop type for useNavigation hook
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Generic screen props
export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
