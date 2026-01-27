import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useStore } from '../stores/useStore';
import { Culture } from '../types';

const CULTURES: { key: Culture; label: string; emoji: string }[] = [
  { key: 'uzbek', label: 'Uzbek', emoji: '🇺🇿' },
  { key: 'russian', label: 'Russian/CIS', emoji: '🇷🇺' },
  { key: 'western', label: 'Western', emoji: '🇺🇸' },
  { key: 'asian', label: 'Asian', emoji: '🇯🇵' },
  { key: 'universal', label: 'Universal', emoji: '🌐' },
];

export function SettingsScreen({ navigation }: any) {
  const { apiKey, setApiKey, userCulture, setUserCulture } = useStore();
  const [newKey, setNewKey] = useState(apiKey);

  const handleSaveKey = () => {
    setApiKey(newKey);
    Alert.alert('Saved!', 'API key has been saved');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {/* API Key */}
        <Text style={styles.sectionTitle}>🔑 OpenAI API Key</Text>
        <Text style={styles.hint}>
          Get your key from platform.openai.com
        </Text>
        <TextInput
          style={styles.input}
          placeholder="sk-..."
          placeholderTextColor="#666"
          value={newKey}
          onChangeText={setNewKey}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveKey}>
          <Text style={styles.saveButtonText}>Save Key</Text>
        </TouchableOpacity>

        {/* Culture */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          🌍 Your Dating Culture
        </Text>
        <Text style={styles.hint}>
          This affects how suggestions are calibrated
        </Text>
        <View style={styles.options}>
          {CULTURES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[
                styles.option,
                userCulture === c.key && styles.optionSelected,
              ]}
              onPress={() => setUserCulture(c.key)}
            >
              <Text style={styles.optionEmoji}>{c.emoji}</Text>
              <Text
                style={[
                  styles.optionText,
                  userCulture === c.key && styles.optionTextSelected,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a2e',
  },
  back: {
    color: '#6366f1',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    color: '#666',
    fontSize: 13,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionSelected: {
    backgroundColor: '#6366f120',
    borderColor: '#6366f1',
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    color: '#888',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fff',
  },
});
