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
import { darkColors, spacing, fontSizes, borderRadius } from '../constants/theme';
import { useStore } from '../stores/useStore';
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
  const [inputKey, setInputKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('missing');
  const [statusMessage, setStatusMessage] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fromSettings = route?.params?.fromSettings;

  // Load existing key on mount
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

  // Validate API key by making a test call
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
        return {
          valid: false,
          error: 'Access denied. Your key may not have the required permissions.',
        };
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
        setStatusMessage('✓ API key is valid and saved securely');

        // Navigate away after a short delay
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
        return darkColors.success;
      case 'invalid':
      case 'error':
        return darkColors.error;
      case 'rate_limited':
        return darkColors.warning;
      default:
        return darkColors.textSecondary;
    }
  };

  const getStatusIcon = () => {
    switch (keyStatus) {
      case 'valid':
        return '✓';
      case 'invalid':
      case 'error':
        return '✗';
      case 'rate_limited':
        return '⏳';
      case 'validating':
        return '...';
      default:
        return '';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {fromSettings && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.title}>API Key Setup</Text>
        <Text style={styles.subtitle}>
          FlirtKey uses OpenAI's GPT to generate suggestions.{'\n'}
          You'll need your own API key.
        </Text>
      </View>

      {/* Key Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Your OpenAI API Key</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="sk-..."
            placeholderTextColor="#666"
            value={inputKey}
            onChangeText={setInputKey}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>{showKey ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        {statusMessage && (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusIcon()} {statusMessage}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, keyStatus === 'validating' && styles.disabledButton]}
          onPress={handleValidateAndSave}
          disabled={keyStatus === 'validating'}
        >
          {keyStatus === 'validating' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Validate & Save Key</Text>
          )}
        </TouchableOpacity>

        {keyStatus === 'valid' && inputKey && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteKey}>
            <Text style={styles.deleteButtonText}>Delete Key</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* How to Get Key Guide */}
      <TouchableOpacity style={styles.guideToggle} onPress={() => setShowGuide(!showGuide)}>
        <Text style={styles.guideToggleText}>{showGuide ? '▼' : '▶'} How to get an API key</Text>
      </TouchableOpacity>

      {showGuide && (
        <View style={styles.guideContainer}>
          <View style={styles.guideStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Go to{' '}
              <Text style={styles.link} onPress={openOpenAIPlatform}>
                platform.openai.com
              </Text>
            </Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Sign in or create an account</Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Go to "API Keys" in the sidebar</Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>Click "Create new secret key"</Text>
          </View>
          <View style={styles.guideStep}>
            <Text style={styles.stepNumber}>5</Text>
            <Text style={styles.stepText}>Copy the key and paste it above</Text>
          </View>

          <TouchableOpacity style={styles.openAIButton} onPress={openOpenAIPlatform}>
            <Text style={styles.openAIButtonText}>Open OpenAI Platform →</Text>
          </TouchableOpacity>

          <View style={styles.costNotice}>
            <Text style={styles.costTitle}>💰 Cost Info</Text>
            <Text style={styles.costText}>
              OpenAI charges per usage. GPT-4o-mini costs ~$0.15 per million tokens. A typical
              FlirtKey response costs less than $0.001.
            </Text>
          </View>
        </View>
      )}

      {/* Skip option */}
      {!fromSettings && (
        <TouchableOpacity style={styles.skipContainer} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
          <Text style={styles.skipHint}>(You can add it later in Settings)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
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
  backText: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: darkColors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    color: darkColors.text,
    fontSize: fontSizes.md,
  },
  toggleButton: {
    padding: spacing.md,
  },
  toggleText: {
    fontSize: 20,
  },
  statusContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  statusText: {
    fontSize: fontSizes.sm,
  },
  saveButton: {
    backgroundColor: darkColors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
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
    backgroundColor: 'transparent',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: darkColors.error,
  },
  deleteButtonText: {
    color: darkColors.error,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  guideToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  guideToggleText: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  guideContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: darkColors.primary,
    color: '#fff',
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: spacing.sm,
  },
  stepText: {
    flex: 1,
    color: darkColors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
  },
  link: {
    color: darkColors.primary,
    textDecorationLine: 'underline',
  },
  openAIButton: {
    backgroundColor: darkColors.primary + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  openAIButtonText: {
    color: darkColors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  costNotice: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: darkColors.background,
    borderRadius: borderRadius.md,
  },
  costTitle: {
    color: darkColors.text,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  costText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
  skipContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  skipText: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.md,
  },
  skipHint: {
    color: darkColors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
