/**
 * Mock for react-native module
 */

export const Platform = {
  OS: 'ios',
  select: jest.fn((obj: Record<string, unknown>) => obj.ios ?? obj.default),
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
  flatten: (style: unknown) => style,
};

export const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

export const Keyboard = {
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  dismiss: jest.fn(),
};

export const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

export const Animated = {
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => 0),
  })),
  timing: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
  })),
  spring: jest.fn(() => ({
    start: jest.fn((cb?: () => void) => cb?.()),
  })),
  View: 'Animated.View',
  Text: 'Animated.Text',
  createAnimatedComponent: jest.fn((comp) => comp),
};

export const Alert = {
  alert: jest.fn(),
};

export const Linking = {
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
};

export const NativeModules = {};

export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const TextInput = 'TextInput';
export const ScrollView = 'ScrollView';
export const FlatList = 'FlatList';
export const Image = 'Image';
export const ActivityIndicator = 'ActivityIndicator';
export const SafeAreaView = 'SafeAreaView';
export const StatusBar = 'StatusBar';
export const Modal = 'Modal';
export const Pressable = 'Pressable';

export default {
  Platform,
  StyleSheet,
  Dimensions,
  Keyboard,
  AppState,
  Animated,
  Alert,
  Linking,
  NativeModules,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable,
};
