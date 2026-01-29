import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { accentColors, spacing, fontSizes, borderRadius, shadows } from '../constants/theme';
import { useStore } from '../stores/useStore';
import { useTheme } from '../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

const SECURE_API_KEY = 'flirtkey_openai_key';

type KeyStatus = 'missing' | 'validating' | 'valid' | 'invalid' | 'rate_limited' | 'error';

interface ApiKeySetupScreenProps {
  navigation: any;
  route?: {
    params?: {
      fromSettings?: boolean;
    };
  };
}

export function ApiKeySetupScreen({ navigation, route }: ApiKeySetupScreenProps) {
  const { setApiKey } = useStore();
  const { theme } = useTheme();
  const [inputKey, setInputKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('missing');
  const [statusMessage, setStatusMessage] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fromSettings = route?.params?.fromSettings;

  useEffect(() => {
    loadSecureKey();
  }, []);

  const loadSecureKey = async () => {
    try {
      const savedKey = await SecureStore.getItemAsync(SECURE_API_KEY);
      if (savedKey) {
        setInputKey(savedKey);
        setApiKey(savedKey);
        setKeyStatus('valid');
        setStatusMessage('Key loaded from secure storage');
      }
    } catch (error) {
      console.error('Failed to load secure key:', error);
    }
  };

  const saveSecureKey = async (key: string) => {
    try {
      await SecureStore.setItemAsync(SECURE_API_KEY, key);
    } catch (error) {
      console.error('Failed to save secure key:', error);
      throw error;
    }
  };

  const deleteSecureKey = async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_API_KEY);
    } catch (error) {
      console.error('Failed to delete secure key:', error);
    }
  };

  const validateKey = async (key: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      }

      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key. Please check and try again.' };
      }
      if (response.status === 429) {
        return { valid: false, error: 'Rate limited. Please wait a moment and try again.' };
      }
      if (response.status === 403) {
        return { valid: false, error: 'Access denied. Your key may not have the required permissions.' };
      }

      return { valid: false, error: errorData.error?.message || 'Unknown error occurred' };
    } catch (error) {
      return { valid: false, error: 'Network error. Please check your connection.' };
    }
  };

  const handleValidateAndSave = async () => {
    const trimmedKey = inputKey.trim();

    if (!trimmedKey) {
      Alert.alert('Error', 'Please enter your API key');
      return;
    }

    if (!trimmedKey.startsWith('sk-')) {
      Alert.alert('Invalid Format', 'OpenAI API keys start with "sk-"');
      return;
    }

    setKeyStatus('validating');
    setStatusMessage('Validating your API key...');

    const result = await validateKey(trimmedKey);

    if (result.valid) {
      try {
        await saveSecureKey(trimmedKey);
        setApiKey(trimmedKey);
        setKeyStatus('valid');
        setStatusMessage('API key is valid and saved securely');

        setTimeout(() => {
          if (fromSettings) {
            navigation.goBack();
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        }, 1000);
      } catch (error) {
        setKeyStatus('error');
        setStatusMessage('Failed to save key securely');
      }
    } else {
      if (result.error?.includes('Rate limited')) {
        setKeyStatus('rate_limited');
      } else {
        setKeyStatus('invalid');
      }
      setStatusMessage(result.error || 'Invalid key');
    }
  };

  const handleDeleteKey = () => {
    Alert.alert(
      'Delete API Key',
      'Are you sure you want to delete your API key? You will need to enter it again to use the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSecureKey();
            setInputKey('');
            setApiKey('');
            setKeyStatus('missing');
            setStatusMessage('');
          },
        },
      ]
    );
  };

  const handleSkip = () => {
    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  const openOpenAIPlatform = () => {
    Linking.openURL('https://platform.openai.com/api-keys');
  };

  const getStatusColor = () => {
    switch (keyStatus) {
      case 'valid':
        return theme.colors.success;
      case 'invalid':
      case 'error':
        return theme.colors.error;
      case 'rate_limited':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (keyStatus) {
      case 'valid':
        return 'checkmark-circle' as any;
      case 'invalid':
      case 'error':
        return 'close-circle' as any;
      case 'rate_limited':
        return 'time' as any;
      default:
        return 'ellipsis-horizontal' as any;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {fromSettings && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={accentColors.coral} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title with gradient icon */}
      <View style={styles.titleContainer}>
        <LinearGradient
          colors={[accentColors.gradientStart, accentColors.gradientEnd]}
          style={styles.iconCircle}
        >
          <Ionicons name="key" size={36} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.title, { color: theme.colors.text }]}>API Key Setup</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          FlirtKey uses OpenAI's GPT to generate suggestions.{'\n'}
          You'll need your own API key.
        </Text>
      </View>

      {/* Key Input */}
      <View style={styles.inputSection}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Your OpenAI API Key</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} style={{ marginLeft: spacing.md }} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="sk-..."
            placeholderTextColor={theme.colors.textTertiary}
            value={inputKey}
            onChangeText={setInputKey}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.toggleButton}>
            <Ionicons name={showKey ? 'eye-off' : 'eye'} size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Status */}
        {statusMessage && (
          <View style={styles.statusContainer}>
            <Ionicons name={getStatusIcon() as any} size={16} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {statusMessage}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[keyStatus === 'validating' && styles.disabledButton]}
          onPress={handleValidateAndSave}
          disabled={keyStatus === 'validating'}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[accentColors.gradientStart, accentColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            {keyStatus === 'validating' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Validate & Save Key</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {keyStatus === 'valid' && inputKey && (
          <TouchableOpacity style={[styles.deleteButton, { borderColor: theme.colors.error }]} onPress={handleDeleteKey}>
            <Ionicons name="trash" size={18} color={theme.colors.error} />
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete Key</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* How to Get Key Guide */}
      <TouchableOpacity style={styles.guideToggle} onPress={() => setShowGuide(!showGuide)}>
        <Ionicons name={showGuide ? 'chevron-down' : 'chevron-forward'} size={18} color={accentColors.coral} />
        <Text style={styles.guideToggleText}>How to get an API key</Text>
      </TouchableOpacity>

      {showGuide && (
        <View style={[styles.guideContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {[
            { step: '1', text: 'Go to platform.openai.com', link: true },
            { step: '2', text: 'Sign in or create an account' },
            { step: '3', text: 'Go to "API Keys" in the sidebar' },
            { step: '4', text: 'Click "Create new secret key"' },
            { step: '5', text: 'Copy the key and paste it above' },
          ].map((item, index) => (
            <View key={index} style={styles.guideStep}>
              <LinearGradient
                colors={[accentColors.gradientStart, accentColors.gradientEnd]}
                style={styles.stepNumberCircle}
              >
                <Text style={styles.stepNumber}>{item.step}</Text>
              </LinearGradient>
              <Text style={[styles.stepText, { color: theme.colors.text }]}>
                {item.link ? (
                  <>
                    Go to{' '}
                    <Text style={styles.link} onPress={openOpenAIPlatform}>
                      platform.openai.com
                    </Text>
                  </>
                ) : (
                  item.text
                )}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.openAIButton} onPress={openOpenAIPlatform}>
            <Ionicons name="open" size={18} color={accentColors.coral} />
            <Text style={styles.openAIButtonText}>Open OpenAI Platform</Text>
          </TouchableOpacity>

          <View style={[styles.costNotice, { backgroundColor: theme.colors.background }]}>
            <View style={styles.costTitleRow}>
              <Ionicons name="cash" size={16} color={accentColors.gold} />
              <Text style={[styles.costTitle, { color: theme.colors.text }]}>Cost Info</Text>
            </View>
            <Text style={[styles.costText, { color: theme.colors.textSecondary }]}>
              OpenAI charges per usage. GPT-4o-mini costs ~$0.15 per million tokens. A typical
              FlirtKey response costs less than $0.001.
            </Text>
          </View>
        </View>
      )}

      {/* Skip option */}
      {!fromSettings && (
        <TouchableOpacity style={styles.skipContainer} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Skip for now</Text>
          <Text style={[styles.skipHint, { color: theme.colors.textSecondary }]}>(You can add it later in Settings)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    minHeight: 80,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSizes.md,
  },
  toggleButton: {
    padding: spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  statusText: {
    fontSize: fontSizes.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    ...shadows.glow,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'transparent',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  guideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  guideToggleText: {
    color: accentColors.coral,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  guideContainer: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: fontSizes.md,
    lineHeight: 28,
  },
  link: {
    color: accentColors.coral,
    textDecorationLine: 'underline',
  },
  openAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: `${accentColors.coral}15`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  openAIButtonText: {
    color: accentColors.coral,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  costNotice: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  costTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  costTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  costText: {
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
  skipContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  skipText: {
    fontSize: fontSizes.md,
  },
  skipHint: {
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
