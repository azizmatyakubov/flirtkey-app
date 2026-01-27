import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../stores/useStore';
import { generateResponse, analyzeScreenshotLegacy } from '../services/ai';
import { AnalysisResult, Suggestion } from '../types';

const SUGGESTION_COLORS = {
  safe: { bg: '#22c55e20', border: '#22c55e', emoji: '🟢' },
  balanced: { bg: '#f59e0b20', border: '#f59e0b', emoji: '🟡' },
  bold: { bg: '#ef444420', border: '#ef4444', emoji: '🔴' },
};

export function ChatScreen({ navigation }: any) {
  const { selectedGirl, apiKey, updateGirl, userCulture } = useStore();
  const [herMessage, setHerMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  if (!selectedGirl) {
    return (
      <View style={styles.container}>
        <Text style={styles.noGirl}>Select someone first</Text>
      </View>
    );
  }

  const handleGenerate = async () => {
    if (!herMessage.trim()) {
      Alert.alert('Enter her message first!');
      return;
    }
    if (!apiKey) {
      Alert.alert('Set up API key in Settings first');
      return;
    }

    setLoading(true);
    try {
      const response = await generateResponse(apiKey, selectedGirl, herMessage, userCulture);
      setResult(response);

      // Update message count
      updateGirl(selectedGirl.id, {
        messageCount: selectedGirl.messageCount + 1,
        lastTopic: herMessage.substring(0, 100),
        lastMessageDate: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Error', errorMessage);
    }
    setLoading(false);
  };

  const handleScreenshot = async () => {
    if (!apiKey) {
      Alert.alert('Set up API key in Settings first');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset?.base64) {
        setLoading(true);
        try {
          const response = await analyzeScreenshotLegacy(
            apiKey,
            asset.base64,
            selectedGirl,
            userCulture
          );
          setResult(response);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to analyze screenshot';
          Alert.alert('Error', errorMessage);
        }
        setLoading(false);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied! 📋', 'Paste it in your chat');
  };

  const renderSuggestion = (suggestion: Suggestion) => {
    const colors = SUGGESTION_COLORS[suggestion.type];
    return (
      <TouchableOpacity
        key={suggestion.type}
        style={[styles.suggestion, { backgroundColor: colors.bg, borderColor: colors.border }]}
        onPress={() => copyToClipboard(suggestion.text)}
      >
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionEmoji}>{colors.emoji}</Text>
          <Text style={[styles.suggestionType, { color: colors.border }]}>
            {suggestion.type.toUpperCase()}
          </Text>
          <Text style={styles.copyHint}>Tap to copy</Text>
        </View>
        <Text style={styles.suggestionText}>{suggestion.text}</Text>
        <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{selectedGirl.name}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GirlProfile')}>
            <Text style={styles.editProfile}>Edit Profile →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>What did she say?</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste her message here..."
            placeholderTextColor="#666"
            value={herMessage}
            onChangeText={setHerMessage}
            multiline
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>✨ Generate Replies</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.screenshotButton}
              onPress={handleScreenshot}
              disabled={loading}
            >
              <Text style={styles.screenshotButtonText}>📸</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {result && (
          <View style={styles.results}>
            {/* Interest Level */}
            {result.interestLevel && (
              <View style={styles.interestLevel}>
                <Text style={styles.interestLabel}>Her Interest Level</Text>
                <View style={styles.interestBar}>
                  <View style={[styles.interestFill, { width: `${result.interestLevel * 10}%` }]} />
                </View>
                <Text style={styles.interestValue}>{result.interestLevel}/10</Text>
              </View>
            )}

            {/* Suggestions */}
            {result.suggestions.map(renderSuggestion)}

            {/* Pro Tip */}
            {result.proTip && (
              <View style={styles.proTip}>
                <Text style={styles.proTipLabel}>💡 PRO TIP</Text>
                <Text style={styles.proTipText}>{result.proTip}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  noGirl: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  headerInfo: {
    marginLeft: 20,
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editProfile: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  inputSection: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  screenshotButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 12,
    width: 55,
    alignItems: 'center',
  },
  screenshotButtonText: {
    fontSize: 20,
  },
  results: {
    padding: 20,
    paddingTop: 0,
  },
  interestLevel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  interestLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  interestBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  interestFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  interestValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  suggestion: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  suggestionType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  copyHint: {
    color: '#666',
    fontSize: 11,
    marginLeft: 'auto',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  suggestionReason: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  proTip: {
    backgroundColor: '#6366f120',
    borderRadius: 12,
    padding: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  proTipLabel: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  proTipText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});
