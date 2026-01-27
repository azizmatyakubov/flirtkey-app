export interface Girl {
  id: number;
  name: string;
  nickname?: string;
  age?: number;
  culture?: string;
  personality?: string;
  interests?: string;
  occupation?: string;
  howMet?: string;
  relationshipStage: 'just_met' | 'talking' | 'flirting' | 'dating' | 'serious';
  herTextingStyle?: string;
  responseTime?: string;
  importantDates?: string;
  topics?: string;
  insideJokes?: string;
  redFlags?: string;
  greenLights?: string;
  lastTopic?: string;
  lastMessageDate?: string;
  messageCount: number;
  avatar?: string;
}

export interface User {
  id: number;
  telegramId?: string;
  name: string;
  culture: string;
  language: string;
}

export interface Suggestion {
  type: 'safe' | 'balanced' | 'bold';
  text: string;
  reason: string;
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  proTip: string;
  interestLevel?: number;
  mood?: string;
}

export type Culture = 'uzbek' | 'russian' | 'western' | 'asian' | 'universal';
export type RelationshipStage = 'just_met' | 'talking' | 'flirting' | 'dating' | 'serious';

// 1.3.7: API Error types
export interface APIError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

export type APIErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'INVALID_API_KEY'
  | 'INSUFFICIENT_QUOTA'
  | 'SERVER_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

// 1.3.8: Navigation types
export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  AddGirl: undefined;
  GirlProfile: { girlId?: number };
  Settings: undefined;
  ApiKeySetup: undefined;
  Onboarding: undefined;
};

// Navigation prop types for screens
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: {
    navigate: (
      screen: keyof RootStackParamList,
      params?: RootStackParamList[typeof screen]
    ) => void;
    goBack: () => void;
    reset: (state: { index: number; routes: { name: keyof RootStackParamList }[] }) => void;
  };
  route: {
    params: RootStackParamList[T];
    name: T;
  };
};

// 1.3.9: Form state types
export interface FormFieldState<T> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: {
    [K in keyof T]: FormFieldState<T[K]>;
  };
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// 1.3.10: AsyncState generic
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: APIError | null;
  lastUpdated: number | null;
}

// Helper to create initial async state
export const createAsyncState = <T>(): AsyncState<T> => ({
  status: 'idle',
  data: null,
  error: null,
  lastUpdated: null,
});

// 1.3.11: Theme interface
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  safe: string;
  balanced: string;
  bold: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeFontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  fontSizes: ThemeFontSizes;
  borderRadius: ThemeBorderRadius;
  isDark: boolean;
}

// Re-export navigation types
export * from './navigation';
