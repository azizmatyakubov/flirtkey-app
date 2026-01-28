// 6.1.10 Voice input option
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, accentColors, fontSizes, spacing, borderRadius } from '../constants/theme';

// Note: expo-speech-to-text or expo-av would be used in production
// This is a mock implementation for UI purposes

interface VoiceInputProps {
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript: _onTranscript, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Check for speech recognition permissions
    // In a real implementation, use expo-speech-recognition
    setHasPermission(true);
  }, []);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(opacity);
      pulseScale.value = withTiming(1);
      opacity.value = withTiming(1);
    }
  }, [isListening, pulseScale, opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: opacity.value,
  }));

  const startListening = useCallback(async () => {
    if (disabled) return;

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Voice input requires microphone permission. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(true);

    // Mock speech recognition - in production use expo-speech-recognition
    // Simulating voice input for demonstration
    setTimeout(() => {
      setIsListening(false);
      // In production, this would be the actual transcript
      Alert.alert(
        'Voice Input',
        'Voice recognition requires native module. For now, please type the message manually.',
        [{ text: 'OK' }]
      );
    }, 3000);
  }, [disabled, hasPermission]);

  const stopListening = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsListening(false);
  }, []);

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={startListening}
        disabled={disabled}
        activeOpacity={0.7}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        {isListening && <Animated.View style={[styles.pulse, pulseStyle]} />}
        {isListening ? (
          <Ionicons name="radio-button-on" size={22} color={darkColors.error} />
        ) : (
          <LinearGradient
            colors={[accentColors.gradientStart, accentColors.gradientEnd]}
            style={styles.micGradient}
          >
            <Ionicons name="mic" size={22} color="#FFFFFF" />
          </LinearGradient>
        )}
      </TouchableOpacity>
      {isListening && <Text style={styles.listeningText}>Listening...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: darkColors.border,
    position: 'relative',
    overflow: 'visible',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.error,
    zIndex: -1,
  },
  micGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningText: {
    color: darkColors.error,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
